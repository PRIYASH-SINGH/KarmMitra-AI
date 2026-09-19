# KarmMitra AI - Sovereign Competency Gap & Learning Pathway Engine

**Smart India Hackathon 2026 - Problem Statement SIH26101 (MoSPI)**

KarmMitra AI is a sovereign, edge-ready learning intelligence platform designed specifically for the Ministry of Statistics and Programme Implementation (MoSPI). It identifies competency gaps using a deterministic RAG (Retrieval-Augmented Generation) engine and integrates seamlessly with the central iGOT Karmayogi ecosystem via strict LTI 1.3 Advantage standards.

---

## 🚀 Getting Started (Prototype Deployment)

The entire microservices architecture is containerized for easy deployment, ensuring it can run securely on local government intranet servers (like the MeghRaj cloud) without external internet dependencies.

### Prerequisites

* Docker Desktop (or Docker Engine + Docker Compose)
* Git

### Installation & Bootstrapping

1. **Clone the repository:**
   ```bash
   git clone https://github.com/PRIYASH-SINGH/KarmMitra-AI.git
   cd "KarmMitra AI"
   ```

2. **Configure environment variables (a secure template is provided):**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   ```

3. **Start the distributed system via Docker Compose:**
   ```bash
   docker compose up --build -d
   ```
   *(Note: On the first run, it may take several minutes to download the PostgreSQL, Node, and Python base images and initialize the Vector Database).*

---

## 🖥️ Accessing the Subsystems

Once the Docker containers are running successfully, you can access the interconnected modules at the following ports:

| Service | URL | Description |
|:---|:---|:---|
| **Mock iGOT Platform** (LMS Simulator) | http://localhost:9000 | **Start Here!** Simulates the official government iGOT portal. Select a synthetic MoSPI official persona and initiate a secure LTI 1.3 SSO launch into KarmMitra AI. |
| **Learner UI** (KarmMitra AI Tool) | http://localhost:3000 | The primary user interface where the official lands after launching from iGOT. Hosts the AI assessment, gap detection, and recommended learning pathways. |
| **Admin Command Center** | http://localhost:5174 | A centralized dashboard for MoSPI administrators and supervisors to view division-wide skill-gap metrics and real-time training progression. |
| **FastAPI Backend Gateway** | http://localhost:8000/docs | Interactive OpenAPI (Swagger) UI for developers to inspect the core backend REST APIs. |

---

## 🎯 How to Test the Primary Workflow

To evaluate the core value proposition of KarmMitra AI, follow this exact flow:

1. Open the **Mock iGOT Platform** (http://localhost:9000).
2. Select a target official (e.g., "Field Investigator Grade-II").
3. Click **Launch KarmMitra AI**. You will be securely authenticated (via OIDC/JWT) and redirected to the Learner UI, with your official FRAC competency role automatically loaded.
4. Begin the **Baseline Diagnostic** or upload a document. The system generates targeted multiple-choice questions (MCQs) powered by our local AI model.
5. Submit your answers. Your competency gaps will be mapped, and a **70:20:10 learning pathway** will be generated.
6. Return to Mock iGOT. Your final diagnostic grade is passed back securely to the Mock iGOT gradebook via the **LTI AGS (Assignment and Grade Services)** pipeline.

---

## 🏗️ Architecture Highlights

| Pillar | Implementation |
|:---|:---|
| **Absolute Data Sovereignty** | Uses Llama-3.2-1B running strictly on local edge infrastructure. No citizen or government data leaves the intranet. |
| **Zero Hallucination AI** | Assessments are generated purely from verified MoSPI/NSSTA manuals indexed in ChromaDB via a strict RAG pipeline, not generative guesswork. |
| **Frictionless Integration** | Open Standards (LTI 1.3 Advantage + OIDC) integration ensures zero-password friction for officials already on iGOT Karmayogi. |
| **Open-Source & Scalable** | Built on PostgreSQL, FastAPI, and React — zero recurring licensing fees, fully auditable, and deployable on MeghRaj. |

---

## 📁 Documentation

Detailed architectural and design documentation is located in the [`docs/`](./docs/) folder:

| Document | Description |
|:---|:---|
| [`02_Decisions.md`](./docs/02_Decisions.md) | Key architectural and technology decisions with rationale. |
| [`03_Explicit_comments.md`](./docs/03_Explicit_comments.md) | Clarifications and constraints for evaluators. |
| [`04_Flow.md`](./docs/04_Flow.md) | End-to-end user flow and system interaction diagrams. |
| [`05_Bug_Feature.md`](./docs/05_Bug_Feature.md) | Known issues, feature flags, and prototype limitations. |
| [`06_Architecture.md`](./docs/06_Architecture.md) | Deep-dive into the microservices architecture and API contracts. |
| [`07-Final_Submission_State.md`](./docs/07-Final_Submission_State.md) | Final verified state of all systems at time of SIH submission. |

---

## 👥 Team

**Team Name:** Tech Trishul
**Problem Statement:** SIH26101 — AI-driven Competency Gap Analysis & Personalized Learning for MoSPI

---

*Built with ❤️ for a more data-capable India.*
