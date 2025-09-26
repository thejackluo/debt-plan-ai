# 6. Testing Strategy

This strategy focuses on efficiently verifying the core negotiation logic and its outcomes.

### Backend Unit Tests (Jest)

We will use a table-driven testing approach in Jest to run multiple scenarios through the agent logic efficiently. This ensures the key user pathways and negotiation thresholds are validated.

**Example** (`backend/tests/agent.test.ts`):

```typescript
import { negotiationAgent } from "../src/agent/graph";

// Helper function to parse URL for testing
const parsePaymentUrl = (url) => {
  if (!url || !url.includes("?")) return null;
  const params = new URLSearchParams(url.split("?")[1]);
  return {
    termLength: parseInt(params.get("termLength"), 10),
    totalDebtAmount: parseInt(params.get("totalDebtAmount"), 10),
    termPaymentAmount: parseInt(params.get("termPaymentAmount"), 10),
  };
};

describe("Negotiation Agent Scenarios", () => {
  const testCases = [
    {
      name: "Case 1: The Payer (Accepts first offer)",
      conversation: [
        {
          role: "user",
          content: "I was laid off but I think I can do $800 a month.",
        },
      ],
      expectedTermLength: 3,
      expectedPaymentAmount: 800,
    },
    {
      name: "Case 2: The Negotiator (Settles on final offer)",
      conversation: [
        { role: "user", content: "I can’t afford that." },
        // Mock AI would offer $400/mo
        { role: "user", content: "That is still too much." },
        // Mock AI would offer $200/mo
        { role: "user", content: "Ok, $200 a month works." },
      ],
      expectedTermLength: 12,
      expectedPaymentAmount: 200,
    },
    {
      name: "Case 3: The Stonewaller (Offers unrealistic plan)",
      conversation: [{ role: "user", content: "I can pay $5 a month." }],
      expectNoUrl: true, // Expects the agent to end without a deal
    },
  ];

  test.each(testCases)(
    "$name",
    async ({
      conversation,
      expectedTermLength,
      expectedPaymentAmount,
      expectNoUrl,
    }) => {
      // Mock the AI responses based on the conversation flow
      const result = await negotiationAgent.invoke(conversation);
      const finalMessage = result.finalMessage;

      if (expectNoUrl) {
        expect(finalMessage).not.toContain(
          "[collectwise.com/payments](https://collectwise.com/payments)"
        );
      } else {
        const urlParams = parsePaymentUrl(finalMessage);

        // Test the final URL parameters
        expect(urlParams.totalDebtAmount).toBe(2400);
        expect(urlParams.termLength).toBe(expectedTermLength);
        expect(urlParams.termPaymentAmount).toBe(expectedPaymentAmount);

        // **Test the negotiation floor/threshold**
        expect(urlParams.termLength).toBeLessThanOrEqual(12);
        expect(urlParams.termPaymentAmount).toBeGreaterThanOrEqual(200);
      }
    }
  );
});
```

---
