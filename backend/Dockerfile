# ─────────────────────────────────────────────────────────────────────────────
# KarmMitra AI — Unified Gateway Dockerfile
# ─────────────────────────────────────────────────────────────────────────────
# Build context is the MONOREPO ROOT (set in docker-compose.yml).
# Installs dependencies for backend (M1), rag-service (M2), and lti-security (M3).
# ─────────────────────────────────────────────────────────────────────────────

FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /workspace

# Install system dependencies for cryptography and build tools
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# Install combined Python dependencies across all subsystems
COPY backend/requirements.txt /tmp/backend-reqs.txt
COPY rag-service/requirements.txt /tmp/rag-reqs.txt
COPY lti-security/requirements.txt /tmp/lti-reqs.txt

RUN pip install --no-cache-dir \
    -r /tmp/backend-reqs.txt \
    -r /tmp/rag-reqs.txt \
    -r /tmp/lti-reqs.txt

# Copy all source code
COPY . .

# Ensure both backend/app and workspace root are on PYTHONPATH
ENV PYTHONPATH=/workspace/backend:/workspace

EXPOSE 8000

# Default command — overridden by docker-compose for --reload during dev
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
