# Security Review — PlatziFlix Backend

**Date:** 2026-08-17
**Scope:** FastAPI application, Docker configuration, database layer

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 2 | Must fix before any deployment |
| 🟠 High | 5 | Must fix before production |
| 🟡 Medium | 6 | Should fix soon |
| 🔵 Low | 5 | Fix as capacity allows |
| **Total** | **18** | |

---

## 🔴 Critical

### C1: Complete Absence of Authentication & Authorization

**File:** `app/main.py` (all endpoints)

Every endpoint is publicly accessible with zero authentication or authorization. Any anonymous client can read all data, create/overwrite ratings as any user, and delete any user's rating.

```python
# Any caller can impersonate any user_id
@app.post("/courses/{slug}/rating", response_model=RatingResponse, status_code=201)
def create_or_update_rating(
    slug: str,
    body: RatingCreate,  # user_id comes from unauthenticated request body
    ...
):
    result = rating_service.upsert_rating(slug, body.user_id, body.rating)
```

**Recommendation:**
- Implement JWT-based or session-based authentication
- `user_id` must derive from the authenticated session, never from user-supplied input
- Add role-based access control if needed (admin vs. student vs. teacher)

---

### C2: Hardcoded Database Credentials in Committed Files

**Files:** `docker-compose.yml:8-9,25`, `app/alembic.ini:87`, `app/core/config.py:7`

Database username and password are hardcoded in plain text across multiple committed files.

```yaml
# docker-compose.yml:8-9
POSTGRES_USER: platziflix_user
POSTGRES_PASSWORD: platziflix_password

# docker-compose.yml:25
DATABASE_URL: postgresql://platziflix_user:platziflix_password@db:5432/platziflix_db
```

**Recommendation:**
- Use Docker secrets or a `.env` file (gitignored) for credentials
- Remove all hardcoded passwords from source-controlled files
- Add `.env` to `.gitignore` and provide `.env.example` with placeholder values
- Use environment variable substitution in docker-compose.yml: `POSTGRES_PASSWORD: ${DB_PASSWORD}`

---

## 🟠 High

### H1: No CORS Configuration

**File:** `app/main.py`

No CORS middleware is configured. Any website could make requests to this API from JavaScript.

**Recommendation:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["*"],
)
```

---

### H2: Health Endpoint Leaks Database Error Details

**File:** `app/main.py:59-61`

The `/health` endpoint returns raw exception messages, exposing internal infrastructure information (host, port, table names, PostgreSQL version).

```python
except Exception as e:
    health_status["status"] = "degraded"
    health_status["database_error"] = str(e)  # Exposes internal details
```

**Recommendation:**
- Log the full error server-side but return only a generic message to the client
- Use structured logging with a correlation ID for debugging

---

### H3: Docker Container Runs as Root

**File:** `Dockerfile`

No non-root user is created. The application runs as root inside the container.

**Recommendation:**
```dockerfile
RUN adduser --disabled-password --no-create-home appuser
USER appuser
```

---

### H4: Uvicorn `--reload` Flag in Production Image

**File:** `Dockerfile:25`

```dockerfile
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

`--reload` watches for file changes and restarts the server, causing performance degradation and potential code execution via file modification.

**Recommendation:**
- Use a production-ready Dockerfile without `--reload`
- Use multi-stage builds to separate dev and production images

---

### H5: Dev Dependencies in Production Image

**File:** `Dockerfile:15`

```dockerfile
RUN uv sync --frozen --extra dev
```

Includes pytest, httpx, and their transitive dependencies in production.

**Recommendation:** Use multi-stage Docker builds to exclude dev dependencies from the production image.

---

## 🟡 Medium

### M1: No Rate Limiting on Any Endpoint

No rate limiting is implemented on any endpoint, including mutation endpoints (POST, DELETE).

**Recommendation:**
- Implement `slowapi` or similar middleware
- Apply stricter limits on mutation endpoints

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/courses/{slug}/rating", ...)
@limiter.limit("10/minute")
def create_or_update_rating(...):
```

---

### M2: Database Port Exposed to Host Network

**File:** `docker-compose.yml:11`

```yaml
ports:
  - "5433:5432"
```

Any process on the host can connect directly to the database, bypassing API-level security.

**Recommendation:** Remove the `ports` mapping for the database service. Use Docker's internal networking for inter-service communication.

---

### M3: SQLAlchemy Engine Without Connection Security

**File:** `app/db/base.py:9`

```python
engine = create_engine(settings.database_url)
```

No SSL/TLS, no connection pool configuration, no timeouts.

**Recommendation:**
```python
engine = create_engine(
    settings.database_url,
    pool_size=5,
    max_overflow=10,
    pool_timeout=30,
    pool_recycle=1800,
    connect_args={"sslmode": "require"} if "localhost" not in settings.database_url else {},
)
```

---

### M4: No Input Validation on `slug` Path Parameter

**Files:** `app/main.py:76,89,105,122`

The `slug` path parameter accepts any string with no pattern validation.

**Recommendation:**
```python
from fastapi import Path

@app.get("/courses/{slug}")
def get_course_by_slug(
    slug: str = Path(..., pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
):
```

---

### M5: Soft Delete Inconsistency

**Files:** `app/services/rating_service.py`, `app/models/base.py`

The `deleted_at` soft-delete mechanism is defined but not enforced at the ORM level. Services manually filter by `deleted_at IS NULL`.

**Recommendation:**
- Use SQLAlchemy events or `with_loader_criteria` to globally filter soft-deleted records
- Add a base query class that auto-applies the filter

---

### M6: No Request Body Size Limits

No request body size limit is configured. An attacker could send extremely large JSON payloads.

**Recommendation:** Configure at the reverse proxy level (nginx `client_max_body_size`) or via FastAPI middleware.

---

## 🔵 Low

### L1: `datetime.utcnow()` Is Deprecated

**Files:** `app/models/base.py:16-17`, `app/services/rating_service.py:136`

**Recommendation:**
```python
from datetime import datetime, timezone
datetime.now(timezone.utc)
```

---

### L2: No Security Headers

No security-related HTTP headers are set (X-Content-Type-Options, X-Frame-Options, HSTS, etc.).

**Recommendation:**
```python
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response
```

---

### L3: No Structured Logging or Audit Trail

No application-level logging exists. Rating creation/deletion produce no audit trail.

**Recommendation:** Add structured logging for all write operations, especially user-affecting ones.

---

### L4: Missing `.env` File / No `.gitignore` for Secrets

No `.gitignore` present in the `Backend/` directory to protect secrets.

**Recommendation:** Create `.gitignore` with:
```
.env
*.pyc
__pycache__
```

---

### L5: Unvalidated `user_id` in RatingCreate Schema

**File:** `app/schemas/course_rating.py:8`

`user_id` is validated only for length (1-100 chars) but accepts any arbitrary string.

**Recommendation:** Once authentication is implemented (C1), derive `user_id` from the auth token.

---

## Priority Remediation Order

1. **[C1]** Implement authentication and authorization
2. **[C2]** Externalize all secrets to environment variables / Docker secrets
3. **[H1]** Add CORS middleware with explicit allowed origins
4. **[H2]** Sanitize error messages in the health endpoint
5. **[H3]** Run Docker container as non-root user
6. **[H4/H5]** Split Dockerfile into dev/production stages, remove `--reload`
7. **[M1]** Add rate limiting (start with `slowapi`)
8. **[M2]** Remove exposed PostgreSQL port from docker-compose
9. **[M3-M6]** Address remaining medium findings
10. **[L1-L5]** Address low findings as part of normal development

> **Bottom line:** This is a development-stage API with zero access control and hardcoded secrets. It is **not safe to deploy** in its current state. The two critical findings (no auth, hardcoded credentials) must be resolved before any external exposure.
