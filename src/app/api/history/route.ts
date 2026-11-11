// src/app/api/history/route.ts
// GET endpoint for fetching user's analysis history

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Prisma, Verdict } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const search = searchParams.get("search") || "";
    const verdict = searchParams.get("verdict") || "";
    const skip = (page - 1) * limit;

    const where: Prisma.AnalysisWhereInput = { userId: session.user.id };

    if (search) {
      where.inputText = { contains: search, mode: "insensitive" };
    }

    if (verdict && verdict !== "all") {
      const matchingVerdict = Object.values(Verdict).find(
        (value) => value === verdict
      );
      if (!matchingVerdict) {
        return NextResponse.json({ error: "Invalid verdict" }, { status: 400 });
      }
      where.verdict = matchingVerdict;
    }

    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
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
          inputText: true,
        },
      }),
      prisma.analysis.count({ where }),
    ]);

    return NextResponse.json({
      analyses: analyses.map((analysis) => {
        const { modelVersion, processingTime, ...analysisData } = analysis;
        return {
          ...analysisData,
          metadata: {
            modelVersion,
            processingTime,
            charCount: analysis.charCount,
          },
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("History fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}