# CollectWise Frontend

The frontend application for the CollectWise debt negotiation chatbot, built with Next.js, React, and Tailwind CSS to provide an intuitive chat interface for debt negotiation conversations.

## 🎨 Overview

This frontend delivers a professional, empathetic chat experience where users can negotiate realistic payment plans for their outstanding debt. The interface focuses on:

- **Clean Chat Interface**: Desktop-first design with responsive mobile support
- **Real-time Messaging**: Streaming responses from the AI negotiation agent
- **Persistent Conversations**: Automatic saving and loading of chat history
- **Professional Styling**: Tailwind CSS with CollectWise branding

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [Component Architecture](#component-architecture)
- [Styling Guide](#styling-guide)
- [API Integration](#api-integration)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your backend URL

# Start development server
npm run dev

# Frontend will be available at http://localhost:3000
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── globals.css         # Global styles and Tailwind imports
│   │   ├── layout.tsx          # Root layout component
│   │   └── page.tsx            # Main chat page
│   ├── components/             # React Components
│   │   ├── ChatController.tsx  # Main chat interface (Story 1.2)
│   │   ├── MessageList.tsx     # Message display component
│   │   ├── MessageInput.tsx    # User input component
│   │   └── LoadingSpinner.tsx  # Loading states
│   ├── types/                  # TypeScript Definitions
│   │   └── chat.ts            # Chat message interfaces
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useChat.ts         # Chat state management
│   │   └── useHistory.ts      # History persistence
│   ├── services/              # API Services
│   │   ├── chatApi.ts         # Backend communication
│   │   └── historyApi.ts      # History management
│   └── utils/                 # Utility Functions
│       ├── messageFormatting.ts # Message parsing and display
│       └── urlValidation.ts   # Payment URL validation
├── public/                    # Static Assets
│   ├── favicon.ico           # CollectWise favicon
│   └── logo.png             # Company logo
├── tailwind.config.ts        # Tailwind CSS configuration
├── next.config.ts           # Next.js configuration
└── package.json
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 20.x or later
- npm (comes with Node.js)
- Backend service running (see [Backend README](../backend/README.md))

### Installation

1. **Navigate to frontend directory**

   ```bash
   cd frontend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:

   ```env
   NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
   NEXT_PUBLIC_APP_NAME=CollectWise
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Available Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
npm run lint:fix   # Fix ESLint errors automatically
```

## 🧩 Component Architecture

### Core Components (Current Implementation)

**`ChatController.tsx`** - Main chat interface component

- Manages chat state and message flow
- Handles user input and API communication
- Integrates with history persistence

**`page.tsx`** - Root page component

- Renders the main chat interface
- Handles initial app setup and loading states

### Planned Components (Future Stories)

**`MessageList.tsx`** - Message display component

- Renders conversation history
- Handles message formatting and styling
- Supports streaming message updates

**`MessageInput.tsx`** - User input component

- Text input with send button
- Input validation and character limits
- Keyboard shortcuts (Enter to send)

**`LoadingSpinner.tsx`** - Loading states

- Shows during API calls
- Indicates streaming response in progress

**`PaymentSummary.tsx`** - Payment plan display

- Shows negotiated payment terms
- Displays final payment URLs
- Handles payment link validation

### Component Usage Examples

```tsx
// Basic chat interface
import { ChatController } from "@/components/ChatController";

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ChatController />
    </div>
  );
}

// Custom message display
import { MessageList } from "@/components/MessageList";

<MessageList
  messages={messages}
  isStreaming={isLoading}
  onRetry={handleRetry}
/>;
```

## 🎨 Styling Guide

### Design System

The frontend uses Tailwind CSS with a custom design system:

**Colors:**

```css
/* Primary Brand Colors */
--collectwise-blue: #2563eb
--collectwise-blue-light: #3b82f6
--collectwise-blue-dark: #1d4ed8

/* UI Colors */
--gray-50: #f9fafb    /* Background */
--gray-100: #f3f4f6   /* Light backgrounds */
--gray-200: #e5e7eb   /* Borders */
--gray-600: #4b5563   /* Text secondary */
--gray-900: #111827   /* Text primary */

/* Status Colors */
--success: #10b981    /* Payment accepted */
--warning: #f59e0b    /* Negotiation needed */
--error: #ef4444      /* Payment rejected */
```

**Typography:**

```css
/* Headings */
.text-xl {
  font-size: 1.25rem;
} /* Chat headers */
.text-lg {
  font-size: 1.125rem;
} /* Message headers */

/* Body Text */
.text-base {
  font-size: 1rem;
} /* Main message text */
.text-sm {
  font-size: 0.875rem;
} /* Timestamps, meta */

/* Fonts */
font-family: Inter, system-ui, sans-serif;
```

### Component Styling Patterns

**Chat Messages:**

```tsx
// User message
<div className="flex justify-end mb-4">
  <div className="bg-blue-600 text-white rounded-lg px-4 py-2 max-w-xs">
    {message.content}
  </div>
</div>

// Assistant message
<div className="flex justify-start mb-4">
  <div className="bg-gray-100 text-gray-900 rounded-lg px-4 py-2 max-w-md">
    {message.content}
  </div>
</div>
```

**Input Components:**

```tsx
<input
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  placeholder="Type your message..."
/>
```

**Buttons:**

```tsx
// Primary button
<button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
  Send Message
</button>

// Secondary button
<button className="bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium py-2 px-4 rounded-lg transition-colors">
  Clear History
</button>
```

### Responsive Design

```tsx
// Mobile-first responsive chat
<div className="
  min-h-screen
  max-w-4xl mx-auto
  px-4 sm:px-6 lg:px-8
  py-4 sm:py-6 lg:py-8
">
  {/* Chat content */}
</div>

// Responsive message layout
<div className="
  grid gap-4
  grid-cols-1
  md:grid-cols-3
  lg:grid-cols-4
">
  {/* Messages */}
</div>
```

## 🔌 API Integration

### Chat Service

```typescript
// services/chatApi.ts
export class ChatService {
  private baseUrl: string;

  constructor() {
    this.baseUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  }

  async sendMessage(messages: Message[]): Promise<ReadableStream> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status}`);
    }

    return response.body!;
  }
}
```

### History Management

```typescript
// services/historyApi.ts
export class HistoryService {
  async loadHistory(): Promise<Message[]> {
    const response = await fetch(`${this.baseUrl}/api/history`);
    const data = await response.json();
    return data.messages || [];
  }

  async saveHistory(messages: Message[]): Promise<void> {
    await fetch(`${this.baseUrl}/api/history`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messages }),
    });
  }

  async clearHistory(): Promise<void> {
    await fetch(`${this.baseUrl}/api/history`, {
      method: "DELETE",
    });
  }
}
```

### Custom Hooks

```typescript
// hooks/useChat.ts
export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (content: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const newMessage: Message = {
        role: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);

      // Stream response from backend
      const stream = await chatService.sendMessage(updatedMessages);
      const response = await processStream(stream);

      setMessages((prev) => [...prev, response]);
      await historyService.saveHistory([...updatedMessages, response]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearHistory: () => {
      setMessages([]);
      historyService.clearHistory();
    },
  };
}
```

## 🧪 Testing

### Testing Setup

When Story 1.6 is implemented, comprehensive frontend testing will include:

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest jest-environment-jsdom

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Test Structure

```bash
frontend/
├── __tests__/              # Test files
│   ├── components/         # Component tests
│   │   ├── ChatController.test.tsx
│   │   └── MessageList.test.tsx
│   ├── hooks/             # Hook tests
│   │   └── useChat.test.ts
│   ├── services/          # Service tests
│   │   └── chatApi.test.ts
│   └── pages/             # Page tests
│       └── index.test.tsx
└── __mocks__/             # Mock files
    └── api.ts
```

### Example Tests

```typescript
// __tests__/components/ChatController.test.tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatController } from "@/components/ChatController";

describe("ChatController", () => {
  it("renders chat interface", () => {
    render(<ChatController />);

    expect(
      screen.getByPlaceholderText("Type your message...")
    ).toBeInTheDocument();
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  it("sends message on form submit", async () => {
    render(<ChatController />);

    const input = screen.getByPlaceholderText("Type your message...");
    const sendButton = screen.getByText("Send");

    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.click(sendButton);

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

## 🚀 Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy from frontend directory
   cd frontend
   vercel
   ```

2. **Environment Variables**
   Set in Vercel dashboard:

   ```env
   NEXT_PUBLIC_BACKEND_URL=https://your-backend.vercel.app
   NEXT_PUBLIC_APP_NAME=CollectWise
   ```

3. **Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Manual Production Build

```bash
# Build for production
npm run build

# Start production server
npm start

# Or serve static files
npx serve out
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## ⚙️ Environment Configuration

### Required Environment Variables

```env
# Backend API URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000

# App Configuration
NEXT_PUBLIC_APP_NAME=CollectWise
```

### Optional Environment Variables

```env
# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Feature Flags
NEXT_PUBLIC_ENABLE_DEBUG=false
NEXT_PUBLIC_ENABLE_MOCK_DATA=false

# UI Configuration
NEXT_PUBLIC_MAX_MESSAGE_LENGTH=500
NEXT_PUBLIC_TYPING_INDICATOR_DELAY=1000
```

## 🔍 Troubleshooting

### Common Issues

**1. Backend Connection Errors**

```bash
# Check backend URL
echo $NEXT_PUBLIC_BACKEND_URL

# Test backend health
curl $NEXT_PUBLIC_BACKEND_URL/api/health

# Verify CORS settings in backend
```

**2. Build Errors**

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npx tsc --noEmit
```

**3. Styling Issues**

```bash
# Rebuild Tailwind
npm run build

# Check Tailwind config
npx tailwindcss --init --dry-run
```

**4. Environment Variable Issues**

```bash
# Check environment variables
printenv | grep NEXT_PUBLIC

# Restart dev server after env changes
npm run dev
```

### Debug Mode

Enable debug logging:

```env
NEXT_PUBLIC_ENABLE_DEBUG=true
```

### Performance Monitoring

Check performance metrics:

```bash
# Analyze bundle size
npm run analyze

# Lighthouse audit
npx lighthouse http://localhost:3000
```

## 🤝 Development Workflow

### Code Standards

- **TypeScript**: Strict mode enabled
- **ESLint**: Next.js recommended config
- **Prettier**: Automated formatting

### Component Development

1. **Create component** in `src/components/`
2. **Add TypeScript interfaces** in `src/types/`
3. **Write tests** in `__tests__/components/`
4. **Update Storybook** (if applicable)
5. **Test responsive design**

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-chat-component

# Make changes and test
npm run lint
npm run build
npm test

# Commit with descriptive message
git commit -m "feat: add message streaming component"

# Push and create PR
git push origin feature/new-chat-component
```

## 📚 Related Documentation

- [Backend README](../backend/README.md) - Backend API and services
- [Main README](../README.md) - Project overview and setup
- [Architecture Docs](../docs/architecture/) - System architecture details
- [PRD](../docs/PRD.md) - Product requirements and user stories

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Need Help?**

- Check the [troubleshooting section](#troubleshooting)
- Review [component examples](#component-architecture)
- Consult the [styling guide](#styling-guide)
- See the [API integration](#api-integration) examples
