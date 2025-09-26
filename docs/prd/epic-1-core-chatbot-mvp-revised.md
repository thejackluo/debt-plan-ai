# Epic 1: Core Chatbot MVP (Revised)

**Epic Goal**: To deliver a functional, deployed MVP of the CollectWise chatbot in ~2 hours, following a decoupled frontend/backend architecture.

### Story 1.1: Project Setup (Frontend & Backend Skeletons)

**As a** developer, **I want** to set up separate Next.js frontend and backend applications and deploy them to Vercel, **so that** I have a working polyrepo structure and CI/CD pipeline.

**Acceptance Criteria:**

- A GitHub repository is created with frontend and backend directories.
- The frontend directory contains a new Next.js + TypeScript application.
- The backend directory contains a new server application (e.g., Express with TypeScript).
- Both applications are deployed to Vercel and are accessible via live URLs.

### Story 1.2: Implement Basic Chat UI & Persistence

**As a** developer, **I want** to build the chat UI using @nlux/react and connect it to a backend persistence layer, **so that** users can have a persistent conversation.

**Acceptance Criteria:**

- The @nlux/react library and Tailwind CSS are added to the frontend project.
- The UI is implemented with a text input and message display. User messages are added to the chat window on send.
- The backend has GET, POST, and DELETE endpoints at /api/history that manage a history.json file.
- The frontend successfully loads, saves, and deletes its conversation history by calling the backend history endpoints.

### Story 1.3: Scalable OpenAI API Endpoint

**As a** developer, **I want** to create a well-structured and documented backend endpoint that connects to OpenAI, **so that** I have a scalable foundation for the AI agent.

**Acceptance Criteria:**

- A /api/chat endpoint is created in the backend application.
- The endpoint is well-documented using comments (e.g., JSDoc).
- It takes a conversation history and proxies the request to the OpenAI API via the Vercel AI SDK.
- The frontend sends its conversation to this endpoint and displays the streamed response.

### Story 1.4: Setup LangGraph & BAML

**As a** developer, **I want** to set up the basic LangGraph and BAML structure in the backend, **so that** the foundation for the stateful agent is in place.

**Acceptance Criteria:**

- LangGraph and BAML are installed in the backend project.
- A basic LangGraph graph is defined with placeholder nodes representing the agent flow.
- A basic BAML file is created to define the function signature for check_user_intent.
- The /api/chat endpoint is wired to be the entry point for this graph.

### Story 1.5: Implement Full Negotiation Agent

**As a** developer, **I want** to fully implement the LangGraph agent flow using BAML, **so that** the chatbot can handle all negotiation cases and generate the final URL.

**Acceptance Criteria:**

- All nodes and conditional edges in the LangGraph diagram are fully implemented.
- BAML functions are created for all required AI interactions.
- The agent correctly handles the Payer, Negotiator, Stonewaller, and "No Debt" Claim case studies.
- The agent successfully generates the correctly formatted collectwise.com/payments URL upon reaching an agreement.

### Story 1.6: Comprehensive Test Suite Implementation

**As a** developer, **I want** to implement a comprehensive automated test suite with 10 detailed conversation scenarios, **so that** I can ensure the chatbot handles all user types reliably and maintains quality over time.

**Acceptance Criteria:**

- A comprehensive test suite is implemented with 10 detailed conversation scenarios covering normal and edge cases.
- Test scenarios include: Compliant Payer, Cooperative Negotiator, Unrealistic Stonewaller, No Debt Claimant, What If Negotiator, Prompt Injection Attacker, Good Faith Promise Maker, Emotional/Venting User, Split Payment Proposer, and Bargain Hunter.
- An automated test runner script validates conversation flows, URL generation, tone, and security measures.
- All tests can be executed with a single command (`npm run test:scenarios`) and provide clear pass/fail reporting.
- The test suite integrates with the existing Jest testing framework and can be run as part of CI/CD pipeline.
