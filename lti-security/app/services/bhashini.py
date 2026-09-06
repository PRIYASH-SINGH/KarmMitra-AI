"""
Bhashini DPI (Digital Public Infrastructure) NMT Translation Service
Provides asynchronous text translation with LRU in-memory caching,
observable error logging, and resilient fallback to source text.
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
    Supports in-memory caching for repeated UI and quiz strings, and graceful
    fallback to original source text on API/network failures.
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
        Translate text from source_lang to target_lang.
        If source == target or text is empty, returns original text immediately.
        If API fails (timeout, non-200, malformed response, missing credentials),
        falls back to returning original text without raising exceptions.
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

        # 2. Check if API credentials are configured
        if not settings.BHASHINI_API_KEY or not settings.BHASHINI_USER_ID:
            logger.warning(
                "Bhashini API credentials not configured (BHASHINI_API_KEY/BHASHINI_USER_ID). "
                "Degrading gracefully to original source text for '%s'.", stripped_text[:30]
            )
            return TranslationResponse(
                translated_text=text,
                source_language=source_lang,
                target_language=target_lang,
                cached=False,
                degraded_fallback=True
            )

        # 3. Construct ULCA/Bhashini Pipeline Request
        payload = {
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
            "inputData": {
                "input": [
                    {
                        "source": stripped_text
                    }
                ]
            }
        }

        headers = {
            "userID": settings.BHASHINI_USER_ID,
            "ulcaApiKey": settings.BHASHINI_API_KEY,
            "Content-Type": "application/json"
        }

        # 4. Call Bhashini Endpoint with resilience and observable logging
        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                response = await client.post(
                    settings.BHASHINI_PIPELINE_ENDPOINT,
                    json=payload,
                    headers=headers
                )

                if response.status_code != 200:
                    logger.error(
                        "Bhashini API returned non-200 status %d: %s. Falling back to source text.",
                        response.status_code, response.text
                    )
                    return TranslationResponse(
                        translated_text=text,
                        source_language=source_lang,
                        target_language=target_lang,
                        cached=False,
                        degraded_fallback=True
                    )

                data = response.json()
                # Parse Bhashini standard response schema: pipelineResponse[0].output[0].target
                pipeline_res = data.get("pipelineResponse", [])
                if not pipeline_res:
                    logger.error("Bhashini response missing 'pipelineResponse': %s. Falling back.", data)
                    return TranslationResponse(
                        translated_text=text,
                        source_language=source_lang,
                        target_language=target_lang,
                        cached=False,
                        degraded_fallback=True
                    )

                output_list = pipeline_res[0].get("output", [])
                if not output_list or "target" not in output_list[0]:
                    logger.error("Bhashini response missing 'target' translation: %s. Falling back.", data)
                    return TranslationResponse(
                        translated_text=text,
                        source_language=source_lang,
                        target_language=target_lang,
                        cached=False,
                        degraded_fallback=True
                    )

                translated_target = output_list[0]["target"]

                # Store in cache
                self._set_cache(stripped_text, source_lang.lower(), target_lang.lower(), translated_target)
                logger.info(
                    "Bhashini translation succeeded: '%s' -> '%s' (%s->%s)",
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
            logger.error("Bhashini API call timed out: %s. Falling back to source text.", ex)
            return TranslationResponse(
                translated_text=text,
                source_language=source_lang,
                target_language=target_lang,
                cached=False,
                degraded_fallback=True
            )
        except Exception as ex:
            logger.error("Unexpected error during Bhashini translation: %s. Falling back to source text.", ex)
            return TranslationResponse(
                translated_text=text,
                source_language=source_lang,
                target_language=target_lang,
                cached=False,
                degraded_fallback=True
            )


# Global Bhashini service singleton
bhashini_service = BhashiniService()
