"""AI Provider Adapter — abstraction layer for AI/LLM providers.

This module wraps the OpenAI-compatible API calls with:
- Provider abstraction (not locked into one implementation)
- Retry logic with exponential backoff
- Timeout handling
- Proper error handling and logging
- Never exposes API keys to the client
- Never hard-codes secrets

The provider is configured via environment variables:
- OPENAI_API_KEY: API key
- OPENAI_BASE_URL: Base URL (default: https://api.openai.com/v1)
- OPENAI_MODEL: Model name (default: gpt-4o)
"""

import os
import json
import time
import logging
from typing import Any, Iterator

import httpx
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Provider errors
# ---------------------------------------------------------------------------

class ProviderError(Exception):
    """Base error for provider failures."""
    def __init__(self, message: str, retryable: bool = False):
        super().__init__(message)
        self.retryable = retryable


class RateLimitError(ProviderError):
    """Rate limit exceeded."""
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, retryable=True)


class TimeoutError(ProviderError):
    """Request timed out."""
    def __init__(self, message: str = "Request timed out"):
        super().__init__(message, retryable=True)


class AuthenticationError(ProviderError):
    """Invalid API key or authentication failure."""
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, retryable=False)


class InvalidResponseError(ProviderError):
    """Provider returned an invalid response."""
    def __init__(self, message: str = "Invalid response from AI provider"):
        super().__init__(message, retryable=False)


class ProviderNotConfiguredError(ProviderError):
    """The provider is not configured (missing API key / endpoint).

    Raised before any network attempt so callers can surface a clear,
    actionable message to the user instead of a generic 500.
    """
    def __init__(self, message: str = "The AI provider is not configured"):
        super().__init__(message, retryable=False)


# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

def _get_api_key() -> str:
    key = os.getenv("OPENAI_API_KEY", "").strip()
    if not key:
        raise ProviderNotConfiguredError("OPENAI_API_KEY is not configured")
    return key


def _get_base_url() -> str:
    url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").strip().rstrip("/")
    if not url:
        raise ProviderNotConfiguredError("OPENAI_BASE_URL is not configured")
    return url


def _get_base_url() -> str:
    return os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1").rstrip("/")


def _get_model() -> str:
    return os.getenv("OPENAI_MODEL", "gpt-4o").strip() or "gpt-4o"


# ---------------------------------------------------------------------------
# Retry configuration
# ---------------------------------------------------------------------------

_MAX_RETRIES = 3
_RETRY_DELAY = 1.0  # seconds
_RETRY_BACKOFF = 2.0  # multiplier


# ---------------------------------------------------------------------------
# Chat completion
# ---------------------------------------------------------------------------

def chat_completion(
    messages: list[dict],
    tools: list[dict] | None = None,
    temperature: float = 0.3,
    max_tokens: int = 2000,
    timeout: float = 60.0,
) -> dict:
    """Send a chat completion request with retries and error handling.

    Args:
        messages: List of message dicts [{role, content, ...}]
        tools: Optional tool definitions for function calling
        temperature: Temperature for sampling (0.0-1.0)
        max_tokens: Maximum tokens in response
        timeout: Request timeout in seconds

    Returns:
        Response dict with content and optional tool_calls

    Raises:
        ProviderError: On provider failures (with retryable flag)
    """
    api_key = _get_api_key()
    base_url = _get_base_url()
    model = _get_model()

    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
    }

    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    last_error = None

    for attempt in range(_MAX_RETRIES + 1):
        try:
            with httpx.Client(timeout=timeout) as client:
                response = client.post(
                    f"{base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                )

                # Handle HTTP errors
                if response.status_code == 401:
                    raise AuthenticationError("Invalid API key")
                elif response.status_code == 429:
                    raise RateLimitError("Rate limit exceeded")
                elif response.status_code == 408:
                    raise TimeoutError("Request timed out")
                elif response.status_code >= 500:
                    raise ProviderError(f"Server error: {response.status_code}", retryable=True)
                elif response.status_code != 200:
                    raise ProviderError(f"API error: {response.status_code} - {response.text}", retryable=False)

                # Parse response
                text = response.text
                try:
                    data = response.json()
                except Exception:
                    raise InvalidResponseError(f"Provider returned non-JSON: {text[:200]!r}") from None

                choices = data.get("choices")
                if not choices:
                    raise InvalidResponseError("Provider returned no choices.")

                choice = choices[0]
                message = choice.get("message") or {}
                tool_calls = message.get("tool_calls") or []
                content = message.get("content")

                # A tool-calling provider often returns content=None alongside
                # tool_calls. That is NOT an empty response — preserve both so
                # downstream knows a tool call happened. When content is None
                # and there are no tool_calls, that is a genuine empty response.
                finish_reason = choice.get("finish_reason")

                return {
                    "content": content,
                    "tool_calls": tool_calls if isinstance(tool_calls, list) else None,
                    "finish_reason": finish_reason,
                    "usage": data.get("usage"),
                }

        except (AuthenticationError, InvalidResponseError) as e:
            # Non-retryable errors
            raise

        except (RateLimitError, TimeoutError, ProviderError, httpx.RequestError, httpx.TimeoutException) as e:
            last_error = e
            retryable = getattr(e, 'retryable', True)

            if not retryable or attempt >= _MAX_RETRIES:
                raise

            delay = _RETRY_DELAY * (_RETRY_BACKOFF ** attempt)
            logger.warning(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay}s...")
            time.sleep(delay)

    # Should not reach here, but just in case
    raise last_error or ProviderError("All retries failed")


# ---------------------------------------------------------------------------
# Streaming chat completion (SSE)
# ---------------------------------------------------------------------------

def chat_completion_stream(
    messages: list[dict],
    tools: list[dict] | None = None,
    temperature: float = 0.3,
    max_tokens: int = 2000,
    timeout: float = 60.0,
) -> Iterator[dict]:
    """Yield streaming chunks from the provider's SSE endpoint.

    Yields dicts of the form:
      {"type": "content", "content": "<increment>"}
      {"type": "content_done"}
      {"type": "tool_calls", "tool_calls": [<openai tool_call>]}
      {"type": "done", "finish_reason": str|None}
      {"type": "error", "message": str}  — on provider/network failure

    Usage: iterate until a {"type": "done"} or {"type": "error"} chunk.
    """
    try:
        api_key = _get_api_key()
        base_url = _get_base_url()
        model = _get_model()
    except ProviderNotConfiguredError as error:
        yield {"type": "error", "message": str(error)}
        return

    payload: dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }

    if tools:
        payload["tools"] = tools
        payload["tool_choice"] = "auto"

    last_error = None
    for attempt in range(_MAX_RETRIES + 1):
        try:
            with httpx.Client(timeout=timeout) as client:
                with client.stream(
                    "POST",
                    f"{base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {api_key}",
                        "Content-Type": "application/json",
                    },
                    json=payload,
                ) as response:
                    if response.status_code == 401:
                        raise AuthenticationError("Invalid API key")
                    elif response.status_code == 429:
                        raise RateLimitError("Rate limit exceeded")
                    elif response.status_code == 408:
                        raise TimeoutError("Request timed out")
                    elif response.status_code >= 500:
                        raise ProviderError(f"Server error: {response.status_code}", retryable=True)
                    elif response.status_code != 200:
                        raise ProviderError(
                            f"API error: {response.status_code} - {response.read().decode('utf-8', errors='replace')}",
                            retryable=False,
                        )

                    accumulated_tool_calls: list[dict] = []
                    content_pieces: list[str] = []
                    finish_reason: str | None = None

                    for line in response.iter_lines():
                        if not line or not line.startswith("data:"):
                            continue
                        data = line[len("data:"):].strip()
                        if data == "[DONE]":
                            break
                        try:
                            chunk = json.loads(data)
                        except json.JSONDecodeError:
                            continue

                        if not isinstance(chunk, dict) or not chunk.get("choices"):
                            continue

                        delta = chunk["choices"][0].get("delta", {}) or {}
                        finish = chunk["choices"][0].get("finish_reason")
                        if finish:
                            finish_reason = finish

                        text = delta.get("content")
                        if text:
                            content_pieces.append(text)
                            yield {"type": "content", "content": text}

                        for tc in delta.get("tool_calls", []) or []:
                            _accumulate_tool_call(accumulated_tool_calls, tc)

                    if not content_pieces:
                        # No text was streamed — still emit any tool calls.
                        if accumulated_tool_calls:
                            yield {"type": "tool_calls", "tool_calls": accumulated_tool_calls}
                        else:
                            yield {"type": "error", "message": "The AI provider returned an empty response."}
                    else:
                        yield {"type": "content_done"}
                        if accumulated_tool_calls:
                            yield {"type": "tool_calls", "tool_calls": accumulated_tool_calls}

                    yield {"type": "done", "finish_reason": finish_reason}
                    return

        except (AuthenticationError, InvalidResponseError, ProviderNotConfiguredError) as error:
            yield {"type": "error", "message": str(error)}
            return

        except (RateLimitError, TimeoutError, ProviderError, httpx.RequestError, httpx.TimeoutException) as error:
            last_error = error
            retryable = getattr(error, "retryable", True)
            if not retryable or attempt >= _MAX_RETRIES:
                yield {"type": "error", "message": str(error)}
                return

            delay = _RETRY_DELAY * (_RETRY_BACKOFF ** attempt)
            logger.warning(f"Attempt {attempt + 1} failed: {error}. Retrying in {delay}s...")
            time.sleep(delay)

    if last_error:
        yield {"type": "error", "message": str(last_error)}
    else:
        yield {"type": "error", "message": "All retries failed"}


def _accumulate_tool_call(accumulated: list[dict], tc: dict) -> None:
    """Merge OpenAI streaming tool_call deltas (fragments across chunks)."""
    index = tc.get("index", len(accumulated))
    while len(accumulated) <= index:
        accumulated.append({"id": None, "type": "function", "function": {"name": None, "arguments": ""}})
    target = accumulated[index]
    target["id"] = target["id"] or tc.get("id")
    if tc.get("function"):
        fn = tc["function"]
        target["function"]["name"] = target["function"]["name"] or fn.get("name")
        target["function"]["arguments"] += fn.get("arguments") or ""


# ---------------------------------------------------------------------------
# Utility
# ---------------------------------------------------------------------------

def is_configured() -> bool:
    """Check if the AI provider is properly configured."""
    try:
        _get_api_key()
        return True
    except ProviderNotConfiguredError:
        return False