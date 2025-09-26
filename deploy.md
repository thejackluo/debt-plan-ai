# Deployment Guide (Vercel)

## Overview

This guide explains how to deploy the **CollectWise Chatbot** to Vercel. Because our project uses a **polyrepo** structure (separate `frontend` and `backend` folders in one GitHub repository), we will create **two distinct Vercel projects**.

This approach provides a clean separation of concerns, allows for independent deployments, and is the most straightforward method for this architecture.

---

## Prerequisites

1.  **Vercel Account**: You need a Vercel account (the free Hobby plan is sufficient).
2.  **GitHub Repository**: Your project code must be pushed to a GitHub repository.
3.  **OpenAI API Key**: Have your `OPENAI_API_KEY` ready.

---

## Step-by-Step Instructions

We will deploy the backend first to get its public URL, which the frontend will need.

### Part 1: Deploying the Backend API

1.  **Log in to Vercel**: Go to your Vercel dashboard.
2.  **Add New Project**: Click on "Add New..." and select "Project".
3.  **Import Repository**: Import the GitHub repository containing your project.
4.  **Configure Project**: This is the most important step.
    - **Project Name**: Name it something clear, like `collectwise-backend`.
    - **Root Directory**: Click "Edit" next to it and select the **`backend`** folder from the dropdown. Vercel will now treat this folder as the project's root.
5.  **Configure Environment Variables**:
    - Navigate to the "Environment Variables" section.
    - Add a new variable with the name `OPENAI_API_KEY` and paste your secret key as the value.
6.  **Deploy**: Click the "Deploy" button. Vercel will build and deploy your Express.js API as a serverless function based on your `backend/vercel.json` file.
7.  **Get the URL**: Once deployment is complete, Vercel will assign it a production URL (e.g., `https://collectwise-backend-yourname.vercel.app`). **Copy this URL.**

### Part 2: Deploying the Frontend UI

1.  **Add New Project Again**: Go back to your Vercel dashboard and click "Add New..." -> "Project" again.
2.  **Import the Same Repository**: Select the exact same GitHub repository as before.
3.  **Configure Project**:
    - **Project Name**: Name it something like `collectwise-frontend`.
    - **Root Directory**: This time, set the Root Directory to the **`frontend`** folder. Vercel will automatically detect that it's a Next.js project.
4.  **Configure Environment Variables**:
    - This is how your frontend will talk to your backend.
    - Add a new variable named `NEXT_PUBLIC_API_URL`.
    - For the value, **paste the backend URL** you copied in Step 7. (The `NEXT_PUBLIC_` prefix is a Next.js requirement to make the variable available in the browser).
5.  **Deploy**: Click "Deploy".
6.  **Done!**: Your frontend is now live. This is the main URL you will share for the assignment. It will make API calls to your separate backend deployment.

---

## Post-Deployment

- **Update Frontend Code**: Make sure your frontend API calls use the environment variable instead of a hardcoded `localhost` address.
  ```typescript
  // Example in frontend/src/components/ChatController.tsx
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const response = await fetch(`${API_URL}/api/chat`, { ... });
  ```
- **Automatic Deployments**: Vercel is now connected to your repository. Any new `git push` to your main branch will automatically trigger new deployments for both projects, keeping your live app up-to-date.
