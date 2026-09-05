# ─────────────────────────────────────────────────────────────────────────────
# KarmMitra AI — Dockerfile (Member 1: Priyash)
# ─────────────────────────────────────────────────────────────────────────────
# WHY python:3.11-slim (not 3.12+):
#   asyncpg and several ML-adjacent libs have stable wheels on 3.11.
#   slim variant removes build cruft, cutting image from ~900MB to ~200MB.
# WHY --no-cache-dir:
#   Pip cache is useless inside a container — saves 30-50MB per build.
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

# Prevents Python from writing .pyc files and enables real-time log output
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Copy requirements first (Docker layer caching: only re-install if deps change)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Expose the FastAPI gateway port
EXPOSE 8000

# Default command — overridden by docker-compose for --reload during dev
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
