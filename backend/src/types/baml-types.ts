// Shared BAML types extracted to break circular dependencies
// These are the enum values that BAML generates

export enum UserIntent {
  WillingPayer = "WillingPayer",
  CooperativeNegotiator = "CooperativeNegotiator",
  ResistantNegotiator = "ResistantNegotiator",
  EmotionalDistressed = "EmotionalDistressed",
  NoDebtClaimant = "NoDebtClaimant",
  Stonewaller = "Stonewaller",
  PromptInjector = "PromptInjector",
  BargainHunter = "BargainHunter",
  SplitPaymentProposer = "SplitPaymentProposer",
  GoodFaithPromiser = "GoodFaithPromiser",
}

export enum NegotiationResponse {
  Accepted = "Accepted",
  CounterOfferReasonable = "CounterOfferReasonable",
  CounterOfferUnrealistic = "CounterOfferUnrealistic",
  RejectedPolitely = "RejectedPolitely",
  RejectedHostile = "RejectedHostile",
  PromptInjection = "PromptInjection",
  StallTactic = "StallTactic",
  ComplianceViolation = "ComplianceViolation",
}

export enum PaymentPlanValidity {
  Reasonable = "Reasonable",
  Borderline = "Borderline",
  Unrealistic = "Unrealistic",
}

export enum EmotionalState {
  Calm = "Calm",
  Frustrated = "Frustrated",
  Stressed = "Stressed",
  Angry = "Angry",
  Overwhelmed = "Overwhelmed",
  Desperate = "Desperate",
  Defiant = "Defiant",
  Manipulative = "Manipulative",
}

export enum SecurityThreatLevel {
  Safe = "Safe",
  MinorConcern = "MinorConcern",
  ModerateConcern = "ModerateConcern",
  AttemptedManipulation = "AttemptedManipulation",
  ActiveThreat = "ActiveThreat",
}

export enum EscalationLevel {
  None = "None",
  SupervisorReview = "SupervisorReview",
  ImmediateEscalation = "ImmediateEscalation",
  ComplianceAlert = "ComplianceAlert",
  SecurityAlert = "SecurityAlert",
}
