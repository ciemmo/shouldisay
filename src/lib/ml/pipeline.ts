// ML Pipeline - orchestrates tone, emotion, and severity analysis
// Uses Transformers.js models for context-aware analysis with rule-based fallback

import { getPipeline } from "./models/registry";
import type { TextClassificationOutput } from "@xenova/transformers";
import { analyzeWithHeuristics, checkRedFlags } from "./rules/heuristics";
import { analyzeContext as analyzeContextML } from "./classifiers/context";

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
 * Main analysis function - runs ML classifiers with rule-based fallback
 */
export async function analyzeText(input: AnalysisInput): Promise<AnalysisResult> {
  const startTime = Date.now();
  const { text } = input;

  // Check for red flags first (always run, even before ML)
  const redFlags = checkRedFlags(text);

  let analysisResult: AnalysisResult;
  let modelVersion = "transformers.js-v1";

  try {
    // Try ML-based analysis first
    const [sentimentResult, emotionResult] = await Promise.all([
      runSentimentAnalysis(text),
      runEmotionAnalysis(text),
    ]);

    // Combine ML results
    const categories = combineCategories(sentimentResult, emotionResult);

    // Deduplicate categories by category key (keep highest score)
    const dedupedCategories = Object.values(
      categories.reduce((acc, cat) => {
        if (!acc[cat.category] || cat.score > acc[cat.category].score) {
          acc[cat.category] = cat;
        }
        return acc;
      }, {} as Record<string, CategoryScore>)
    );

    const severity = calculateSeverity(dedupedCategories, sentimentResult);

    // Red flags always force NOT_OK verdict and maximum severity
    let verdict = determineVerdict(severity.level, sentimentResult);
    let finalSeverity = severity;
    if (redFlags.length > 0) {
      verdict = "NOT_OK";
      finalSeverity = { level: 5, label: "Severe" };
    }

    const confidence = calculateConfidence(sentimentResult, emotionResult);
    const feedback = generateFeedback(text, dedupedCategories, finalSeverity, verdict, redFlags);

    analysisResult = {
      verdict,
      confidence,
      severity: finalSeverity,
      categories: dedupedCategories,
      feedback,
      metadata: {
        modelVersion,
        processingTime: Date.now() - startTime,
        charCount: text.length,
      },
    };
  } catch (mlError) {
    // Fallback to rule-based analysis
    console.warn("[ML] Transformers.js failed, falling back to heuristics:", mlError);
    modelVersion = "heuristics-fallback-v1";

    // Pass red flags to heuristic analysis so feedback accounts for them
    const heuristicResult = analyzeWithHeuristics(text, redFlags);

    analysisResult = {
      verdict: heuristicResult.verdict,
      confidence: heuristicResult.confidence,
      severity: heuristicResult.severity,
      categories: heuristicResult.categories,
      feedback: {
        explanation: heuristicResult.explanation,
        suggestions: heuristicResult.suggestions,
      },
      metadata: {
        modelVersion,
        processingTime: Date.now() - startTime,
        charCount: text.length,
      },
    };
  }

  // Context analysis if conversation history provided (works with both ML and fallback)
  // NOTE: Tier gating is enforced in the API route (src/app/api/analyze/route.ts).
  // This function only runs when conversationHistory is explicitly provided.
  // Free tier users will never have conversationHistory passed to analyzeText().
  let contextAnalysis: AnalysisResult["contextAnalysis"];
  if (input.conversationHistory && input.conversationHistory.length > 0) {
    try {
      // Use embedding-based ML context analyzer
      const ctx = await analyzeContextML([...input.conversationHistory, text]);
      contextAnalysis = {
        flow: ctx.flow,
        patterns: ctx.patterns,
        recommendations: ctx.recommendations,
      };
    } catch (ctxError) {
      // Fallback to simple pattern-based context analysis
      console.warn("[ML] Context analysis failed, using fallback:", ctxError);
      contextAnalysis = await analyzeContextFallback(text, input.conversationHistory);
    }
  }

  return {
    ...analysisResult,
    contextAnalysis,
  };
}

/**
 * Fallback context analysis using simple pattern detection
 * Used when embedding model fails
 */
async function analyzeContextFallback(
  currentText: string,
  history: string[]
): Promise<AnalysisResult["contextAnalysis"]> {
  // Simple pattern detection
  const recentMessages = history.slice(-5);
  const allText = [...recentMessages, currentText].join(" ");

  // Check for escalation
  const negativeWords = ["angry", "frustrated", "upset", "annoyed", "furious"];
  const negativeCount = negativeWords.filter(w => allText.toLowerCase().includes(w)).length;

  // Check for repetition
  const words = currentText.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  const repetitionRatio = uniqueWords.size / words.length;

  let flow: NonNullable<AnalysisResult["contextAnalysis"]>["flow"] = "neutral";
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

/**
 * Run sentiment analysis using DistilBERT SST-2
 * Returns positive/negative with confidence
 */
async function runSentimentAnalysis(text: string): Promise<{ label: string; score: number }> {
  const pipe = await getPipeline("sentiment");
  const result = await pipe(text) as TextClassificationOutput | TextClassificationOutput[];
  const top = normalizeClassificationOutput(result)[0];
  if (!top) throw new Error("Sentiment analysis returned no predictions");
  return { label: top.label, score: top.score };
}

/**
 * Run emotion classification using Twitter RoBERTa sentiment model (3-class)
 * Returns: negative, neutral, positive - used as emotion proxy
 */
async function runEmotionAnalysis(text: string): Promise<Array<{ label: string; score: number }>> {
  const pipe = await getPipeline("emotion");
  const result = await pipe(text, { topk: 3 }) as TextClassificationOutput | TextClassificationOutput[];

  return normalizeClassificationOutput(result);
}

function isBatchedOutput(
  output: TextClassificationOutput | TextClassificationOutput[]
): output is TextClassificationOutput[] {
  return Array.isArray(output[0]);
}

function normalizeClassificationOutput(
  output: TextClassificationOutput | TextClassificationOutput[]
): TextClassificationOutput {
  return isBatchedOutput(output) ? output[0] ?? [] : output;
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

  // Map Twitter RoBERTa 3-class sentiment to our categories
  // Labels: "negative", "neutral", "positive"
  const emotionToCategory: Record<string, { category: string; label: string }> = {
    negative: { category: "negative_tone", label: "Negative Tone" },
    neutral: { category: "neutral_tone", label: "Neutral Tone" },
    positive: { category: "positive_tone", label: "Positive Tone" },
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

  // Add sentiment as overall tone indicator (DistilBERT SST-2 labels: NEGATIVE, POSITIVE)
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
  verdict: "OK" | "CAUTION" | "NOT_OK",
  redFlags: string[] = []
): FeedbackResult {
  const topCategory = categories[0];
  const isNegative = verdict !== "OK";

  let explanation = "";
  const suggestions: string[] = [];

  // Red flags always indicate serious issues
  if (redFlags.length > 0) {
    explanation = `⚠️ ${redFlags.join("; ")}. This message contains serious safety concerns and should not be sent.`;

    // Specific suggestions based on red flag type
    for (const flag of redFlags) {
      if (flag.includes("Self-harm") || flag.includes("kill yourself") || flag.includes("kys")) {
        suggestions.push("If you or someone you know is struggling, please reach out for help.");
        suggestions.push("Crisis Text Line: Text HOME to 741741 (US/Canada/UK)");
        suggestions.push("988 Suicide & Crisis Lifeline: Call or text 988 (US)");
        suggestions.push("International: https://findahelpline.com/");
      }
      if (flag.includes("Hate speech")) {
        suggestions.push("Hate speech is harmful and unacceptable. Consider how your words impact others.");
      }
      if (flag.includes("threat")) {
        suggestions.push("Threats of violence are never appropriate. Seek help if you're feeling unsafe or angry.");
      }
      if (flag.includes("SSN") || flag.includes("credit card")) {
        suggestions.push("Never share personal identification or financial information in messages.");
      }
    }

    return { explanation, suggestions };
  }

  if (!isNegative) {
    explanation = "Your message comes across as constructive and respectful. No significant tone issues detected.";
    suggestions.push("Great job! Your communication style is clear and considerate.");
  } else {
    const primaryLabel = topCategory?.label || "negative tone";
    explanation = `Your message shows signs of ${primaryLabel.toLowerCase()} (severity: ${severity.label}). This may be perceived as ${verdict === "NOT_OK" ? "inappropriate or hurtful" : "potentially off-putting"} by the recipient.`;

    // Category-specific suggestions (ML-based categories)
    if (categories.some(c => c.category === "negative_tone")) {
      suggestions.push("Frame criticism constructively: \"This could be improved by...\" instead of \"This is bad\"");
      suggestions.push("Offer specific suggestions: \"I think X would work better because...\"");
      suggestions.push("Balance negative feedback with what's working well");
    }
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

  // Deduplicate suggestions
  const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);

  return { explanation, suggestions: uniqueSuggestions };
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

  let flow: NonNullable<AnalysisResult["contextAnalysis"]>["flow"] = "neutral";
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