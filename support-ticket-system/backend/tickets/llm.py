import json
import logging
import os
import re

import google.generativeai as genai

from .models import Ticket

logger = logging.getLogger(__name__)

DEFAULT_RESPONSE = {
    'suggested_category': None,
    'suggested_priority': None,
}


def _extract_json_payload(raw_text: str) -> str:
    """Strip code fences/markdown wrappers and return probable JSON text."""
    cleaned_text = raw_text.strip()
    fence_match = re.search(r'```(?:json)?\s*(\{.*\})\s*```', cleaned_text, flags=re.DOTALL)
    if fence_match:
        return fence_match.group(1).strip()

    json_match = re.search(r'\{.*\}', cleaned_text, flags=re.DOTALL)
    if json_match:
        return json_match.group(0).strip()

    return cleaned_text


def classify_ticket_description(description: str) -> dict:
    """Classify ticket description with Gemini and return safe fallback on failures."""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        return DEFAULT_RESPONSE

    prompt = (
        'Categorize the following support ticket and assign a priority.\n'
        'Return ONLY valid JSON in this format:\n'
        '{\n'
        '  "category": "billing|technical|account|general",\n'
        '  "priority": "low|medium|high|critical"\n'
        '}\n\n'
        'Ticket description:\n'
        f'{description}'
    )

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        response = model.generate_content(prompt, request_options={'timeout': 10})
        raw_text = (response.text or '').strip()
        payload = json.loads(_extract_json_payload(raw_text))

        category = payload.get('category')
        priority = payload.get('priority')

        valid_categories = {choice[0] for choice in Ticket.CATEGORY_CHOICES}
        valid_priorities = {choice[0] for choice in Ticket.PRIORITY_CHOICES}

        if category not in valid_categories or priority not in valid_priorities:
            logger.warning('Gemini returned invalid category/priority: %s', payload)
            return DEFAULT_RESPONSE

        return {
            'suggested_category': category,
            'suggested_priority': priority,
        }
    except Exception as exc:
        logger.error('Gemini classification failed: %s', exc)
        return DEFAULT_RESPONSE
