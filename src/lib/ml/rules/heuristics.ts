// src/lib/ml/rules/heuristics.ts
// Rule-based heuristics for tone analysis fallback

import { ALL_PATTERNS, NEGATIVE_CATEGORIES, POSITIVE_CATEGORIES, type PatternRule } from "./patterns";

export interface HeuristicResult {
  categories: Array<{ category: string; score: number; label: string }>;
  severity: { level: 1 | 2 | 3 | 4 | 5; label: string };
  verdict: "OK" | "CAUTION" | "NOT_OK";
  confidence: number;
  explanation: string;
  suggestions: string[];
}

/**
 * Analyze text using only rule-based patterns
 * Used as fallback when ML models are unavailable
 */
export function analyzeWithHeuristics(text: string, redFlags: string[] = []): HeuristicResult {
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

  // Score each pattern rule
  const categoryScores: Record<string, { score: number; label: string; count: number }> = {};

  for (const rule of ALL_PATTERNS) {
    let matches = 0;
    for (const pattern of rule.patterns) {
      const textMatches = lowerText.match(pattern);
      if (textMatches) {
        matches += textMatches.length;
      }
    }

    if (matches > 0) {
      // Normalize by word count and apply weight
      const normalizedScore = Math.min(1, (matches / Math.max(1, wordCount)) * 20 * rule.weight);
      if (!categoryScores[rule.category] || normalizedScore > categoryScores[rule.category].score) {
        categoryScores[rule.category] = {
          score: normalizedScore,
          label: rule.label,
          count: matches,
        };
      }
    }
  }

  // Convert to categories array
  const categories = Object.entries(categoryScores)
    .map(([category, data]) => ({
      category,
      score: data.score,
      label: data.label,
    }))
    .sort((a, b) => b.score - a.score);

  // Calculate severity from negative categories
  let severityScore = 0;
  for (const cat of categories) {
    if (NEGATIVE_CATEGORIES.includes(cat.category)) {
      severityScore += cat.score * 0.8;
    }
  }
  // Positive categories reduce severity
  for (const cat of categories) {
    if (POSITIVE_CATEGORIES.includes(cat.category)) {
      severityScore -= cat.score * 0.3;
    }
  }
  severityScore = Math.max(0, Math.min(1, severityScore));

  // Map to 1-5
  let level: HeuristicResult["severity"]["level"] = 1;
  if (severityScore >= 0.8) level = 5;
  else if (severityScore >= 0.6) level = 4;
  else if (severityScore >= 0.4) level = 3;
  else if (severityScore >= 0.2) level = 2;

  const severityLabels = {
    1: "Minimal",
    2: "Low",
    3: "Moderate",
    4: "High",
    5: "Severe",
  };

  // Determine verdict - red flags always force NOT_OK
  let verdict: HeuristicResult["verdict"] = "OK";
  if (redFlags.length > 0) {
    verdict = "NOT_OK";
  } else if (level >= 4) {
    verdict = "NOT_OK";
  } else if (level >= 3) {
    verdict = "CAUTION";
  } else if (level === 2 && categories.some(c => NEGATIVE_CATEGORIES.includes(c.category))) {
    verdict = "CAUTION";
  }

  // Confidence based on number and strength of matches
  const totalMatches = Object.values(categoryScores).reduce((sum, c) => sum + c.count, 0);
  const confidence = Math.min(0.85, 0.3 + totalMatches * 0.1 + categories.length * 0.05);

  // Generate explanation and suggestions
  const { explanation, suggestions } = generateHeuristicFeedback(categories, verdict, severityScore, redFlags);

  return {
    categories,
    severity: { level, label: severityLabels[level] },
    verdict,
    confidence,
    explanation,
    suggestions,
  };
}

function generateHeuristicFeedback(
  categories: Array<{ category: string; score: number; label: string }>,
  verdict: "OK" | "CAUTION" | "NOT_OK",
  severityScore: number,
  redFlags: string[] = []
): { explanation: string; suggestions: string[] } {
  const suggestions: string[] = [];
  let explanation = "";

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

  if (verdict === "OK") {
    explanation = "Your message appears constructive and respectful based on pattern analysis.";
    suggestions.push("Your communication style seems clear and considerate.");
  } else {
    const topNegative = categories.find(c => NEGATIVE_CATEGORIES.includes(c.category));
    const primaryLabel = topNegative?.label?.toLowerCase() || "negative tone";

    const severityIndex = Math.round(severityScore * 4) + 1 as 1 | 2 | 3 | 4 | 5;
    const severityLabel = severityLabels[severityIndex] || "Moderate";
    explanation = `Pattern analysis detects ${primaryLabel} (severity: ${severityLabel}). This may be perceived as ${verdict === "NOT_OK" ? "inappropriate or hurtful" : "potentially off-putting"}.`;

    // Category-specific suggestions
    const categorySuggestions: Record<string, string[]> = {
      aggressive: [
        "Try softening demands: \"Could you please...\" instead of \"You must...\"",
        "Replace ultimatums with requests: \"It would help if...\" instead of \"Do this or else...\"",
      ],
      rude: [
        "Avoid insults or demeaning language. Focus on the behavior, not the person.",
        "Replace \"That's stupid\" with \"I disagree because...\"",
      ],
      dismissive: [
        "Acknowledge the other person's perspective before sharing yours.",
        "Replace \"Whatever\" with \"I see it differently because...\"",
      ],
      passive_aggressive: [
        "Try being direct about your feelings instead of hinting.",
        "Replace \"Fine, do what you want\" with \"I disagree with this approach because...\"",
      ],
      blaming: [
        "Use \"I\" statements: \"I feel frustrated when...\" instead of \"You always...\"",
        "Focus on the specific situation, not the person's character.",
      ],
      threatening: [
        "Avoid ultimatums. Express consequences calmly if needed.",
        "Seek mediation or a third party if the situation is escalating.",
      ],
      negative_critical: [
        "Frame criticism constructively: \"This could be improved by...\" instead of \"This is bad\"",
        "Offer specific suggestions: \"I think X would work better because...\"",
        "Balance negative feedback with what's working well",
      ],
      sarcastic: [
        "Sarcasm often obscures your real message. Try being direct.",
        "Replace sarcastic remarks with clear communication of your actual thoughts.",
      ],
    };

    for (const cat of categories) {
      if (categorySuggestions[cat.category]) {
        suggestions.push(...categorySuggestions[cat.category].slice(0, 2));
      }
    }

    // General suggestions
    suggestions.push("Read your message aloud before sending — does it sound how you intend?");
    suggestions.push("Consider the recipient's perspective: how would you feel receiving this?");
  }

  // Deduplicate suggestions
  const uniqueSuggestions = [...new Set(suggestions)].slice(0, 5);

  return { explanation, suggestions: uniqueSuggestions };
}

const severityLabels = {
  1: "Minimal",
  2: "Low",
  3: "Moderate",
  4: "High",
  5: "Severe",
};

/**
 * Quick check for obvious red flags (high-confidence negative patterns)
 */
export function checkRedFlags(text: string): string[] {
  const flags: string[] = [];
  const lowerText = text.toLowerCase();

  // Explicit threats
  if (/(kill|hurt|harm|attack)\s+(you|yourself)/i.test(text)) flags.push("Explicit threat detected");
  if (/(go die|kill yourself|kys)/i.test(text)) flags.push("Self-harm encouragement detected");

  // Severe harassment
  if (/\b(nigger|faggot|retard|tranny|kike|spic|chink)\b/i.test(text)) flags.push("Hate speech detected");

  // PII / doxxing hints
  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) flags.push("Possible SSN detected");
  if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text)) flags.push("Possible credit card detected");

  return flags;
}

/**
 * Get a quick heuristic score without full analysis
 * Returns 0-1 where higher = more negative
 */
export function calculateHeuristicScore(text: string): number {
  const result = analyzeWithHeuristics(text);
  return result.severity.level / 5;
}