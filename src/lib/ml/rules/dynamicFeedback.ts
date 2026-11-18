// src/lib/ml/rules/dynamicFeedback.ts
// Dynamic, context-aware feedback generation

import { CategoryScore } from "../pipeline";

export interface MessageContext {
  // Key phrases extracted from the message
  praiseWords: string[];
  critiqueWords: string[];
  intensifiers: string[];
  hedges: string[];
  addresses: string[]; // "buddy", "pal", etc.
  questions: string[];
  imperatives: string[];
  selfReferences: string[];
  otherReferences: string[];

  // Structural features
  hasBut: boolean;
  hasBecause: boolean;
  sentenceCount: number;
  avgSentenceLength: number;

  // Emotional markers
  exclamationCount: number;
  questionCount: number;
  capsWords: string[];
  repeatedChars: string[];
}

/**
 * Extract linguistic context from the message for tailored feedback
 */
export function extractMessageContext(text: string): MessageContext {
  const lowerText = text.toLowerCase();
  const words = text.split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Praise words
  const praiseWords = text.match(/\b(good|great|awesome|amazing|fantastic|wonderful|excellent|brilliant|perfect|love|like|enjoy|impressive|solid|strong|nice)\b/gi) || [];

  // Critique/improvement words
  const critiqueWords = text.match(/\b(could|should|would|need|must|better|more|improve|fix|change|work on|polish|refine|strengthen|enhance)\b/gi) || [];

  // Intensifiers
  const intensifiers = text.match(/\b(very|really|so|extremely|incredibly|absolutely|totally|completely|utterly)\b/gi) || [];

  // Hedges
  const hedges = text.match(/\b(i (think|guess|suppose|assume|believe|feel)|maybe|perhaps|possibly|probably|kind of|sort of|a bit|slightly)\b/gi) || [];

  // Addresses (condescending terms)
  const addresses = text.match(/\b(buddy|pal|friend|champ|chief|sport|honey|sweetie|dear|sweetheart)\b/gi) || [];

  // Questions
  const questions = text.match(/[^.!?]*\?/g) || [];

  // Imperatives (commands)
  const imperatives = text.match(/\b(do this|do that|you must|you need to|you have to|you should|please|kindly)\b/gi) || [];

  // Self references
  const selfReferences = text.match(/\b(i (think|feel|believe|want|need|like|dislike|hate|love|am|was|will|would|could|should))\b/gi) || [];

  // Other references (you statements)
  const otherReferences = text.match(/\b(you (are|were|will|would|could|should|need|must|have|has|did|do|don't|didn't|won't|can't))\b/gi) || [];

  // Exclamation and question counts
  const exclamationCount = (text.match(/!/g) || []).length;
  const questionCount = (text.match(/\?/g) || []).length;

  // Caps words (4+ letters)
  const capsWords = text.match(/\b[A-Z]{4,}\b/g) || [];

  // Repeated characters
  const repeatedChars = text.match(/\b\w*([a-z])\1{2,}\w*\b/gi) || [];

  return {
    praiseWords: [...new Set(praiseWords.map(w => w.toLowerCase()))],
    critiqueWords: [...new Set(critiqueWords.map(w => w.toLowerCase()))],
    intensifiers: [...new Set(intensifiers.map(w => w.toLowerCase()))],
    hedges: [...new Set(hedges.map(w => w.toLowerCase()))],
    addresses: [...new Set(addresses.map(w => w.toLowerCase()))],
    questions,
    imperatives: [...new Set(imperatives.map(w => w.toLowerCase()))],
    selfReferences: [...new Set(selfReferences.map(w => w.toLowerCase()))],
    otherReferences: [...new Set(otherReferences.map(w => w.toLowerCase()))],
    hasBut: /\bbut\b/i.test(text),
    hasBecause: /\bbecause\b/i.test(text),
    sentenceCount: sentences.length,
    avgSentenceLength: sentences.length > 0 ? words.length / sentences.length : words.length,
    exclamationCount,
    questionCount,
    capsWords,
    repeatedChars,
  };
}

/**
 * Generate dynamic, contextual explanation
 */
export function generateDynamicExplanation(
  text: string,
  categories: CategoryScore[],
  context: MessageContext,
  severity: { level: number; label: string },
  verdict: "OK" | "CAUTION" | "NOT_OK"
): string {
  const topCats = categories.filter(c => c.score >= 0.15).slice(0, 3);

  if (verdict === "OK" && topCats.length === 0) {
    return "Your message comes across as constructive and respectful. No significant tone issues detected.";
  }

  // Build explanation referencing actual content
  const parts: string[] = [];

  // 1. Describe the overall tone with evidence
  const primaryLabel = topCats[0]?.label?.toLowerCase() || "mixed tone";

  if (context.praiseWords.length > 0 && context.critiqueWords.length > 0) {
    parts.push(`You open with praise (${context.praiseWords.slice(0, 2).join(", ")}) then pivot to improvement (${context.critiqueWords.slice(0, 2).join(", ")}).`);
  } else if (context.praiseWords.length > 0) {
    parts.push(`Your message emphasizes positive aspects: ${context.praiseWords.slice(0, 3).join(", ")}.`);
  } else if (context.critiqueWords.length > 0) {
    parts.push(`Your message focuses on what could improve: ${context.critiqueWords.slice(0, 3).join(", ")}.`);
  }

  // 2. Note specific patterns with evidence
  const patternEvidences: string[] = [];

  if (context.addresses.length > 0) {
    patternEvidences.push(`addressing the recipient as "${context.addresses[0]}"`);
  }
  if (context.hedges.length > 0) {
    patternEvidences.push(`hedging with "${context.hedges[0]}"`);
  }
  if (context.intensifiers.length > 0) {
    patternEvidences.push(`intensifying with "${context.intensifiers[0]}"`);
  }
  if (context.hasBut) {
    patternEvidences.push("using 'but' to pivot");
  }
  if (context.capsWords.length > 0) {
    patternEvidences.push(`SHOUTING with "${context.capsWords[0]}"`);
  }
  if (context.repeatedChars.length > 0) {
    patternEvidences.push(`stretching words like "${context.repeatedChars[0]}"`);
  }
  if (context.exclamationCount > 1) {
    patternEvidences.push(`${context.exclamationCount} exclamation points`);
  }
  if (context.otherReferences.length > 3) {
    patternEvidences.push("frequent 'you' statements");
  }

  if (patternEvidences.length > 0) {
    parts.push(`This comes across as ${primaryLabel} due to ${patternEvidences.slice(0, 2).join(" and ")}.`);
  } else {
    parts.push(`This comes across as ${primaryLabel}.`);
  }

  // 3. Add severity context
  parts.push(`Severity: ${severity.label}. This may be perceived as ${verdict === "NOT_OK" ? "inappropriate or hurtful" : "potentially off-putting"}.`);

  return parts.join(" ");
}

/**
 * Generate dynamic, tailored suggestions
 */
export function generateDynamicSuggestions(
  text: string,
  categories: CategoryScore[],
  context: MessageContext,
  verdict: "OK" | "CAUTION" | "NOT_OK"
): string[] {
  const suggestions: string[] = [];
  const topCats = categories.filter(c => c.score >= 0.15).slice(0, 3);

  // 1. Context-aware suggestions based on actual message content
  if (context.praiseWords.length > 0 && context.critiqueWords.length > 0 && context.hasBut) {
    suggestions.push(
      `Your "praise-but-critique" structure is good. Make the critique specific: instead of "more ${context.critiqueWords[0]}", try "The ${context.praiseWords[0]} part works because X; the middle would land harder if Y."`
    );
  }

  if (context.addresses.length > 0) {
    suggestions.push(
      `Calling someone "${context.addresses[0]}" can sound condescending. Use their name or just make your point directly.`
    );
  }

  if (context.hedges.length > 0) {
    suggestions.push(
      `You hedge with "${context.hedges[0]}". Own your perspective: "I think..." instead of "I guess..."`
    );
  }

  if (context.capsWords.length > 0) {
    suggestions.push(
      `"${context.capsWords[0]}" reads as shouting. Replace with "I feel strongly that..." or "I'm frustrated because..."`
    );
  }

  if (context.repeatedChars.length > 0) {
    suggestions.push(
      `Stretched words like "${context.repeatedChars[0]}" add drama. In feedback, standard spelling ("${context.repeatedChars[0].replace(/(.)\1+/g, '$1')}") reads as more grounded.`
    );
  }

  if (context.exclamationCount > 1) {
    suggestions.push(
      `${context.exclamationCount} exclamation points feels intense. One is enough for emphasis.`
    );
  }

  if (context.otherReferences.length > 3 && context.selfReferences.length < 2) {
    suggestions.push(
      "You use 'you' frequently but 'I' rarely. Shift to 'I' statements: 'I noticed...' instead of 'You always...'"
    );
  }

  if (context.sentenceCount === 1 && context.avgSentenceLength > 25) {
    suggestions.push(
      "Long single sentences can feel overwhelming. Break into 2-3 shorter sentences for clarity."
    );
  }

  // 2. Category-specific suggestions (still use static ones as fallback)
  const categorySuggestions: Record<string, string[]> = {
    aggressive: [
      "Soften demands: 'Could you...' instead of 'You must...'",
      "Replace ultimatums: 'It would help if...' instead of 'Do this or else...'",
    ],
    rude: [
      "Focus on behavior, not the person: 'That approach didn't work' instead of 'That's stupid'",
    ],
    dismissive: [
      "Acknowledge their view first: 'I see your point about X. My concern is...'",
    ],
    passive_aggressive: [
      "Be direct: 'I disagree because...' instead of 'Fine, do what you want'",
    ],
    blaming: [
      "Use 'I' statements: 'I feel frustrated when...' instead of 'You always...'",
    ],
    threatening: [
      "Avoid ultimatums. Express consequences calmly if needed.",
    ],
    sarcastic: [
      "Sarcasm obscures your message. Say what you mean directly.",
    ],
    negative_critical: [
      "Frame constructively: 'This could improve by...' instead of 'This is bad'",
    ],
    gaslighting: [
      "Don't deny their reality. Try: 'I remember it differently — can we talk?'",
    ],
    guilt_tripping: [
      "Own your choices: 'I chose to help because...' not 'After all I did...'",
    ],
    stonewalling: [
      "If you need a break, say so: 'I need time. Can we continue at 7?'",
    ],
    deflection: [
      "Address the current issue first. 'That's separate — let's resolve this.'",
    ],
    condescending: [
      "Ask before explaining: 'Would my perspective on X help?'",
    ],
    backhanded_compliment: [
      "Give genuine praise without qualifiers: 'That was a smart approach.'",
    ],
    victim_playing: [
      "Focus on solutions: 'This is frustrating. What can I do differently?'",
    ],
    minimizing: [
      "Validate even if you disagree: 'I see this matters to you.'",
    ],
    love_bombing: [
      "Let connections build naturally. 'I enjoy our time together' > 'You're perfect.'",
    ],
    sealioning: [
      "Ask in good faith. Accept answers without demanding endless proof.",
    ],
    concern_trolling: [
      "Express care without criticism: 'Just wanted you to know I'm here.'",
    ],
    negging: [
      "Compliment sincerely: 'Interesting approach — tell me more.'",
    ],
    emotional_blackmail: [
      "Never threaten self-harm to control. Seek help if you're doing this.",
    ],
    tone_policing: [
      "Focus on content, not delivery: 'You're right, I could have said that better.'",
    ],
    projection: [
      "Own your patterns: 'I notice I've been doing X, working on it.'",
    ],
    moving_goalposts: [
      "Be clear upfront. If needs change, say: 'I realize I also need...'",
    ],
    mocking_politeness: [
      `Words like "${context.addresses[0] || 'buddy/pal'}" with sarcasm read as condescending.`,
    ],
    feigned_ignorance: [
      "Acknowledge what you understand. Ask specific questions for the rest.",
    ],
    false_alignment: [
      "'I agree, but...' negates the agreement. Either agree or disagree clearly.",
    ],
    weaponized_helpfulness: [
      "Accept feedback on delivery: 'I meant to help. I see it landed differently.'",
    ],
    performative_empathy: [
      "Separate validation from counterpoint: 'I understand. And I also think...'",
    ],
    condescending_praise: [
      "Celebrate without comparison: 'That's great — tell me more.'",
    ],
    fake_reasonableness: [
      "Own your perspective: 'From my view...' instead of 'Objectively...'",
    ],
    veiled_threat: [
      "State concerns directly: 'I'm worried about X' not 'Would be a shame if...'",
    ],
    dismissive_just: [
      "'Just a joke' dismisses impact. 'I didn't mean to upset you' owns it.",
    ],
    triangulation: [
      "Speak for yourself: 'I think...' not 'Everyone thinks...'",
    ],
    dismissive_abbreviation: [
      `"${context.praiseWords.includes('k') || context.praiseWords.includes('ok') ? 'k/ok' : 'idk/idc'} reads as checked out. 'Got it, thanks' shows engagement.`,
    ],
    uncertain_typing: [
      "Own uncertainty: 'I'm not sure — what do you think?' instead of 'I guess...'",
    ],
    emphatic_repetition: [
      `Stretched "${context.repeatedChars[0]}" adds intensity. Standard spelling reads as grounded.`,
    ],
    shouting_caps: [
      `"${context.capsWords[0]}" reads as shouting. "I strongly disagree" is clearer.`,
    ],
    excessive_punctuation: [
      `${context.exclamationCount} exclamation points feels aggressive. One is enough.`,
    ],
    keyboard_smash: [
      "Overwhelmed? Pause: 'I need a minute' instead of random keystrokes.",
    ],
    lazy_typing: [
      "Basic capitalization/punctuation shows care in important conversations.",
    ],
    over_apologetic: [
      "One sincere apology > multiple. 'I'm sorry for X. I'll do better.'",
    ],
    hedging: [
      `"${context.hedges[0]}" undermines you. "I'd like to understand X" is stronger.`,
    ],
    demanding_brevity: [
      "Complex topics need space. 'Can we focus on the main point?' respects effort.",
    ],
    performative_thinking: [
      "Genuine consideration doesn't need 'hmmmmm'. 'Let me think on that.'",
    ],
    constructive_critique: [
      "Name what works, then what needs work: 'X is strong because... Y would improve if...'",
    ],
  };

  // Add category suggestions for detected patterns
  for (const cat of topCats) {
    if (categorySuggestions[cat.category]) {
      suggestions.push(...categorySuggestions[cat.category].slice(0, 1));
    }
  }

  // 3. General advice
  suggestions.push("Read it aloud — does it sound how you intend?");
  suggestions.push("Consider: how would you feel receiving this?");

  // Deduplicate and limit
  return [...new Set(suggestions)].slice(0, 5);
}