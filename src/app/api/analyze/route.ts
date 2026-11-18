// /api/analyze route - POST endpoint for tone analysis
// Validates input, enforces tier limits, runs ML pipeline, saves to DB

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { analyzeText } from "@/lib/ml/pipeline";
import { getAllPresetAudiences, AudienceProfile } from "@/lib/ml/audience";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Input validation
const audienceTraitsSchema = z.object({
  formality: z.enum(["very_casual", "casual", "neutral", "formal", "very_formal"]).optional(),
  directness: z.enum(["very_indirect", "indirect", "balanced", "direct", "very_direct"]).optional(),
  humorTolerance: z.enum(["none", "low", "moderate", "high", "edgy"]).optional(),
  vulnerabilityTolerance: z.enum(["low", "moderate", "high"]).optional(),
  sensitivity: z.object({
    sarcasm: z.number().min(0).max(1).optional(),
    criticism: z.number().min(0).max(1).optional(),
    abbreviations: z.number().min(0).max(1).optional(),
    caps: z.number().min(0).max(1).optional(),
    profanity: z.number().min(0).max(1).optional(),
    emotionalExpression: z.number().min(0).max(1).optional(),
    hedging: z.number().min(0).max(1).optional(),
    commands: z.number().min(0).max(1).optional(),
  }).optional(),
  appreciationFor: z.object({
    politeness: z.number().min(0).max(1).optional(),
    clarity: z.number().min(0).max(1).optional(),
    warmth: z.number().min(0).max(1).optional(),
    thoroughness: z.number().min(0).max(1).optional(),
    brevity: z.number().min(0).max(1).optional(),
    empathy: z.number().min(0).max(1).optional(),
  }).optional(),
  powerDynamic: z.enum(["equal", "you_senior", "they_senior", "varies"]).optional(),
  emotionalCloseness: z.enum(["stranger", "acquaintance", "colleague", "friend", "close_friend", "family", "partner"]).optional(),
});

const customAudienceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(100),
  type: z.literal("custom"),
  description: z.string().max(500).optional(),
  traits: audienceTraitsSchema,
  userId: z.string().optional(),
  createdAt: z.date().optional(),
});

const analyzeSchema = z.object({
  text: z.string().min(1).max(10000),
  conversationHistory: z.array(z.string()).max(10).optional(),
  audience: z.union([
    z.string(), // preset ID
    customAudienceSchema, // custom audience object
  ]).optional(),
  options: z.object({
    detailLevel: z.enum(["basic", "detailed"]).default("basic"),
    includeSuggestions: z.boolean().default(true),
  }).optional(),
});

// Tier limits (Free vs Pro)
const TIER_LIMITS = {
  FREE: { maxChars: 500, detailLevel: "basic" as const, contextAnalysis: false, customAudience: false },
  PRO: { maxChars: 10000, detailLevel: "detailed" as const, contextAnalysis: true, customAudience: true },
  ACTIVE: { maxChars: 10000, detailLevel: "detailed" as const, contextAnalysis: true, customAudience: true },
} as const;

const PRESET_AUDIENCE_IDS = getAllPresetAudiences().map(a => a.id);

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request
    const body = await request.json();
    const validated = analyzeSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    const { text, conversationHistory, audience, options } = validated.data;

    // Get user's subscription status
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Determine tier limits
    const subscriptionStatus = user.subscription?.status || "FREE";
    const limits = TIER_LIMITS[subscriptionStatus as keyof typeof TIER_LIMITS] || TIER_LIMITS.FREE;

    // Enforce character limit
    if (text.length > limits.maxChars) {
      return NextResponse.json(
        {
          error: `Character limit exceeded. Your plan allows ${limits.maxChars} characters per analysis.`,
          limit: limits.maxChars,
          current: text.length,
        },
        { status: 400 }
      );
    }

    // Validate and resolve audience
    let resolvedAudience: string | AudienceProfile | undefined;

    if (audience) {
      if (typeof audience === "string") {
        // Preset audience - validate it exists
        if (!PRESET_AUDIENCE_IDS.includes(audience)) {
          return NextResponse.json(
            { error: `Invalid audience preset. Available: ${PRESET_AUDIENCE_IDS.join(", ")}` },
            { status: 400 }
          );
        }
        resolvedAudience = audience;
      } else {
        // Custom audience - check tier
        if (!limits.customAudience) {
          return NextResponse.json(
            { error: "Custom audiences are a Pro feature. Upgrade to use custom audience profiles." },
            { status: 403 }
          );
        }
        // Attach userId for tracking and ensure id is set, with defaults for optional traits
        resolvedAudience = {
          ...audience,
          userId: user.id,
          id: audience.id || `custom_${Date.now()}`,
          createdAt: audience.createdAt || new Date(),
          description: audience.description || "",
          traits: {
            formality: audience.traits.formality || "neutral",
            directness: audience.traits.directness || "balanced",
            humorTolerance: audience.traits.humorTolerance || "moderate",
            vulnerabilityTolerance: audience.traits.vulnerabilityTolerance || "moderate",
            sensitivity: {
              sarcasm: audience.traits.sensitivity?.sarcasm ?? 0.5,
              criticism: audience.traits.sensitivity?.criticism ?? 0.5,
              abbreviations: audience.traits.sensitivity?.abbreviations ?? 0.5,
              caps: audience.traits.sensitivity?.caps ?? 0.5,
              profanity: audience.traits.sensitivity?.profanity ?? 0.5,
              emotionalExpression: audience.traits.sensitivity?.emotionalExpression ?? 0.5,
              hedging: audience.traits.sensitivity?.hedging ?? 0.5,
              commands: audience.traits.sensitivity?.commands ?? 0.5,
            },
            appreciationFor: {
              politeness: audience.traits.appreciationFor?.politeness ?? 0.5,
              clarity: audience.traits.appreciationFor?.clarity ?? 0.5,
              warmth: audience.traits.appreciationFor?.warmth ?? 0.5,
              thoroughness: audience.traits.appreciationFor?.thoroughness ?? 0.5,
              brevity: audience.traits.appreciationFor?.brevity ?? 0.5,
              empathy: audience.traits.appreciationFor?.empathy ?? 0.5,
            },
            powerDynamic: audience.traits.powerDynamic || "equal",
            emotionalCloseness: audience.traits.emotionalCloseness || "acquaintance",
          },
        };
      }
    }

    // Run analysis
    // Only pass conversationHistory for Pro/Active tiers (contextAnalysis is true for those tiers)
    const result = await analyzeText({
      text,
      conversationHistory: limits.contextAnalysis ? conversationHistory : undefined,
      audience: resolvedAudience,
    });

    // Apply tier restrictions to response
    const response = {
      id: "", // Will be filled after DB save
      verdict: result.verdict,
      confidence: result.confidence,
      severity: result.severity,
      categories: result.categories,
      feedback: options?.includeSuggestions !== false ? result.feedback : {
        explanation: result.feedback.explanation,
        suggestions: [],
      },
      contextAnalysis: limits.contextAnalysis ? result.contextAnalysis : undefined,
      metadata: result.metadata,
    };

    // Save analysis to database
    const analysis = await prisma.analysis.create({
      data: {
        userId: user.id,
        inputText: text,
        inputHash: hashText(text),
        verdict: result.verdict,
        confidence: result.confidence,
        severity: { ...result.severity },
        categories: result.categories.map((category) => ({ ...category })),
        feedback: { ...result.feedback },
        contextAnalysis: result.contextAnalysis
          ? { ...result.contextAnalysis }
          : Prisma.DbNull,
        modelVersion: result.metadata.modelVersion,
        processingTime: result.metadata.processingTime,
        charCount: result.metadata.charCount,
        isConversation: !!conversationHistory?.length,
      },
    });

    // Update usage stats
    await prisma.usageStats.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        analysesThisMonth: 1,
        charsThisMonth: text.length,
        lastResetDate: new Date(),
      },
      update: {
        analysesThisMonth: { increment: 1 },
        charsThisMonth: { increment: text.length },
      },
    });

    return NextResponse.json({
      ...response,
      id: analysis.id,
    });

  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}

// Simple hash for deduplication
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}