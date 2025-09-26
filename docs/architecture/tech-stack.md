# Technology Stack

The CollectWise chatbot solution splits into independent frontend and backend applications deployed on Vercel. The stack follows Architecture v1.1 and PRD v1.2 directives.

## Frontend
- **Framework:** Next.js ~14.2 with TypeScript for page routing, server actions, and React 18 features.
- **UI Library:** `@nlux/react` ~0.4 provides production-ready chat components aligned with the PRD UI goals.
- **Styling:** Tailwind CSS ~3.4 supplies utility classes for rapid layout refinements.
- **Build & Deployment:** Vercel frontend project; leverage Edge network and preview deployments for PR validation.

## Backend
- **Runtime:** Node.js 20.x (Vercel default) running Express.js ~4.19 serverless handlers.
- **Language:** TypeScript ~5.4 for type-safe API and agent logic.
- **Agent Framework:** LangGraph.js (latest) orchestrates negotiation states; BAML (latest) defines AI function schemas and validation.
- **Persistence:** File-based `backend/data/history.json` for chat transcripts as mandated by the PRD.
- **AI Provider:** OpenAI API (`gpt-4o` baseline) accessed through the Vercel AI SDK for streamed completions.

## Quality & Tooling
- **Testing:** Jest ~29.7 for unit tests, especially negotiation scenarios.
- **Package Management:** `pnpm` or `npm` (choose one per repo) with lockfiles committed to guarantee reproducible builds.
- **CI/CD:** Vercel Git integration handles both deployments; ensure environment variables (OpenAI keys, etc.) are configured per project.

## Cross-Cutting Concerns
- TypeScript strict mode and ESLint keep the polyrepo consistent.
- Shared interfaces between frontend and backend should live in `backend/src/agent/` and be copied or published to avoid runtime coupling.
- Monitor Vercel function logs for latency; keep payload sizes small by trimming chat history when possible.
