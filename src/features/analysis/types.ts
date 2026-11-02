// src/features/analysis/types.ts
// Analysis feature types - TODO: implement

export * from "@/types/analysis";

export interface AnalysisInput {
  text: string;
  conversationHistory?: string[];
  options?: { detailLevel: "basic" | "detailed"; includeSuggestions: boolean; };
}

export interface AnalysisJob {
  id: string; userId: string; input: AnalysisInput;
  status: "pending" | "processing" | "completed" | "failed";
  result?: any; error?: string; createdAt: Date; updatedAt: Date;
}