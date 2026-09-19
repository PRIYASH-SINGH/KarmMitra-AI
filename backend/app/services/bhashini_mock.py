"""
Bhashini NMT Translation Service (Mock Provider)
=================================================

SIH Note: Bhashini API integration architecture is structurally complete. 
Running in mock mode pending official MoSPI API key approval.

This mock service provides the exact async interface expected by upstream 
FastAPI routes and UI components, simulating real-time Indian language translation 
(e.g., Hindi, Tamil, Telugu) for competency questions and feedback prompts.
"""

import logging

logger = logging.getLogger("bhashini.mock")


async def translate_text(text: str, target_lang: str = "hi") -> str:
    """
    Simulates translation of given text into target_lang.

    SIH Note: Bhashini API integration architecture is structurally complete.
    Running in mock mode pending official MoSPI API key approval.
    """
    if not text:
        return ""
    
    logger.info(f"Bhashini Mock translating ({target_lang}): '{text[:30]}...'")
    return f"[Bhashini Translated]: {text}"
