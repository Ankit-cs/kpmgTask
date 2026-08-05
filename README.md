# AI-Powered Code Grading & Doubt Resolution Portal

![Next.js](https://img.shields.io/badge/Next.js-React-black) ![Express](https://img.shields.io/badge/Express-Node.js-green) ![Docker](https://img.shields.io/badge/Docker-Sandbox-blue) ![Redis](https://img.shields.io/badge/BullMQ-Redis-red)

> *Empowering education through secure, scalable, and intelligent automated workflows.*

**Live Demo:** [https://kpmgv1.vercel.app](https://kpmgv1.vercel.app)

## Highlights

- **Bulletproof Code Sandbox:** Ephemeral, isolated Docker containers ensure 100% safe execution of untrusted student code.
- **Asynchronous Scalability:** BullMQ & Redis decouple execution from HTTP threads, preventing bottlenecks during peak submission times.
- **Enterprise AI Security:** Stage-2 prompt injection isolation and deterministic Regex filtering actively block LLM hallucinations and malicious queries.
- **High-Availability LLM Engine:** A resilient LangChain pipeline defaults to Google Gemini (1.5-Flash) but instantly hot-swaps to Groq (Llama-3) upon failure.
- **0xMemory Historical Context Injection:** The AI Teaching Assistant dynamically retrieves a student's past code submissions from the database and injects them into its context window, providing highly personalized guidance.
- **Human-In-The-Loop (HITL) Workflow:** A strict state machine allows teachers to intercept, edit, approve, or reject AI-drafted responses before publishing them to the student board.
- **Unified Student Dashboard:** A seamless, persistent navigation layout for students to easily switch between the Sandbox, Questions/Assignments, and Submission History without losing state.
- **One-Click AI Error Analysis:** Students can request instant, contextual AI explanations and fix suggestions for any compilation or runtime errors they encounter in the sandbox.
- **Framer Motion UI:** A completely responsive, highly polished Next.js frontend featuring fluid animations and a split-pane Monaco editor.

## Recent Updates

- **Teacher Review Portal (HITL)**: Full implementation of the teacher dashboard (`/teacher/review`) for human-in-the-loop review, editing, and approval of AI-generated doubt drafts.
- **Instant Draft Visibility**: Bridged the gap between speed and safety by showing AI drafts to students instantly with a bright orange "Pending Teacher Verification" badge. The badge clears once a teacher approves it.
- **0xMemory Context Linking Fix**: Resolved a dummy-ID mismatch between the Sandbox and the Doubt Board. The AI now successfully injects the student's actual broken code submissions into the doubt resolution context!
- **Host-Mode Fallback & Windows Support**: Added `MODE=host` fallback for local execution when Docker is unavailable. Optimized C++ compilation timeouts to support heavy standard libraries (`bits/stdc++.h`) on Windows.
- **Doubt Management**: Added a "Refresh Board" button for students and full cascading deletion capabilities for doubts and their associated drafts.

## Overview

Evaluating code manually is slow, and generic AI feedback is often noisy or insecure. This platform bridges the gap by functioning as an intelligent, full-stack Learning Management System (LMS). 

It empowers students to submit code into a secure grading sandbox, while simultaneously generating deep, qualitative feedback using structured AI responses. Beyond grading, it features an interactive **Doubt Resolution Board** where the AI acts as a Teaching Assistant, drafting personalized responses using historical memory context, which then traverse a strict state machine controlled by human teachers.

### Authors

Architected and developed for the KPMG Assignment.

## System Architecture

The system separates concerns cleanly across the stack to ensure maximum performance and security.

```mermaid
graph TD
    A[Student Client] -->|Submit Code or Doubt| B(Next.js Frontend)
    B -->|HTTP Requests| C{Express.js Backend}
    
    C -->|Code Execution| D[BullMQ + Redis]
    D -->|Process Async| E(Worker Process)
    E -->|Execute Code| F[Docker Sandbox]
    
    C -->|Historical Query| J[(PostgreSQL)]
    J -->|Context Injection| G
    
    E -->|Grade Code| G[LangChain + Zod]
    C -->|Draft Doubt| G
    
    G -->|Primary| H((Gemini 1.5))
    G -.->|Fallback| I((Groq Llama-3))
    
    G -->|Save Results & Drafts| J
```

### 1. Frontend Client (Next.js)
The presentation layer is built on React 18 and Next.js App Router. It leverages Tailwind CSS for utility-first styling and Framer Motion for complex entrance and exit animations. The core IDE experience is powered by Microsoft's Monaco Editor, giving students a VS-Code-like experience in the browser. 

The application is structured into distinct portals:
- **Student Dashboard:** Features a unified, persistent layout with a top navigation bar, allowing students to seamlessly browse assignments, review their submission history, and experiment in the code sandbox.
- **Teacher Review Portal:** A dedicated interface for human-in-the-loop validation of AI-generated responses.

When a user executes code, the frontend utilizes an optimized HTTP polling loop or WebSockets to fetch the execution results. It also features a built-in AI Error Analysis tool that provides instant, contextual help for compilation errors directly within the execution panel.

### 2. Execution Engine (Docker & BullMQ)
Security is the absolute priority when dealing with untrusted user code. Instead of executing code directly on the Node.js server, the Express backend pushes execution payloads into a Redis-backed BullMQ queue. A background worker picks up these jobs and spins up an ephemeral Docker container for every single submission. The container lacks internet access and is heavily restricted by memory and CPU constraints. Once the execution finishes (or times out), the container is immediately destroyed.

### 3. AI Grading & Context Memory (LangChain)
The grading system goes beyond simple string matching. We use LangChain to orchestrate a complex AI pipeline. The primary agent defaults to Google's Gemini 1.5-Flash for rapid inference. If the API rate limits or times out, LangChain's `.withFallbacks()` method automatically reroutes the prompt to Groq's Llama-3.3-70B model. 

For the Doubt Board, the AI implements **0xMemory-style Historical Context Injection**. Before drafting an answer, the backend fetches the student's recent code submissions from Prisma and injects them into the LLM's context window, allowing the AI to deliver hyper-personalized guidance based on what the student was recently struggling with.

### 4. Human-In-The-Loop (HITL) Workflow
All AI-generated doubt drafts enter a strict `DRAFT` state within the PostgreSQL database. Human teachers utilize dedicated API endpoints to intercept these drafts. They can seamlessly edit the AI's response to add human nuance, approve it for publication, or reject it entirely, ensuring 100% quality control.

### 5. AI Security Guardrails
Drawing inspiration from enterprise security tools, this application implements a dual-layer defense against prompt injection and LLM hallucinations. 
- **Layer 1 (Prompt Level):** Uses delimiter isolation techniques (e.g., `###STUDENT_CODE_START###`) to ensure the LLM treats user input strictly as passive data, not executable instructions.
- **Layer 2 (Deterministic Filtering):** A post-processing Regex filter scans the AI's vulnerability report. If the LLM hallucinates a low-priority finding (like a Denial of Service or rate-limiting issue), the Regex engine silently drops it before it hits the database.

## Local Development Setup

### 1. Prerequisites
- Node.js (v18+)
- Docker Desktop (Must be running for code execution)
- PostgreSQL (Local or managed)
- Redis instance (Local or Upstash)

### 2. Environment Variables
Create a `.env` file in the `backend/` directory.

```env
# Database Configuration
DATABASE_URL="postgresql://neondb_owner:npg_ypKbB2S7QAdE@ep-summer-dream-avx3prop-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# BullMQ Redis Configuration
REDIS_URL="redis://localhost:6379"

# AI Provider Keys
GEMINI_API_KEY="your_gemini_key_here"
GROQ_API_KEY="your_groq_key_here"
```

### 3. Database Initialization
We use Prisma as our strictly-typed ORM. Navigate to the backend folder and apply the schema to your Postgres instance.

```bash
cd task/backend
npm install
npx prisma generate
npx prisma db push
```

### 4. Start the Application

The backend serves both the REST API and the BullMQ Worker.
```bash
# Terminal 1: Start the Backend
cd task/backend
npm run dev
```

The frontend uses Next.js server-side rendering.
```bash
# Terminal 2: Start the Frontend
cd task/frontend
npm install
npm run dev
```

Navigate to `http://localhost:3000` to interact with the platform.

## Tradeoffs & Design Decisions

Building a secure, AI-powered code evaluation platform required several deliberate architectural tradeoffs:

- **Docker Containers vs. WebAssembly (Wasm) Execution**: We chose to spin up ephemeral Docker containers for executing untrusted user code. **Tradeoff**: While Docker introduces slight latency (cold starts) and requires more server resources than browser-based Wasm execution, it guarantees absolute isolation, supports arbitrary system dependencies, and perfectly mirrors a real-world server environment.
- **Async BullMQ vs. Synchronous API Execution**: Code execution requests are pushed to a Redis-backed queue rather than handled synchronously by the Express server. **Tradeoff**: This adds infrastructure complexity (requiring Redis and background workers), but strictly prevents the Node.js event loop from blocking during heavy peak-submission loads, ensuring the API remains highly available.
- **Human-In-The-Loop (HITL) vs. Fully Automated AI**: Doubt drafts are kept in a `DRAFT` state for human teacher review rather than being instantly published. **Tradeoff**: This introduces a slight delay for students waiting for answers, but guarantees absolute quality control and prevents AI hallucinations from misleading students on complex topics.
- **Gemini 1.5-Flash (Primary) vs. Groq Llama-3 (Fallback)**: We utilize Gemini 1.5-Flash as our primary LLM due to its massive context window (essential for our 0xMemory historical context injection). **Tradeoff**: Relying on a single provider creates a single point of failure, which is why we implemented a LangChain fallback to Groq. While Groq's Llama-3 is blisteringly fast, its smaller context window acts as a functional tradeoff when operating in fallback mode.

## Feedback and Contributing

We welcome contributions to expand the capabilities of this learning platform. If you encounter issues with the Docker sandbox configurations on specific operating systems, please open an issue with your exact Docker daemon logs. We are actively looking for contributors to help expand the list of supported languages (currently limited to Python and JavaScript) and to write more extensive automated test suites for the React components.
