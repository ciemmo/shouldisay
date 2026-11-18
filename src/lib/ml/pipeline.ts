// ML Pipeline - orchestrates tone, emotion, and severity analysis
// Uses Transformers.js models for context-aware analysis with rule-based fallback

import { getPipeline } from "./models/registry";
import type { TextClassificationOutput } from "@xenova/transformers";
import { analyzeWithHeuristics, checkRedFlags } from "./rules/heuristics";
import { analyzeContext as analyzeContextML } from "./classifiers/context";
import { extractMessageContext, generateDynamicExplanation, generateDynamicSuggestions } from "./rules/dynamicFeedback";
import { AudienceProfile, calculateAudienceModifiers, DEFAULT_AUDIENCE, getPresetAudience } from "./audience";

export interface AnalysisInput {
  text: string;
  conversationHistory?: string[];
  audience?: AudienceProfile | string; // AudienceProfile object or preset ID
}

/**
 * Resolve audience from input (preset ID string or full profile object)
 */
function resolveAudience(audience?: AudienceProfile | string): AudienceProfile {
  if (!audience) return DEFAULT_AUDIENCE;
  if (typeof audience === "string") {
    return getPresetAudience(audience) || DEFAULT_AUDIENCE;
  }
  return audience;
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
    audienceId?: string;
    audienceName?: string;
  };
}

/**
 * Main analysis function - runs ML classifiers AND rule-based analysis in parallel
 * Combines both for richer, more specific results
 */
export async function analyzeText(input: AnalysisInput): Promise<AnalysisResult> {
  const startTime = Date.now();
  const { text, audience } = input;

  // Resolve audience profile
  const audienceProfile = resolveAudience(audience);

  // Calculate audience modifiers
  const audienceModifiers = calculateAudienceModifiers(audienceProfile.traits);

  // Check for red flags first (always run, even before ML)
  const redFlags = checkRedFlags(text);

  let analysisResult: AnalysisResult;
  let modelVersion = "transformers.js-v1";

  try {
    // Run ML-based analysis AND rule-based analysis in parallel
    const [sentimentResult, emotionResult, heuristicResult] = await Promise.all([
      runSentimentAnalysis(text),
      runEmotionAnalysis(text),
      // Run heuristics in parallel - provides specific linguistic patterns
      Promise.resolve(analyzeWithHeuristics(text, redFlags)),
    ]);

    // Combine ML results (broad sentiment/emotion)
    const mlCategories = combineCategories(sentimentResult, emotionResult);

    // Combine with rule-based categories (specific linguistic patterns)
    // Heuristic categories include: aggressive, rude, dismissive, passive_aggressive,
    // blaming, threatening, sarcastic, negative_critical, polite, collaborative, etc.
    const allCategories = [...mlCategories, ...heuristicResult.categories];

    // Deduplicate categories by category key (keep highest score)
    let dedupedCategories = Object.values(
      allCategories.reduce((acc, cat) => {
        if (!acc[cat.category] || cat.score > acc[cat.category].score) {
          acc[cat.category] = cat;
        }
        return acc;
      }, {} as Record<string, CategoryScore>)
    );

    // Apply audience category multipliers
    dedupedCategories = dedupedCategories.map(cat => ({
      ...cat,
      score: Math.min(1, cat.score * (audienceModifiers.categoryMultipliers[cat.category] || 1.0)),
    }));

    // Calculate severity using BOTH ML sentiment AND heuristic categories
    const severity = calculateSeverity(dedupedCategories, sentimentResult);

    // Apply audience severity adjustment
    const adjustedSeverityScore = Math.max(0, Math.min(1,
      (severity.level - 1) / 4 + audienceModifiers.severityAdjustment
    ));
    const adjustedSeverityLevel = Math.max(1, Math.min(5, Math.round(adjustedSeverityScore * 4) + 1)) as SeverityResult["level"];
    const severityLabels = { 1: "Minimal", 2: "Low", 3: "Moderate", 4: "High", 5: "Severe" };
    const adjustedSeverity: SeverityResult = { level: adjustedSeverityLevel, label: severityLabels[adjustedSeverityLevel] };

    // Red flags always force NOT_OK verdict and maximum severity
    let verdict = determineVerdict(adjustedSeverity.level, sentimentResult, audienceModifiers.verdictThresholdAdjustment);
    let finalSeverity = adjustedSeverity;
    if (redFlags.length > 0) {
      verdict = "NOT_OK";
      finalSeverity = { level: 5, label: "Severe" };
    }

    // Confidence based on both ML and rule-based signals
    const confidence = calculateConfidence(sentimentResult, emotionResult, heuristicResult);

    // Generate feedback using ALL detected categories (ML + rules)
    const feedback = generateFeedback(text, dedupedCategories, finalSeverity, verdict, redFlags, audienceProfile);

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
        audienceId: audienceProfile.id,
        audienceName: audienceProfile.name,
      },
    };
  } catch (mlError) {
    // Fallback to rule-based analysis only
    console.warn("[ML] Transformers.js failed, falling back to heuristics:", mlError);
    modelVersion = "heuristics-fallback-v1";

    // Pass red flags to heuristic analysis so feedback accounts for them
    const heuristicResult = analyzeWithHeuristics(text, redFlags);

    // Apply audience modifiers to fallback result too
    let adjustedCategories = heuristicResult.categories.map(cat => ({
      ...cat,
      score: Math.min(1, cat.score * (audienceModifiers.categoryMultipliers[cat.category] || 1.0)),
    }));

    analysisResult = {
      verdict: heuristicResult.verdict,
      confidence: heuristicResult.confidence,
      severity: heuristicResult.severity,
      categories: adjustedCategories,
      feedback: {
        explanation: heuristicResult.explanation,
        suggestions: heuristicResult.suggestions,
      },
      metadata: {
        modelVersion,
        processingTime: Date.now() - startTime,
        charCount: text.length,
        audienceId: audienceProfile.id,
        audienceName: audienceProfile.name,
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
  // ML-based negative categories
  const mlNegativeCategories = ["aggressive", "rude", "dismissive", "anxious"];
  // Heuristic-based negative categories (specific linguistic patterns)
  const heuristicNegativeCategories = [
    "aggressive", "rude", "dismissive", "passive_aggressive",
    "blaming", "threatening", "sarcastic", "negative_critical"
  ];
  for (const cat of categories) {
    if (mlNegativeCategories.includes(cat.category)) {
      severityScore += cat.score * 0.4;
    }
    if (heuristicNegativeCategories.includes(cat.category)) {
      severityScore += cat.score * 0.5; // Heuristic patterns are strong signals
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
  sentiment: { label: string; score: number },
  thresholdAdjustment: number = 0
): "OK" | "CAUTION" | "NOT_OK" {
  // Apply threshold adjustment (positive = stricter)
  const adjustedLevel = severityLevel + Math.round(thresholdAdjustment * 4);
  if (adjustedLevel >= 4) return "NOT_OK";
  if (adjustedLevel >= 3) return "CAUTION";
  if (adjustedLevel === 2 && sentiment.label === "NEGATIVE") return "CAUTION";
  return "OK";
}

/**
 * Calculate overall confidence score
 */
function calculateConfidence(
  sentiment: { label: string; score: number },
  emotions: Array<{ label: string; score: number }>,
  heuristicResult?: { categories: Array<{ category: string; score: number }>; confidence: number }
): number {
  // Weighted average of top predictions
  const topEmotionScore = emotions[0]?.score || 0;
  const mlConfidence = (sentiment.score * 0.6 + topEmotionScore * 0.4);

  // Boost confidence if heuristic analysis found specific patterns
  let heuristicBoost = 0;
  if (heuristicResult && heuristicResult.categories.length > 0) {
    const topHeuristicScore = Math.max(...heuristicResult.categories.map(c => c.score));
    heuristicBoost = topHeuristicScore * 0.2;
  }

  return Math.min(0.95, mlConfidence + heuristicBoost);
}

/**
 * Generate human-readable feedback and suggestions - DYNAMIC VERSION
 */
function generateFeedback(
  text: string,
  categories: CategoryScore[],
  severity: SeverityResult,
  verdict: "OK" | "CAUTION" | "NOT_OK",
  redFlags: string[] = [],
  audienceProfile?: AudienceProfile
): FeedbackResult {
  const topCategory = categories[0];
  const isNegative = verdict !== "OK";

  // Check for negative heuristic patterns regardless of verdict
  // These are specific linguistic patterns that indicate issues even if ML sentiment is positive
  const heuristicNegativeCats = categories.filter(c => c.score >= 0.15 &&
    ["aggressive", "rude", "dismissive", "passive_aggressive", "blaming",
     "threatening", "sarcastic", "negative_critical",
     "mocking_politeness", "feigned_ignorance", "false_alignment",
     "weaponized_helpfulness", "performative_empathy", "condescending_praise",
     "fake_reasonableness", "veiled_threat", "dismissive_just", "triangulation",
     "gaslighting", "guilt_tripping", "stonewalling", "deflection",
     "condescending", "backhanded_compliment", "victim_playing", "minimizing",
     "love_bombing", "sealioning", "concern_trolling", "negging",
     "emotional_blackmail", "tone_policing", "projection", "moving_goalposts",
     "dismissive_abbreviation", "uncertain_typing", "emphatic_repetition",
     "shouting_caps", "excessive_punctuation", "keyboard_smash",
     "lazy_typing", "over_apologetic", "hedging", "demanding_brevity",
     "performative_thinking",
     "inappropriate_familiarity", "flirtatious_language", "praise_stacking"
    ].includes(c.category));

  const hasHeuristicNegatives = heuristicNegativeCats.length > 0;

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

  // Extract context from the message for dynamic feedback
  const context = extractMessageContext(text);

  // If we have heuristic negative patterns, treat as negative for feedback purposes
  // even if overall verdict is OK (ML model might miss sarcasm, passive-aggression, etc.)
  const treatAsNegative = isNegative || hasHeuristicNegatives;

  // Add audience-specific context to explanation
  const audienceContext = audienceProfile
    ? ` (analyzed for: ${audienceProfile.name})`
    : "";

  if (!treatAsNegative) {
    // Check if there are any notable patterns even in "OK" messages
    const notableCategories = categories.filter(c => c.score >= 0.3 &&
      ["positive_tone", "collaborative", "empathetic", "constructive", "validating", "polite"].includes(c.category));

    if (notableCategories.length > 0) {
      const labels = notableCategories.map(c => c.label.toLowerCase()).join(", ");
      explanation = `Your message comes across as ${labels}. No significant tone issues detected.`;
    } else {
      explanation = "Your message comes across as constructive and respectful. No significant tone issues detected.";
    }
    suggestions.push("Great job! Your communication style is clear and considerate.");
  } else {
    // Use dynamic feedback generation
    explanation = generateDynamicExplanation(text, categories, context, severity, verdict) + audienceContext;
    const dynamicSuggestions = generateDynamicSuggestions(text, categories, context, verdict);
    suggestions.push(...dynamicSuggestions);
  }

  // Add audience-specific suggestions
  if (audienceProfile) {
    suggestions.push(...generateAudienceSuggestions(text, categories, audienceProfile));
  }

  // Deduplicate suggestions
  const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);

  return { explanation, suggestions: uniqueSuggestions };
}

/**
 * Generate audience-specific suggestions based on the target audience's traits
 */
function generateAudienceSuggestions(
  text: string,
  categories: CategoryScore[],
  audience: AudienceProfile
): string[] {
  const suggestions: string[] = [];
  const traits = audience.traits;

  // Formality suggestions
  if (traits.formality === "formal" || traits.formality === "very_formal") {
    if (text.match(/\b(hey|hi|hello|thanks|thx|ok|okay|yeah|yep|nah)\b/i)) {
      suggestions.push(`For ${audience.name}, consider more formal greetings and avoid casual abbreviations.`);
    }
    if (text.match(/\b(gonna|wanna|gotta|kinda|sorta)\b/i)) {
      suggestions.push("Avoid informal contractions like 'gonna', 'wanna' — use 'going to', 'want to' instead.");
    }
  }

  // Directness suggestions
  if (traits.directness === "indirect" || traits.directness === "very_indirect") {
    if (text.match(/\b(you (must|need to|have to|should))\b/i)) {
      suggestions.push(`${audience.name} may prefer softer phrasing: "Could you..." or "Would it be possible to..." instead of "You must..."`);
    }
  } else if (traits.directness === "direct" || traits.directness === "very_direct") {
    if (text.match(/\b(i (think|feel|believe) (maybe|perhaps|possibly))\b/i)) {
      suggestions.push(`${audience.name} appreciates directness — consider stating your point more clearly.`);
    }
  }

  // Humor tolerance
  if (traits.humorTolerance === "none" || traits.humorTolerance === "low") {
    if (text.match(/\b(lol|haha|jk|joking|sarcasm|sarcastic)\b/i) || text.includes("😂") || text.includes("🤣")) {
      suggestions.push(`${audience.name} may not appreciate humor or sarcasm in this context.`);
    }
  }

  // Power dynamic
  if (traits.powerDynamic === "they_senior") {
    if (text.match(/\b(i (disagree|don't agree|think you're wrong))\b/i)) {
      suggestions.push("When disagreeing with a superior, try: 'I see it differently because...' or 'Have you considered...?'");
    }
    if (!text.match(/\b(please|thank you|appreciate|grateful)\b/i)) {
      suggestions.push("Consider adding polite markers like 'please' or 'thank you' when messaging a superior.");
    }
  }

  // Emotional closeness
  if (traits.emotionalCloseness === "stranger" || traits.emotionalCloseness === "acquaintance") {
    if (text.match(/\b(i (love|miss|need) you)\b/i) || text.match(/\b(you're (amazing|perfect|incredible))\b/i)) {
      suggestions.push(`With ${audience.name}, overly intimate language may feel inappropriate.`);
    }
  }

  // Sensitivity-specific suggestions based on detected categories
  const detectedCategories = categories.filter(c => c.score >= 0.15).map(c => c.category);

  if (traits.sensitivity.sarcasm > 0.6 && detectedCategories.some(c => ["sarcastic", "mocking_politeness"].includes(c))) {
    suggestions.push(`${audience.name} is sensitive to sarcasm — consider being more direct.`);
  }

  if (traits.sensitivity.criticism > 0.6 && detectedCategories.includes("negative_critical")) {
    suggestions.push(`${audience.name} may take criticism personally. Frame as suggestions: "What if we tried...?"`);
  }

  if (traits.sensitivity.abbreviations > 0.5 && detectedCategories.includes("dismissive_abbreviation")) {
    suggestions.push(`${audience.name} prefers full words over abbreviations like "k", "idk", "thx".`);
  }

  if (traits.sensitivity.caps > 0.6 && detectedCategories.includes("shouting_caps")) {
    suggestions.push(`ALL CAPS feels aggressive to ${audience.name}. Use italics or "I strongly feel..." for emphasis.`);
  }

  // Workplace flirtation / inappropriate familiarity suggestions
  if (detectedCategories.includes("inappropriate_familiarity")) {
    if (traits.formality === "formal" || traits.formality === "very_formal" || traits.powerDynamic === "they_senior") {
      suggestions.push(`${audience.name} expects professional boundaries — avoid pet names like "honey", "sweetie", "babe".`);
    } else {
      suggestions.push(`Terms of endearment can feel inappropriate with ${audience.name}. Use their name instead.`);
    }
  }

  if (detectedCategories.includes("flirtatious_language")) {
    if (traits.formality === "formal" || traits.formality === "very_formal" || traits.humorTolerance === "none" || traits.humorTolerance === "low") {
      suggestions.push(`${audience.name} may perceive tildes (~), winks, and stacked compliments as unprofessional or flirtatious.`);
    } else {
      suggestions.push(`Playful language like tildes (~) and wink emojis can be misread by ${audience.name}.`);
    }
  }

  if (detectedCategories.includes("praise_stacking")) {
    if (traits.formality === "formal" || traits.formality === "very_formal") {
      suggestions.push(`Multiple excessive compliments can feel insincere or manipulative to ${audience.name}. One specific compliment is better.`);
    } else {
      suggestions.push(`Stacked superlatives ("awesome sweet lovely") can overwhelm ${audience.name}. Be specific: "Great job on X."`);
    }
  }

  return suggestions;
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