# Source Tree

The repository is organized as a polyrepo inside a single GitHub project, matching the structure defined in Architecture v1.1 and the PRD.

```
collectwise-chatbot/
├── backend/
│   ├── data/
│   │   └── history.json           # JSON persistence for chat transcripts
│   ├── src/
│   │   ├── agent/                 # LangGraph nodes and BAML definitions
│   │   │   ├── graph.ts
│   │   │   └── functions.baml
│   │   ├── api/                   # Express route handlers (history & chat)
│   │   │   ├── historyRoutes.ts
│   │   │   └── chatRoutes.ts
│   │   └── index.ts               # Express server entry point
│   ├── tests/
│   │   └── agent.test.ts          # Jest scenarios for negotiation logic
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json                # Backend deployment configuration
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx           # Main chat page; initializes conversation
│   │   │   └── layout.tsx         # Root layout and providers
│   │   └── components/
│   │       └── ChatController.tsx # Client component handling state + API calls
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── vercel.json                # Frontend deployment configuration
│
├── docs/
│   ├── PRD.md                     # Product requirements (authoritative)
│   ├── architecture.md            # Full architecture reference
│   ├── prd/                       # Sharded PRD sections
│   ├── architecture/              # Sharded architecture sections (this folder)
│   └── project.md                 # Assignment overview and evaluation criteria
│
└── README.md                      # Contributor onboarding
```

## Implementation Notes
- Keep backend and frontend package managers in sync with their lockfiles to prevent CI drift.
- Update the tree when adding significant directories (e.g., shared libraries) so stories stay traceable to the architecture.
- Vercel treats `vercel.json` files independently; ensure routing and regions remain correct per app.
