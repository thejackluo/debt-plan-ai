# Coding Standards

These standards align with the CollectWise Chatbot architecture (v1.1) and PRD (v1.2). They keep the polyrepo, Vercel-hosted stack maintainable while we implement the LangGraph/BAML negotiation agent.

## TypeScript & Project Conventions
- Enable `strict` mode in all `tsconfig.json` files; surface compiler warnings as build blockers.
- Prefer named exports; reserve `default` exports for Next.js page/layout modules.
- Co-locate types in `*.types.ts` files when they are shared across modules; otherwise keep types adjacent to their usage.
- Treat lint warnings as errors. Follow idiomatic ES2022 syntax, `const` by default, and avoid implicit `any`.
- Respect the polyrepo separation—never reach across `frontend/` and `backend/` at runtime except via the documented REST API.

## React & Next.js
- Implement all components in TypeScript (`.tsx`) and keep them function-based.
- Use the `@nlux/react` primitives for chat UI. Extend them with Tailwind utility classes instead of bespoke CSS.
- Organize UI logic under `frontend/src/app/` and reusable widgets under `frontend/src/components/`.
- Keep server/client boundaries explicit with the `"use client"` directive only where interactivity is required.

## Node.js, Express & LangGraph
- Keep Express route handlers in `backend/src/api/`. Export each router from its own file and mount them in `backend/src/index.ts`.
- Encapsulate LangGraph nodes under `backend/src/agent/`. Each node file documents its responsibilities and BAML contract.
- Do not execute file system writes outside the `backend/data/history.json` persistence layer; wrap access in a small repository module for reuse.
- All OpenAI and BAML configuration lives in environment variables loaded via `@vercel/edge-config` or `dotenv` during local development.

## Error Handling & Logging
- Use typed `Result` objects (success flag + payload/message) when returning from internal services.
- Log structured JSON (`{ level, message, context }`) in the backend so Vercel functions stay readable.
- Surface user-facing errors through graceful chat responses; never expose raw stack traces to the client.

## Testing Expectations
- Cover negotiation logic with Jest table-driven tests under `backend/tests/` as outlined in the architecture doc.
- Mock external services (OpenAI API, file system) to keep tests deterministic and CI-friendly.
- For frontend behavior, add lightweight React Testing Library tests for critical flows (message rendering, history clearing) once UI stabilizes.

## Version Control & Code Review
- Commit changes that keep backend and frontend deployments green on Vercel.
- Update `docs/` artifacts when architecture or requirements shift; stories should always reference the latest decision record.
- Reference story IDs in commit messages to maintain traceability back to the PRD.
