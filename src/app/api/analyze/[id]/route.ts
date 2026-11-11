// src/app/api/analyze/[id]/route.ts
// GET endpoint for fetching a specific analysis by ID

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const analysis = await prisma.analysis.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        inputText: true,
        verdict: true,
        confidence: true,
        severity: true,
        categories: true,
        feedback: true,
        contextAnalysis: true,
        modelVersion: true,
        processingTime: true,
        charCount: true,
        isConversation: true,
        createdAt: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: "Analysis not found" }, { status: 404 });
    }

    if (analysis.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { modelVersion, processingTime, ...analysisData } = analysis;
    return NextResponse.json({
      ...analysisData,
      metadata: {
        modelVersion,
        processingTime,
        charCount: analysis.charCount,
      },
    });
  } catch (error) {
    console.error("Fetch analysis error:", error);
    return NextResponse.json({ error: "Failed to fetch analysis" }, { status: 500 });
  }
}