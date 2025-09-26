# Goals and Background Context

### Goals

- To build an AI agent that intelligently negotiates a **reasonable and realistic payment plan**.
- To implement a **stateful, multi-path negotiation strategy** that can handle various user personas and tricky situations like debt denial.
- To provide a **simple and professional desktop-first chat UI** using the `@nlux/react` library.
- To ensure the chat history **persists in a server-side JSON file**.
- To successfully deploy the decoupled frontend and backend applications to Vercel.

### Background Context

CollectWise is redefining financial obligation management through AI-powered automation. This project is to create a core feature: an intelligent chatbot that empowers users to navigate their debts with flexibility. The chatbot will engage users via a simple chat interface to assess their financial constraints and personalize a debt resolution plan, starting with an initial debt of $2400. The core challenge is to manage the negotiation flow intelligently, handling various user attitudes and ensuring a constructive outcome.

### Change Log

| Date         | Version | Description                                                                                       | Author    |
| :----------- | :------ | :------------------------------------------------------------------------------------------------ | :-------- |
| Sep 25, 2025 | 1.1     | Incorporated detailed negotiation logic, UI specs, and tech stack.                                | John (PM) |
| Sep 25, 2025 | 1.2     | Added LangGraph flow, revised stories, specified polyrepo structure and `@nlux/react` UI library. | John (PM) |

---
