// src/lib/ml/rules/patterns.ts
// Rule-based patterns for tone analysis

export interface PatternRule {
  category: string;
  label: string;
  patterns: RegExp[];
  weight: number; // 0-1, how strongly this pattern indicates the category
}

/**
 * Negative tone patterns - indicate potential issues
 */
export const NEGATIVE_PATTERNS: PatternRule[] = [
  // Negative / critical language (constructive criticism but negative tone)
  {
    category: "negative_critical",
    label: "Negative/Critical",
    patterns: [
      /\b(this is (not|bad|terrible|awful|horrible|wrong))\b/gi,
      /\b(not good|not okay|not right|doesn't work|won't work)\b/gi,
      /\b(failed|failure|broken|useless|pointless)\b/gi,
      /\b(disappointed|unhappy|dissatisfied|frustrated)\b/gi,
      /\b(problem|issue|concern|trouble)\b/gi,
    ],
    weight: 0.5,
  },

  // Aggressive / demanding language
  {
    category: "aggressive",
    label: "Aggressive",
    patterns: [
      /\byou\s+(must|need to|have to|should|will)\b/gi,
      /\b(do this|do that|do it)\b/gi,
      /\b(never|always)\s+\w+/gi,
      /\b(if you don't|unless you)\b/gi,
      /\b(demand|require|insist|command)\b/gi,
    ],
    weight: 0.8,
  },

  // Rude / insulting language
  {
    category: "rude",
    label: "Rude",
    patterns: [
      /\b(stupid|idiot|moron|dumb|ignorant)\b/gi,
      /\b(useless|worthless|pathetic|incompetent)\b/gi,
      /\b(shut up|go away|leave me alone)\b/gi,
      /\b(nobody cares|who cares)\b/gi,
      /\b(whatever|i don't care)\b/gi,
    ],
    weight: 0.9,
  },

  // Dismissive / minimizing language
  {
    category: "dismissive",
    label: "Dismissive",
    patterns: [
      /\b(whatever|fine|ok|k)\b/gi,
      /\b(it's not a big deal|no big deal)\b/gi,
      /\b(you're overreacting|too sensitive)\b/gi,
      /\b(calm down|relax|chill)\b/gi,
      /\b(not my problem|not my fault)\b/gi,
    ],
    weight: 0.7,
  },

  // Passive-aggressive language
  {
    category: "passive_aggressive",
    label: "Passive-Aggressive",
    patterns: [
      /\b(fine\.\s*do what you want)\b/gi,
      /\b(i guess|i suppose)\b/gi,
      /\b(sure.*if that's what you want)\b/gi,
      /\b(whatever makes you happy)\b/gi,
      /\b(i'm not mad|i'm fine)\b/gi,
    ],
    weight: 0.7,
  },

  // Blaming / accusatory language
  {
    category: "blaming",
    label: "Blaming",
    patterns: [
      /\byou\s+(always|never)\b/gi,
      /\b(this is your fault|you caused this)\b/gi,
      /\b(if you hadn't|because of you)\b/gi,
      /\byou (made me|forced me)\b/gi,
    ],
    weight: 0.8,
  },

  // Threatening / ultimatum language
  {
    category: "threatening",
    label: "Threatening",
    patterns: [
      /\b(or else|or i will)\b/gi,
      /\b(last chance|final warning)\b/gi,
      /\b(i'll (quit|leave|stop|sue))\b/gi,
      /\b(don't make me)\b/gi,
    ],
    weight: 0.9,
  },

  // Sarcastic language (simple heuristics)
  {
    category: "sarcastic",
    label: "Sarcastic",
    patterns: [
      /\b(oh (great|wonderful|fantastic|perfect))\b/gi,
      /\b(yeah right|sure thing|totally)\b/gi,
      /\b(as if|like that'll happen)\b/gi,
    ],
    weight: 0.6,
  },
];

/**
 * Positive tone patterns - indicate constructive communication
 */
export const POSITIVE_PATTERNS: PatternRule[] = [
  // Polite / request language
  {
    category: "polite",
    label: "Polite",
    patterns: [
      /\b(please|thank you|thanks|appreciate)\b/gi,
      /\b(could you|would you|can you)\b/gi,
      /\b(kindly|if possible|when you have a moment)\b/gi,
    ],
    weight: 0.7,
  },

  // Collaborative / inclusive language
  {
    category: "collaborative",
    label: "Collaborative",
    patterns: [
      /\b(we can|let's|together|our)\b/gi,
      /\b(what do you think|your thoughts)\b/gi,
      /\b(i'd love to|i'd like to)\b/gi,
      /\b(how can (i|we) help)\b/gi,
    ],
    weight: 0.7,
  },

  // Empathetic / understanding language
  {
    category: "empathetic",
    label: "Empathetic",
    patterns: [
      /\b(understand|i see|i hear you)\b/gi,
      /\b(that makes sense|valid point)\b/gi,
      /\b(i appreciate|thank you for)\b/gi,
      /\b(sorry to hear|that sounds)\b/gi,
    ],
    weight: 0.8,
  },

  // Constructive / solution-oriented language
  {
    category: "constructive",
    label: "Constructive",
    patterns: [
      /\b(suggest|recommend|propose)\b/gi,
      /\b(let's try|what if we|how about)\b/gi,
      /\b(improve|better|fix|solve)\b/gi,
      /\b(moving forward|next steps)\b/gi,
    ],
    weight: 0.7,
  },

  // Acknowledging / validating language
  {
    category: "validating",
    label: "Validating",
    patterns: [
      /\b(you're right|good point|fair enough)\b/gi,
      /\b(i agree|that's true|makes sense)\b/gi,
      /\b(glad you|happy to)\b/gi,
    ],
    weight: 0.7,
  },
];

/**
 * Urgency / pressure patterns
 */
export const PRESSURE_PATTERNS: PatternRule[] = [
  {
    category: "urgent",
    label: "Urgent Pressure",
    patterns: [
      /\b(asap|immediately|right now|urgent)\b/gi,
      /\b(deadline|due (today|tomorrow))\b/gi,
      /\b(no time|running out of time)\b/gi,
    ],
    weight: 0.6,
  },
];

/**
 * All patterns combined for easy iteration
 */
export const ALL_PATTERNS = [
  ...NEGATIVE_PATTERNS,
  ...POSITIVE_PATTERNS,
  ...PRESSURE_PATTERNS,
];

/**
 * Get patterns by category
 */
export function getPatternsByCategory(category: string): PatternRule[] {
  return ALL_PATTERNS.filter((p) => p.category === category);
}

/**
 * Get all negative categories
 */
export const NEGATIVE_CATEGORIES = NEGATIVE_PATTERNS.map((p) => p.category);

/**
 * Get all positive categories
 */
export const POSITIVE_CATEGORIES = POSITIVE_PATTERNS.map((p) => p.category);