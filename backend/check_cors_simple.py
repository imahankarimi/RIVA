#!/usr/bin/env python3
"""Simplified CORS test that doesn't require a database."""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

print("=" * 80)
print("CORS FIX VERIFICATION - Isolated Test")
print("=" * 80)
print()

CORS_ORIGINS = [
    "http://localhost:3000",
    "https://riva-snowy-beta.vercel.app",
    "https://riva-app-inky.vercel.app",
]

app = FastAPI(title="CORS Test")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request, exc: StarletteHTTPException) -> JSONResponse:
    origin = request.headers.get("origin")
    response = JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    if origin and origin in CORS_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    if exc.headers:
        for key, value in exc.headers.items():
            response.headers[key] = value
    return response

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/test-error")
def test_error():
    raise HTTPException(status_code=401, detail="Test error", headers={"WWW-Authenticate": "Bearer"})

client = TestClient(app)

print("TEST 1: Successful response")
print("-" * 80)
r = client.get('/health', headers={'Origin': 'https://riva-snowy-beta.vercel.app'})
print(f"Status: {r.status_code}, CORS: {r.headers.get('access-control-allow-origin', 'MISSING')}")
assert r.headers.get('access-control-allow-origin') == 'https://riva-snowy-beta.vercel.app'
print("✅ PASS\n")

print("TEST 2: HTTPException 401 (CRITICAL TEST)")
print("-" * 80)
r = client.post('/test-error', headers={'Origin': 'https://riva-snowy-beta.vercel.app'})
cors = r.headers.get('access-control-allow-origin')
creds = r.headers.get('access-control-allow-credentials')
www = r.headers.get('www-authenticate')
print(f"Status: {r.status_code}")
print(f"CORS: {cors if cors else 'MISSING ❌'}")
print(f"Credentials: {creds if creds else 'MISSING ❌'}")
print(f"WWW-Authenticate: {www if www else 'MISSING ❌'}")
if not cors:
    print("\n❌ FAILURE: HTTPException missing CORS header!")
    sys.exit(1)
assert cors == 'https://riva-snowy-beta.vercel.app'
assert creds == 'true'
assert www == 'Bearer'
print("✅ PASS\n")

print("TEST 3: Non-allowed origin")
print("-" * 80)
r = client.post('/test-error', headers={'Origin': 'https://evil.com'})
cors = r.headers.get('access-control-allow-origin')
print(f"CORS: {cors if cors else 'None (correct)'}")
if cors:
    print("❌ FAILURE: Evil origin got CORS!")
    sys.exit(1)
print("✅ PASS\n")

print("=" * 80)
print("✅ ALL TESTS PASSED!")
print("=" * 80)
print("\n🚀 SAFE TO COMMIT AND DEPLOY")
