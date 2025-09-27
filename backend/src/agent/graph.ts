// CollectWise Negotiation Agent - LangGraph Implementation
// Based on Stories 1.4 and 1.5 from PRD
// Simplified architecture with proper TypeScript support

import { AIMessage } from "@langchain/core/messages";
import type { BaseMessage } from "@langchain/core/messages";

import type { BamlAsyncClient } from "../../baml_client/async_client.js";
import { b } from "../../baml_client/index.js";
import {
  EmotionalState,
  NegotiationResponse,
  PaymentPlanValidity,
  SecurityThreatLevel,
  UserIntent,
} from "../../baml_client/types.js";
import type { EscalationLevel } from "../../baml_client/types.js";

// Agent State Interface - Core state management
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

// Main Negotiation Graph Class
export class NegotiationGraph {
  // Main entry point - Story 1.4 AC4: Entry point for graph
  async invoke(state: AgentState): Promise<AgentState> {
    console.log(
      `Processing negotiation state with ${state.messages.length} messages`
    );

    // Handle first user message - generate contextual opening
    if (this.isFirstUserMessage(state)) {
      state = await this.checkUserIntent(state);
      state = await this.generateContextualOpening(state);
      return state;
    }

    // Analyze user intent if not already done
    if (!state.user_intent && state.messages.length > 0) {
      state = await this.checkUserIntent(state);
    }

    // Route to appropriate handler
    if (!state.conversation_ended) {
      state = await this.routeToHandler(state);
    }

    // Analyze response if we have an active offer
    if (this.hasActiveOffer(state)) {
      state = await this.analyzeResponse(state);
    }

    return state;
  }

  // Story 1.4 AC3: BAML function for check_user_intent
  private async checkUserIntent(state: AgentState): Promise<AgentState> {
    const lastMessage = this.getLastMessage(state);
    const messageContent = this.extractMessageContent(lastMessage);
    const conversationContext = this.buildConversationContext(state);
    const bamlClient = b as BamlAsyncClient;

    try {
      // Use BAML functions for intent analysis with proper type checking

      const intent = (await bamlClient.AnalyzeUserIntent(
        messageContent,
        conversationContext,
        [],
        state.negotiation_attempts || 0
      )) as UserIntent;

      const emotionalState = (await bamlClient.AssessEmotionalState(
        messageContent,
        conversationContext,
        "Previous: calm"
      )) as EmotionalState;

      const securityThreat = (await bamlClient.DetectSecurityThreats(
        messageContent,
        conversationContext,
        "Debt collection system"
      )) as SecurityThreatLevel;

      return {
        ...state,
        user_intent: intent,
        emotional_state: emotionalState,
        security_threat_level: securityThreat,
      };
    } catch (error) {
      console.error("BAML intent analysis failed:", error);
      return this.handleIntentFallback(state, messageContent);
    }
  }

  // Story 1.5: Generate contextual opening using BAML
  private async generateContextualOpening(
    state: AgentState
  ): Promise<AgentState> {
    const userMessage = this.extractMessageContent(state.messages[0]);
    const bamlClient = b as BamlAsyncClient;

    try {
      const openingMessage = await bamlClient.GenerateContextualOpening(
        userMessage,
        state.user_intent?.toString() || "Unknown",
        state.emotional_state?.toString() || "Calm"
      );

      return {
        ...state,
        messages: [...state.messages, new AIMessage(openingMessage)],
      };
    } catch (error) {
      console.error("Failed to generate contextual opening:", error);
      return {
        ...state,
        messages: [
          ...state.messages,
          new AIMessage(
            "I understand you're reaching out about your account. Let me help you find the best way to resolve your $2400 debt."
          ),
        ],
      };
    }
  }

  // Story 1.5: Route to appropriate handler based on intent
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

    // Route based on user intent
    switch (intent) {
      case UserIntent.WillingPayer:
        return this.handlePayer(state);
      case UserIntent.CooperativeNegotiator:
      case UserIntent.ResistantNegotiator:
        return await this.handleNegotiator(state);
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
        return await this.handleNegotiator(state);
    }
  }

  // Story 1.5: Handle willing payers
  private async handlePayer(state: AgentState): Promise<AgentState> {
    const response = await this.generateNegotiationResponse(
      state,
      UserIntent.WillingPayer.toString(),
      "User is ready to pay - offering payment options"
    );

    const optionsNote =
      "Here are two payment options we can lock in right now:\n" +
      "• $400 per month for 6 months\n" +
      "• $200 per month for 12 months\n\n" +
      "Let me know which plan works best (or tell me a different amount), and I'll send over the secure CollectWise payment link.";

    const enhancedResponse = `${response}\n\n${optionsNote}`;

    return {
      ...state,
      current_offer: "$400/month for 6 months OR $200/month for 12 months",
      messages: [...state.messages, new AIMessage(enhancedResponse)],
    };
  }

  // Story 1.5: Handle negotiators with tiered offer strategy
  private async handleNegotiator(state: AgentState): Promise<AgentState> {
    const attempts = state.negotiation_attempts || 0;

    // After 2 attempts, escalate to stonewaller
    if (attempts >= 2) {
      return await this.handleStonewaller(state);
    }

    const offer =
      attempts === 0 ? "$400/month for 6 months" : "$200/month for 12 months";
    const context =
      attempts === 0
        ? "First negotiation offer"
        : "Second negotiation offer - more affordable";

    const response = await this.generateNegotiationResponse(
      state,
      state.user_intent?.toString() || "CooperativeNegotiator",
      context
    );

    return {
      ...state,
      current_offer: offer,
      negotiation_attempts: attempts + 1,
      messages: [...state.messages, new AIMessage(response)],
    };
  }

  // Story 1.5: Handle no debt claims
  private async handleNoDebtClaim(state: AgentState): Promise<AgentState> {
    const response = await this.generateNegotiationResponse(
      state,
      UserIntent.NoDebtClaimant.toString(),
      "User denies owing the debt - verification process"
    );

    return {
      ...state,
      conversation_ended: true,
      messages: [...state.messages, new AIMessage(response)],
    };
  }

  // Story 1.5: Handle stonewaller escalation
  private async handleStonewaller(state: AgentState): Promise<AgentState> {
    const response = await this.generateNegotiationResponse(
      state,
      UserIntent.Stonewaller.toString(),
      "User is uncooperative - final attempt before escalation"
    );

    return {
      ...state,
      conversation_ended: true,
      messages: [...state.messages, new AIMessage(response)],
    };
  }

  // Story 1.5: Handle emotional users with maximum flexibility
  private async handleEmotionalUser(state: AgentState): Promise<AgentState> {
    const response = await this.generateNegotiationResponse(
      state,
      UserIntent.EmotionalDistressed.toString(),
      "User is emotionally distressed - offering most flexible terms"
    );

    return {
      ...state,
      current_offer: "$200/month for 12 months",
      messages: [...state.messages, new AIMessage(response)],
    };
  }

  // Story 1.5: Handle security threats
  private async handleSecurityThreat(state: AgentState): Promise<AgentState> {
    const response = await this.generateNegotiationResponse(
      state,
      UserIntent.PromptInjector.toString(),
      "User attempting system manipulation - redirecting to debt focus"
    );

    return {
      ...state,
      messages: [...state.messages, new AIMessage(response)],
    };
  }

  // Story 1.5: Handle bargain hunters
  private async handleBargainHunter(state: AgentState): Promise<AgentState> {
    const response = await this.generateNegotiationResponse(
      state,
      UserIntent.BargainHunter.toString(),
      "User seeking to negotiate total debt amount - clarifying payment plan flexibility"
    );

    return {
      ...state,
      current_offer: "$400/month for 6 months OR $200/month for 12 months",
      messages: [...state.messages, new AIMessage(response)],
    };
  }

  // Story 1.5: Handle split payment proposals
  private handleSplitPayment(state: AgentState): AgentState {
    const response =
      "Thank you for offering to make a payment today - that shows great faith! Here's how we can structure this: I'll set up a plan where you pay $200/month for 12 months, and your payment today will be credited as your first payment.";

    return {
      ...state,
      current_offer: "$200/month for 12 months (with upfront credit)",
      messages: [...state.messages, new AIMessage(response)],
    };
  }

  // Story 1.5: Handle good faith promises
  private handleGoodFaithPromise(state: AgentState): AgentState {
    const response =
      "I appreciate your commitment to resolving this! Since timing can be unpredictable with new jobs, let's set up a structured plan that gives you flexibility. I can offer $200/month for 12 months with early payoff allowed.";

    return {
      ...state,
      current_offer: "$200/month for 12 months (early payoff allowed)",
      messages: [...state.messages, new AIMessage(response)],
    };
  }

  // Story 1.5: Analyze user response to offers
  private async analyzeResponse(state: AgentState): Promise<AgentState> {
    const lastMessage = this.getLastMessage(state);
    const messageContent = this.extractMessageContent(lastMessage);
    const currentOffer = state.current_offer || "No current offer";
    const negotiationHistory = this.buildNegotiationHistory(state);
    const bamlClient = b as BamlAsyncClient;

    try {
      const response = (await bamlClient.AnalyzeNegotiationResponse(
        messageContent,
        currentOffer,
        negotiationHistory,
        state.emotional_state?.toString() || "Calm",
        state.security_threat_level?.toString() || "Safe"
      )) as NegotiationResponse;

      switch (response) {
        case NegotiationResponse.Accepted:
          return this.handleAcceptedOffer(state);
        case NegotiationResponse.CounterOfferReasonable:
          return await this.validateCounterOffer(state, messageContent);
        case NegotiationResponse.RejectedPolitely:
        case NegotiationResponse.RejectedHostile:
          return await this.handleNegotiator(state);
        default:
          return await this.handleNegotiator(state);
      }
    } catch (error) {
      console.error("Failed to analyze negotiation response:", error);
      return await this.handleResponseFallback(state, messageContent);
    }
  }

  // Story 1.5: Handle accepted offers
  private handleAcceptedOffer(state: AgentState): AgentState {
    const paymentUrl = this.generatePaymentUrl(2400, state.current_offer);

    return {
      ...state,
      final_agreement: state.current_offer,
      conversation_ended: true,
      messages: [
        ...state.messages,
        new AIMessage(
          `Excellent! You've agreed to ${state.current_offer}. Here's your payment link: ${paymentUrl}\n\nThank you for resolving this matter.`
        ),
      ],
    };
  }

  // Story 1.5: Validate counter offers
  private async validateCounterOffer(
    state: AgentState,
    counterOffer: string
  ): Promise<AgentState> {
    const bamlClient = b as BamlAsyncClient;

    try {
      const validity = (await bamlClient.ValidatePaymentPlan(
        counterOffer,
        2400,
        "User counter-offer",
        state.emotional_state?.toString() || "Calm",
        this.buildConversationContext(state)
      )) as PaymentPlanValidity;

      switch (validity) {
        case PaymentPlanValidity.Reasonable:
          return this.acceptCounterOffer(state, counterOffer);
        case PaymentPlanValidity.Borderline:
          return this.negotiateCounterOffer(state);
        default:
          return await this.handleNegotiator(state);
      }
    } catch (error) {
      console.error("Failed to validate counter offer:", error);
      return await this.handleNegotiator(state);
    }
  }

  // Story 1.5 AC4: Generate payment URL with correct format
  private generatePaymentUrl(totalDebt: number, paymentPlan?: string): string {
    const baseUrl = this.getBaseUrl();

    if (!paymentPlan || paymentPlan === "full") {
      return `${baseUrl}/payments?termLength=1&totalDebtAmount=${totalDebt}&termPaymentAmount=${totalDebt}`;
    }

    // Parse payment plan string
    const planMatch = paymentPlan.match(
      /\$?(\d+)(?:\/month|\s*per\s*month)(?:\s*for\s*)?(\d+)\s*months?/i
    );

    if (planMatch) {
      const [, paymentAmount, termLength] = planMatch;
      return `${baseUrl}/payments?termLength=${termLength}&totalDebtAmount=${totalDebt}&termPaymentAmount=${paymentAmount}`;
    }

    // Fallback
    return `${baseUrl}/payments?termLength=1&totalDebtAmount=${totalDebt}&termPaymentAmount=${totalDebt}`;
  }

  // Helper Methods
  private isFirstUserMessage(state: AgentState): boolean {
    return (
      state.messages.length === 1 && state.messages[0]._getType() === "human"
    );
  }

  private hasActiveOffer(state: AgentState): boolean {
    return !!(
      state.current_offer &&
      !state.final_agreement &&
      !state.conversation_ended &&
      state.messages[state.messages.length - 1]?._getType() === "human"
    );
  }

  private getLastMessage(state: AgentState): BaseMessage | undefined {
    return state.messages[state.messages.length - 1];
  }

  private extractMessageContent(message: BaseMessage | undefined): string {
    if (!message) return "";
    return typeof message.content === "string"
      ? message.content
      : JSON.stringify(message.content);
  }

  private buildConversationContext(state: AgentState): string {
    return state.messages
      .slice(-3)
      .map((msg) => `${msg._getType()}: ${this.extractMessageContent(msg)}`)
      .join("\n");
  }

  private buildNegotiationHistory(state: AgentState): string {
    return state.messages
      .slice(-5)
      .map((msg) => `${msg._getType()}: ${this.extractMessageContent(msg)}`)
      .join("\n");
  }

  private async generateNegotiationResponse(
    state: AgentState,
    intent: string,
    context: string
  ): Promise<string> {
    const lastMessage = this.getLastMessage(state);
    const userMessage = this.extractMessageContent(lastMessage);
    const conversationHistory = this.buildConversationContext(state);
    const bamlClient = b as BamlAsyncClient;

    try {
      const response = await bamlClient.GenerateNegotiationResponse(
        userMessage,
        conversationHistory,
        intent,
        state.emotional_state?.toString() || "Calm",
        context,
        state.current_offer || "No current offer",
        state.negotiation_attempts || 0
      );

      return response;
    } catch (error) {
      console.error("Failed to generate negotiation response:", error);
      return "I understand your situation. Let me help you find the best payment solution for your $2400 debt.";
    }
  }

  private handleIntentFallback(
    state: AgentState,
    messageContent: string
  ): AgentState {
    const lowerContent = messageContent.toLowerCase();
    let fallbackIntent = UserIntent.CooperativeNegotiator;

    if (lowerContent.includes("can pay") && lowerContent.includes("month")) {
      fallbackIntent = UserIntent.WillingPayer;
    } else if (
      lowerContent.includes("don't owe") ||
      lowerContent.includes("not my debt")
    ) {
      fallbackIntent = UserIntent.NoDebtClaimant;
    } else if (lowerContent.includes("fuck") || lowerContent.includes("scam")) {
      fallbackIntent = UserIntent.Stonewaller;
    }

    return {
      ...state,
      user_intent: fallbackIntent,
      emotional_state: EmotionalState.Calm,
      security_threat_level: SecurityThreatLevel.Safe,
    };
  }

  private async handleResponseFallback(
    state: AgentState,
    messageContent: string
  ): Promise<AgentState> {
    const lowerContent = messageContent.toLowerCase();

    if (
      lowerContent.includes("yes") ||
      lowerContent.includes("accept") ||
      lowerContent.includes("agree")
    ) {
      return this.handleAcceptedOffer(state);
    } else {
      return await this.handleNegotiator(state);
    }
  }

  private acceptCounterOffer(
    state: AgentState,
    counterOffer: string
  ): AgentState {
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
  }

  private negotiateCounterOffer(state: AgentState): AgentState {
    return {
      ...state,
      messages: [
        ...state.messages,
        new AIMessage(
          `Your proposal is close, but let me suggest a slight adjustment. How about we meet in the middle with my current offer of ${state.current_offer}?`
        ),
      ],
    };
  }

  private getBaseUrl(): string {
    return process.env.PAYMENT_URL_BASE ?? "https://collectwise.com";
  }
}

// Story 1.4 AC2: Export graph creation function
export function createNegotiationGraph(): NegotiationGraph {
  return new NegotiationGraph();
}

// Export the graph instance
export const negotiationGraph = createNegotiationGraph();
