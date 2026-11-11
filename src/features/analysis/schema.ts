// src/features/analysis/schema.ts
// Analysis validation schemas - TODO: implement

import { z } from "zod";

export const analysisRequestSchema = z.object({ text: z.string().min(1).max(10000) });
export const analysisResponseSchema = z.object({ id: z.string() });

export type ValidatedAnalysisRequest = z.infer<typeof analysisRequestSchema>;
export type ValidatedAnalysisResponse = z.infer<typeof analysisResponseSchema>;