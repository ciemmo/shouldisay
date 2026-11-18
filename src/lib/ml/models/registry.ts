// Model registry - handles loading and caching of Transformers.js models
// Runs server-side in Next.js API routes

import {
  pipeline,
  TextClassificationPipeline,
  FeatureExtractionPipeline,
  env,
} from "@xenova/transformers";

// Configure Transformers.js for Node.js environment
env.allowLocalModels = false; // Download from Hugging Face Hub
env.useBrowserCache = false; // Disable browser cache (we're in Node)
// Note: Do NOT set localModelPath - setting it to undefined causes issues in Node.js

// Model configurations
export interface ModelConfig {
  task: "sentiment-analysis" | "text-classification" | "feature-extraction";
  model: string;
  quantized: boolean;
}

export const MODEL_CONFIGS = {
  sentiment: {
    task: "sentiment-analysis",
    model: "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
    quantized: true,
  },
  // Use Twitter RoBERTa sentiment (3-class: negative, neutral, positive) as emotion proxy
  // since Xenova/distilbert-base-uncased-emotion is not available
  emotion: {
    task: "text-classification",
    model: "Xenova/twitter-roberta-base-sentiment-latest",
    quantized: true,
  },
  embedding: {
    task: "feature-extraction",
    model: "Xenova/all-MiniLM-L6-v2",
    quantized: true,
  },
} satisfies Record<string, ModelConfig>;

// In-memory cache for loaded pipelines
const pipelineCache = new Map<keyof typeof MODEL_CONFIGS, TextClassificationPipeline | FeatureExtractionPipeline>();

/**
 * Get or create a pipeline for the given model config
 * Models are cached in memory after first load
 */
export async function getPipeline(
  key: keyof typeof MODEL_CONFIGS
): Promise<TextClassificationPipeline | FeatureExtractionPipeline> {
  if (pipelineCache.has(key)) {
    return pipelineCache.get(key)!;
  }

  const config = MODEL_CONFIGS[key];

  // Create pipeline with progress callback for large model downloads
  const pipe = await pipeline(config.task, config.model, {
    quantized: config.quantized,
    progress_callback: (progress: { status: string; file: string; progress: number }) => {
      if (progress.status === "downloading") {
        console.log(`[ML] Downloading ${key}: ${progress.file} - ${Math.round(progress.progress * 100)}%`);
      }
    },
  });

  pipelineCache.set(key, pipe);
  console.log(`[ML] Model ${key} loaded and cached`);
  return pipe;
}

/**
 * Preload models at startup (optional - call during app initialization)
 */
export async function preloadModels(): Promise<void> {
  console.log("[ML] Preloading models...");
  await Promise.all(
    Object.keys(MODEL_CONFIGS).map((key) => getPipeline(key as keyof typeof MODEL_CONFIGS))
  );
  console.log("[ML] All models preloaded");
}

/**
 * Clear cache (useful for testing or memory management)
 */
export function clearPipelineCache(): void {
  pipelineCache.clear();
}
