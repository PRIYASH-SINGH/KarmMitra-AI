"""
Bhashini DPI (Digital Public Infrastructure) NMT Translation Service
Provides asynchronous text translation with LRU in-memory caching,
observable error logging, and resilient fallback to source text.

Live API Architecture (Two-Step Pipeline):
  Step 1 — Udyat modelConfigSearch: POST to BHASHINI_PIPELINE_CONFIG_URL
            authenticated with BHASHINI_USER_ID + BHASHINI_UDYAT_KEY.
            Returns the dynamic service endpoint and model config for the
            requested language pair.
  Step 2 — Dhruva Inference: POST to the discovered callbackUrl
            authenticated with BHASHINI_INFERENCE_KEY as the Authorization header.
            Returns the translated text in pipelineResponse[0].output[0].target.
"""

import logging
from typing import Dict, Tuple, Optional
from threading import Lock
import httpx
from pydantic import BaseModel, Field

from app.core.config import settings

logger = logging.getLogger("dpi.bhashini")


class TranslationRequest(BaseModel):
    text: str = Field(..., description="Source text to translate")
    source_language: str = Field(default="en", description="ISO 639-1 language code (e.g. en, hi, ta)")
    target_language: str = Field(..., description="Target ISO 639-1 language code")


class TranslationResponse(BaseModel):
    translated_text: str
    source_language: str
    target_language: str
    cached: bool = False
    degraded_fallback: bool = False


class BhashiniService:
    """
    Client for Bhashini Dhruva NMT (Neural Machine Translation) Pipeline.

    Implements the live two-step API:
      1. Call Udyat (modelConfigSearch) with BHASHINI_UDYAT_KEY to discover the
         dynamic inference callbackUrl and pipelineId for the language pair.
      2. Call the discovered Dhruva inference endpoint with BHASHINI_INFERENCE_KEY
         as the Authorization bearer to get the translated text.

    Supports in-memory caching for repeated UI and quiz strings, and graceful
    fallback to '[Bhashini Translated]: <original>' on any API/network failure —
    matching the zero-risk contract of the backend mock service.
    """

    def __init__(self, cache_maxsize: int = 10000):
        # Cache keyed by (source_text, source_lang, target_lang) -> translated_text
        self._cache: Dict[Tuple[str, str, str], str] = {}
        self._cache_lock = Lock()
        self._maxsize = cache_maxsize

    def _get_cache(self, text: str, source_lang: str, target_lang: str) -> Optional[str]:
        with self._cache_lock:
            return self._cache.get((text, source_lang, target_lang))

    def _set_cache(self, text: str, source_lang: str, target_lang: str, translated: str) -> None:
        with self._cache_lock:
            if len(self._cache) >= self._maxsize:
                # Evict first element if full
                first_key = next(iter(self._cache))
                del self._cache[first_key]
            self._cache[(text, source_lang, target_lang)] = translated

    async def translate_text(
        self,
        text: str,
        source_lang: str = "en",
        target_lang: str = "hi"
    ) -> TranslationResponse:
        """
        Translate text from source_lang to target_lang using the live Bhashini API.

        If source == target or text is empty, returns original text immediately.
        If API credentials are absent, returns '[Bhashini Translated]: <text>' (mock mode).
        If the live API fails at any point (timeout, non-200, malformed response),
        returns '[Bhashini Translated]: <text>' without raising — zero-risk fallback.
        """
        stripped_text = text.strip()
        if not stripped_text or source_lang.lower() == target_lang.lower():
            return TranslationResponse(
                translated_text=text,
                source_language=source_lang,
                target_language=target_lang,
                cached=False,
                degraded_fallback=False
            )

        # 1. Check in-memory cache for repeated UI/quiz strings
        cached_result = self._get_cache(stripped_text, source_lang.lower(), target_lang.lower())
        if cached_result is not None:
            logger.debug("Bhashini translation cache hit for '%s' -> %s", stripped_text[:25], target_lang)
            return TranslationResponse(
                translated_text=cached_result,
                source_language=source_lang,
                target_language=target_lang,
                cached=True,
                degraded_fallback=False
            )

        # 2. Check if live API credentials are configured — fallback to mock prefix if absent
        if not settings.BHASHINI_UDYAT_KEY or not settings.BHASHINI_INFERENCE_KEY or not settings.BHASHINI_USER_ID:
            logger.info(
                "Bhashini live credentials not configured (BHASHINI_UDYAT_KEY / BHASHINI_INFERENCE_KEY). "
                "Running in mock-prefix mode for '%s'.", stripped_text[:30]
            )
            return TranslationResponse(
                translated_text=f"[Bhashini Translated]: {text}",
                source_language=source_lang,
                target_language=target_lang,
                cached=False,
                degraded_fallback=True
            )

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                # ── Step 1: Udyat modelConfigSearch ───────────────────────────────
                # Fetch the dynamic pipeline config (callbackUrl + pipelineId) for
                # the requested language pair using the Udyat key.
                config_payload = {
                    "pipelineTasks": [
                        {
                            "taskType": "translation",
                            "config": {
                                "language": {
                                    "sourceLanguage": source_lang.lower(),
                                    "targetLanguage": target_lang.lower()
                                }
                            }
                        }
                    ],
                    "pipelineRequestConfig": {
                        "pipelineId": "64392f96daac500b55c543cd"
                    }
                }

                config_headers = {
                    "userID": settings.BHASHINI_USER_ID,
                    "ulcaApiKey": settings.BHASHINI_UDYAT_KEY,
                    "Content-Type": "application/json"
                }

                config_response = await client.post(
                    settings.BHASHINI_PIPELINE_CONFIG_URL,
                    json=config_payload,
                    headers=config_headers
                )

                if config_response.status_code != 200:
                    logger.error(
                        "Bhashini Udyat config fetch returned non-200 status %d: %s. "
                        "Falling back to mock prefix.",
                        config_response.status_code, config_response.text
                    )
                    return TranslationResponse(
                        translated_text=f"[Bhashini Translated]: {text}",
                        source_language=source_lang,
                        target_language=target_lang,
                        cached=False,
                        degraded_fallback=True
                    )

                config_data = config_response.json()
                pipeline_resp_config = config_data.get("pipelineResponseConfig", [])
                if not pipeline_resp_config:
                    logger.error(
                        "Bhashini Udyat response missing 'pipelineResponseConfig': %s. "
                        "Falling back to mock prefix.", config_data
                    )
                    return TranslationResponse(
                        translated_text=f"[Bhashini Translated]: {text}",
                        source_language=source_lang,
                        target_language=target_lang,
                        cached=False,
                        degraded_fallback=True
                    )

                # Extract callbackUrl and serviceId from the Udyat response
                task_config = pipeline_resp_config[0].get("config", [{}])[0]
                callback_url = task_config.get("callbackUrl", "")
                service_id = task_config.get("serviceId", "")

                if not callback_url:
                    logger.error(
                        "Bhashini Udyat response missing 'callbackUrl' in task config: %s. "
                        "Falling back to mock prefix.", task_config
                    )
                    return TranslationResponse(
                        translated_text=f"[Bhashini Translated]: {text}",
                        source_language=source_lang,
                        target_language=target_lang,
                        cached=False,
                        degraded_fallback=True
                    )

                # ── Step 2: Dhruva Inference ───────────────────────────────────────
                # Call the discovered inference endpoint with BHASHINI_INFERENCE_KEY.
                inference_payload = {
                    "pipelineTasks": [
                        {
                            "taskType": "translation",
                            "config": {
                                "language": {
                                    "sourceLanguage": source_lang.lower(),
                                    "targetLanguage": target_lang.lower()
                                },
                                "serviceId": service_id
                            }
                        }
                    ],
                    "inputData": {
                        "input": [
                            {
                                "source": stripped_text
                            }
                        ]
                    }
                }

                inference_headers = {
                    "Authorization": settings.BHASHINI_INFERENCE_KEY,
                    "Content-Type": "application/json"
                }

                inference_response = await client.post(
                    callback_url,
                    json=inference_payload,
                    headers=inference_headers
                )

                if inference_response.status_code != 200:
                    logger.error(
                        "Bhashini inference returned non-200 status %d: %s. "
                        "Falling back to mock prefix.",
                        inference_response.status_code, inference_response.text
                    )
                    return TranslationResponse(
                        translated_text=f"[Bhashini Translated]: {text}",
                        source_language=source_lang,
                        target_language=target_lang,
                        cached=False,
                        degraded_fallback=True
                    )

                data = inference_response.json()
                # Parse Bhashini standard response schema: pipelineResponse[0].output[0].target
                pipeline_res = data.get("pipelineResponse", [])
                if not pipeline_res:
                    logger.error(
                        "Bhashini inference response missing 'pipelineResponse': %s. "
                        "Falling back to mock prefix.", data
                    )
                    return TranslationResponse(
                        translated_text=f"[Bhashini Translated]: {text}",
                        source_language=source_lang,
                        target_language=target_lang,
                        cached=False,
                        degraded_fallback=True
                    )

                output_list = pipeline_res[0].get("output", [])
                if not output_list or "target" not in output_list[0]:
                    logger.error(
                        "Bhashini inference response missing 'target' translation: %s. "
                        "Falling back to mock prefix.", data
                    )
                    return TranslationResponse(
                        translated_text=f"[Bhashini Translated]: {text}",
                        source_language=source_lang,
                        target_language=target_lang,
                        cached=False,
                        degraded_fallback=True
                    )

                translated_target = output_list[0]["target"]

                # Store in cache
                self._set_cache(stripped_text, source_lang.lower(), target_lang.lower(), translated_target)
                logger.info(
                    "Bhashini live translation succeeded: '%s' -> '%s' (%s->%s)",
                    stripped_text[:20], translated_target[:20], source_lang, target_lang
                )
                return TranslationResponse(
                    translated_text=translated_target,
                    source_language=source_lang,
                    target_language=target_lang,
                    cached=False,
                    degraded_fallback=False
                )

        except httpx.TimeoutException as ex:
            logger.error("Bhashini API call timed out: %s. Falling back to mock prefix.", ex)
            return TranslationResponse(
                translated_text=f"[Bhashini Translated]: {text}",
                source_language=source_lang,
                target_language=target_lang,
                cached=False,
                degraded_fallback=True
            )
        except Exception as ex:
            logger.error("Unexpected error during Bhashini translation: %s. Falling back to mock prefix.", ex)
            return TranslationResponse(
                translated_text=f"[Bhashini Translated]: {text}",
                source_language=source_lang,
                target_language=target_lang,
                cached=False,
                degraded_fallback=True
            )


# Global Bhashini service singleton
bhashini_service = BhashiniService()
