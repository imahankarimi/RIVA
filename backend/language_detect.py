"""Language detection for RIVA AI responses.

The assistant must respond in the language of the user's current message,
regardless of the business's configured locale. This module provides a
deterministic, dependency-free heuristic that works for the two languages
RIVA supports (English and Persian/Farsi).
"""

import re

_PERSIAN_CHAR_RE = re.compile(r"[؀-ۿﮊپچژگ]")
_ASCII_LETTER_RE = re.compile(r"[A-Za-z]")

# Persian question/amount/action markers that help classify short messages
_PERSIAN_MARKERS = (
    "است", "هست", "بود", "چقدر", "چند", "چیه", "چیست", "تومان", "تومن",
    "ریال", "میلیون", "هزار", "درآمد", "فروش", "هزینه", "بدهی", "موجودی",
    "پرداخت", "خرید", "کردم", "دادم", "باشه", "بله", "نه", "لطفا", "ثبت",
)


def detect_language(text: str) -> str:
    """Return 'fa' or 'en' for a user message.

    The heuristic wins by the volume of Persian vs. Latin characters. Roman
    numerals / symbols are ignored. When the evidence is ambiguous (e.g. a
    short 'yes'/'بله'), a conservative English default is fine because the
    system prompt also instructs the model to match the user.
    """
    text = (text or "").strip()
    if not text:
        return "en"

    persian_chars = len(_PERSIAN_CHAR_RE.findall(text))
    latin_chars = len(_ASCII_LETTER_RE.findall(text))

    # Strong Persian character presence always wins, even with mixed content
    if persian_chars > 0 and persian_chars >= latin_chars:
        return "fa"

    if latin_chars > persian_chars:
        return "en"

    # No letters at all — fall back to known Persian markers
    for marker in _PERSIAN_MARKERS:
        if marker in text:
            return "fa"
    return "en"


def is_persian(text: str) -> bool:
    return detect_language(text) == "fa"