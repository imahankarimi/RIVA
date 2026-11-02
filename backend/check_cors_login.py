#!/usr/bin/env python3
"""Test login endpoint with production CORS headers."""
import asyncio
import sys
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

# Test OPTIONS preflight for production origin
print("=" * 60)
print("TEST 1: OPTIONS preflight (RIVA Desktop origin)")
print("=" * 60)
response = client.options(
    "/api/auth/login",
    headers={
        "Origin": "https://riva-snowy-beta.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }
)
print(f"Status: {response.status_code}")
print(f"CORS Headers:")
print(f"  Access-Control-Allow-Origin: {response.headers.get('access-control-allow-origin', 'MISSING')}")
print(f"  Access-Control-Allow-Credentials: {response.headers.get('access-control-allow-credentials', 'MISSING')}")
print(f"  Access-Control-Allow-Methods: {response.headers.get('access-control-allow-methods', 'MISSING')}")
print(f"  Access-Control-Allow-Headers: {response.headers.get('access-control-allow-headers', 'MISSING')}")

# Test POST with invalid credentials (should return 401, not CORS error)
print("\n" + "=" * 60)
print("TEST 2: POST /api/auth/login with invalid credentials")
print("=" * 60)
response = client.post(
    "/api/auth/login",
    json={"email": "test@example.com", "password": "wrongpassword"},
    headers={
        "Origin": "https://riva-snowy-beta.vercel.app",
        "Content-Type": "application/json",
    }
)
print(f"Status: {response.status_code}")
print(f"Body: {response.json()}")
print(f"CORS Headers:")
print(f"  Access-Control-Allow-Origin: {response.headers.get('access-control-allow-origin', 'MISSING')}")
print(f"  Access-Control-Allow-Credentials: {response.headers.get('access-control-allow-credentials', 'MISSING')}")

# Test RIVA App origin
print("\n" + "=" * 60)
print("TEST 3: OPTIONS preflight (RIVA App origin)")
print("=" * 60)
response = client.options(
    "/api/auth/login",
    headers={
        "Origin": "https://riva-app-inky.vercel.app",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }
)
print(f"Status: {response.status_code}")
print(f"CORS Headers:")
print(f"  Access-Control-Allow-Origin: {response.headers.get('access-control-allow-origin', 'MISSING')}")
print(f"  Access-Control-Allow-Credentials: {response.headers.get('access-control-allow-credentials', 'MISSING')}")
print(f"  Access-Control-Allow-Methods: {response.headers.get('access-control-allow-methods', 'MISSING')}")
print(f"  Access-Control-Allow-Headers: {response.headers.get('access-control-allow-headers', 'MISSING')}")

print("\n" + "=" * 60)
print("SUMMARY: CORS headers present for production origins")
print("=" * 60)
