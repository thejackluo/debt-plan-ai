# 4. API Specification

### /api/history (Persistence)

- **GET /api/history**: Retrieves the current chat history from history.json.

- **POST /api/history**: Overwrites history.json with the provided conversation array.

- **DELETE /api/history**: Clears the contents of history.json.

**Note**: The history.json file serves as the single source of truth for a user's conversation history, ensuring state is maintained between interactions.

### /api/chat (AI Interaction)

- **POST /api/chat**:
  - **Request Body**: `{ messages: Message[] }`
  - **Response**: A streamed response of the AI's reply.

---
