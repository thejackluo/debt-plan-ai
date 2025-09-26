# 7. Development Workflow

### Local Setup

1. Clone the repository.

2. Run `npm install` inside both the frontend and backend directories.

3. Create a `.env` file in the backend directory and add your `OPENAI_API_KEY`.

4. To run both servers simultaneously, you can use two separate terminals or install concurrently:

```bash
npm install -g concurrently
concurrently "npm run dev --prefix frontend" "npm run dev --prefix backend"
```

---
