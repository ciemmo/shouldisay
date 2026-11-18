// /api/user/audiences - GET and POST for custom audiences
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { prisma } from "@/lib/db";

const audienceTraitsSchema = z.object({
  formality: z.enum(["very_casual", "casual", "neutral", "formal", "very_formal"]),
  directness: z.enum(["very_indirect", "indirect", "balanced", "direct", "very_direct"]),
  humorTolerance: z.enum(["none", "low", "moderate", "high", "edgy"]),
  vulnerabilityTolerance: z.enum(["low", "moderate", "high"]),
  sensitivity: z.object({
    sarcasm: z.number().min(0).max(1),
    criticism: z.number().min(0).max(1),
    abbreviations: z.number().min(0).max(1),
    caps: z.number().min(0).max(1),
    profanity: z.number().min(0).max(1),
    emotionalExpression: z.number().min(0).max(1),
    hedging: z.number().min(0).max(1),
    commands: z.number().min(0).max(1),
  }),
  appreciationFor: z.object({
    politeness: z.number().min(0).max(1),
    clarity: z.number().min(0).max(1),
    warmth: z.number().min(0).max(1),
    thoroughness: z.number().min(0).max(1),
    brevity: z.number().min(0).max(1),
    empathy: z.number().min(0).max(1),
  }),
  powerDynamic: z.enum(["equal", "you_senior", "they_senior", "varies"]),
  emotionalCloseness: z.enum(["stranger", "acquaintance", "colleague", "friend", "close_friend", "family", "partner", "varies"]),
});

const createAudienceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  traits: audienceTraitsSchema,
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check Pro tier
    const isPro = user.subscription?.status === "ACTIVE";
    if (!isPro) {
      return NextResponse.json({ error: "Pro feature" }, { status: 403 });
    }

    // For now, return empty array - in a real app you'd store these in the database
    // We'll create a simple in-memory store or use a UserAudience model
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching custom audiences:", error);
    return NextResponse.json({ error: "Failed to fetch audiences" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { subscription: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check Pro tier
    const isPro = user.subscription?.status === "ACTIVE";
    if (!isPro) {
      return NextResponse.json({ error: "Custom audiences are a Pro feature" }, { status: 403 });
    }

    const body = await request.json();
    const validated = createAudienceSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validated.error.flatten() },
        { status: 400 }
      );
    }

    // Generate ID
    const id = `custom_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // Return the created audience (in production, save to database)
    const audience = {
      id,
      name: validated.data.name,
      description: validated.data.description || "",
      type: "custom" as const,
      traits: validated.data.traits,
      userId: user.id,
      createdAt: new Date(),
    };

    return NextResponse.json(audience, { status: 201 });
  } catch (error) {
    console.error("Error creating custom audience:", error);
    return NextResponse.json({ error: "Failed to create audience" }, { status: 500 });
  }
}