// Audience configuration for tone analysis
// Defines how different audiences affect pattern detection, severity, and feedback

export interface AudienceTraits {
  // Communication style preferences
  formality: "very_casual" | "casual" | "neutral" | "formal" | "very_formal";
  directness: "very_indirect" | "indirect" | "balanced" | "direct" | "very_direct";
  humorTolerance: "none" | "low" | "moderate" | "high" | "edgy";
  vulnerabilityTolerance: "low" | "moderate" | "high";

  // Sensitivity to specific patterns
  sensitivity: {
    sarcasm: number;           // 0-1: how negatively sarcasm is viewed
    criticism: number;         // 0-1: how negatively direct criticism is viewed
    abbreviations: number;     // 0-1: how negatively casual abbreviations viewed
    caps: number;              // 0-1: how negatively shouting viewed
    profanity: number;         // 0-1: how negatively profanity viewed
    emotionalExpression: number; // 0-1: how negatively strong emotions viewed
    hedging: number;           // 0-1: how negatively uncertainty viewed
    commands: number;          // 0-1: how negatively imperatives viewed
  };

  // Positive pattern bonuses
  appreciationFor: {
    politeness: number;
    clarity: number;
    warmth: number;
    thoroughness: number;
    brevity: number;
    empathy: number;
  };

  // Relationship context
  powerDynamic: "equal" | "you_senior" | "they_senior" | "varies";
  emotionalCloseness: "stranger" | "acquaintance" | "colleague" | "friend" | "close_friend" | "family" | "partner" | "varies";
}

export interface AudienceProfile {
  id: string;
  name: string;
  type: "preset" | "custom";
  description: string;
  traits: AudienceTraits;
  // For custom audiences
  userId?: string;
  createdAt?: Date;
}

// Predefined audiences for FREE tier
export const PRESET_AUDIENCES: AudienceProfile[] = [
  {
    id: "friend",
    name: "Close Friend",
    type: "preset",
    description: "Someone you're close with - casual, direct, humor welcome",
    traits: {
      formality: "very_casual",
      directness: "direct",
      humorTolerance: "high",
      vulnerabilityTolerance: "high",
      sensitivity: {
        sarcasm: 0.2,
        criticism: 0.3,
        abbreviations: 0.1,
        caps: 0.2,
        profanity: 0.1,
        emotionalExpression: 0.1,
        hedging: 0.2,
        commands: 0.2,
      },
      appreciationFor: {
        politeness: 0.2,
        clarity: 0.6,
        warmth: 0.9,
        thoroughness: 0.4,
        brevity: 0.7,
        empathy: 0.8,
      },
      powerDynamic: "equal",
      emotionalCloseness: "close_friend",
    },
  },
  {
    id: "spouse",
    name: "Spouse/Partner",
    type: "preset",
    description: "Intimate partner - high emotional safety, direct communication",
    traits: {
      formality: "very_casual",
      directness: "very_direct",
      humorTolerance: "high",
      vulnerabilityTolerance: "high",
      sensitivity: {
        sarcasm: 0.3,  // Can still sting in close relationships
        criticism: 0.4,
        abbreviations: 0.1,
        caps: 0.3,
        profanity: 0.2,
        emotionalExpression: 0.1,
        hedging: 0.3,
        commands: 0.4,
      },
      appreciationFor: {
        politeness: 0.3,
        clarity: 0.8,
        warmth: 1.0,
        thoroughness: 0.5,
        brevity: 0.5,
        empathy: 1.0,
      },
      powerDynamic: "equal",
      emotionalCloseness: "partner",
    },
  },
  {
    id: "family",
    name: "Family Member",
    type: "preset",
    description: "Family - varies by relationship, generally more formal than friends",
    traits: {
      formality: "casual",
      directness: "balanced",
      humorTolerance: "moderate",
      vulnerabilityTolerance: "moderate",
      sensitivity: {
        sarcasm: 0.4,
        criticism: 0.5,
        abbreviations: 0.3,
        caps: 0.4,
        profanity: 0.5,
        emotionalExpression: 0.3,
        hedging: 0.3,
        commands: 0.5,
      },
      appreciationFor: {
        politeness: 0.6,
        clarity: 0.7,
        warmth: 0.8,
        thoroughness: 0.5,
        brevity: 0.4,
        empathy: 0.7,
      },
      powerDynamic: "varies",
      emotionalCloseness: "family",
    },
  },
  {
    id: "coworker",
    name: "Co-worker",
    type: "preset",
    description: "Professional peer - balanced, clear, appropriately warm",
    traits: {
      formality: "neutral",
      directness: "balanced",
      humorTolerance: "low",
      vulnerabilityTolerance: "low",
      sensitivity: {
        sarcasm: 0.7,
        criticism: 0.5,
        abbreviations: 0.5,
        caps: 0.6,
        profanity: 0.8,
        emotionalExpression: 0.5,
        hedging: 0.4,
        commands: 0.5,
      },
      appreciationFor: {
        politeness: 0.8,
        clarity: 0.9,
        warmth: 0.5,
        thoroughness: 0.7,
        brevity: 0.6,
        empathy: 0.6,
      },
      powerDynamic: "equal",
      emotionalCloseness: "colleague",
    },
  },
  {
    id: "boss",
    name: "Boss/Manager",
    type: "preset",
    description: "Supervisor - formal, clear, solution-oriented, respectful",
    traits: {
      formality: "formal",
      directness: "direct",
      humorTolerance: "low",
      vulnerabilityTolerance: "low",
      sensitivity: {
        sarcasm: 0.9,
        criticism: 0.6,
        abbreviations: 0.7,
        caps: 0.8,
        profanity: 0.9,
        emotionalExpression: 0.6,
        hedging: 0.5,
        commands: 0.3, // They give commands, you don't
      },
      appreciationFor: {
        politeness: 1.0,
        clarity: 1.0,
        warmth: 0.3,
        thoroughness: 0.9,
        brevity: 0.8,
        empathy: 0.4,
      },
      powerDynamic: "they_senior",
      emotionalCloseness: "acquaintance",
    },
  },
  {
    id: "client",
    name: "Client/Customer",
    type: "preset",
    description: "External stakeholder - professional, accommodating, clear",
    traits: {
      formality: "formal",
      directness: "indirect",
      humorTolerance: "none",
      vulnerabilityTolerance: "low",
      sensitivity: {
        sarcasm: 0.95,
        criticism: 0.7,
        abbreviations: 0.8,
        caps: 0.8,
        profanity: 0.95,
        emotionalExpression: 0.6,
        hedging: 0.5,
        commands: 0.7,
      },
      appreciationFor: {
        politeness: 1.0,
        clarity: 0.9,
        warmth: 0.6,
        thoroughness: 0.8,
        brevity: 0.5,
        empathy: 0.7,
      },
      powerDynamic: "they_senior",
      emotionalCloseness: "stranger",
    },
  },
  {
    id: "stranger",
    name: "Stranger",
    type: "preset",
    description: "Unknown person - polite, clear, no assumptions",
    traits: {
      formality: "neutral",
      directness: "balanced",
      humorTolerance: "low",
      vulnerabilityTolerance: "low",
      sensitivity: {
        sarcasm: 0.8,
        criticism: 0.6,
        abbreviations: 0.6,
        caps: 0.7,
        profanity: 0.8,
        emotionalExpression: 0.5,
        hedging: 0.4,
        commands: 0.6,
      },
      appreciationFor: {
        politeness: 0.9,
        clarity: 0.8,
        warmth: 0.4,
        thoroughness: 0.6,
        brevity: 0.6,
        empathy: 0.5,
      },
      powerDynamic: "equal",
      emotionalCloseness: "stranger",
    },
  },
  {
    id: "acquaintance",
    name: "Acquaintance",
    type: "preset",
    description: "Someone you know slightly - polite but can be more relaxed",
    traits: {
      formality: "casual",
      directness: "balanced",
      humorTolerance: "moderate",
      vulnerabilityTolerance: "low",
      sensitivity: {
        sarcasm: 0.6,
        criticism: 0.5,
        abbreviations: 0.4,
        caps: 0.5,
        profanity: 0.6,
        emotionalExpression: 0.4,
        hedging: 0.3,
        commands: 0.5,
      },
      appreciationFor: {
        politeness: 0.7,
        clarity: 0.7,
        warmth: 0.5,
        thoroughness: 0.5,
        brevity: 0.6,
        empathy: 0.5,
      },
      powerDynamic: "equal",
      emotionalCloseness: "acquaintance",
    },
  },
  {
    id: "groupchat",
    name: "Group Chat",
    type: "preset",
    description: "Multiple people - context varies, generally casual but considerate",
    traits: {
      formality: "casual",
      directness: "balanced",
      humorTolerance: "moderate",
      vulnerabilityTolerance: "moderate",
      sensitivity: {
        sarcasm: 0.4,
        criticism: 0.4,
        abbreviations: 0.2,
        caps: 0.4,
        profanity: 0.4,
        emotionalExpression: 0.3,
        hedging: 0.3,
        commands: 0.4,
      },
      appreciationFor: {
        politeness: 0.5,
        clarity: 0.8,
        warmth: 0.5,
        thoroughness: 0.4,
        brevity: 0.7,
        empathy: 0.6,
      },
      powerDynamic: "equal",
      emotionalCloseness: "varies",
    },
  },
];

// Helper functions
export function getPresetAudience(id: string): AudienceProfile | undefined {
  return PRESET_AUDIENCES.find(a => a.id === id);
}

export function getAllPresetAudiences(): AudienceProfile[] {
  return PRESET_AUDIENCES;
}

// Default audience (used when none specified)
export const DEFAULT_AUDIENCE = PRESET_AUDIENCES.find(a => a.id === "friend")!;

// Audience traits modifiers for heuristic scoring
export interface AudienceModifiers {
  // Multipliers for pattern category scores
  categoryMultipliers: Record<string, number>;
  // Adjustments to severity calculation
  severityAdjustment: number;
  // Threshold adjustments for verdict
  verdictThresholdAdjustment: number;
}

export function calculateAudienceModifiers(traits: AudienceTraits): AudienceModifiers {
  const categoryMultipliers: Record<string, number> = {};

  // Map sensitivity to category multipliers
  // Higher sensitivity = higher multiplier = more severe detection
  const sensitivityMap: Record<keyof AudienceTraits["sensitivity"], string[]> = {
    sarcasm: [
      "sarcastic", "mocking_politeness", "feigned_ignorance", "false_alignment",
      "condescending_praise", "fake_reasonableness", "veiled_threat", "dismissive_just",
      "gaslighting", "negging", "concern_trolling", "sealioning"
    ],
    criticism: [
      "negative_critical", "blaming", "constructive_critique",
      "condescending", "backhanded_compliment", "minimizing", "tone_policing",
      "projection", "moving_goalposts"
    ],
    abbreviations: [
      "dismissive_abbreviation", "lazy_typing",
      "inappropriate_familiarity", "flirtatious_language" // pet names as informal address
    ],
    caps: [
      "shouting_caps", "excessive_punctuation",
      "emphatic_repetition", "keyboard_smash"
    ],
    profanity: [
      "rude", "aggressive", "threatening",
      "emotional_blackmail", "inappropriate_familiarity", "flirtatious_language" // inappropriate intimacy
    ],
    emotionalExpression: [
      "emphatic_repetition", "keyboard_smash", "over_apologetic",
      "love_bombing", "victim_playing", "performative_empathy",
      "flirtatious_language", "praise_stacking" // excessive praise/flirtation
    ],
    hedging: [
      "hedging", "uncertain_typing", "performative_thinking",
      "passive_aggressive", "deflection", "stonewalling",
      "weaponized_helpfulness", "fake_reasonableness"
    ],
    commands: [
      "aggressive", "demanding_brevity",
      "blaming", "threatening", "tone_policing"
    ],
  };

  for (const [sensitivityKey, categories] of Object.entries(sensitivityMap)) {
    const sensitivity = traits.sensitivity[sensitivityKey as keyof AudienceTraits["sensitivity"]];
    // Sensitivity 0-1 maps to multiplier 0.5-2.0
    const multiplier = 0.5 + sensitivity * 1.5;
    for (const cat of categories) {
      categoryMultipliers[cat] = multiplier;
    }
  }

  // Apply formality and power dynamic modifiers to ALL negative categories
  // Formal/professional audiences are more sensitive to negative tones overall
  const formalityScore = {
    very_casual: 0,
    casual: 0.25,
    neutral: 0.5,
    formal: 0.75,
    very_formal: 1.0,
  };
  const powerScore = {
    equal: 0,
    you_senior: 0.25,
    they_senior: 0.5,
    varies: 0.25,
  };
  const formalityMultiplier = 1 + formalityScore[traits.formality] * 2; // 1.0 to 3.0
  const powerMultiplier = 1 + powerScore[traits.powerDynamic] * 1.5; // 1.0 to 1.75
  const professionalContextMultiplier = formalityMultiplier * powerMultiplier;

  // All negative categories get amplified for formal/hierarchical audiences
  const negativeCategories = [
    // Manipulation tactics
    "gaslighting", "guilt_tripping", "stonewalling", "deflection", "condescending",
    "backhanded_compliment", "victim_playing", "minimizing", "love_bombing",
    "sealioning", "concern_trolling", "negging", "emotional_blackmail",
    "tone_policing", "projection", "moving_goalposts", "triangulation",
    // Contextual sarcasm
    "mocking_politeness", "feigned_ignorance", "false_alignment",
    "weaponized_helpfulness", "performative_empathy", "condescending_praise",
    "fake_reasonableness", "veiled_threat", "dismissive_just",
    // Typing quirks
    "dismissive_abbreviation", "uncertain_typing", "emphatic_repetition",
    "shouting_caps", "excessive_punctuation", "keyboard_smash",
    "lazy_typing", "over_apologetic", "hedging", "demanding_brevity",
    "performative_thinking",
    // Criticism/aggression
    "aggressive", "rude", "dismissive", "passive_aggressive", "blaming",
    "threatening", "sarcastic", "negative_critical",
    // New workplace patterns
    "inappropriate_familiarity", "flirtatious_language", "praise_stacking",
    // Constructive critique (can be perceived negatively in some contexts)
    "constructive_critique",
  ];

  for (const cat of negativeCategories) {
    if (categoryMultipliers[cat]) {
      categoryMultipliers[cat] *= professionalContextMultiplier;
    } else {
      categoryMultipliers[cat] = professionalContextMultiplier;
    }
  }

  // Positive appreciation reduces severity for matching patterns
  const appreciationMap: Record<keyof AudienceTraits["appreciationFor"], string[]> = {
    politeness: ["polite", "collaborative"],
    clarity: ["constructive", "constructive_critique"],
    warmth: ["empathetic", "validating", "positive_tone"],
    thoroughness: ["constructive"],
    brevity: ["concise"],
    empathy: ["empathetic", "validating", "collaborative"],
  };

  for (const [appreciationKey, categories] of Object.entries(appreciationMap)) {
    const appreciation = traits.appreciationFor[appreciationKey as keyof AudienceTraits["appreciationFor"]];
    // Appreciation 0-1 maps to multiplier 1.0-0.5 (reduces severity)
    const multiplier = 1.0 - appreciation * 0.5;
    for (const cat of categories) {
      categoryMultipliers[cat] = (categoryMultipliers[cat] || 1.0) * multiplier;
    }
  }

  // Overall severity adjustment based on relationship closeness
  const closenessScores = {
    stranger: 0.2,
    acquaintance: 0.1,
    colleague: 0,
    friend: -0.1,
    close_friend: -0.2,
    family: -0.15,
    partner: -0.25,
    varies: 0,
  };

  const severityAdjustment = closenessScores[traits.emotionalCloseness] || 0;

  // Verdict threshold: stricter for formal/hierarchical relationships
  let verdictThresholdAdjustment = 0;
  if (traits.formality === "formal" || traits.formality === "very_formal") {
    verdictThresholdAdjustment += 0.1;
  }
  if (traits.powerDynamic === "they_senior") {
    verdictThresholdAdjustment += 0.1;
  }

  return {
    categoryMultipliers,
    severityAdjustment,
    verdictThresholdAdjustment,
  };
}