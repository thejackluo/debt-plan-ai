# 8. Deployment Architecture

### Vercel Compatibility

This polyrepo architecture is fully compatible with Vercel and is a common pattern. To deploy, you will create two separate Vercel projects from your single GitHub repository:

### Frontend Project (collectwise-frontend)

- **Root Directory**: `frontend`
- **Framework Preset**: Next.js
- Vercel will automatically detect and build your Next.js application.

### Backend Project (collectwise-backend)

- **Root Directory**: `backend`
- **Framework Preset**: Other (or Express.js if available)

You will need a `vercel.json` file in the backend directory to tell Vercel how to handle the Express server as a serverless function:

**backend/vercel.json**:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "./src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/src/index.ts"
    }
  ]
}
```

Your frontend application will then call the live URL of your deployed backend project by setting the appropriate environment variable. This is the fastest and simplest way to manage deployment for a 2-hour project.
