// ML Pipeline - orchestrates tone, emotion, and severity analysis
// Uses Transformers.js models for context-aware analysis

import { getPipeline } from "./models/registry";

export interface AnalysisInput {
  text: string;
  conversationHistory?: string[];
}

export interface CategoryScore {
  category: string;
  score: number;
  label: string;
}

export interface SeverityResult {
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
}

export interface FeedbackResult {
  explanation: string;
  suggestions: string[];
}

export interface AnalysisResult {
  verdict: "OK" | "CAUTION" | "NOT_OK";
  confidence: number;
  severity: SeverityResult;
  categories: CategoryScore[];
  feedback: FeedbackResult;
  contextAnalysis?: {
    flow: "positive" | "neutral" | "negative" | "escalating";
    patterns: string[];
    recommendations: string[];
  };
  metadata: {
    modelVersion: string;
    processingTime: number;
    charCount: number;
  };
}

/**
 * Main analysis function - runs all classifiers in parallel
 */
export async function analyzeText(input: AnalysisInput): Promise<AnalysisResult> {
  const startTime = Date.now();
  const { text } = input;

  // Run sentiment and emotion classifiers in parallel
  const [sentimentResult, emotionResult] = await Promise.all([
    runSentimentAnalysis(text),
    runEmotionAnalysis(text),
  ]);

  // Combine results
  const categories = combineCategories(sentimentResult, emotionResult);
  const severity = calculateSeverity(categories, sentimentResult);
  const verdict = determineVerdict(severity.level, sentimentResult);
  const confidence = calculateConfidence(sentimentResult, emotionResult);
  const feedback = generateFeedback(text, categories, severity, verdict);

  // Context analysis if conversation history provided
  let contextAnalysis: AnalysisResult["contextAnalysis"];
  if (input.conversationHistory && input.conversationHistory.length > 0) {
    contextAnalysis = await analyzeContext(text, input.conversationHistory);
  }

  return {
    verdict,
    confidence,
    severity,
    categories,
    feedback,
    contextAnalysis,
    metadata: {
      modelVersion: "transformers.js-v1",
      processingTime: Date.now() - startTime,
      charCount: text.length,
    },
  };
}

/**
 * Run sentiment analysis using DistilBERT SST-2
 * Returns positive/negative with confidence
 */
async function runSentimentAnalysis(text: string): Promise<{ label: string; score: number }> {
  const pipe = await getPipeline("sentiment");
  const result = await pipe(text);

  // Transformers.js returns array of { label: "POSITIVE" | "NEGATIVE", score: number }
  const top = Array.isArray(result) ? result[0] : result;
  return { label: top.label, score: top.score };
}

/**
 * Run emotion classification using DistilBERT emotion model
 * Returns 6 emotions: anger, disgust, fear, joy, sadness, surprise
 */
async function runEmotionAnalysis(text: string): Promise<Array<{ label: string; score: number }>> {
  const pipe = await getPipeline("emotion");
  const result = await pipe(text, { topK: 6 });

  // Returns array of { label, score } sorted by score descending
  return Array.isArray(result) ? result : [result];
}

/**
 * Combine sentiment and emotion results into unified categories
 * Maps emotions to our tone categories
 */
function combineCategories(
  sentiment: { label: string; score: number },
  emotions: Array<{ label: string; score: number }>
): CategoryScore[] {
  const categories: CategoryScore[] = [];

  // Map emotions to our categories
  const emotionToCategory: Record<string, { category: string; label: string }> = {
    anger: { category: "aggressive", label: "Aggressive" },
    disgust: { category: "rude", label: "Rude" },
    fear: { category: "anxious", label: "Anxious" },
    joy: { category: "positive", label: "Positive" },
    sadness: { category: "dismissive", label: "Dismissive" },
    surprise: { category: "surprised", label: "Surprised" },
  };

  // Add emotion-based categories (threshold: 0.15)
  for (const emotion of emotions) {
    if (emotion.score >= 0.15) {
      const mapping = emotionToCategory[emotion.label.toLowerCase()];
      if (mapping) {
        categories.push({
          category: mapping.category,
          score: emotion.score,
          label: mapping.label,
        });
      }
    }
  }

  // Add sentiment as overall tone indicator
  if (sentiment.label === "NEGATIVE" && sentiment.score > 0.5) {
    categories.push({
      category: "negative_tone",
      score: sentiment.score,
      label: "Negative Tone",
    });
  } else if (sentiment.label === "POSITIVE" && sentiment.score > 0.7) {
    categories.push({
      category: "positive_tone",
      score: sentiment.score,
      label: "Positive Tone",
    });
  }

  // Sort by score descending
  return categories.sort((a, b) => b.score - a.score);
}

/**
 * Calculate severity level (1-5) based on categories and sentiment
 */
function calculateSeverity(
  categories: CategoryScore[],
  sentiment: { label: string; score: number }
): SeverityResult {
  // Base severity from negative sentiment
  let severityScore = 0;

  if (sentiment.label === "NEGATIVE") {
    severityScore = sentiment.score * 0.6;
  }

  // Add category contributions
  const negativeCategories = ["aggressive", "rude", "dismissive", "anxious"];
  for (const cat of categories) {
    if (negativeCategories.includes(cat.category)) {
      severityScore += cat.score * 0.4;
    }
  }

  // Normalize to 0-1
  severityScore = Math.min(1, severityScore);

  // Map to 1-5 scale
  let level: SeverityResult["level"] = 1;
  if (severityScore >= 0.8) level = 5;
  else if (severityScore >= 0.6) level = 4;
  else if (severityScore >= 0.4) level = 3;
  else if (severityScore >= 0.2) level = 2;

  const labels = {
    1: "Minimal",
    2: "Low",
    3: "Moderate",
    4: "High",
    5: "Severe",
  };

  return { level, label: labels[level] };
}

/**
 * Determine overall verdict from severity and sentiment
 */
function determineVerdict(
  severityLevel: number,
  sentiment: { label: string; score: number }
): "OK" | "CAUTION" | "NOT_OK" {
  if (severityLevel >= 4) return "NOT_OK";
  if (severityLevel >= 3) return "CAUTION";
  if (severityLevel === 2 && sentiment.label === "NEGATIVE") return "CAUTION";
  return "OK";
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(
  sentiment: { label: string; score: number },
  emotions: Array<{ label: string; score: number }>
): number {
  // Weighted average of top predictions
  const topEmotionScore = emotions[0]?.score || 0;
  return (sentiment.score * 0.6 + topEmotionScore * 0.4);
}

/**
 * Generate human-readable feedback and suggestions
 */
function generateFeedback(
  text: string,
  categories: CategoryScore[],
  severity: SeverityResult,
  verdict: "OK" | "CAUTION" | "NOT_OK"
): FeedbackResult {
  const topCategory = categories[0];
  const isNegative = verdict !== "OK";

  let explanation = "";
  const suggestions: string[] = [];

  if (!isNegative) {
    explanation = "Your message comes across as constructive and respectful. No significant tone issues detected.";
    suggestions.push("Great job! Your communication style is clear and considerate.");
  } else {
    const primaryLabel = topCategory?.label || "negative tone";
    explanation = `Your message shows signs of ${primaryLabel.toLowerCase()} (severity: ${severity.label}). This may be perceived as ${verdict === "NOT_OK" ? "inappropriate or hurtful" : "potentially off-putting"} by the recipient.`;

    // Category-specific suggestions
    if (categories.some(c => c.category === "aggressive")) {
      suggestions.push("Try softening demands: \"Could you please...\" instead of \"You must...\"");
      suggestions.push("Replace ultimatums with requests: \"It would help if...\" instead of \"Do this or else...\"");
    }
    if (categories.some(c => c.category === "rude")) {
      suggestions.push("Avoid insults or demeaning language. Focus on the behavior, not the person.");
      suggestions.push("Replace \"That's stupid\" with \"I disagree because...\"");
    }
    if (categories.some(c => c.category === "dismissive")) {
      suggestions.push("Acknowledge the other person's perspective before sharing yours.");
      suggestions.push("Replace \"Whatever\" with \"I see it differently because...\"");
    }
    if (categories.some(c => c.category === "anxious")) {
      suggestions.push("Your message may convey uncertainty. Consider stating your position more confidently.");
    }

    // General suggestions
    suggestions.push("Read your message aloud before sending — does it sound how you intend?");
    suggestions.push("Consider the recipient's perspective: how would you feel receiving this?");
  }

  return { explanation, suggestions };
}

/**
 * Analyze conversation context (conversation history + current message)
 * Detects escalation patterns, recurring issues, etc.
 */
async function analyzeContext(
  currentText: string,
  history: string[]
): Promise<AnalysisResult["contextAnalysis"]> {
  // Simple pattern detection for now
  // Could be enhanced with embeddings later

  const recentMessages = history.slice(-5);
  const allText = [...recentMessages, currentText].join(" ");

  // Check for escalation
  const negativeWords = ["angry", "frustrated", "upset", "annoyed", "furious"];
  const negativeCount = negativeWords.filter(w => allText.toLowerCase().includes(w)).length;

  // Check for repetition
  const words = currentText.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitionRatio = uniqueWords.size / words.length;

  let flow: AnalysisResult["contextAnalysis"]["flow"] = "neutral";
  const patterns: string[] = [];
  const recommendations: string[] = [];

  if (negativeCount >= 2) {
    flow = "escalating";
    patterns.push("Increasing negative language detected");
    recommendations.push("Consider pausing the conversation to de-escalate");
  } else if (negativeCount === 1) {
    flow = "negative";
    patterns.push("Negative tone in recent messages");
  }

  if (repetitionRatio < 0.5 && words.length > 10) {
    patterns.push("Repetitive language detected");
    recommendations.push("Try varying your phrasing to communicate more clearly");
  }

  if (flow === "neutral" && patterns.length === 0) {
    flow = "positive";
    patterns.push("Conversation appears constructive");
  }

  return { flow, patterns, recommendations };
}