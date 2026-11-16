// src/lib/ml/classifiers/context.ts
// Context analyzer - uses sentence embeddings to analyze conversation flow

import { getPipeline } from "../models/registry";
import type { FeatureExtractionPipeline, Tensor } from "@xenova/transformers";

export interface ContextAnalysisResult {
  flow: "positive" | "neutral" | "negative" | "escalating";
  patterns: string[];
  recommendations: string[];
  metrics: {
    avgSimilarity: number;
    similarityTrend: number[]; // cosine similarity between consecutive messages
    sentimentTrend: number[]; // negative sentiment scores over time
    topicDriftScore: number; // 0-1, higher = more drift
    repetitionScore: number; // 0-1, higher = more repetition
  };
}

/**
 * Compute cosine similarity between two vectors
 */
function cosineSimilarity(a: Float32Array, b: Float32Array): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get mean pooled embedding from token embeddings
 * For all-MiniLM-L6-v2, we use mean pooling over the last hidden state
 */
function meanPool(embeddings: Float32Array, attentionMask?: Float32Array): Float32Array {
  // For sentence embeddings from feature extraction, the output shape is [1, seq_len, hidden_size]
  // We need to mean pool over seq_len
  const hiddenSize = 384; // all-MiniLM-L6-v2 hidden size
  const seqLen = embeddings.length / hiddenSize;

  const pooled = new Float32Array(hiddenSize);

  if (attentionMask) {
    let validTokens = 0;
    for (let i = 0; i < seqLen; i++) {
      if (attentionMask[i] > 0) {
        for (let j = 0; j < hiddenSize; j++) {
          pooled[j] += embeddings[i * hiddenSize + j];
        }
        validTokens++;
      }
    }
    if (validTokens > 0) {
      for (let j = 0; j < hiddenSize; j++) {
        pooled[j] /= validTokens;
      }
    }
  } else {
    // Simple mean pool over all tokens
    for (let i = 0; i < seqLen; i++) {
      for (let j = 0; j < hiddenSize; j++) {
        pooled[j] += embeddings[i * hiddenSize + j];
      }
    }
    for (let j = 0; j < hiddenSize; j++) {
      pooled[j] /= seqLen;
    }
  }

  return pooled;
}

/**
 * Extract normalized sentence embedding from FeatureExtractionPipeline result
 * Handles both pooled (mean/cls) and non-pooled outputs
 */
function extractSentenceEmbedding(result: Tensor): Float32Array {
  // When pooling is 'mean' or 'cls', result.dims is [1, hidden_size]
  // When pooling is 'none', result.dims is [1, seq_len, hidden_size]

  const data = result.data as Float32Array;
  const dims = result.dims;

  if (dims.length === 2 && dims[0] === 1) {
    // Already pooled: [1, hidden_size] -> just return the data
    return data.slice(0, dims[1]);
  }

  if (dims.length === 3 && dims[0] === 1) {
    // Not pooled: [1, seq_len, hidden_size] -> mean pool
    const hiddenSize = dims[2];
    const seqLen = dims[1];

    const pooled = new Float32Array(hiddenSize);
    for (let i = 0; i < seqLen; i++) {
      for (let j = 0; j < hiddenSize; j++) {
        pooled[j] += data[i * hiddenSize + j];
      }
    }
    for (let j = 0; j < hiddenSize; j++) {
      pooled[j] /= seqLen;
    }

    // Normalize
    let norm = 0;
    for (const v of pooled) norm += v * v;
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let j = 0; j < pooled.length; j++) pooled[j] /= norm;
    }

    return pooled;
  }

  // Fallback
  return new Float32Array(384);
}

/**
 * Analyze sentiment trend using a simple keyword-based approach
 * Could be enhanced with a proper sentiment model
 */
function analyzeSentimentTrend(messages: string[]): number[] {
  const negativeKeywords = [
    "angry", "frustrated", "upset", "annoyed", "furious", "hate", "terrible",
    "awful", "horrible", "worst", "stupid", "idiot", "ridiculous", "pathetic",
    "disappointed", "fed up", "sick of", "done with", "enough", "unacceptable",
    "disrespectful", "rude", "mean", "cruel", "toxic", "abusive"
  ];

  const positiveKeywords = [
    "happy", "great", "wonderful", "excellent", "amazing", "love", "appreciate",
    "thank", "grateful", "pleased", "satisfied", "good", "nice", "kind",
    "helpful", "supportive", "understanding", "patient", "respectful"
  ];

  return messages.map(msg => {
    const lower = msg.toLowerCase();
    let negativeScore = 0;
    let positiveScore = 0;

    for (const word of negativeKeywords) {
      if (lower.includes(word)) negativeScore += 1;
    }
    for (const word of positiveKeywords) {
      if (lower.includes(word)) positiveScore += 1;
    }

    // Normalize to 0-1 range (negative sentiment)
    const total = negativeScore + positiveScore;
    if (total === 0) return 0.5; // neutral
    return negativeScore / total;
  });
}

/**
 * Detect repetition in messages
 */
function calculateRepetitionScore(messages: string[]): number {
  if (messages.length < 2) return 0;

  // Check for n-gram repetition across messages
  const allWords = messages.flatMap(m => m.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordCounts = new Map<string, number>();

  for (const word of allWords) {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
  }

  const repeatedWords = Array.from(wordCounts.values()).filter(c => c > 1).length;
  const uniqueWords = wordCounts.size;

  return uniqueWords > 0 ? repeatedWords / uniqueWords : 0;
}

/**
 * Calculate topic drift by measuring similarity between first and last messages
 * and overall coherence
 */
function calculateTopicDrift(embeddings: Float32Array[]): number {
  if (embeddings.length < 2) return 0;

  // Compare first and last message similarity
  const firstLastSim = cosineSimilarity(embeddings[0], embeddings[embeddings.length - 1]);

  // Also check average adjacent similarity
  let adjSum = 0;
  for (let i = 1; i < embeddings.length; i++) {
    adjSum += cosineSimilarity(embeddings[i - 1], embeddings[i]);
  }
  const avgAdjSim = adjSum / (embeddings.length - 1);

  // Topic drift = 1 - similarity (higher = more drift)
  // Weight both first-last and average adjacent
  const drift = 1 - (firstLastSim * 0.5 + avgAdjSim * 0.5);
  return Math.max(0, Math.min(1, drift));
}

/**
 * Main context analysis function
 * Uses sentence embeddings to analyze conversation flow patterns
 */
export async function analyzeContext(messages: string[]): Promise<ContextAnalysisResult> {
  if (messages.length < 2) {
    return {
      flow: "neutral",
      patterns: ["Insufficient messages for context analysis"],
      recommendations: ["Need at least 2 messages to analyze conversation flow"],
      metrics: {
        avgSimilarity: 0,
        similarityTrend: [],
        sentimentTrend: [],
        topicDriftScore: 0,
        repetitionScore: 0,
      },
    };
  }

  // Load embedding model
  const embeddingPipe = await getPipeline("embedding") as FeatureExtractionPipeline;

  // Get embeddings for all messages
  const embeddings: Float32Array[] = [];

  for (const message of messages) {
    // The feature extraction pipeline returns a Tensor
    // With pooling: 'mean', normalize: true, we get [1, hidden_size]
    const result = await embeddingPipe(message, { pooling: "mean", normalize: true });

    // Extract sentence embedding from tensor
    const embedding = extractSentenceEmbedding(result);
    embeddings.push(embedding);
  }

  // Compute similarity trend (cosine similarity between consecutive messages)
  const similarityTrend: number[] = [];
  for (let i = 1; i < embeddings.length; i++) {
    const sim = cosineSimilarity(embeddings[i - 1], embeddings[i]);
    similarityTrend.push(sim);
  }

  const avgSimilarity = similarityTrend.length > 0
    ? similarityTrend.reduce((a, b) => a + b, 0) / similarityTrend.length
    : 0;

  // Analyze sentiment trend
  const sentimentTrend = analyzeSentimentTrend(messages);

  // Calculate topic drift
  const topicDriftScore = calculateTopicDrift(embeddings);

  // Calculate repetition
  const repetitionScore = calculateRepetitionScore(messages);

  // Detect patterns
  const patterns: string[] = [];
  const recommendations: string[] = [];

  // Check for escalation (increasing negative sentiment)
  let isEscalating = false;
  if (sentimentTrend.length >= 3) {
    const recent = sentimentTrend.slice(-3);
    const increasing = recent.every((v, i) => i === 0 || v >= recent[i - 1]);
    const highNegative = recent.some(v => v > 0.6);

    if (increasing && highNegative) {
      isEscalating = true;
      patterns.push("Escalating negative sentiment detected");
      recommendations.push("Consider pausing the conversation to de-escalate");
      recommendations.push("Try acknowledging the other person's feelings before responding");
    }
  }

  // Check for consistently negative sentiment
  const avgNegativeSentiment = sentimentTrend.reduce((a, b) => a + b, 0) / sentimentTrend.length;
  const isNegative = avgNegativeSentiment > 0.55;

  // Check for topic drift
  if (topicDriftScore > 0.4) {
    patterns.push("Topic drift detected - conversation has shifted significantly");
    recommendations.push("Consider summarizing key points to realign the conversation");
  }

  // Check for repetition
  if (repetitionScore > 0.3) {
    patterns.push("Repetitive language patterns detected");
    recommendations.push("Try varying your phrasing to communicate more clearly");
  }

  // Check for low similarity (disconnected messages)
  if (avgSimilarity < 0.3 && messages.length > 2) {
    patterns.push("Low semantic coherence between messages");
    recommendations.push("Messages appear disconnected - consider clarifying the topic");
  }

  // Check for high similarity but negative (circular argument)
  if (avgSimilarity > 0.7 && isNegative) {
    patterns.push("Circular negative exchange detected");
    recommendations.push("Conversation may be stuck in a loop - consider a break or mediator");
  }

  // Determine flow type
  let flow: ContextAnalysisResult["flow"] = "neutral";

  if (isEscalating) {
    flow = "escalating";
  } else if (isNegative) {
    flow = "negative";
  } else if (avgSimilarity > 0.5 && avgNegativeSentiment < 0.4) {
    flow = "positive";
  }

  // Add positive pattern if no issues
  if (patterns.length === 0) {
    patterns.push("Conversation appears constructive and on-topic");
  }

  // General recommendations based on flow
  if (flow === "positive") {
    recommendations.push("Conversation is flowing well - maintain this tone");
  } else if (flow === "neutral" && recommendations.length === 0) {
    recommendations.push("Consider adding more warmth or clarity to your messages");
  }

  return {
    flow,
    patterns,
    recommendations,
    metrics: {
      avgSimilarity: Math.round(avgSimilarity * 100) / 100,
      similarityTrend: similarityTrend.map(s => Math.round(s * 100) / 100),
      sentimentTrend: sentimentTrend.map(s => Math.round(s * 100) / 100),
      topicDriftScore: Math.round(topicDriftScore * 100) / 100,
      repetitionScore: Math.round(repetitionScore * 100) / 100,
    },
  };
}