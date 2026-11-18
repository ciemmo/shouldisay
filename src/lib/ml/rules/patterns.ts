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

  // Sarcastic language
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

  // Gaslighting / reality denial
  {
    category: "gaslighting",
    label: "Gaslighting",
    patterns: [
      /\b(that never happened|i never said that)\b/gi,
      /\b(you're imagining things|you're crazy)\b/gi,
      /\b(you're remembering it wrong)\b/gi,
      /\b(that's not what happened)\b/gi,
      /\b(you're being (paranoid|delusional|overly sensitive))\b/gi,
      /\b(i didn't mean it like that|you're twisting my words)\b/gi,
    ],
    weight: 0.8,
  },

  // Guilt tripping / emotional manipulation
  {
    category: "guilt_tripping",
    label: "Guilt Tripping",
    patterns: [
      /\b(after all i (did|do) for you)\b/gi,
      /\b(if you (loved|cared) (about me|for me))\b/gi,
      /\b(i sacrificed|i gave up)\b/gi,
      /\b(you owe me|i deserve)\b/gi,
      /\b(make me feel|guilt)\b/gi,
      /\b(disappointed in you|let me down)\b/gi,
    ],
    weight: 0.8,
  },

  // Stonewalling / silent treatment / withdrawal
  {
    category: "stonewalling",
    label: "Stonewalling",
    patterns: [
      /\b(i'm done (talking|with this))\b/gi,
      /\b(not talking about this|won't discuss)\b/gi,
      /\b(end of discussion|conversation over)\b/gi,
      /\b(i have nothing (else )?to say)\b/gi,
      /\b(whatever\.\s*done)\b/gi,
    ],
    weight: 0.7,
  },

  // Deflection / whataboutism
  {
    category: "deflection",
    label: "Deflection",
    patterns: [
      /\b(what about (you|when you|the time you))\b/gi,
      /\b(but you (did|do|said))\b/gi,
      /\b(that's not the (point|issue|question))\b/gi,
      /\b(why are we talking about (me|this))\b/gi,
      /\b(let's talk about (your|something else))\b/gi,
    ],
    weight: 0.6,
  },

  // Condescension / patronizing / mansplaining
  {
    category: "condescending",
    label: "Condescending",
    patterns: [
      /\b(actually,?\s*(let me explain|it works like|the thing is))\b/gi,
      /\b(allow me to (explain|clarify))\b/gi,
      /\b(it's (simple|obvious|basic|not that hard))\b/gi,
      /\b(you (wouldn't|don't) understand)\b/gi,
      /\b(think about it|use your brain)\b/gi,
      /\b(sweetie|honey|dear|buddy)\b/gi,
    ],
    weight: 0.7,
  },

  // Backhanded compliments
  {
    category: "backhanded_compliment",
    label: "Backhanded Compliment",
    patterns: [
      /\b(you're (pretty|smart|good) for (a|someone))\b/gi,
      /\b(not bad for (someone|a))\b/gi,
      /\b(surprisingly (good|smart|well))\b/gi,
      /\b(you did (okay|well) (considering|for))\b/gi,
    ],
    weight: 0.7,
  },

  // Victim playing / self-pity
  {
    category: "victim_playing",
    label: "Victim Playing",
    patterns: [
      /\b(why does this always happen to me)\b/gi,
      /\b(nobody (understands|appreciates|likes) me)\b/gi,
      /\b(i'm always the (bad guy|villain|problem))\b/gi,
      /\b(everyone (is against me|hates me))\b/gi,
      /\b(poor me|i suffer|my life is hard)\b/gi,
    ],
    weight: 0.6,
  },

  // Minimizing / invalidating feelings
  {
    category: "minimizing",
    label: "Minimizing",
    patterns: [
      /\b(it's (just|only) (a|one) (little|small|minor))\b/gi,
      /\b(don't (make a big deal|blow it up))\b/gi,
      /\b(you're making (too much|a mountain))\b/gi,
      /\b(stop being (dramatic|emotional|sensitive))\b/gi,
      /\b(there are (worse|bigger) (problems|things))\b/gi,
    ],
    weight: 0.7,
  },

  // Love bombing / excessive flattery (manipulative)
  {
    category: "love_bombing",
    label: "Love Bombing",
    patterns: [
      /\b(you're (perfect|amazing|incredible|the best))\b/gi,
      /\b(i've never (met|felt|known) anyone like you)\b/gi,
      /\b(you're my (everything|soulmate|world))\b/gi,
      /\b(we're (meant to be|destined|perfect together))\b/gi,
      /\b(can't live without you|need you to survive)\b/gi,
    ],
    weight: 0.5,
  },

  // Sealioning / bad faith questioning
  {
    category: "sealioning",
    label: "Sealioning",
    patterns: [
      /\b(just asking questions|genuine question)\b/gi,
      /\b(but (why|how) (exactly|specifically))\b/gi,
      /\b(define (that|what you mean))\b/gi,
      /\b(source|proof|evidence|citation)\b/gi,
      /\b(i'm just (curious|trying to understand))\b/gi,
    ],
    weight: 0.5,
  },

  // Concern trolling
  {
    category: "concern_trolling",
    label: "Concern Trolling",
    patterns: [
      /\b(i'm (just )?concerned (about|for) you)\b/gi,
      /\b(for your own good|thinking of you)\b/gi,
      /\b(don't you think (you should|it would be better))\b/gi,
      /\b(worried (you'll|that you|about your))\b/gi,
    ],
    weight: 0.5,
  },

  // Negging / subtle put-downs
  {
    category: "negging",
    label: "Negging",
    patterns: [
      /\b(not (bad|good) for)\b/gi,
      /\b(i (like|love) how you don't care)\b/gi,
      /\b(bold choice|interesting choice)\b/gi,
      /\b(confident for someone who)\b/gi,
    ],
    weight: 0.6,
  },

  // Emotional blackmail
  {
    category: "emotional_blackmail",
    label: "Emotional Blackmail",
    patterns: [
      /\b(if you (leave|go|don't), i will)\b/gi,
      /\b(i'll (kill myself|hurt myself|die))\b/gi,
      /\b(you're (responsible|to blame) (for|if))\b/gi,
      /\b(after everything i (did|gave|sacrificed))\b/gi,
    ],
    weight: 0.9,
  },

  // Tone policing
  {
    category: "tone_policing",
    label: "Tone Policing",
    patterns: [
      /\b(calm down|watch your tone|how you said it)\b/gi,
      /\b(not (what you said|the words) but (how|your tone))\b/gi,
      /\b(if you said it (nicely|differently|politely))\b/gi,
      /\b(there's no need to be (rude|hostile|aggressive))\b/gi,
    ],
    weight: 0.6,
  },

  // Projection
  {
    category: "projection",
    label: "Projection",
    patterns: [
      /\b(you're the one (who|that) (always|never))\b/gi,
      /\b(that's (exactly|just) what you do)\b/gi,
      /\b(pot calling the kettle)\b/gi,
      /\b(look in the mirror)\b/gi,
    ],
    weight: 0.5,
  },

  // Moving goalposts
  {
    category: "moving_goalposts",
    label: "Moving Goalposts",
    patterns: [
      /\b(that's not what i (meant|asked|said))\b/gi,
      /\b(i meant|i said|i asked) (something else|different)\b/gi,
      /\b(if you (do|did) that, then (i'll|then))\b/gi,
      /\b(one more thing|another thing)\b/gi,
    ],
    weight: 0.5,
  },

  // Contextual sarcasm / mocking politeness - neutral words used sarcastically
  // "Wow, real scary, buddy" - "buddy" is neutral but condescending here
  {
    category: "mocking_politeness",
    label: "Mocking Politeness",
    patterns: [
      // "Wow/Oh/Great/Really" + positive/neutral word + dismissive address
      /\b(wow|oh|great|really|nice|good)\b.{0,30}\b(buddy|pal|friend|champ|chief|sport|honey|sweetie|dear)\b/gi,
      // Sarcastic agreement with condescending address
      /\b(sure|yeah|okay|fine|whatever)\b.{0,20}\b(buddy|pal|friend|champ|chief)\b/gi,
      // "Thanks" / "Thank you" used dismissively with address
      /\b(thanks|thank you)\b.{0,15}\b(buddy|pal|friend|champ|chief)\b/gi,
      // "Good job" / "Nice work" used sarcastically
      /\b(good job|nice work|well done|great job)\b.{0,15}\b(buddy|pal|friend|champ|chief)\b/gi,
    ],
    weight: 0.8,
  },

  // Feigned ignorance / playing dumb
  {
    category: "feigned_ignorance",
    label: "Feigned Ignorance",
    patterns: [
      /\b(i (don't|do not) (know|understand|see|get))\b.{0,20}\b(what you mean|what you're saying|the problem)\b/gi,
      /\b(what (problem|issue|difference)\??\b)/gi,
      /\b(i (honestly|genuinely|truly) (don't|didn't) (know|see|understand))\b/gi,
    ],
    weight: 0.6,
  },

  // Backhanded agreement / false alignment
  {
    category: "false_alignment",
    label: "False Alignment",
    patterns: [
      /\b(i (agree|understand|see your point),?\s*but)\b/gi,
      /\b(yes,?\s*but|sure,?\s*however|true,?\s*although)\b/gi,
      /\b(i'm (on your side|with you),?\s*but)\b/gi,
    ],
    weight: 0.6,
  },

  // Weaponized competence / "just trying to help"
  {
    category: "weaponized_helpfulness",
    label: "Weaponized Helpfulness",
    patterns: [
      /\b(i was just (trying to help|helping|trying to be helpful))\b/gi,
      /\b(just (trying to|wanting to) (help|improve|suggest))\b/gi,
      /\b(only (trying to|wanting to) (help|make it better))\b/gi,
      /\b(don't (shoot|blame|attack) the messenger)\b/gi,
    ],
    weight: 0.6,
  },

  // Performative empathy / hollow validation
  {
    category: "performative_empathy",
    label: "Performative Empathy",
    patterns: [
      /\b(i (feel|understand) (your|you).{0,10}\bbut\b)/gi,
      /\b(i (get it|hear you|see where you're coming from).{0,10}\bbut\b)/gi,
      /\b(obviously|clearly|of course) (you're|you are) (upset|angry|frustrated)\b/gi,
    ],
    weight: 0.6,
  },

  // Condescending praise / "good for you" energy
  {
    category: "condescending_praise",
    label: "Condescending Praise",
    patterns: [
      /\b(good for you|happy for you|proud of you)\b/gi,
      /\b(way to go|atta boy|atta girl|gold star)\b/gi,
      /\b(you (finally|actually|managed to) (did|do|figure))\b/gi,
    ],
    weight: 0.7,
  },

  // Minimizing with fake reasonableness
  {
    category: "fake_reasonableness",
    label: "Fake Reasonableness",
    patterns: [
      /\b(being (reasonable|rational|logical|objective))\b/gi,
      /\b(just (being|saying) (honest|real|straight))\b/gi,
      /\b(looking at this (objectively|logically|rationally))\b/gi,
      /\b(the (fact|reality|truth) (is|remains))\b/gi,
    ],
    weight: 0.5,
  },

  // Subtle threat disguised as observation
  {
    category: "veiled_threat",
    label: "Veiled Threat",
    patterns: [
      /\b(would be a shame if)\b/gi,
      /\b(it would be unfortunate if)\b/gi,
      /\b(hope (nothing|nothing bad) happens)\b/gi,
      /\b(just (saying|mentioning|noting))\b/gi,
    ],
    weight: 0.8,
  },

  // Dismissive "just" / minimization
  {
    category: "dismissive_just",
    label: "Dismissive Minimization",
    patterns: [
      /\b(just (a (joke|comment|question|observation)))\b/gi,
      /\b(it was just (a (joke|comment|question)))\b/gi,
      /\b(only (a (joke|comment|question)))\b/gi,
      /\b(don't (take it|get) (so )?(serious|personal|upset))\b/gi,
    ],
    weight: 0.7,
  },

  // Triangulation / bringing in third parties
  {
    category: "triangulation",
    label: "Triangulation",
    patterns: [
      /\b(everyone (else )?(agrees|thinks|says|knows))\b/gi,
      /\b(people (are saying|think|say|agree))\b/gi,
      /\b(others (have said|noticed|mentioned|complained))\b/gi,
      /\b((my|our) (friends|colleagues|team) (think|say|agree))\b/gi,
    ],
    weight: 0.6,
  },

  // Typing quirks & text abbreviations - carry social signal
  // Positive critique / constructive feedback with praise
  // "It's good, but could be great" - sandwich feedback, growth-oriented
  {
    category: "constructive_critique",
    label: "Constructive Critique",
    patterns: [
      // "good but could be better" patterns
      /\b(it'?s|that'?s|this is) (good|nice|okay|decent|fine|solid),?\s*(but|however)\b/gi,
      /\b(not bad|pretty good|quite good),?\s*(but|however)\b/gi,
      // "wow" energy / "take it to the next level"
      /\b(more (wow|energy|impact|polish|depth))\b/gi,
      /\b(take it (to the next level|up a notch|further))\b/gi,
      /\b(could be (even )?(better|great|amazing|stronger))\b/gi,
      /\b(room for (improvement|growth))\b/gi,
      // "It's not bad, but..." / "good, but needs..."
      /\b(its? (not bad|good|okay),?\s*but)\b/gi,
      /\b(needs (more|work|polish|refinement))\b/gi,
      // Sandwich: praise -> critique -> encouragement
      /\b(i (like|love|enjoy).{0,30}(but|however).{0,30}(could|would|should))\b/gi,
    ],
    weight: 0.6,
  },

  {
    category: "dismissive_abbreviation",
    label: "Dismissive Abbreviation",
    patterns: [
      /\b(idk|idc|idgaf|whatever)\b/gi,
      /\b(k|kk|ok|okay)\b/gi,
      /\b(nvm|nm|nevermind)\b/gi,
      /\b(dw|don't worry)\b/gi,
    ],
    weight: 0.6,
  },

  // Uncertainty / hesitation markers
  {
    category: "uncertain_typing",
    label: "Uncertain/Hesitant",
    patterns: [
      /\b(idk|i don't know|not sure|maybe|idk)\b/gi,
      /\b(i (guess|suppose|think|assume))\b/gi,
      /\b(probably|possibly|perhaps|might)\b/gi,
      /\b(hmm+|uhm+|uh+|er+)\b/gi,
    ],
    weight: 0.4,
  },

  // Emphasis via character repetition - "sooooo", "yesssss", "noooo"
  {
    category: "emphatic_repetition",
    label: "Emphatic Repetition",
    patterns: [
      /\b\w*([a-z])\1{3,}\w*\b/gi,  // 4+ repeated chars: sooooo, yesssss, noooo
      /\b(no+|ye+s+|ok+|yeah+|right+)\b/gi,
    ],
    weight: 0.5,
  },

  // Caps lock / shouting emphasis
  {
    category: "shouting_caps",
    label: "Shouting (All Caps)",
    patterns: [
      /\b[A-Z]{4,}\b/g,  // Words with 4+ uppercase letters
      /[A-Z\s]{10,}/g,   // Long stretches of caps
    ],
    weight: 0.8,
  },

  // Excessive punctuation - "????", "!!!!", "..."
  {
    category: "excessive_punctuation",
    label: "Excessive Punctuation",
    patterns: [
      /[?!]{3,}/g,       // ??? or !!! or ?!?
      /\.{4,}/g,         // ...... (more than ellipsis)
      /[?!]{2,}\.{2,}/g, // ??... or !....
    ],
    weight: 0.6,
  },

  // Keyboard smash / frustration typing
  {
    category: "keyboard_smash",
    label: "Keyboard Smash",
    patterns: [
      // Common keyboard row patterns
      /\b(asdf|qwer|zxcv|jkl|ghj|fdsa|poiu|lkj|mnbv)\b/gi,
      // Sequential key patterns (3+ keys in row)
      /\b(qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)\b/gi,
      // Repeated same key (4+): aaaa, ssss, etc. (not real words)
      /\b([asdfghjklzxcvbnm])\1{3,}\b/gi,
      // Alternating hand mashing patterns (consonant clusters unlikely in English)
      /\b([bcdfghjklmnpqrstvwxyz]{6,})\b/gi,
    ],
    weight: 0.7,
  },

  // Passive/lazy typing - all lowercase, no punctuation
  {
    category: "lazy_typing",
    label: "Lazy/Casual Typing",
    patterns: [
      /^[a-z\s]+$/g,      // All lowercase, no punctuation (whole message)
      /\b(u|r|ur|y|ya|ye|k|thx|pls|plz)\b/gi,  // Extreme abbreviations
    ],
    weight: 0.4,
  },

  // Over-apologetic / self-deprecating
  {
    category: "over_apologetic",
    label: "Over-Apologetic",
    patterns: [
      /\b(sorry|sry|so sorry|really sorry)\b.{0,20}\b(sorry|sry)\b/gi,  // Multiple sorries
      /\b(i'm so (sorry|stupid|dumb|bad|terrible))\b/gi,
      /\b(forgive me|my bad|my fault)\b/gi,
    ],
    weight: 0.5,
  },

  // Hedging / softening language
  {
    category: "hedging",
    label: "Hedging/Softening",
    patterns: [
      /\b(just (wondering|curious|asking|saying))\b/gi,
      /\b(might be (wrong|mistaken|off))\b/gi,
      /\b(not (sure|certain|an expert))\b/gi,
      /\b(don't (quote|hold) me (to|on) (that|it))\b/gi,
    ],
    weight: 0.4,
  },

  // Demanding brevity / "TL;DR" energy
  {
    category: "demanding_brevity",
    label: "Demanding Brevity",
    patterns: [
      /\b(tldr|tl;dr|too long|didn't read)\b/gi,
      /\b(keep it (short|brief|simple))\b/gi,
      /\b(get to the point|bottom line|long story short)\b/gi,
      /\b(summary|in short|basically)\b/gi,
    ],
    weight: 0.5,
  },

  // Performative thinking / "hmmmmmm"
  {
    category: "performative_thinking",
    label: "Performative Thinking",
    patterns: [
      /\b(hmm+|hmm+\.|hmm+\?)\b/gi,
      /\b(let me (think|see|check))\b/gi,
      /\b(interesting\.{2,}|hmm\.{2,})\b/gi,
    ],
    weight: 0.4,
  },

  // Inappropriate familiarity / unprofessional pet names in workplace
  {
    category: "inappropriate_familiarity",
    label: "Inappropriate Familiarity",
    patterns: [
      // Pet names in professional contexts
      /\b(my\s+)?(awesome|sweet|lovely|honey|sweetie|babe|dear|darling|cutie|beautiful|gorgeous)\s+(co-?worker|colleague|boss|manager|client|customer|team|staff)\b/gi,
      // Direct address with pet names
      /\b(hey|hi|hello|how'?s)\b.{0,10}\b(honey|sweetie|babe|dear|darling|cutie|lovely|beautiful|gorgeous)\b/gi,
      // "My [pet name] [role]" constructions
      /\bmy\s+(sweet|lovely|awesome|amazing|wonderful)\s+(co-?worker|colleague|assistant|intern)\b/gi,
    ],
    weight: 0.85,
  },

  // Flirtatious language - excessive praise + tilde/emoji suggesting flirtation
  {
    category: "flirtatious_language",
    label: "Flirtatious Language",
    patterns: [
      // Tilde usage suggesting flirtatious tone
      /~+/g,
      // Multiple excessive compliments in sequence (space or comma separated)
      /\b(awesome|sweet|lovely|amazing|wonderful|fantastic|incredible|gorgeous|beautiful)[\s,]+(awesome|sweet|lovely|amazing|wonderful|fantastic|incredible|gorgeous|beautiful)\b/gi,
      // "How's my [compliment stack] [person] doing" pattern (handles commas)
      /\bhow'?s\s+my\s+(awesome|sweet|lovely|amazing|wonderful|fantastic|incredible|gorgeous|beautiful)[\s,]+(co-?worker|colleague|assistant|intern|team)\b/gi,
      // Wink/emoji combinations with compliments
      /\b(awesome|sweet|lovely|amazing|gorgeous|beautiful)\b.{0,20}[;😉😊😍🥰]/g,
    ],
    weight: 0.8,
  },

  // Praise stacking - multiple excessive positive adjectives in sequence
  {
    category: "praise_stacking",
    label: "Excessive Praise Stacking",
    patterns: [
      // Three or more positive adjectives in a row (space or comma separated)
      /\b(awesome|sweet|lovely|amazing|wonderful|fantastic|incredible|gorgeous|beautiful|perfect|brilliant|outstanding|exceptional)[\s,]+(awesome|sweet|lovely|amazing|wonderful|fantastic|incredible|gorgeous|beautiful|perfect|brilliant|outstanding|exceptional)[\s,]+(awesome|sweet|lovely|amazing|wonderful|fantastic|incredible|gorgeous|beautiful|perfect|brilliant|outstanding|exceptional)\b/gi,
      // "My [adj] [adj] [adj] [person]" pattern (handles commas)
      /\bmy\s+(awesome|sweet|lovely|amazing|wonderful|fantastic|incredible|gorgeous|beautiful)[\s,]+(awesome|sweet|lovely|amazing|wonderful|fantastic|incredible|gorgeous|beautiful)\s+(co-?worker|colleague|assistant|intern|team|staff)\b/gi,
    ],
    weight: 0.75,
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