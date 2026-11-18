// src/app/dashboard/(workspace)/analyze/page.tsx
// Main analysis page with text input and results display

"use client";

import { Suspense } from "react";
import { useState, useEffect, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Label } from "@/components/ui/Label";
import { Loader2, AlertTriangle, CheckCircle, XCircle, ChevronDown, ChevronUp, RotateCcw, TrendingUp, Lock, Users, UserPlus, Settings, Target } from "lucide-react";
import { cn } from "@/lib/utils";

// Audience types (matching backend)
interface AudienceProfile {
  id: string;
  name: string;
  type: "preset" | "custom";
  description: string;
}

const PRESET_AUDIENCES: AudienceProfile[] = [
  { id: "friend", name: "Close Friend", type: "preset", description: "Casual, direct, humor welcome" },
  { id: "spouse", name: "Spouse/Partner", type: "preset", description: "Intimate, very direct, high emotional safety" },
  { id: "family", name: "Family Member", type: "preset", description: "Warm but mindful, varies by relationship" },
  { id: "coworker", name: "Co-worker", type: "preset", description: "Professional peer, clear and appropriately warm" },
  { id: "boss", name: "Boss/Manager", type: "preset", description: "Formal, solution-oriented, respectful" },
  { id: "client", name: "Client/Customer", type: "preset", description: "Professional, accommodating, polished" },
  { id: "stranger", name: "Stranger", type: "preset", description: "Polite, clear, no assumptions" },
  { id: "acquaintance", name: "Acquaintance", type: "preset", description: "Polite but relaxed, some familiarity" },
  { id: "groupchat", name: "Group Chat", type: "preset", description: "Casual but considerate, multiple people" },
];

// Default audience for each tier
const DEFAULT_FREE_AUDIENCE = "friend";
const DEFAULT_PRO_AUDIENCE = "coworker";

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

function AnalyzeContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get("id");

  const [text, setText] = useState("");
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showCategories, setShowCategories] = useState(true);
  const [loadedAnalysisId, setLoadedAnalysisId] = useState<string | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<string>(DEFAULT_FREE_AUDIENCE);
  const [showCustomAudienceModal, setShowCustomAudienceModal] = useState(false);
  const [customAudiences, setCustomAudiences] = useState<AudienceProfile[]>([]);
  const isLoadingHistory = Boolean(analysisId && loadedAnalysisId !== analysisId);

  const isPro = session?.user?.subscriptionStatus !== "FREE" && session?.user?.subscriptionStatus !== "CANCELED" && session?.user?.subscriptionStatus !== "PAST_DUE";
  const maxChars = isPro ? 10000 : 500;

  // Load custom audiences for Pro users
  useEffect(() => {
    if (isPro) {
      fetch("/api/user/audiences")
        .then((res) => res.ok ? res.json() : [])
        .then((data: AudienceProfile[]) => setCustomAudiences(data))
        .catch(() => setCustomAudiences([]));
    }
  }, [isPro]);

  // Reset audience to default when tier changes
  useEffect(() => {
    setSelectedAudience(isPro ? DEFAULT_PRO_AUDIENCE : DEFAULT_FREE_AUDIENCE);
  }, [isPro]);

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
          conversationHistory: isPro ? conversationHistory : undefined,
          audience: selectedAudience,
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

            {/* Audience Selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="audience-select" className="text-sm font-medium">
                  Analyze For
                </Label>
                <Badge variant="outline" className="text-xs">
                  <Target className="h-3 w-3 mr-1" />
                  Audience-aware analysis
                </Badge>
              </div>

              {/* Preset Audiences Dropdown */}
              <div className="relative">
                <select
                  id="audience-select"
                  value={selectedAudience}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === "__create_custom__") {
                      setShowCustomAudienceModal(true);
                      // Reset to previous selection
                      setTimeout(() => {
                        const selectEl = document.getElementById("audience-select") as HTMLSelectElement;
                        if (selectEl) selectEl.value = selectedAudience;
                      }, 0);
                    } else {
                      setSelectedAudience(value);
                      setShowCustomAudienceModal(false);
                    }
                  }}
                  className={cn(
                    "w-full appearance-none bg-background border border-input rounded-md py-2.5 pr-10 pl-3 text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "disabled:opacity-50 disabled:pointer-events-none"
                  )}
                  disabled={isLoading || isLoadingHistory}
                >
                  <optgroup label="— Quick Select (Free) —">
                    {PRESET_AUDIENCES.map((audience) => (
                      <option key={audience.id} value={audience.id} title={audience.description}>
                        {audience.name}
                      </option>
                    ))}
                  </optgroup>
                  {isPro && customAudiences.length > 0 && (
                    <optgroup label="— Your Custom Audiences (Pro) —">
                      {customAudiences.map((audience) => (
                        <option key={audience.id} value={audience.id} title={audience.description}>
                          {audience.name} (custom)
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {isPro && (
                    <option value="__new_custom__" disabled className="text-muted-foreground">
                      ─────────────
                    </option>
                  )}
                  {isPro && (
                    <option value="__create_custom__">
                      + Create New Custom Audience...
                    </option>
                  )}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Selected Audience Description */}
              <div className="text-sm text-muted-foreground min-h-[20px]">
                {(() => {
                  const audience = PRESET_AUDIENCES.find(a => a.id === selectedAudience) ||
                    customAudiences.find(a => a.id === selectedAudience);
                  return audience ? audience.description : "Select an audience to tailor the analysis";
                })()}
              </div>

              {!isPro && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-muted rounded-md">
                  <Lock className="h-4 w-4 text-brand" />
                  <span>
                    <strong>Pro feature:</strong> Create custom audiences like "Paul, 22, makes edgy jokes" with
                    tailored sensitivity settings. <a href="/dashboard/billing" className="underline hover:text-brand ml-1">Upgrade to Pro</a>
                  </span>
                </div>
              )}
            </div>

            {/* Conversation History Input - Pro Tier Feature */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="conversation-history" className="text-sm font-medium">
                  Conversation History (Pro)
                </Label>
                {!isPro && (
                  <Badge variant="secondary" className="gap-1">
                    <Lock className="h-3 w-3" />
                    Pro Feature
                  </Badge>
                )}
              </div>
              <Textarea
                id="conversation-history"
                value={conversationHistory.join("\n---\n")}
                onChange={(e) => {
                  const val = e.target.value;
                  setConversationHistory(val.split("\n---\n").filter(m => m.trim()));
                }}
                placeholder={isPro
                  ? "Paste previous messages in this conversation (separate with --- on a new line)\nExample:\nHi, how are you?\n---\nI'm frustrated with this project\n---\nCan you help me?"
                  : "Upgrade to Pro to analyze conversation context and detect escalation patterns"
                }
                className="min-h-[100px] resize-y"
                disabled={!isPro || isLoading || isLoadingHistory}
                maxLength={5000}
              />
              {!isPro && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-brand" />
                  <span>Conversation context analysis detects escalation patterns and recurring issues. <a href="/dashboard/billing" className="underline hover:text-brand">Upgrade to Pro</a> to unlock.</span>
                </div>
              )}
              {isPro && conversationHistory.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  {conversationHistory.length} previous message{conversationHistory.length > 1 ? "s" : ""} included in analysis
                </p>
              )}
            </div>

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

      {/* Custom Audience Modal */}
      {showCustomAudienceModal && isPro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="w-full max-w-md bg-background rounded-lg shadow-xl border p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Create Custom Audience</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowCustomAudienceModal(false)}>
                <XCircle className="h-5 w-5" />
              </Button>
            </div>
            <CustomAudienceForm
              onSave={(audience) => {
                setCustomAudiences(prev => [...prev, audience]);
                setSelectedAudience(audience.id);
                setShowCustomAudienceModal(false);
              }}
              onCancel={() => setShowCustomAudienceModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Custom Audience Form Component
function CustomAudienceForm({ onSave, onCancel }: {
  onSave: (audience: AudienceProfile) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [formality, setFormality] = useState<"very_casual" | "casual" | "neutral" | "formal" | "very_formal">("neutral");
  const [directness, setDirectness] = useState<"very_indirect" | "indirect" | "balanced" | "direct" | "very_direct">("balanced");
  const [humorTolerance, setHumorTolerance] = useState<"none" | "low" | "moderate" | "high" | "edgy">("moderate");
  const [sensitivity, setSensitivity] = useState({
    sarcasm: 0.5,
    criticism: 0.5,
    abbreviations: 0.5,
    caps: 0.5,
    profanity: 0.5,
    emotionalExpression: 0.5,
    hedging: 0.5,
    commands: 0.5,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/user/audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          traits: {
            formality,
            directness,
            humorTolerance,
            vulnerabilityTolerance: "moderate",
            sensitivity,
            appreciationFor: {
              politeness: 0.5,
              clarity: 0.5,
              warmth: 0.5,
              thoroughness: 0.5,
              brevity: 0.5,
              empathy: 0.5,
            },
            powerDynamic: "equal",
            emotionalCloseness: "acquaintance",
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create audience");
      }

      const audience = await response.json();
      onSave(audience);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create audience");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sensitivityOptions = [
    { key: "sarcasm" as const, label: "Sarcasm Sensitivity", desc: "How negatively sarcasm is viewed" },
    { key: "criticism" as const, label: "Criticism Sensitivity", desc: "How negatively direct criticism is viewed" },
    { key: "abbreviations" as const, label: "Abbreviations", desc: "How negatively casual abbreviations are viewed" },
    { key: "caps" as const, label: "ALL CAPS", desc: "How negatively shouting is viewed" },
    { key: "profanity" as const, label: "Profanity", desc: "How negatively profanity is viewed" },
    { key: "emotionalExpression" as const, label: "Emotional Expression", desc: "How negatively strong emotions are viewed" },
    { key: "hedging" as const, label: "Hedging/Uncertainty", desc: "How negatively hedging is viewed" },
    { key: "commands" as const, label: "Commands/Imperatives", desc: "How negatively direct commands are viewed" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="audience-name" className="text-sm font-medium">Name *</Label>
        <input
          id="audience-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Paul, 22, makes edgy jokes"
          className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="audience-description" className="text-sm font-medium">Description</Label>
        <textarea
          id="audience-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description of this person/context"
          className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          maxLength={500}
          rows={2}
        />
      </div>

      <div className="grid gap-4 grid-cols-2">
        <div className="space-y-2">
          <Label className="text-sm font-medium">Formality</Label>
          <select
            value={formality}
            onChange={(e) => setFormality(e.target.value as typeof formality)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="very_casual">Very Casual</option>
            <option value="casual">Casual</option>
            <option value="neutral">Neutral</option>
            <option value="formal">Formal</option>
            <option value="very_formal">Very Formal</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Directness</Label>
          <select
            value={directness}
            onChange={(e) => setDirectness(e.target.value as typeof directness)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="very_indirect">Very Indirect</option>
            <option value="indirect">Indirect</option>
            <option value="balanced">Balanced</option>
            <option value="direct">Direct</option>
            <option value="very_direct">Very Direct</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Humor Tolerance</Label>
          <select
            value={humorTolerance}
            onChange={(e) => setHumorTolerance(e.target.value as typeof humorTolerance)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="none">None</option>
            <option value="low">Low</option>
            <option value="moderate">Moderate</option>
            <option value="high">High</option>
            <option value="edgy">Edgy</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Sensitivity Settings (0 = tolerant, 1 = sensitive)</Label>
        <div className="grid gap-3 grid-cols-2">
          {sensitivityOptions.map((opt) => (
            <div key={opt.key} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm">{opt.label}</span>
                <span className="text-sm font-mono text-muted-foreground">{Math.round(sensitivity[opt.key] * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={sensitivity[opt.key]}
                onChange={(e) => setSensitivity(prev => ({ ...prev, [opt.key]: parseFloat(e.target.value) }))}
                className="w-full h-2 bg-muted rounded-lg appearance-none accent-brand"
                title={opt.desc}
              />
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            "Save Audience"
          )}
        </Button>
      </div>
    </form>
  );
}

export default function AnalyzePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[400px]">Loading...</div>}>
      <AnalyzeContent />
    </Suspense>
  );
}