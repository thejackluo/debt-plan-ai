# 5. Unified Project Structure

The project will live in a single GitHub repository with the following structure:

```
collectwise-chatbot/
├── backend/
│   ├── data/
│   │   └── history.json        # Chat persistence
│   ├── src/
│   │   ├── agent/              # LangGraph and BAML setup
│   │   │   ├── graph.ts
│   │   │   └── functions.baml
│   │   ├── api/                # Express routes
│   │   │   ├── historyRoutes.ts
│   │   │   └── chatRoutes.ts
│   │   └── index.ts            # Express server entry point
│   ├── tests/
│   │   └── agent.test.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json             # Vercel deployment config for backend
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Main page component
│   │   │   └── layout.tsx
│   │   └── components/
│   │       └── ChatController.tsx  # Component managing state and API calls
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── vercel.json             # Vercel deployment config for frontend
│
├── docs/
│   ├── prd.md
│   └── architecture.md
│
└── .gitignore
```

---
