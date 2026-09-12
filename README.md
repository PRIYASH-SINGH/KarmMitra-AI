# KarmMitra AI - Competency Gap & Learning Pathway Engine
*Smart India Hackathon 2026 - Problem Statement SIH26101 (MoSPI)*

KarmMitra AI is a sovereign AI-driven learning platform designed for the Ministry of Statistics and Programme Implementation (MoSPI). It identifies competency gaps using a deterministic RAG (Retrieval-Augmented Generation) engine and integrates seamlessly with the iGOT Karmayogi ecosystem via LTI 1.3 standards.

---

## ?? Getting Started (Prototype Deployment)

The entire microservices architecture is dockerized for easy deployment, ensuring it can run securely on local government servers (like MeghRaj cloud).

### Prerequisites
- Docker Desktop (or Docker Engine + Docker Compose)
- Git

### Installation & Bootstrapping
1. Clone the repository and navigate to the project root:
   ```bash
   git clone https://github.com/PRIYASH-SINGH/KarmMitra-AI.git
   cd "KarmMitra AI"
   ```
2. Configure environment variables (a secure template is provided):
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```
3. Start the system via Docker Compose:
   ```bash
   docker compose up --build -d
   ```
   *Note: On first run, it may take several minutes to download the PostgreSQL, Node, and Python base images.*

---

## ?? Accessing the Subsystems

Once the Docker containers are running successfully, you can access the various interconnected modules of the prototype:

1. **Mock iGOT Platform (LMS Simulator):** [`http://localhost:9000`](http://localhost:9000)
   - *Start Here!* This simulates the official government iGOT portal. You can select a synthetic MoSPI official persona and initiate a secure LTI 1.3 Single Sign-On (SSO) launch into KarmMitra AI.

2. **Learner UI (KarmMitra AI Tool):** [`http://localhost:3000`](http://localhost:3000)
   - This is the primary user interface where the official lands after launching from iGOT. It hosts the AI assessment, gap detection, and recommended learning pathways.

3. **Admin Dashboard (Analytics):** [`http://localhost:3001`](http://localhost:3001)
   - A centralized dashboard for MoSPI administrators and supervisors to view division-wide skill-gap metrics and training progression.

4. **FastAPI Backend Gateway:** [`http://localhost:8000/docs`](http://localhost:8000/docs)
   - Interactive Swagger UI for developers to inspect the core backend REST APIs.

---

## ?? How to Test the Primary Workflow

To evaluate the core value proposition of KarmMitra AI, follow this exact flow:

1. Open the **Mock iGOT Platform** (`http://localhost:9000`).
2. Select a target official (e.g., "Field Investigator Grade-II").
3. Click **Launch KarmMitra AI**.
4. You will be securely authenticated (via OIDC/JWT) and redirected to the **Learner UI**, with your official FRAC competency role automatically loaded.
5. Begin the Baseline Diagnostic. The system will generate targeted multiple-choice questions (MCQs) powered by our local AI model.
6. Submit your answers. Your competency gaps will be mapped, and a 70:20:10 learning pathway will be generated.
7. Your final diagnostic grade is passed back securely to the Mock iGOT gradebook via LTI AGS (Assignment and Grade Services).

---

## ??? Architecture Highlights
- **Absolute Data Sovereignty:** Uses Llama-3-8B running strictly on local infrastructure via `vLLM`. No government data leaves the intranet.
- **Zero Hallucination AI:** Assessments are generated purely from verified MoSPI and NSSTA manuals indexed in ChromaDB using a strict Retrieval-Augmented Generation (RAG) pipeline.
- **Frictionless Integration:** Open Standards (LTI 1.3 Advantage) integration ensures zero-password friction for government officials already using iGOT Karmayogi.
- **Open-Source Scalability:** Built purely on an open-source stack (PostgreSQL, FastAPI, React) requiring zero recurring licensing fees.
