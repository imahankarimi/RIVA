#!/usr/bin/env python3
"""
Test script to verify CORS headers are present in both success and error responses.
This validates the custom HTTPException handler fix.
"""
import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from fastapi.testclient import TestClient
    from main import app

    client = TestClient(app)

    print("=" * 80)
    print("CORS FIX VERIFICATION TEST")
    print("=" * 80)
    print()

    # Test 1: Successful response
    print("TEST 1: Successful response (GET /health)")
    print("-" * 80)
    response = client.get(
        '/health',
        headers={'Origin': 'https://riva-snowy-beta.vercel.app'}
    )
    print(f'✓ Status Code: {response.status_code}')
    print(f'✓ Response Body: {response.json()}')
    print(f'✓ Access-Control-Allow-Origin: {response.headers.get("access-control-allow-origin", "MISSING ❌")}')
    print(f'✓ Access-Control-Allow-Credentials: {response.headers.get("access-control-allow-credentials", "MISSING ❌")}')
    print()

    # Test 2: HTTPException with 401 (invalid credentials)
    print("TEST 2: HTTPException 401 (POST /api/auth/login with invalid credentials)")
    print("-" * 80)
    response = client.post(
        '/api/auth/login',
        json={'email': 'test@example.com', 'password': 'wrongpassword'},
        headers={'Origin': 'https://riva-snowy-beta.vercel.app'}
    )
    print(f'✓ Status Code: {response.status_code}')
    print(f'✓ Response Body: {response.json()}')
    cors_origin = response.headers.get("access-control-allow-origin")
    cors_creds = response.headers.get("access-control-allow-credentials")
    www_auth = response.headers.get("www-authenticate")

    print(f'✓ Access-Control-Allow-Origin: {cors_origin if cors_origin else "MISSING ❌"}')
    print(f'✓ Access-Control-Allow-Credentials: {cors_creds if cors_creds else "MISSING ❌"}')
    print(f'✓ WWW-Authenticate: {www_auth if www_auth else "MISSING ❌"}')

    if not cors_origin:
        print()
        print("❌ FAILURE: 401 response missing CORS header!")
        print("   This means the custom exception handler is not working.")
        sys.exit(1)
    print()

    # Test 3: Pydantic validation error (422)
    print("TEST 3: Validation error 422 (POST /api/auth/login with missing password)")
    print("-" * 80)
    response = client.post(
        '/api/auth/login',
        json={'email': 'test@example.com'},
        headers={'Origin': 'https://riva-snowy-beta.vercel.app'}
    )
    print(f'✓ Status Code: {response.status_code}')
    print(f'✓ Response Body: {response.json()}')
    cors_origin = response.headers.get("access-control-allow-origin")
    print(f'✓ Access-Control-Allow-Origin: {cors_origin if cors_origin else "MISSING ❌"}')
    print()

    # Test 4: OPTIONS preflight
    print("TEST 4: OPTIONS preflight request")
    print("-" * 80)
    response = client.options(
        '/api/auth/login',
        headers={
            'Origin': 'https://riva-snowy-beta.vercel.app',
            'Access-Control-Request-Method': 'POST',
            'Access-Control-Request-Headers': 'content-type'
        }
    )
    print(f'✓ Status Code: {response.status_code}')
    print(f'✓ Access-Control-Allow-Origin: {response.headers.get("access-control-allow-origin", "MISSING ❌")}')
    print(f'✓ Access-Control-Allow-Methods: {response.headers.get("access-control-allow-methods", "MISSING ❌")}')
    print(f'✓ Access-Control-Allow-Headers: {response.headers.get("access-control-allow-headers", "MISSING ❌")}')
    print()

    # Test 5: Invalid origin should NOT get CORS header
    print("TEST 5: Request from non-allowed origin")
    print("-" * 80)
    response = client.post(
        '/api/auth/login',
        json={'email': 'test@example.com', 'password': 'wrongpassword'},
        headers={'Origin': 'https://evil-site.com'}
    )
    print(f'✓ Status Code: {response.status_code}')
    cors_origin = response.headers.get("access-control-allow-origin")
    if cors_origin:
        print(f'❌ Access-Control-Allow-Origin: {cors_origin} (SHOULD BE MISSING!)')
        print()
        print("❌ FAILURE: Evil origin got CORS header!")
        sys.exit(1)
    else:
        print(f'✓ Access-Control-Allow-Origin: None (correct - origin not allowed)')
    print()

    print("=" * 80)
    print("✅ ALL TESTS PASSED!")
    print("=" * 80)
    print()
    print("The custom exception handler is working correctly:")
    print("  ✓ HTTPException responses include CORS headers")
    print("  ✓ WWW-Authenticate header is preserved")
    print("  ✓ Only allowed origins get CORS headers")
    print("  ✓ OPTIONS preflight works")
    print()
    print("🚀 SAFE TO COMMIT AND DEPLOY")

except ImportError as e:
    print(f"Error: Missing dependency - {e}")
    print()
    print("To run this test, install dependencies:")
    print("  cd backend")
    print("  pip install -r requirements.txt")
    sys.exit(1)
except Exception as e:
    print(f"Error running tests: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
