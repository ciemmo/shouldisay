// src/types/analysis.ts
// Core analysis result types

export type Verdict = "GOOD" | "OK" | "CAUTION" | "NOT_OK" | "BAD";

export interface Severity {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
}

export interface Category {
  category: string;
  score: number;
  label: string;
}

export interface Feedback {
  explanation: string;
  suggestions: string[];
  rephrased?: string;
}

export interface ContextAnalysis {
  flow: "positive" | "neutral" | "negative" | "escalating";
  patterns: string[];
  recommendations: string[];
}

export interface AnalysisResult {
  id: string;
  verdict: Verdict;
  confidence: number;
  severity: Severity;
  categories: Category[];
  feedback: Feedback;
  contextAnalysis?: ContextAnalysis;
  metadata: {
    modelVersion: string;
    processingTime: number;
    charCount: number;
  };
  createdAt: Date;
}

export interface AnalysisRequest {
  text: string;
  conversationHistory?: string[];
  options?: {
    detailLevel: "basic" | "detailed";
    includeSuggestions: boolean;
  };
}

export interface AnalysisResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: {
    code: string;
    message: string;
  };
}

// Tone category constants
export const TONE_CATEGORIES = [
  "rude",
  "dismissive",
  "aggressive",
  "passive_aggressive",
  "condescending",
  "manipulative",
  "insensitive",
  "demanding",
  "sarcastic",
  "judgmental",
  "threatening",
  "hostile",
  "provocative",
  "belittling",
  "mocking",
  "offensive",
  "intimidating",
  "disrespectful",
  "unprofessional",
  "creepy",
] as const;

export type ToneCategory = (typeof TONE_CATEGORIES)[number];

export const SEVERITY_LABELS: Record<Severity["level"], string> = {
  1: "Minimal",
  2: "Low",
  3: "Moderate",
  4: "High",
  5: "Severe",
};

export const VERDICT_LABELS: Record<Verdict, string> = {
  GOOD: "Good",
  OK: "Appropriate",
  CAUTION: "Review Recommended",
  NOT_OK: "Likely Problematic",
  BAD: "Definitely Problematic",
};

export const VERDICT_COLORS: Record<Verdict, string> = {
  GOOD: "green",
  OK: "blue",
  CAUTION: "yellow",
  NOT_OK: "orange",
  BAD: "red",
};