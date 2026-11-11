"use client";

import { useState, useEffect, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Loader2, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnalysisResult {
  id: string;
  verdict: "OK" | "CAUTION" | "NOT_OK";
  confidence: number;
  severity: { level: number; label: string };
  categories: Array<{ category: string; score: number; label: string }>;
  feedback: { explanation: string; suggestions: string[] };
  contextAnalysis?: {
    flow: "positive" | "neutral" | "negative" | "escalating";
    patterns: string[];
    recommendations: string[];
  };
  metadata: { modelVersion: string; processingTime: number; charCount: number };
}

interface CategoryItem {
  category: string;
  score: number;
  label: string;
}

const verdictConfig = {
  OK: { color: "bg-green-100 text-green-800", icon: CheckCircle, label: "Appropriate" },
  CAUTION: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle, label: "Review Recommended" },
  NOT_OK: { color: "bg-red-100 text-red-800", icon: XCircle, label: "Inappropriate" },
};

const flowConfig = {
  positive: { color: "bg-green-100 text-green-800", label: "Positive" },
  neutral: { color: "bg-gray-100 text-gray-800", label: "Neutral" },
  negative: { color: "bg-orange-100 text-orange-800", label: "Negative" },
  escalating: { color: "bg-red-100 text-red-800", label: "Escalating" },
};

export default function AnalyzePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("id");

  const [text, setText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [loadedAnalysisId, setLoadedAnalysisId] = useState<string | null>(null);
  const isLoadingHistory = Boolean(analysisId && loadedAnalysisId !== analysisId);

  const maxChars = session?.user
    ? session.user.subscriptionStatus !== "FREE" ? 10000 : 500
    : 500;

  // Load existing analysis if ID provided
  useEffect(() => {
    if (!analysisId) return;

    const controller = new AbortController();
    fetch(`/api/analyze/${analysisId}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to load analysis");
        return response.json() as Promise<AnalysisResult & { inputText?: string }>;
      })
      .then((data) => {
        setResult(data);
        setText(data.inputText || "");
        setCharCount(data.metadata?.charCount || 0);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setError(error instanceof Error ? error.message : "Failed to load analysis");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadedAnalysisId(analysisId);
      });

    return () => controller.abort();
  }, [analysisId]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          options: { detailLevel: "detailed", includeSuggestions: true }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setText("");
    setResult(null);
    setError("");
    setCharCount(0);
    // Clear URL param
    router.push("/dashboard/analyze");
  };

  const handleNewAnalysis = () => {
    handleClear();
  };

  const getSeverityColor = (level: number) => {
    if (level >= 4) return "bg-red-500";
    if (level >= 3) return "bg-orange-500";
    if (level >= 2) return "bg-yellow-500";
    return "bg-green-500";
  };

  if (!session?.user) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-4">Sign in to Analyze</h1>
        <p className="text-muted-foreground mb-6">
          Create an account or sign in to use the tone analyzer.
        </p>
        <a href="/login" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90">
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analyze Your Message</h1>
          <p className="text-muted-foreground mt-1">
            Paste a message to check its tone, severity, and get suggestions for improvement.
          </p>
        </div>
        {result && (
          <Button variant="outline" onClick={handleNewAnalysis} className="gap-2" size="sm">
            <RotateCcw className="h-4 w-4" />
            New Analysis
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <Badge variant="outline">
          Plan:           {session.user.subscriptionStatus !== "FREE" ? "Pro" : "Free"}
        </Badge>
        <span>Limit: {maxChars} characters per analysis</span>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Message to Analyze</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={text}
              onChange={(e) => {
                const val = e.target.value;
                setText(val);
                setCharCount(val.length);
              }}
              placeholder="Paste your message here... (email, text, Slack message, tweet draft, etc.)"
              className="min-h-[150px] resize-y"
              disabled={isLoading || isLoadingHistory}
              maxLength={maxChars}
            />
            <div className="flex items-center justify-between">
              <span className={cn("text-sm", charCount > maxChars * 0.9 ? "text-orange-600" : "text-muted-foreground")}>
                {charCount} / {maxChars} characters
              </span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleClear} disabled={isLoading || isLoadingHistory || !text}>
                  Clear
                </Button>
                <Button type="submit" disabled={isLoading || isLoadingHistory || !text.trim() || charCount > maxChars}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    "Analyze Tone"
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading History */}
      {isLoadingHistory && (
        <Card className="border-brand-border bg-brand-muted">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-brand-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-brand" />
              <span>Loading analysis from history...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Verdict Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Analysis Result</h2>
                  <p className="text-muted-foreground mt-1">
                    Processed in {result.metadata.processingTime}ms · {result.metadata.charCount} characters
                  </p>
                </div>
                {verdictConfig[result.verdict] && (
                  <>
                    {(() => {
                    const vConfig = verdictConfig[result.verdict];
                    return (
                      <div className={cn("flex items-center gap-2 px-4 py-2 rounded-full", vConfig.color)}>
                        <vConfig.icon className="h-5 w-5" />
                        <span className="font-semibold">{vConfig.label}</span>
                      </div>
                    );
                  })()}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Severity & Confidence */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground">{result.severity.level}</div>
                  <div className="text-muted-foreground">Severity Level</div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn("h-full transition-all duration-500", getSeverityColor(result.severity.level))}
                      style={{ width: `${(result.severity.level / 5) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-sm font-medium text-foreground">{result.severity.label}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-foreground">{Math.round(result.confidence * 100)}%</div>
                  <div className="text-muted-foreground">Confidence</div>
                  <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand transition-all duration-500"
                      style={{ width: `${result.confidence * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {result.contextAnalysis && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-muted-foreground text-sm mb-1">Conversation Flow</div>
                    {(() => {
                      const fConfig = flowConfig[result.contextAnalysis!.flow];
                      return (
                        <Badge className={cn("text-lg", fConfig.color)}>
                          {fConfig.label}
                        </Badge>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Categories */}
          {result.categories.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Detected Categories</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCategories(!showCategories)}
                  >
                    {showCategories ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </div>
              </CardHeader>
              {showCategories && (
                <CardContent>
                  <div className="space-y-3">
                    {result.categories.map((cat: CategoryItem, idx: number) => (
                      <div key={idx} className="flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{cat.label}</span>
                            <span className="text-muted-foreground">{Math.round(cat.score * 100)}%</span>
                          </div>
                          <div className="mt-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand transition-all duration-500"
                              style={{ width: `${cat.score * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Feedback */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Feedback & Suggestions</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                >
                  {showSuggestions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            {showSuggestions && (
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Explanation</h4>
                    <p className="text-muted-foreground">{result.feedback.explanation}</p>
                  </div>
                  {result.feedback.suggestions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Suggestions</h4>
                      <ul className="space-y-2 list-disc list-inside text-muted-foreground">
                        {result.feedback.suggestions.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            )}
          </Card>

          {/* Context Analysis */}
          {result.contextAnalysis && result.contextAnalysis.patterns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Conversation Context</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium mb-2">Patterns Detected</h4>
                    <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground">
                      {result.contextAnalysis.patterns.map((p, idx) => (
                        <li key={idx}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  {result.contextAnalysis.recommendations.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <ul className="space-y-1 list-disc list-inside text-sm text-muted-foreground">
                        {result.contextAnalysis.recommendations.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}