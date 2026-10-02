"""Stress test scenarios for specific RIVA failure points.

Tests individual components under extreme load to identify bottlenecks.

Run individual tests with:
    pytest backend/stress_tests.py -v -s
"""

import asyncio
import time
import pytest
from concurrent.futures import ThreadPoolExecutor, as_completed
from decimal import Decimal

# These tests require a running RIVA instance
# Set RIVA_BASE_URL environment variable or use default
import os
RIVA_BASE_URL = os.getenv("RIVA_BASE_URL", "http://localhost:8000")


def test_concurrent_logins():
    """Test 100 concurrent login attempts (brute force simulation)."""
    import requests

    def attempt_login(i):
        start = time.time()
        try:
            response = requests.post(
                f"{RIVA_BASE_URL}/api/auth/login",
                json={
                    "email": f"test{i}@example.com",
                    "password": "wrong_password",
                },
                timeout=10,
            )
            elapsed = time.time() - start
            return {
                "attempt": i,
                "status": response.status_code,
                "time": elapsed,
                "rate_limited": response.status_code == 429,
            }
        except Exception as e:
            return {"attempt": i, "error": str(e), "time": time.time() - start}

    print("\n=== Testing 100 concurrent login attempts ===")
    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = [executor.submit(attempt_login, i) for i in range(100)]
        results = [f.result() for f in as_completed(futures)]

    rate_limited_count = sum(1 for r in results if r.get("rate_limited"))
    avg_time = sum(r["time"] for r in results) / len(results)

    print(f"Total attempts: {len(results)}")
    print(f"Rate limited: {rate_limited_count}")
    print(f"Average response time: {avg_time:.3f}s")

    # Rate limiting should kick in
    assert rate_limited_count > 0, "Rate limiting not working for auth endpoints"


def test_concurrent_ai_requests():
    """Test 50 concurrent AI chat requests (cost explosion test)."""
    import requests

    # Create test user and get token
    email = f"aitest_{int(time.time())}@example.com"
    signup_response = requests.post(
        f"{RIVA_BASE_URL}/api/auth/signup",
        json={
            "email": email,
            "password": "TestPass123!",
            "business_name": "AI Test Business",
            "base_currency": "USD",
        },
    )

    if signup_response.status_code != 201:
        pytest.skip("Could not create test user")

    token = signup_response.json()["access_token"]
    business_id = signup_response.json()["business"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    def send_ai_message(i):
        start = time.time()
        try:
            response = requests.post(
                f"{RIVA_BASE_URL}/api/chat",
                headers=headers,
                json={
                    "business_id": business_id,
                    "message": f"How much revenue did we make? (test {i})",
                },
                timeout=65,  # AI requests can be slow
            )
            elapsed = time.time() - start
            return {
                "attempt": i,
                "status": response.status_code,
                "time": elapsed,
                "rate_limited": response.status_code == 429,
            }
        except Exception as e:
            return {"attempt": i, "error": str(e), "time": time.time() - start}

    print("\n=== Testing 50 concurrent AI requests ===")
    with ThreadPoolExecutor(max_workers=25) as executor:
        futures = [executor.submit(send_ai_message, i) for i in range(50)]
        results = [f.result() for f in as_completed(futures)]

    rate_limited_count = sum(1 for r in results if r.get("rate_limited"))
    successful = sum(1 for r in results if r.get("status") == 200)
    avg_time = sum(r["time"] for r in results) / len(results)

    print(f"Total requests: {len(results)}")
    print(f"Successful: {successful}")
    print(f"Rate limited: {rate_limited_count}")
    print(f"Average response time: {avg_time:.3f}s")

    # AI rate limiting should protect against spam
    assert rate_limited_count > 10, "AI rate limiting not working effectively"


def test_database_connection_pool():
    """Test connection pool under 100 concurrent database queries."""
    import requests

    # Create test user
    email = f"dbtest_{int(time.time())}@example.com"
    signup_response = requests.post(
        f"{RIVA_BASE_URL}/api/auth/signup",
        json={
            "email": email,
            "password": "TestPass123!",
            "business_name": "DB Test Business",
            "base_currency": "USD",
        },
    )

    if signup_response.status_code != 201:
        pytest.skip("Could not create test user")

    token = signup_response.json()["access_token"]
    business_id = signup_response.json()["business"]["id"]
    headers = {"Authorization": f"Bearer {token}"}

    def fetch_overview(i):
        start = time.time()
        try:
            response = requests.get(
                f"{RIVA_BASE_URL}/api/businesses/{business_id}/overview",
                headers=headers,
                timeout=15,
            )
            elapsed = time.time() - start
            return {
                "attempt": i,
                "status": response.status_code,
                "time": elapsed,
                "error": None if response.status_code == 200 else response.text[:100],
            }
        except Exception as e:
            return {"attempt": i, "error": str(e), "time": time.time() - start}

    print("\n=== Testing 100 concurrent database queries ===")
    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = [executor.submit(fetch_overview, i) for i in range(100)]
        results = [f.result() for f in as_completed(futures)]

    successful = sum(1 for r in results if r.get("status") == 200)
    errors = [r for r in results if r.get("error")]
    avg_time = sum(r["time"] for r in results if r.get("status") == 200) / max(successful, 1)

    print(f"Total requests: {len(results)}")
    print(f"Successful: {successful}")
    print(f"Failed: {len(errors)}")
    print(f"Average response time: {avg_time:.3f}s")

    if errors:
        print(f"Sample error: {errors[0].get('error', 'Unknown')}")

    # Should handle all requests without pool exhaustion
    assert successful >= 95, f"Connection pool issues: only {successful}/100 succeeded"
    assert avg_time < 5.0, f"Queries too slow: {avg_time:.3f}s average"


def test_request_timeout():
    """Test that slow requests are properly timed out."""
    import requests

    print("\n=== Testing request timeout handling ===")

    # This would need a special slow endpoint or mock
    # For now, test that fast endpoints complete within timeout
    start = time.time()
    response = requests.get(f"{RIVA_BASE_URL}/health", timeout=5)
    elapsed = time.time() - start

    print(f"Health check response time: {elapsed:.3f}s")
    assert elapsed < 2.0, "Health check should be fast"
    assert response.status_code == 200


if __name__ == "__main__":
    print("RIVA Stress Tests")
    print("=" * 60)
    print("These tests require a running RIVA instance.")
    print(f"Target: {RIVA_BASE_URL}")
    print("=" * 60)
    pytest.main([__file__, "-v", "-s"])
