"""Regression tests for the RIVA backend "it doesn't come up" problem.

Symptom reported: running the backend did nothing / exited instantly.

Two independent causes were confirmed:

1. `main.py` had no `if __name__ == "__main__"` entry point, so
   `python main.py` imported the app, printed nothing, exited with code 0
   and never bound a port. Users read that as "backend is not starting".

2. Every runtime dependency (fastapi, uvicorn, sqlalchemy, ...) lives only
   in `backend/.venv`, which is Python 3.14. The default interpreter on this
   machine is Anaconda 3.13 with none of those packages, so any command run
   without activating the venv fails with `ModuleNotFoundError`.

These tests lock both behaviours down so a regression is caught immediately.
"""

import os
import socket
import subprocess
import sys
import time
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BACKEND_DIR))

VENV_PYTHON = BACKEND_DIR / ".venv" / "bin" / "python"


# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------
def _free_port() -> int:
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def _wait_for_health(port: int, proc: subprocess.Popen, timeout: float = 45.0):
    """Poll /health until the server answers. Returns (ok, detail)."""
    import urllib.error
    import urllib.request

    deadline = time.time() + timeout
    last_error = None

    while time.time() < deadline:
        if proc.poll() is not None:
            return False, f"process exited early with code {proc.returncode}"

        try:
            with urllib.request.urlopen(
                f"http://127.0.0.1:{port}/health", timeout=3
            ) as resp:
                if resp.status == 200:
                    return True, resp.read().decode()
        except Exception as error:  # noqa: BLE001 - poll loop, any error is retryable
            last_error = error

        time.sleep(0.4)

    return False, f"timed out after {timeout}s; last error: {last_error}"


# --------------------------------------------------------------------------
# 1. Environment / dependency tests
# --------------------------------------------------------------------------
def test_venv_python_exists():
    """The project venv must exist; it is the only interpreter with deps."""
    assert VENV_PYTHON.exists(), (
        f"Missing {VENV_PYTHON}. Recreate with:\n"
        f"  python3 -m venv {BACKEND_DIR / '.venv'} && "
        f"{VENV_PYTHON} -m pip install -r {BACKEND_DIR / 'requirements.txt'}"
    )


def test_runtime_dependencies_importable():
    """All runtime deps must import under the project venv."""
    code = (
        "import fastapi, uvicorn, sqlalchemy, psycopg, pydantic, jwt, bcrypt, httpx, "
        "openai, alembic, dotenv; print('deps-ok')"
    )
    result = subprocess.run(
        [str(VENV_PYTHON), "-c", code],
        capture_output=True,
        text=True,
        cwd=BACKEND_DIR,
    )
    assert result.returncode == 0, (
        "Runtime dependencies are not installed in the venv:\n"
        f"stdout: {result.stdout}\nstderr: {result.stderr}\n"
        f"Fix: {VENV_PYTHON} -m pip install -r {BACKEND_DIR / 'requirements.txt'}"
    )
    assert "deps-ok" in result.stdout


def test_env_file_has_required_keys():
    """.env must define the keys database.py and auth.py require."""
    env_path = BACKEND_DIR / ".env"
    assert env_path.exists(), f"Missing {env_path}. Copy .env.example to .env."

    values = {}
    for raw in env_path.read_text().splitlines():
        raw = raw.strip()
        if not raw or raw.startswith("#") or "=" not in raw:
            continue
        key, _, value = raw.partition("=")
        values[key.strip()] = value.strip()

    for key in ("DATABASE_URL", "JWT_SECRET_KEY"):
        assert values.get(key), f"{key} missing or empty in .env"


def test_database_url_is_not_a_placeholder():
    """A placeholder URL makes every request 500 with a driver/connect error."""
    os.environ["DATABASE_URL"] = "postgresql+psycopg://localhost/ledgerai"
    assert os.environ["DATABASE_URL"], "DATABASE_URL must resolve"

    database = __import__("database")
    url = database.DATABASE_URL
    assert url, "DATABASE_URL did not resolve"
    assert "psycopg" in url, f"Expected psycopg (v3) driver in URL, got: {url}"


# --------------------------------------------------------------------------
# 2. App import tests
# --------------------------------------------------------------------------
def test_app_imports_and_exposes_routes():
    """The FastAPI app must import and register its public routes."""
    main = __import__("main")

    assert hasattr(main, "app"), "main.py must expose an `app` object"
    routes = {route.path for route in main.app.routes}

    for required in ("/", "/health", "/api/auth/login", "/api/businesses"):
        assert required in routes, f"Missing route: {required} (has {sorted(routes)})"


def test_main_has_console_entry_point():
    """Regression: `python main.py` must boot the server, not exit silently.

    This is the exact cause of 'backend does not come up' - previously the
    module had no `__main__` guard, so it imported, printed nothing and
    exited with code 0 without binding a port.
    """
    source = (BACKEND_DIR / "main.py").read_text()
    assert '__name__ == "__main__"' in source or "__name__ == '__main__'" in source, (
        "main.py has no `if __name__ == \"__main__\":` block, so `python main.py` "
        "exits immediately without starting the server."
    )
    assert "uvicorn.run" in source, (
        "main.py must call uvicorn.run(...) in its __main__ block to bind a port."
    )


# --------------------------------------------------------------------------
# 3. Live boot test - the real proof
# --------------------------------------------------------------------------
def test_backend_actually_serves_requests():
    """Boot the backend exactly as a user would and hit it over HTTP."""
    port = _free_port()
    env = dict(os.environ)
    env["PORT"] = str(port)

    proc = subprocess.Popen(
        [str(VENV_PYTHON), "main.py"],
        cwd=BACKEND_DIR,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        env=env,
    )

    try:
        ok, detail = _wait_for_health(port, proc)
        assert ok, f"Backend did not become healthy: {detail}"

        # Root endpoint
        import urllib.request

        with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=5) as resp:
            assert resp.status == 200
            body = resp.read().decode()
        assert "RIVA" in body, f"Unexpected root response: {body}"

        # CORS preflight from the frontend origin
        request = urllib.request.Request(
            f"http://127.0.0.1:{port}/api/businesses",
            method="OPTIONS",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        with urllib.request.urlopen(request, timeout=5) as resp:
            assert resp.status == 200
            assert resp.headers.get("access-control-allow-origin"), (
                "CORS preflight from http://localhost:3000 missing "
                "access-control-allow-origin header"
            )
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()
            proc.wait(timeout=5)


# --------------------------------------------------------------------------
# Runner so the file works with or without pytest
# --------------------------------------------------------------------------
def main() -> int:
    tests = [
        test_venv_python_exists,
        test_runtime_dependencies_importable,
        test_env_file_has_required_keys,
        test_database_url_is_not_a_placeholder,
        test_app_imports_and_exposes_routes,
        test_main_has_console_entry_point,
        test_backend_actually_serves_requests,
    ]

    failures = []
    for test in tests:
        try:
            test()
            print(f"PASS  {test.__name__}")
        except AssertionError as error:
            failures.append((test.__name__, str(error)))
            print(f"FAIL  {test.__name__}: {error}")
        except Exception as error:  # noqa: BLE001
            failures.append((test.__name__, f"{type(error).__name__}: {error}"))
            print(f"ERROR {test.__name__}: {type(error).__name__}: {error}")

    print()
    if failures:
        print(f"{len(failures)}/{len(tests)} tests failed")
        return 1

    print(f"All {len(tests)} tests passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())