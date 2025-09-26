# Requirements

### Functional Requirements

- **FR1**: The chatbot must initiate the conversation stating the user owes $2400.

- **FR2**: The chatbot must handle the three user pathways (Payer, Negotiator, Stonewaller) according to the defined negotiation strategy.

- **FR3**: Upon agreement, the chatbot must generate the correctly formatted mock payment URL.

- **FR4**: The system must include a frontend chat interface.

- **FR5**: The chat history must persist between browser sessions.

- **FR6**: The user must be able to clear/delete the entire chat history with a button click.

- **FR7**: The backend must read and write the chat history to a JSON file on the server.

- **FR8**: The agent must handle users who claim they have no debt, as per the handle_no_debt_claim flow.

- **FR9**: The application must be structured as two separate applications in a single repository: frontend and backend.

### Non-Functional Requirements

- **NFR1**: The solution must be built using Next.js and TypeScript.

- **NFR2** (Revised): The agentic framework must be structured using BAML. The stateful conversational flow must be managed by LangGraph.

- **NFR3**: The AI backend will use the OpenAI API via the Vercel AI SDK.

- **NFR4**: Unit testing will be implemented using Jest.

- **NFR5**: The solution must be deployed to Vercel and be fully functional at a live URL.

- **NFR6** (Revised): The chat UI must be implemented using the @nlux/react component library and styled with Tailwind CSS.

- **NFR7**: The application must be scalable and well-structured.

---
