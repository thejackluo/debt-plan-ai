# CollectWise Debt Negotiation Chatbot

CollectWise is building an AI-powered assistant that helps users negotiate realistic repayment plans when they cannot resolve their debt immediately. This repository hosts the polyrepo frontend and backend projects that power the experience described in the product and architecture documentation.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Feature Highlights](#feature-highlights)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Testing and Quality](#testing-and-quality)
- [Deployment](#deployment)
- [Case Studies](#case-studies)
- [Change Log](#change-log)
- [License](#license)
- [Further Reading](#further-reading)

## Overview

CollectWise aims to make debt resolution empathetic and flexible. The chatbot opens every session by acknowledging the user's $2,400 balance, then collaborates on a structured plan that balances business goals with the user's constraints. The experience focuses on three pillars:

- **Negotiation intelligence** powered by a LangGraph state machine anchored in BAML functions and OpenAI models.
- **Persistent conversations** backed by a lightweight JSON store so users can resume where they left off.
- **A focused desktop chat interface** that feels professional, trustworthy, and simple to use.

## Architecture

The system follows the decoupled architecture outlined in `docs/architecture.md`:

- **Frontend**: Next.js + TypeScript app deployed on Vercel, using `@nlux/react` for a production-ready chat experience styled with Tailwind CSS.
- **Backend**: Express.js server packaged as Vercel serverless functions. It exposes REST endpoints for history management and OpenAI-powered negotiation, and hosts the LangGraph agent along with BAML definitions.
- **AI Workflow**: LangGraph routes the conversation through nodes such as `check_user_intent`, `offer_payment_plan`, `handle_no_debt_claim`, and `handle_stonewaller`. BAML enforces structured prompts and response validation before invoking OpenAI's `gpt-4o` models.
- **Data Persistence**: Chat transcripts live in `backend/data/history.json`, giving the UI instant access to stored conversations and enabling explicit clearing via API.

### Project Structure

```
collectwise-chatbot/
├── backend/
│   ├── data/history.json
│   ├── src/
│   │   ├── agent/graph.ts
│   │   ├── agent/functions.baml
│   │   ├── api/historyRoutes.ts
│   │   ├── api/chatRoutes.ts
│   │   └── index.ts
│   ├── tests/agent.test.ts
│   └── vercel.json
├── frontend/
│   ├── src/app/page.tsx
│   ├── src/app/layout.tsx
│   ├── src/components/ChatController.tsx
│   └── tailwind.config.ts
└── docs/
    ├── PRD.md
    └── architecture.md
```

## Tech Stack

| Category           | Technology            | Purpose                                        |
| ------------------ | --------------------- | ---------------------------------------------- |
| Frontend Framework | Next.js (~14.2)       | Desktop-first chat UI and SSR capabilities     |
| UI Components      | @nlux/react (~0.4)    | Chat layout, message rendering, input controls |
| Styling            | Tailwind CSS (~3.4)   | Utility-first styling system                   |
| Backend Framework  | Express.js (~4.19)    | REST API for chat history and negotiation      |
| Language           | TypeScript (~5.4)     | Type safety for both frontend and backend      |
| AI State Machine   | LangGraph.js (latest) | Conversational flow orchestration              |
| AI Functions       | BAML (latest)         | Structured function schemas for AI calls       |
| AI Provider        | OpenAI `gpt-4o`       | Negotiation reasoning and response generation  |
| Testing            | Jest (~29.7)          | Backend unit and scenario testing              |
| Hosting            | Vercel                | CI/CD and global hosting for both apps         |

## Feature Highlights

- **Tiered negotiation engine** that adapts offers based on user intent (willing payer, negotiator, stonewaller, or no-debt claimant).
- **Persistent transcripts** with explicit load, save, and clear flows driven by REST endpoints.
- **Desktop-first chat UI** with send controls, streaming responses, and a delete-history action.
- **Mock payment link generation** that validates term length, installment amount, and formats URLs as `collectwise.com/payments?...`.
- **Deployable polyrepo** suitable for rapid iteration with independent frontend and backend pipelines.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm (bundled with Node.js)

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd debt-plan-ai
   ```
2. **Install dependencies**
   ```bash
   npm install --prefix frontend
   npm install --prefix backend
   ```
3. **Configure environment variables**
   - `backend/.env`
     ```bash
     OPENAI_API_KEY=sk-...
     ```
   - `frontend/.env.local`
     ```bash
     NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
     ```
     Adjust the backend URL if you run it on a different host or deploy to Vercel.
4. **Run the development servers**
   - In separate terminals:
     ```bash
     npm run dev --prefix backend
     npm run dev --prefix frontend
     ```
   - Or install `concurrently` for a single command:
     ```bash
     npm install -g concurrently
     concurrently "npm run dev --prefix frontend" "npm run dev --prefix backend"
     ```

## Usage

1. Open the frontend at `http://localhost:3000` (or your Vercel preview URL).
2. The chatbot greets the user and confirms the outstanding $2,400 balance.
3. Type responses to negotiate; the LangGraph agent evaluates each message and escalates offers as needed.
4. Accepting a realistic plan returns a mock payment link: `collectwise.com/payments?termLength=...&totalDebtAmount=2400&termPaymentAmount=...`.
5. Use the "Delete History" action to clear stored conversations. This issues a `DELETE /api/history` request and resets the UI.

## API Reference

### `GET /api/history`

Returns the persisted conversation as an array of messages.

### `POST /api/history`

Replaces the stored conversation with the provided message array. Use this when syncing the latest transcript from the frontend.

### `DELETE /api/history`

Clears `history.json`, wiping the conversation for a fresh start.

### `POST /api/chat`

Accepts `{ messages: Message[] }`, routes the payload through the LangGraph agent, and streams the AI's reply back to the frontend.

## Testing and Quality

- Scenario-driven Jest tests (`backend/tests/agent.test.ts`) cover core personas:
  - Payer accepts the first reasonable plan.
  - Negotiator pushes back until a mutually acceptable term emerges.
  - Stonewaller rejects realistic offers and should _not_ yield a payment link.
- Extend the table-driven test suite with additional personas or regression cases as you evolve the agent.

## Deployment

1. **Frontend (collectwise-frontend)**
   - Import the repository into Vercel and set the root directory to `frontend`.
   - Provide `NEXT_PUBLIC_BACKEND_URL` pointing to the deployed backend project.
2. **Backend (collectwise-backend)**
   - Create a separate Vercel project scoped to the `backend` directory.
   - Include `backend/vercel.json` so Vercel builds the Express entry point as a serverless function.
   - Define `OPENAI_API_KEY` in the Vercel environment settings.
3. Update the frontend environment values whenever backend URLs change. Redeploy both projects for synchronized updates.

## Case Studies

| Persona          | Scenario                                                                                                                    | Expected Outcome                                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| The Payer        | User can accept a high-tier offer (e.g., `$800/month` for 3 months).                                                        | Agent confirms the plan and sends a payment link reflecting termLength `3` and termPaymentAmount `800`.             |
| The Negotiator   | User rejects initial offers, negotiating mid-tier terms (e.g., `$400/month` for 6 months, then `$200/month` for 12 months). | Agent revises offers within reasonable floors, ultimately generating a compliant payment link once the user agrees. |
| The Stonewaller  | User proposes unrealistic payments (e.g., `$5/month`).                                                                      | Agent escalates through limited retries, then firmly ends the session without issuing a link.                       |
| No-Debt Claimant | User insists the debt is incorrect.                                                                                         | Agent provides reference information and a contact number, then closes the conversation politely.                   |

Leverage these case studies when demonstrating the chatbot or writing additional automated tests.

## Change Log

| Date         | Document         | Version | Description                                            | Author  |
| ------------ | ---------------- | ------- | ------------------------------------------------------ | ------- |
| Sep 25, 2025 | Architecture Doc | 1.0     | Initial fullstack architecture aligned to PRD v1.2.    | Winston |
| Sep 25, 2025 | Architecture Doc | 1.1     | Added testing strategy and Vercel deployment guidance. | Winston |
| Sep 25, 2025 | PRD              | 1.1     | Refined negotiation logic, UI specs, and tech stack.   | John    |
| Sep 25, 2025 | PRD              | 1.2     | Documented LangGraph flow and polyrepo requirements.   | John    |

## License

This project is released under the terms of the MIT License. See `LICENSE` for details.

## Further Reading

- `docs/PRD.md` – Full product requirements, including epics and acceptance criteria.
- `docs/architecture.md` – Detailed architecture, API design, and deployment notes.
- `docs/project.md` – Original take-home assignment brief and context.
