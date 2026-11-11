// Model registry - handles loading and caching of Transformers.js models
// Runs server-side in Next.js API routes

import {
  pipeline,
  TextClassificationPipeline,
  env,
} from "@xenova/transformers";

// Configure Transformers.js for Node.js environment
env.allowLocalModels = false; // Download from Hugging Face Hub
env.useBrowserCache = false; // Disable browser cache (we're in Node)
env.localModelPath = undefined; // Use default cache location

// Model configurations
export interface ModelConfig {
  task: "sentiment-analysis" | "text-classification";
  model: string;
  quantized: boolean;
}

export const MODEL_CONFIGS = {
  sentiment: {
    task: "sentiment-analysis",
    model: "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
    quantized: true,
  },
  emotion: {
    task: "text-classification",
    model: "Xenova/distilbert-base-uncased-emotion",
    quantized: true,
  },
} satisfies Record<string, ModelConfig>;

// In-memory cache for loaded pipelines
const pipelineCache = new Map<keyof typeof MODEL_CONFIGS, TextClassificationPipeline>();

/**
 * Get or create a pipeline for the given model config
 * Models are cached in memory after first load
 */
export async function getPipeline(
  key: keyof typeof MODEL_CONFIGS
): Promise<TextClassificationPipeline> {
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