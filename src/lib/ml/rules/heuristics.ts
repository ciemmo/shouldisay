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

export function analyzeWithHeuristics(text: string, redFlags: string[] = []): HeuristicResult {
  const lowerText = text.toLowerCase();
  const wordCount = text.split(/\s+/).length;

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

  const categories = Object.entries(categoryScores)
    .map(([category, data]) => ({
      category,
      score: data.score,
      label: data.label,
    }))
    .sort((a, b) => b.score - a.score);

  let severityScore = 0;
  for (const cat of categories) {
    if (NEGATIVE_CATEGORIES.includes(cat.category)) {
      severityScore += cat.score * 0.8;
    }
  }
  for (const cat of categories) {
    if (POSITIVE_CATEGORIES.includes(cat.category)) {
      severityScore -= cat.score * 0.3;
    }
  }
  severityScore = Math.max(0, Math.min(1, severityScore));

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

  const totalMatches = Object.values(categoryScores).reduce((sum, c) => sum + c.count, 0);
  const confidence = Math.min(0.85, 0.3 + totalMatches * 0.1 + categories.length * 0.05);

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

  if (redFlags.length > 0) {
    explanation = `WARNING: ${redFlags.join("; ")}. This message contains serious safety concerns and should not be sent.`;

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

    const categorySuggestions: Record<string, string[]> = {
      aggressive: [
        "Try softening demands: 'Could you please...' instead of 'You must...'",
        "Replace ultimatums with requests: 'It would help if...' instead of 'Do this or else...'",
      ],
      rude: [
        "Avoid insults or demeaning language. Focus on the behavior, not the person.",
        "Replace 'That's stupid' with 'I disagree because...'",
      ],
      dismissive: [
        "Acknowledge the other person's perspective before sharing yours.",
        "Replace 'Whatever' with 'I see it differently because...'",
      ],
      passive_aggressive: [
        "Try being direct about your feelings instead of hinting.",
        "Replace 'Fine, do what you want' with 'I disagree with this approach because...'",
      ],
      blaming: [
        "Use 'I' statements: 'I feel frustrated when...' instead of 'You always...'",
        "Focus on the specific situation, not the person's character.",
      ],
      threatening: [
        "Avoid ultimatums. Express consequences calmly if needed.",
        "Seek mediation or a third party if the situation is escalating.",
      ],
      negative_critical: [
        "Frame criticism constructively: 'This could be improved by...' instead of 'This is bad'",
        "Offer specific suggestions: 'I think X would work better because...'",
        "Balance negative feedback with what's working well",
      ],
      sarcastic: [
        "Sarcasm often obscures your real message. Try being direct.",
        "Replace sarcastic remarks with clear communication of your actual thoughts.",
      ],
      gaslighting: [
        "Avoid denying the other person's reality or experiences.",
        "Instead of 'That never happened,' try 'I remember it differently - can we talk about it?'",
        "Validate their feelings: 'I can see this upset you, and that matters.'",
      ],
      guilt_tripping: [
        "Express needs directly without leveraging past sacrifices.",
        "Replace 'After all I've done for you' with 'I'd appreciate it if...'",
        "Own your choices: 'I chose to help because...' not 'You owe me.'",
      ],
      stonewalling: [
        "If you need a break, say so: 'I need some time to think. Can we continue in an hour?'",
        "Avoid silent treatment - it damages trust. Communicate your need for space.",
        "Set a specific time to resume: 'Let's talk about this at 7 PM.'",
      ],
      deflection: [
        "Address the current issue before bringing up past events.",
        "Replace 'But you did X' with 'I hear you about Y. Can we focus on that first?'",
        "Stay on topic: 'That's a separate conversation. Let's resolve this first.'",
      ],
      condescending: [
        "Avoid explaining things the other person likely already understands.",
        "Replace 'Actually, let me explain' with 'From my perspective...'",
        "Ask before explaining: 'Would it help if I shared my take on this?'",
      ],
      backhanded_compliment: [
        "Give genuine compliments without qualifiers.",
        "Replace 'You're smart for someone who...' with 'That was a smart approach.'",
        "Focus on the achievement, not the surprise.",
      ],
      victim_playing: [
        "Take ownership of your part in the situation.",
        "Replace 'Why does this always happen to me?' with 'This is frustrating. What can I do differently?'",
        "Focus on solutions rather than self-pity.",
      ],
      minimizing: [
        "Validate the other person's feelings even if you disagree.",
        "Replace 'It's not a big deal' with 'I can see this matters to you.'",
        "Avoid comparing struggles: 'I understand this is important to you.'",
      ],
      love_bombing: [
        "Build connection gradually. Intense early praise can feel overwhelming.",
        "Replace 'You're perfect' with 'I really enjoy spending time with you.'",
        "Let relationships develop at a natural pace.",
      ],
      sealioning: [
        "Ask questions in good faith, not to exhaust the other person.",
        "If you genuinely want to understand, say: 'I'm curious about your perspective on...'",
        "Accept answers without demanding endless justification.",
      ],
      concern_trolling: [
        "Express genuine concern without hidden criticism.",
        "Replace 'I'm concerned for your own good' with 'I care about you and wanted to share...'",
        "Respect autonomy: 'Just wanted you to know I'm here if you need anything.'",
      ],
      negging: [
        "Give sincere compliments without subtle put-downs.",
        "Replace 'Bold choice' with 'That's an interesting approach - tell me more.'",
        "Focus on what you genuinely appreciate.",
      ],
      emotional_blackmail: [
        "Never use self-harm threats to control someone's behavior.",
        "Express needs directly: 'I feel scared when...' not 'If you leave, I'll...'",
        "Seek professional help if you're using threats to maintain relationships.",
      ],
      tone_policing: [
        "Focus on the content of the message, not the delivery.",
        "Replace 'Calm down' with 'I hear you're upset. Let's talk about it.'",
        "Address the substance: 'You're right, I could have said that better. My point was...'",
      ],
      projection: [
        "Own your own behaviors before accusing others.",
        "Replace 'You're the one who always...' with 'I notice I've been doing X, and I'm working on it.'",
        "Reflect: 'Am I describing them, or myself?'",
      ],
      moving_goalposts: [
        "Be clear about what you need from the start.",
        "If requirements change, acknowledge it: 'I realize I also need...'",
        "Avoid 'one more thing' patterns - batch your feedback.",
      ],
      mocking_politeness: [
        "Words like 'buddy', 'pal', 'champ' can sound condescending when paired with sarcasm.",
        "Replace 'Wow, great job buddy' with genuine feedback: 'I appreciate your effort on this.'",
        "If you're frustrated, express it directly instead of masking it with fake praise.",
      ],
      feigned_ignorance: [
        "Playing dumb avoids accountability. Acknowledge what you understand.",
        "Replace 'I don't know what you mean' with 'I see your point about X, but I disagree because...'",
        "If something is unclear, ask specific questions instead of blanket denial.",
      ],
      false_alignment: [
        "The 'I agree, but...' pattern negates the agreement. Either agree or disagree clearly.",
        "Replace 'I agree, but' with 'I understand your point about X. My concern is...'",
        "Don't use fake alignment to soften criticism — it feels manipulative.",
      ],
      weaponized_helpfulness: [
        "'Just trying to help' can dismiss valid criticism of your approach.",
        "Replace 'I was just trying to help' with 'My intention was to help. I see it came across differently.'",
        "Accept feedback on your delivery without deflecting to your intentions.",
      ],
      performative_empathy: [
        "Empathy followed by 'but' cancels the validation. Listen fully first.",
        "Replace 'I understand, but...' with 'I understand. And I also think...'",
        "Separate validation from your counterpoint — they can coexist without 'but'.",
      ],
      condescending_praise: [
        "'Good for you' often reads as dismissive, not celebratory.",
        "Replace 'Good for you' with 'That's great — tell me more about it.'",
        "Celebrate others' wins without qualification or comparison.",
      ],
      fake_reasonableness: [
        "Claiming objectivity often masks bias. Own your perspective.",
        "Replace 'Looking at this objectively' with 'From my perspective...'",
        "Acknowledge that you have a viewpoint — it builds more trust than pretending neutrality.",
      ],
      veiled_threat: [
        "'Would be a shame if...' is a threat, not an observation.",
        "Express concerns directly: 'I'm worried about X' instead of veiled warnings.",
        "If you have a consequence in mind, state it clearly or don't imply it.",
      ],
      dismissive_just: [
        "'Just a joke' dismisses the impact of your words. Intent ≠ impact.",
        "Replace 'It was just a joke' with 'I didn't mean to upset you. That wasn't my intention.'",
        "Take responsibility for how your words land, not just what you meant.",
      ],
      triangulation: [
        "Bringing in 'everyone else' isolates the person and avoids direct conversation.",
        "Replace 'Everyone thinks...' with 'I think...' — speak for yourself.",
        "If others have feedback, let them share it directly. Don't be their messenger.",
      ],
      dismissive_abbreviation: [
        "Short replies like 'k', 'idk', 'idc' can feel dismissive or checked out.",
        "Replace 'k' with 'Got it' or 'Okay, thanks' — a few extra words show you care.",
        "If you're unsure, say 'I'm not sure' instead of 'idk' — it invites dialogue.",
      ],
      uncertain_typing: [
        "Frequent 'I guess', 'maybe', 'idk' can make you seem unsure or disengaged.",
        "If you have an opinion, state it: 'I think X because...' instead of 'I guess...'",
        "It's okay to be uncertain — just own it: 'I'm not sure, what do you think?'",
      ],
      emphatic_repetition: [
        "Stretched words like 'sooooo', 'noooo' add emotional intensity — use intentionally.",
        "In serious conversations, standard spelling ('so', 'no') reads as more grounded.",
        "Save 'yesssss!' for genuine excitement with friends, not tense discussions.",
      ],
      shouting_caps: [
        "ALL CAPS reads as shouting. It escalates tension immediately.",
        "Replace 'THIS IS WRONG' with 'I strongly disagree with this.'",
        "If you're angry, name it: 'I'm frustrated because...' instead of caps.",
      ],
      excessive_punctuation: [
        "Multiple '???' or '!!!' reads as aggressive or impatient.",
        "One question mark or exclamation point is sufficient.",
        "Replace 'Why????' with 'Could you clarify why?'",
      ],
      keyboard_smash: [
        "Random keystrokes ('asdfghjkl') signal overwhelm or frustration.",
        "If you're too upset to type coherently, pause: 'I need a minute.'",
        "Step away and return when you can express yourself clearly.",
      ],
      lazy_typing: [
        "All-lowercase, no punctuation can read as low effort or disrespectful.",
        "In important conversations, basic capitalization and punctuation show care.",
        "Quick fix: 'u' -> 'you', 'r' -> 'are', 'k' -> 'okay'.",
      ],
      over_apologetic: [
        "Multiple apologies ('sorry sorry so sorry') can burden the other person.",
        "One sincere apology is enough: 'I'm sorry for X. I'll do better.'",
        "If you apologize often, ask yourself: am I actually at fault, or just anxious?",
      ],
      hedging: [
        "Constant 'just wondering', 'might be wrong' undermines your credibility.",
        "Own your questions: 'I'd like to understand X' instead of 'Just wondering...'",
        "You don't need to pre-apologize for having a perspective.",
      ],
      demanding_brevity: [
        "'TL;DR', 'get to the point' dismisses the other person's effort to communicate.",
        "If something is long, say: 'Can we focus on the main point?'",
        "Respect that complex topics need space — or schedule time to discuss properly.",
      ],
      performative_thinking: [
        "Long 'hmmmmmm' or 'interesting....' can read as performative or condescending.",
        "If you need time to think, say: 'Let me think about that for a moment.'",
        "Genuine consideration doesn't need theatrical signaling.",
      ],
      constructive_critique: [
        "You're giving constructive feedback — balance praise with specific suggestions.",
        "Replace 'could be more wow' with 'The intro grabs me; the middle could use a stronger hook.'",
        "Name what works, then what needs work: 'X is strong because... Y would improve if...'",
      ],
      inappropriate_familiarity: [
        "Pet names like 'sweetie', 'honey', 'babe' are inappropriate with colleagues.",
        "Replace 'my sweet coworker' with 'my colleague' or their name — keep it professional.",
        "In workplace settings, use names or professional titles, not terms of endearment.",
      ],
      flirtatious_language: [
        "Tildes (~), winks, and stacked compliments can read as flirtatious in professional contexts.",
        "Replace 'How's my awesome, sweet coworker~?' with 'How are you doing today?'",
        "Save playful language for personal relationships — at work, be warm but professional.",
      ],
      praise_stacking: [
        "Multiple excessive compliments ('awesome sweet lovely') can feel insincere or manipulative.",
        "One genuine compliment lands better: 'Great work on the presentation' vs 'You're amazing incredible brilliant.'",
        "Be specific: 'Your analysis was thorough' means more than stacked superlatives.",
      ],
    };

    for (const cat of categories) {
      if (categorySuggestions[cat.category]) {
        suggestions.push(...categorySuggestions[cat.category].slice(0, 2));
      }
    }

    suggestions.push("Read your message aloud before sending - does it sound how you intend?");
    suggestions.push("Consider the recipient's perspective: how would you feel receiving this?");
  }

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

export function checkRedFlags(text: string): string[] {
  const flags: string[] = [];
  const lowerText = text.toLowerCase();

  if (/(kill|hurt|harm|attack)\s+(you|yourself)/i.test(text)) flags.push("Explicit threat detected");
  if (/(go die|kill yourself|kys)/i.test(text)) flags.push("Self-harm encouragement detected");

  if (/\b(nigger|faggot|retard|tranny|kike|spic|chink)\b/i.test(text)) flags.push("Hate speech detected");

  if (/\b\d{3}-\d{2}-\d{4}\b/.test(text)) flags.push("Possible SSN detected");
  if (/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/.test(text)) flags.push("Possible credit card detected");

  return flags;
}

export function calculateHeuristicScore(text: string): number {
  const result = analyzeWithHeuristics(text);
  return result.severity.level / 5;
}