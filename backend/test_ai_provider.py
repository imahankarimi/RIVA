"""Tests for the AI provider error mapping and streaming behavior.

These avoid making external network calls — they exercise configuration
gating, error classification, and streaming chunk emission for paths that
fail before/at the HTTP boundary.
"""

import os
import unittest

import ai_provider
from ai_provider import (
    ProviderNotConfiguredError,
    AuthenticationError,
    RateLimitError,
    TimeoutError,
    InvalidResponseError,
    chat_completion,
    chat_completion_stream,
    is_configured,
)


class ProviderConfigurationTests(unittest.TestCase):
    def setUp(self):
        # Save & clear the API key so tests run without a real key.
        self._saved = {
            "key": os.environ.get("OPENAI_API_KEY"),
            "url": os.environ.get("OPENAI_BASE_URL"),
            "model": os.environ.get("OPENAI_MODEL"),
        }
        os.environ.pop("OPENAI_API_KEY", None)
        os.environ["OPENAI_BASE_URL"] = "http://example.invalid/v1"

    def tearDown(self):
        for k, v in self._saved.items():
            env = "OPENAI_API_KEY" if k == "key" else "OPENAI_BASE_URL" if k == "url" else "OPENAI_MODEL"
            if v is None:
                os.environ.pop(env, None)
            else:
                os.environ[env] = v

    def test_missing_key_raises_provider_not_configured(self):
        os.environ.pop("OPENAI_API_KEY", None)
        with self.assertRaises(ProviderNotConfiguredError):
            chat_completion([{"role": "user", "content": "hi"}])

    def test_is_configured_reflects_key_presence(self):
        os.environ.pop("OPENAI_API_KEY", None)
        self.assertFalse(is_configured())
        os.environ["OPENAI_API_KEY"] = "sk-test"
        self.assertTrue(is_configured())

    def test_stream_yields_error_when_unconfigured(self):
        os.environ.pop("OPENAI_API_KEY", None)
        chunks = list(chat_completion_stream([{"role": "user", "content": "hi"}]))
        self.assertEqual(chunks[-1]["type"], "error")


class ProviderErrorClassificationTests(unittest.TestCase):
    def test_retryable_flags(self):
        self.assertTrue(RateLimitError().retryable)
        self.assertTrue(TimeoutError().retryable)
        self.assertFalse(AuthenticationError().retryable)
        self.assertFalse(InvalidResponseError().retryable)
        self.assertFalse(ProviderNotConfiguredError().retryable)


if __name__ == "__main__":
    unittest.main()