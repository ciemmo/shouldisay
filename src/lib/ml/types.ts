// src/lib/ml/types.ts
// ML-specific types - TODO: implement

export interface ModelConfig { name: string; path: string; type: "onnx" | "transformers"; }
export interface InferenceResult { output: Float32Array; metadata: Record<string, unknown>; }
export interface PipelineResult { tone: string; severity: number; categories: string[]; }