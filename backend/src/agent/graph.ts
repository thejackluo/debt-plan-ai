// Simplified negotiation agent for CollectWise
// This module implements the negotiation workflow and integrates with BAML
// Note: LangGraph implementation simplified due to API compatibility issues

import type { BaseMessage } from "@langchain/core/messages";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { b } from "../../baml_client/index.js";
import {
  UserIntent,
  NegotiationResponse,
  PaymentPlanValidity,
  EmotionalState,
  SecurityThreatLevel,
  EscalationLevel,
} from "../types/baml-types.js";

// Define the state interface
export interface AgentState {
  messages: BaseMessage[];
  user_intent?: UserIntent;
  emotional_state?: EmotionalState;
  security_threat_level?: SecurityThreatLevel;
  escalation_level?: EscalationLevel;
  negotiation_attempts: number;
  current_offer?: string;
  final_agreement?: string;
  conversation_ended: boolean;
}

/**
 * Simplified negotiation graph that processes messages step by step.
 * Implements the LangGraph agent flow from the PRD using BAML for AI interactions.
 *
 * This class handles all negotiation scenarios:
 * - Willing Payer: Ready to pay immediately or accept reasonable terms
 * - Cooperative Negotiator: Needs flexibility but willing to work with us
 * - Resistant Negotiator: Requires multiple offers before accepting
 * - Emotional Distressed: Needs empathetic handling
 * - No Debt Claimant: Denies owing the debt
 * - Stonewaller: Uncooperative or hostile
 * - Various other personas (Bargain Hunter, Split Payment, etc.)
 */
export class NegotiationGraph {
  /**
   * Main entry point for processing negotiation state.
   * Handles the complete flow: intent analysis → routing → response analysis
   *
   * @param state - Current agent state containing messages and negotiation context
   * @returns Updated agent state with new messages and state changes
   */
  async invoke(state: AgentState): Promise<AgentState> {
    console.log(
      "Processing negotiation state with",
      state.messages.length,
      "messages"
    );

    // Step 0: Handle fresh conversation start (only user message, no AI greeting yet)
    const hasOnlyUserMessage = state.messages.length === 1 &&
                              state.messages[0]._getType() === "human";

    if (hasOnlyUserMessage) {
      // Analyze the user's first message and provide contextual opening
      state = await this.checkUserIntent(state);
      state = await this.generateContextualOpening(state);
      return state;
    }

    // Step 1: Analyze user intent if we haven't already
    if (!state.user_intent && state.messages.length > 0) {
      state = await this.checkUserIntent(state);
    }

    // Step 2: Route to appropriate handler based on intent
    if (!state.conversation_ended) {
      state = await this.routeToHandler(state);
    }

    // Step 3: Analyze response if we have an offer and more messages
    if (
      state.current_offer &&
      !state.final_agreement &&
      !state.conversation_ended
    ) {
      const lastMessage = state.messages[state.messages.length - 1];
      if (lastMessage && lastMessage._getType() === "human") {
        state = await this.analyzeResponse(state);
      }
    }

    return state;
  }

  /**
   * Analyzes user intent using BAML AI functions with fallback logic.
   * Classifies the user into one of the negotiation personas defined in the PRD.
   *
   * @param state - Current agent state
   * @returns Updated state with user_intent, emotional_state, and security_threat_level
   */
  private async checkUserIntent(state: AgentState): Promise<AgentState> {
    console.log("Analyzing user intent");

    const lastMessage = state.messages[state.messages.length - 1];
    const messageContent =
      typeof lastMessage?.content === "string" ? lastMessage.content : "";

    const conversationContext = state.messages
      .slice(-3)
      .map((msg) => `${msg._getType()}: ${msg.content}`)
      .join("\n");

    try {
      const previousOffers: string[] = [];
      const intent = await b.AnalyzeUserIntent(
        messageContent,
        conversationContext,
        previousOffers,
        state.negotiation_attempts || 0
      );

      const emotionalState = await b.AssessEmotionalState(
        messageContent,
        conversationContext,
        "Previous: calm"
      );

      const securityThreat = await b.DetectSecurityThreats(
        messageContent,
        conversationContext,
        "Debt collection system"
      );

      console.log(
        `Intent: ${intent}, Emotion: ${emotionalState}, Security: ${securityThreat}`
      );

      return {
        ...state,
        user_intent: intent,
        emotional_state: emotionalState,
        security_threat_level: securityThreat,
        messages: [
          ...state.messages,
          new AIMessage(
            `[Analysis: Intent=${intent}, Emotion=${emotionalState}, Security=${securityThreat}]`
          ),
        ],
      };
    } catch (error) {
      console.error("Error in BAML intent classification:", error);

      let fallbackIntent: UserIntent = UserIntent.CooperativeNegotiator;
      const lowerContent = messageContent.toLowerCase();

      if (lowerContent.includes("can pay") && lowerContent.includes("month")) {
        fallbackIntent = UserIntent.WillingPayer;
      } else if (
        lowerContent.includes("don't owe") ||
        lowerContent.includes("not my debt")
      ) {
        fallbackIntent = UserIntent.NoDebtClaimant;
      } else if (
        lowerContent.includes("fuck") ||
        lowerContent.includes("scam")
      ) {
        fallbackIntent = UserIntent.Stonewaller;
      }

      return {
        ...state,
        user_intent: fallbackIntent,
        messages: [
          ...state.messages,
          new AIMessage(`[Intent classified (fallback): ${fallbackIntent}]`),
        ],
      };
    }
  }

  /**
   * Generates a contextual opening message using BAML AI based on the user's first message.
   * This creates dynamic, personalized responses instead of predetermined templates.
   *
   * @param state - Current agent state with classified user intent
   * @returns Updated state with AI-generated contextual opening message
   */
  private async generateContextualOpening(state: AgentState): Promise<AgentState> {
    console.log("Generating AI contextual opening for intent:", state.user_intent);

    const userMessage = state.messages[0]?.content as string || "";

    try {
      // Generate dynamic opening using BAML AI
      const openingMessage = await b.GenerateContextualOpening(
        userMessage,
        state.user_intent?.toString() || "Unknown",
        state.emotional_state?.toString() || "Calm"
      );

      console.log("Generated dynamic opening:", openingMessage);

      return {
        ...state,
        messages: [...state.messages, new AIMessage(openingMessage)],
      };
    } catch (error) {
      console.error("Error generating contextual opening:", error);

      // Intelligent fallback that still acknowledges what they said
      const fallbackMessage = `I understand you're reaching out about your account. Let me help you find the best way to resolve your $2400 debt. What would work best for your situation?`;

      return {
        ...state,
        messages: [...state.messages, new AIMessage(fallbackMessage)],
      };
    }
  }

  /**
   * Routes the conversation to the appropriate handler based on user intent and security assessment.
   * Implements the conditional edges from the LangGraph flow diagram in the PRD.
   *
   * @param state - Current agent state with classified user intent
   * @returns Updated state after processing through the appropriate handler
   */
  private async routeToHandler(state: AgentState): Promise<AgentState> {
    const intent = state.user_intent;
    const securityThreat = state.security_threat_level;

    // Security override
    if (
      securityThreat === SecurityThreatLevel.ActiveThreat ||
      securityThreat === SecurityThreatLevel.AttemptedManipulation
    ) {
      return this.handleSecurityThreat(state);
    }

    switch (intent) {
      case UserIntent.WillingPayer:
        return this.handlePayer(state);
      case UserIntent.CooperativeNegotiator:
      case UserIntent.ResistantNegotiator:
        return this.handleNegotiator(state);
      case UserIntent.EmotionalDistressed:
        return this.handleEmotionalUser(state);
      case UserIntent.NoDebtClaimant:
        return this.handleNoDebtClaim(state);
      case UserIntent.Stonewaller:
        return this.handleStonewaller(state);
      case UserIntent.PromptInjector:
        return this.handleSecurityThreat(state);
      case UserIntent.BargainHunter:
        return this.handleBargainHunter(state);
      case UserIntent.SplitPaymentProposer:
        return this.handleSplitPayment(state);
      case UserIntent.GoodFaithPromiser:
        return this.handleGoodFaithPromise(state);
      default:
        return this.handleNegotiator(state);
    }
  }

  /**
   * Handles users who are willing to pay using AI-generated responses.
   * Offers both immediate full payment and reasonable payment plan options.
   *
   * @param state - Current agent state
   * @returns Updated state with AI-generated payment options and current offer
   */
  private async handlePayer(state: AgentState): Promise<AgentState> {
    console.log("Handling willing payer with AI response");

    const lastMessage = state.messages[state.messages.length - 1];
    const userMessage = typeof lastMessage?.content === "string" ? lastMessage.content : "";

    const conversationHistory = state.messages
      .slice(-3)
      .map((msg) => `${msg._getType()}: ${msg.content}`)
      .join("\n");

    try {
      const response = await b.GenerateNegotiationResponse(
        userMessage,
        conversationHistory,
        UserIntent.WillingPayer.toString(),
        state.emotional_state?.toString() || "Calm",
        "User is ready to pay - offering payment options",
        "Initial payment options",
        state.negotiation_attempts || 0
      );

      // Add payment URLs to the response using environment-aware generation
      const fullPaymentUrl = this.generatePaymentUrl(2400, "full");
      const planPaymentUrl = this.generatePaymentUrl(2400, "$400/month for 6 months");

      const enhancedResponse = `${response}\n\nYou can pay the full $2400 immediately here: ${fullPaymentUrl}\n\nOr choose the payment plan here: ${planPaymentUrl}`;

      return {
        ...state,
        current_offer: "$400/month for 6 months",
        messages: [...state.messages, new AIMessage(enhancedResponse)],
      };
    } catch (error) {
      console.error("Error generating payer response:", error);
      const paymentUrl = this.generatePaymentUrl(2400);
      const fallbackResponse = `Great! I can see you're ready to resolve this. You can pay the full $2400 immediately at: ${paymentUrl}\n\nOr if you prefer a payment plan, I can offer you $400/month for 6 months. Would either of these work for you?`;

      return {
        ...state,
        current_offer: "$400/month for 6 months",
        messages: [...state.messages, new AIMessage(fallbackResponse)],
      };
    }
  }

  /**
   * Handles users who need negotiation using AI-generated responses.
   * Implements the tiered offer strategy: $400/6mo → $200/12mo → escalate to stonewaller.
   *
   * @param state - Current agent state with negotiation attempt count
   * @returns Updated state with AI-generated offer or escalation to stonewaller
   */
  private async handleNegotiator(state: AgentState): Promise<AgentState> {
    console.log("Handling negotiator with AI response");
    const attempts = state.negotiation_attempts || 0;

    // After 2 attempts, escalate to stonewaller
    if (attempts >= 2) {
      return this.handleStonewaller(state);
    }

    const lastMessage = state.messages[state.messages.length - 1];
    const userMessage = typeof lastMessage?.content === "string" ? lastMessage.content : "";

    const conversationHistory = state.messages
      .slice(-3)
      .map((msg) => `${msg._getType()}: ${msg.content}`)
      .join("\n");

    let offer: string;
    let negotiationContext: string;

    if (attempts === 0) {
      offer = "$400/month for 6 months";
      negotiationContext = "First negotiation offer - standard payment plan";
    } else {
      offer = "$200/month for 12 months";
      negotiationContext = "Second negotiation offer - more affordable extended plan";
    }

    try {
      const response = await b.GenerateNegotiationResponse(
        userMessage,
        conversationHistory,
        state.user_intent?.toString() || "CooperativeNegotiator",
        state.emotional_state?.toString() || "Calm",
        negotiationContext,
        offer,
        attempts + 1
      );

      return {
        ...state,
        current_offer: offer,
        negotiation_attempts: attempts + 1,
        messages: [...state.messages, new AIMessage(response)],
      };
    } catch (error) {
      console.error("Error generating negotiator response:", error);

      // Fallback responses
      const fallbackResponse = attempts === 0
        ? `I understand you'd like to work out a payment plan. For the $2400 debt, I can offer you ${offer}. This would resolve your account quickly. Does this work for you?`
        : `I see you need a more affordable option. Let me offer you ${offer}. This is a very reasonable plan that gives you more breathing room. Can you commit to this?`;

      return {
        ...state,
        current_offer: offer,
        negotiation_attempts: attempts + 1,
        messages: [...state.messages, new AIMessage(fallbackResponse)],
      };
    }
  }

  private async handleNoDebtClaim(state: AgentState): Promise<AgentState> {
    console.log("Handling debt denial with AI response");

    const lastMessage = state.messages[state.messages.length - 1];
    const userMessage = typeof lastMessage?.content === "string" ? lastMessage.content : "";

    const conversationHistory = state.messages
      .slice(-3)
      .map((msg) => `${msg._getType()}: ${msg.content}`)
      .join("\n");

    try {
      const response = await b.GenerateNegotiationResponse(
        userMessage,
        conversationHistory,
        UserIntent.NoDebtClaimant.toString(),
        state.emotional_state?.toString() || "Defiant",
        "User denies owing the debt - verification process",
        "No current offer",
        0
      );

      return {
        ...state,
        conversation_ended: true,
        messages: [...state.messages, new AIMessage(response)],
      };
    } catch (error) {
      console.error("Error generating no debt claim response:", error);
      const fallbackResponse = `I understand you believe this debt isn't yours. Let me transfer you to our verification department who can review your account details and provide documentation. They can be reached at 1-800-COLLECT-1. Is there anything else I can help clarify about this account?`;

      return {
        ...state,
        conversation_ended: true,
        messages: [...state.messages, new AIMessage(fallbackResponse)],
      };
    }
  }

  private async handleStonewaller(state: AgentState): Promise<AgentState> {
    console.log("Handling stonewaller with AI response");

    const lastMessage = state.messages[state.messages.length - 1];
    const userMessage = typeof lastMessage?.content === "string" ? lastMessage.content : "";

    const conversationHistory = state.messages
      .slice(-3)
      .map((msg) => `${msg._getType()}: ${msg.content}`)
      .join("\n");

    try {
      const response = await b.GenerateNegotiationResponse(
        userMessage,
        conversationHistory,
        UserIntent.Stonewaller.toString(),
        state.emotional_state?.toString() || "Angry",
        "User is uncooperative - final attempt before escalation",
        "Final offer before escalation",
        state.negotiation_attempts || 3
      );

      return {
        ...state,
        conversation_ended: true,
        messages: [...state.messages, new AIMessage(response)],
      };
    } catch (error) {
      console.error("Error generating stonewaller response:", error);
      const fallbackResponse = `I understand this is a difficult situation. Since we haven't been able to reach an agreement today, I'll need to escalate this to our legal department. You'll receive formal documentation within 10 business days. If you'd like to avoid legal proceedings, please call us at 1-800-COLLECT-1 to discuss payment options. Have a good day.`;

      return {
        ...state,
        conversation_ended: true,
        messages: [...state.messages, new AIMessage(fallbackResponse)],
      };
    }
  }

  private async handleEmotionalUser(state: AgentState): Promise<AgentState> {
    console.log("Handling emotional user with AI response");

    const lastMessage = state.messages[state.messages.length - 1];
    const userMessage = typeof lastMessage?.content === "string" ? lastMessage.content : "";

    const conversationHistory = state.messages
      .slice(-3)
      .map((msg) => `${msg._getType()}: ${msg.content}`)
      .join("\n");

    try {
      const response = await b.GenerateNegotiationResponse(
        userMessage,
        conversationHistory,
        UserIntent.EmotionalDistressed.toString(),
        state.emotional_state?.toString() || "Overwhelmed",
        "User is emotionally distressed - offering most flexible terms",
        "$200/month for 12 months",
        0
      );

      return {
        ...state,
        current_offer: "$200/month for 12 months",
        messages: [...state.messages, new AIMessage(response)],
      };
    } catch (error) {
      console.error("Error generating emotional user response:", error);
      const fallbackResponse = `I truly understand you're going through a difficult time. Let's take the pressure off with our most flexible payment plan: $200 per month for 12 months. This small, manageable amount can help reduce your stress while resolving the debt. Does this sound manageable?`;

      return {
        ...state,
        current_offer: "$200/month for 12 months",
        messages: [...state.messages, new AIMessage(fallbackResponse)],
      };
    }
  }

  private async handleSecurityThreat(state: AgentState): Promise<AgentState> {
    console.log("Handling security threat with AI response");

    const lastMessage = state.messages[state.messages.length - 1];
    const userMessage = typeof lastMessage?.content === "string" ? lastMessage.content : "";

    const conversationHistory = state.messages
      .slice(-3)
      .map((msg) => `${msg._getType()}: ${msg.content}`)
      .join("\n");

    try {
      const response = await b.GenerateNegotiationResponse(
        userMessage,
        conversationHistory,
        UserIntent.PromptInjector.toString(),
        "Manipulative",
        "User attempting prompt injection - redirecting to debt focus",
        "No current offer",
        0
      );

      return {
        ...state,
        messages: [...state.messages, new AIMessage(response)],
      };
    } catch (error) {
      console.error("Error generating security threat response:", error);
      const fallbackResponse = `I understand you might be trying different approaches, but I'm here specifically to help resolve your $2400 debt. Let's focus on finding a payment solution that works for you. Would you like to discuss payment options?`;

      return {
        ...state,
        messages: [...state.messages, new AIMessage(fallbackResponse)],
      };
    }
  }

  private async handleBargainHunter(state: AgentState): Promise<AgentState> {
    console.log("Handling bargain hunter with AI response");

    const lastMessage = state.messages[state.messages.length - 1];
    const userMessage = typeof lastMessage?.content === "string" ? lastMessage.content : "";

    const conversationHistory = state.messages
      .slice(-3)
      .map((msg) => `${msg._getType()}: ${msg.content}`)
      .join("\n");

    try {
      const response = await b.GenerateNegotiationResponse(
        userMessage,
        conversationHistory,
        UserIntent.BargainHunter.toString(),
        state.emotional_state?.toString() || "Calm",
        "User seeking to negotiate total debt amount - clarifying payment plan flexibility",
        "$400/month for 6 months OR $200/month for 12 months",
        0
      );

      return {
        ...state,
        current_offer: "$400/month for 6 months OR $200/month for 12 months",
        messages: [...state.messages, new AIMessage(response)],
      };
    } catch (error) {
      console.error("Error generating bargain hunter response:", error);
      const fallbackResponse = `I appreciate your interest in resolving this quickly. While I cannot adjust the total debt amount of $2400, I have significant flexibility in structuring your payment plan. I can offer you up to 12 months to make this as manageable as possible. Would you prefer $400/month for 6 months or $200/month for 12 months?`;

      return {
        ...state,
        current_offer: "$400/month for 6 months OR $200/month for 12 months",
        messages: [...state.messages, new AIMessage(fallbackResponse)],
      };
    }
  }

  private async handleSplitPayment(state: AgentState): Promise<AgentState> {
    console.log("Handling split payment");
    const response = `Thank you for offering to make a payment today - that shows great faith! Here's how we can structure this: I'll set up a plan where you pay $200/month for 12 months, and your payment today will be credited as your first payment. This way you have a predictable plan and get credit for your good faith payment. Does this work?`;

    return {
      ...state,
      current_offer: "$200/month for 12 months (with upfront credit)",
      messages: [...state.messages, new AIMessage(response)],
    };
  }

  private async handleGoodFaithPromise(state: AgentState): Promise<AgentState> {
    console.log("Handling good faith promise");
    const response = `I appreciate your commitment to resolving this! Since timing can be unpredictable with new jobs, let's set up a structured plan that gives you flexibility. I can offer $200/month for 12 months, and here's the good news: you can pay it off early anytime without penalties. This gives you the security of manageable payments while allowing you to pay in full when your new job income comes in. Shall we set this up?`;

    return {
      ...state,
      current_offer: "$200/month for 12 months (early payoff allowed)",
      messages: [...state.messages, new AIMessage(response)],
    };
  }

  private async analyzeResponse(state: AgentState): Promise<AgentState> {
    console.log("Analyzing response to offer");
    const lastMessage = state.messages[state.messages.length - 1];
    const messageContent =
      typeof lastMessage?.content === "string" ? lastMessage.content : "";

    const currentOffer = state.current_offer || "No current offer";
    const negotiationHistory = state.messages
      .slice(-5)
      .map((msg) => `${msg._getType()}: ${msg.content}`)
      .join("\n");

    try {
      const response = await b.AnalyzeNegotiationResponse(
        messageContent,
        currentOffer,
        negotiationHistory,
        state.emotional_state?.toString() || "Calm",
        state.security_threat_level?.toString() || "Safe"
      );

      console.log(`Negotiation response: ${response}`);

      switch (response) {
        case NegotiationResponse.Accepted:
          const paymentUrl = this.generatePaymentUrl(2400, state.current_offer);
          return {
            ...state,
            final_agreement: state.current_offer,
            conversation_ended: true,
            messages: [
              ...state.messages,
              new AIMessage(
                `Excellent! You've agreed to ${state.current_offer}. Here's your payment link: ${paymentUrl}\n\nThank you for resolving this matter. You'll receive a confirmation email once your first payment is processed.`
              ),
            ],
          };

        case NegotiationResponse.CounterOfferReasonable:
          return this.validateCounterOffer(state, messageContent);

        case NegotiationResponse.RejectedPolitely:
          return this.handleNegotiator(state);

        case NegotiationResponse.RejectedHostile:
          return this.handleStonewaller(state);

        default:
          return this.handleNegotiator(state);
      }
    } catch (error) {
      console.error("Error in BAML response analysis:", error);
      const lowerContent = messageContent.toLowerCase();

      if (
        lowerContent.includes("yes") ||
        lowerContent.includes("accept") ||
        lowerContent.includes("agree")
      ) {
        const paymentUrl = this.generatePaymentUrl(2400, state.current_offer);
        return {
          ...state,
          final_agreement: state.current_offer,
          conversation_ended: true,
          messages: [
            ...state.messages,
            new AIMessage(
              `Great! You've agreed to ${state.current_offer}. Here's your payment link: ${paymentUrl}`
            ),
          ],
        };
      } else {
        return this.handleNegotiator(state);
      }
    }
  }

  private async validateCounterOffer(
    state: AgentState,
    counterOffer: string
  ): Promise<AgentState> {
    try {
      const validity = await b.ValidatePaymentPlan(
        counterOffer,
        2400,
        "User counter-offer",
        state.emotional_state?.toString() || "Calm",
        state.messages
          .slice(-3)
          .map((msg) => `${msg._getType()}: ${msg.content}`)
          .join("\n")
      );

      switch (validity) {
        case PaymentPlanValidity.Reasonable:
          const paymentUrl = this.generatePaymentUrl(2400, counterOffer);
          return {
            ...state,
            final_agreement: counterOffer,
            conversation_ended: true,
            messages: [
              ...state.messages,
              new AIMessage(
                `That sounds reasonable! I can accept your proposal: ${counterOffer}. Here's your payment link: ${paymentUrl}`
              ),
            ],
          };

        case PaymentPlanValidity.Borderline:
          return {
            ...state,
            messages: [
              ...state.messages,
              new AIMessage(
                `Your proposal is close, but let me suggest a slight adjustment. How about we meet in the middle with my current offer of ${state.current_offer}?`
              ),
            ],
          };

        case PaymentPlanValidity.Unrealistic:
        default:
          return this.handleNegotiator(state);
      }
    } catch (error) {
      console.error("Error validating counter-offer:", error);
      return this.handleNegotiator(state);
    }
  }

  /**
   * Generates a payment URL according to PRD specifications.
   * Uses environment-aware base URL for deployment flexibility.
   * Format: {baseUrl}/payments?termLength={termLength}&totalDebtAmount={totalDebtAmount}&termPaymentAmount={termPaymentAmount}
   *
   * @param totalDebt - The total debt amount (e.g., 2400)
   * @param paymentPlan - The payment plan string (e.g., "$400/month for 6 months")
   * @returns Formatted payment URL with correct base URL for environment
   */
  private generatePaymentUrl(totalDebt: number, paymentPlan?: string): string {
    // Determine base URL based on environment
    const getBaseUrl = (): string => {
      // Check if we're in production (Vercel deployment)
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        return "https://collectwise-backend.vercel.app";
      }
      // Development environment
      if (process.env.PORT) {
        return `http://localhost:${process.env.PORT}`;
      }
      // Default fallback
      return "http://localhost:4000";
    };

    const baseUrl = `${getBaseUrl()}/payments`;

    // Handle full payment case
    if (!paymentPlan || paymentPlan === "full") {
      const params = new URLSearchParams({
        termLength: "1",
        totalDebtAmount: totalDebt.toString(),
        termPaymentAmount: totalDebt.toString(),
      });
      return `${baseUrl}?${params.toString()}`;
    }

    // Parse payment plan string to extract payment amount and term length
    // Supports formats like "$400/month for 6 months", "$200 per month for 12 months", etc.
    const planMatch = paymentPlan.match(
      /\$?(\d+)(?:\/month|\s*per\s*month|\s*monthly)(?:\s*for\s*)?(\d+)\s*months?/i
    );

    if (planMatch) {
      const [, paymentAmount, termLength] = planMatch;
      const params = new URLSearchParams({
        termLength: termLength,
        totalDebtAmount: totalDebt.toString(),
        termPaymentAmount: paymentAmount,
      });
      return `${baseUrl}?${params.toString()}`;
    }

    // Fallback for unrecognized formats - try to extract numbers
    const amountMatch = paymentPlan.match(/\$?(\d+)/);
    const termMatch = paymentPlan.match(/(\d+)\s*months?/i);

    if (amountMatch && termMatch) {
      const paymentAmount = amountMatch[1];
      const termLength = termMatch[1];
      const params = new URLSearchParams({
        termLength: termLength,
        totalDebtAmount: totalDebt.toString(),
        termPaymentAmount: paymentAmount,
      });
      return `${baseUrl}?${params.toString()}`;
    }

    // Final fallback - assume monthly payment equal to total debt
    const params = new URLSearchParams({
      termLength: "1",
      totalDebtAmount: totalDebt.toString(),
      termPaymentAmount: totalDebt.toString(),
    });
    return `${baseUrl}?${params.toString()}`;
  }
}

// Create a simplified version that maintains the same interface
export function createNegotiationGraph() {
  return new NegotiationGraph();
}

// Export the graph instance
export const negotiationGraph = createNegotiationGraph();
