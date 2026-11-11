// /api/analyze route - POST endpoint for tone analysis
// Validates input, enforces tier limits, runs ML pipeline, saves to DB

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { analyzeText } from "@/lib/ml/pipeline";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";

// Input validation
const analyzeSchema = z.object({
  text: z.string().min(1).max(10000),
  conversationHistory: z.array(z.string()).max(10).optional(),
  options: z.object({
    detailLevel: z.enum(["basic", "detailed"]).default("basic"),
    includeSuggestions: z.boolean().default(true),
  }).optional(),
});

// Tier limits (Free vs Pro)
const TIER_LIMITS = {
  FREE: { maxChars: 500, detailLevel: "basic" as const, contextAnalysis: false },
  PRO: { maxChars: 10000, detailLevel: "detailed" as const, contextAnalysis: true },
  ACTIVE: { maxChars: 10000, detailLevel: "detailed" as const, contextAnalysis: true },
} as const;

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

    const { text, conversationHistory, options } = validated.data;

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

    // Run analysis
    const result = await analyzeText({
      text,
      conversationHistory: limits.contextAnalysis ? conversationHistory : undefined,
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