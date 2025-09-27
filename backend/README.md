# CollectWise Backend

The backend service for the CollectWise debt negotiation chatbot, built with Express.js, TypeScript, and powered by LangGraph for AI conversation flow management.

## 🏗️ Architecture Overview

This backend serves as the AI orchestration layer for debt negotiation conversations. It features:

- **LangGraph State Machine**: Manages conversation flow through negotiation states
- **BAML Function Definitions**: Structured AI function calls with validation
- **OpenAI Integration**: Powered by GPT-4o for intelligent responses
- **Persistent Storage**: JSON-based conversation history
- **RESTful API**: Clean endpoints for frontend integration

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development Setup](#development-setup)
- [API Documentation](#api-documentation)
- [Agent Architecture](#agent-architecture)
- [Testing](#testing)
- [Deployment](#deployment)
- [Environment Configuration](#environment-configuration)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your OpenAI API key

# Start development server
npm run dev

# Backend will be available at http://localhost:4000
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── agent/                    # AI Agent Logic
│   │   ├── graph.ts             # LangGraph state machine
│   │   ├── functions.baml       # BAML function definitions
│   │   └── README.md            # Agent architecture docs
│   ├── api/                     # REST API Routes
│   │   ├── chatRoutes.ts        # /api/chat endpoint
│   │   ├── healthRoutes.ts      # /api/health endpoint
│   │   └── historyRoutes.ts     # /api/history CRUD
│   ├── repositories/            # Data Access Layer
│   │   └── historyRepository.ts # JSON file operations
│   ├── services/                # Business Logic
│   │   └── chatService.ts       # Chat orchestration
│   ├── types/                   # TypeScript Definitions
│   │   └── chat.types.ts        # Shared interfaces
│   ├── utils/                   # Utilities
│   │   └── logger.ts            # Structured logging
│   ├── validation/              # Input Validation
│   │   └── chatValidation.ts    # Zod schemas
│   ├── app.ts                   # Express app setup
│   ├── index.ts                 # Vercel entry point
│   └── server.ts                # Local dev server
├── tests/                       # Test Suite
│   ├── chatRoutes.test.ts       # API endpoint tests
│   ├── chatService.test.ts      # Service layer tests
│   ├── historyRepository.test.ts # Data layer tests
│   └── comprehensive-scenarios/ # Full conversation tests (Story 1.6)
├── data/
│   └── history.json             # Conversation persistence
├── dist/                        # Compiled JavaScript
├── vercel.json                  # Vercel deployment config
└── package.json
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 20.x or later
- npm (comes with Node.js)
- OpenAI API key

### Installation

1. **Clone and navigate to backend**

   ```bash
   cd backend
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment setup**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   OPENAI_API_KEY=sk-your-openai-key-here
   PORT=4000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Available Scripts

```bash
npm run dev        # Start development server with hot reload
npm run build      # Compile TypeScript to JavaScript
npm run start      # Start production server (requires build first)
npm run lint       # Run ESLint
npm run test       # Run Jest test suite
npm run test:watch # Run tests in watch mode
```

## 📡 API Documentation

### Health Check

**GET** `/api/health`

Returns server status and basic diagnostics.

```json
{
  "status": "healthy",
  "timestamp": "2025-01-12T10:30:00Z",
  "version": "0.1.0"
}
```

### Chat Endpoint

**POST** `/api/chat`

Proxies a full conversation transcript to OpenAI via the Vercel AI SDK and
streams the assistant's response back to the caller as plain-text chunks.

**Request Body**

```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a debt negotiation assistant."
    },
    {
      "role": "user",
      "content": "I can't pay $2400 right now, can we break it up?"
    }
  ]
}
```

**Streaming Response**

The endpoint returns `text/plain` chunks. A simple cURL session illustrates the
behaviour:

```bash
curl \
  -H "Content-Type: application/json" \
  -H "X-Request-Id: demo-123" \
  -d '{"messages":[{"role":"user","content":"Hi there"}]}' \
  --no-buffer \
  http://localhost:4000/api/chat
```

If the caller omits `X-Request-Id`, the backend generates a UUID so logs remain
traceable.

**Error Responses**

- `400` – Invalid payload (fails Zod validation)
- `502` – Upstream OpenAI failure after retries
- `500` – Unexpected server error

### History Management

**GET** `/api/history`

Retrieves stored conversation history.

```json
{
  "messages": [
    {
      "role": "assistant",
      "content": "Hello! I see you have an outstanding balance of $2,400..."
    },
    {
      "role": "user",
      "content": "I can only pay $100 per month"
    }
  ]
}
```

**POST** `/api/history`

Saves conversation history (replaces existing).

**Request Body:**

```json
{
  "messages": [
    /* array of message objects */
  ]
}
```

**DELETE** `/api/history`

Clears all conversation history.

## 🤖 Agent Architecture

The CollectWise agent uses LangGraph to manage conversation flow through these key states:

### Negotiation Flow States

1. **check_user_intent** - Determines user type (payer, negotiator, stonewaller, no-debt)
2. **offer_payment_plan** - Generates tiered payment offers
3. **handle_payer** - Processes willing payers
4. **handle_negotiator** - Manages back-and-forth negotiation
5. **handle_stonewaller** - Deals with unrealistic demands
6. **handle_no_debt_claim** - Handles debt disputes
7. **generate_final_link** - Creates payment URLs

### BAML Functions

Located in `src/agent/functions.baml`:

- **check_user_intent**: Classifies user responses
- **generate_payment_offer**: Creates structured payment plans
- **validate_user_offer**: Assesses counter-offers
- **format_payment_link**: Generates collectwise.com URLs

### Conversation Personas

The agent handles these user types:

- **The Compliant Payer**: Accepts reasonable offers quickly
- **The Cooperative Negotiator**: Negotiates in good faith
- **The Unrealistic Stonewaller**: Makes impossible demands
- **The No Debt Claimant**: Disputes debt validity
- **The Emotional User**: Needs empathetic handling

## 🧪 Testing

### Test Structure

```bash
tests/
├── unit/                    # Unit tests for individual components
├── integration/             # API endpoint integration tests
└── scenarios/              # Full conversation scenario tests
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- chatService.test.ts

# Run tests in watch mode during development
npm run test:watch
```

### Test Scenarios (Story 1.6)

When Story 1.6 is implemented, comprehensive scenario testing will include:

```bash
# Run comprehensive conversation scenarios
npm run test:scenarios

# Test specific persona
npm run test:scenarios -- --persona=negotiator
```

**Test Cases Include:**

- Normal cases: Compliant Payer, Cooperative Negotiator, etc.
- Edge cases: Prompt Injection, Emotional Users, etc.
- Security: Input validation and prompt injection protection
- Performance: Response time and resource usage

## 🚀 Deployment

### Vercel Deployment

The backend is configured for Vercel serverless deployment:

1. **Connect to Vercel**

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Deploy
   vercel
   ```

2. **Environment Variables**
   Set in Vercel dashboard:
   - `OPENAI_API_KEY`
   - `NODE_ENV=production`

3. **Deployment Configuration**
   See `vercel.json` for routing and build settings.

### Local Production Testing

```bash
# Build for production
npm run build

# Start production server
npm start
```

## ⚙️ Environment Configuration

### Required Environment Variables

```env
# OpenAI Configuration
OPENAI_API_KEY=sk-your-key-here

# Server Configuration
PORT=4000
NODE_ENV=development|production

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### Optional Environment Variables

```env
# Logging
LOG_LEVEL=info|debug|warn|error

# OpenAI Model Configuration
OPENAI_MODEL=gpt-4o
OPENAI_MAX_TOKENS=1000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Payment Links
PAYMENT_URL_BASE=https://collectwise.com
```

## 🔍 Troubleshooting

### Common Issues

**1. OpenAI API Errors**

```bash
# Check API key
echo $OPENAI_API_KEY

# Verify API key format (should start with sk-)
# Check OpenAI dashboard for usage limits
```

**2. Port Already in Use**

```bash
# Find process using port 4000
lsof -i :4000

# Kill the process
kill -9 <PID>

# Or use different port
PORT=4001 npm run dev
```

**3. File Permission Errors**

```bash
# Ensure data directory is writable
chmod 755 data/
chmod 644 data/history.json
```

**4. TypeScript Compilation Errors**

```bash
# Clean and rebuild
rm -rf dist/
npm run build

# Check TypeScript configuration
npx tsc --noEmit
```

### Debug Mode

Enable detailed logging:

```bash
LOG_LEVEL=debug npm run dev
```

### Health Checks

Verify service health:

```bash
# Local
curl http://localhost:4000/api/health

# Production
curl https://your-backend.vercel.app/api/health
```

## 🤝 Development Workflow

### Code Style

- **TypeScript**: Strict mode enabled
- **ESLint**: Enforced code standards
- **Prettier**: Automated code formatting

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-negotiation-state

# Make changes and test
npm test
npm run lint

# Commit with descriptive message
git commit -m "feat: add payment plan validation"

# Push and create PR
git push origin feature/new-negotiation-state
```

### Adding New Features

1. **Add types** in `src/types/`
2. **Implement logic** in appropriate service
3. **Add tests** for new functionality
4. **Update API documentation**
5. **Test integration** with frontend

## 📚 Related Documentation

- [Frontend README](../frontend/README.md) - Frontend development guide
- [Main README](../README.md) - Project overview and setup
- [Architecture Docs](../docs/architecture/) - System architecture details
- [PRD](../docs/PRD.md) - Product requirements and specifications

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

---

**Need Help?**

- Check the [troubleshooting section](#troubleshooting)
- Review the [test cases](tests/) for examples
- Consult the [architecture documentation](../docs/architecture/)
