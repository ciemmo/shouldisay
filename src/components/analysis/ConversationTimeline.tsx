// src/components/analysis/ConversationTimeline.tsx
// Conversation timeline component with expandable message previews

"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

export interface TimelineMessage {
  id: string;
  text: string;
  timestamp: Date | string;
  analysis: {
    verdict: "GOOD" | "OK" | "CAUTION" | "NOT_OK" | "BAD";
    confidence: number;
    severity: {
      level: 1 | 2 | 3 | 4 | 5;
      label: string;
    };
    categories: Array<{
      category: string;
      score: number;
      label: string;
    }>;
    feedback: {
      explanation: string;
      suggestions: string[];
      rephrased?: string;
    };
    contextAnalysis?: {
      flow: "positive" | "neutral" | "negative" | "escalating";
      patterns: string[];
      recommendations: string[];
    };
  };
}

const verdictVariants = cva("", {
  variants: {
    verdict: {
      GOOD: "bg-green-500",
      OK: "bg-blue-500",
      CAUTION: "bg-yellow-500",
      NOT_OK: "bg-orange-500",
      BAD: "bg-red-500",
    },
  },
  defaultVariants: {
    verdict: "OK",
  },
});

const severityBarVariants = cva("h-1.5 rounded-full transition-all duration-300", {
  variants: {
    level: {
      1: "w-[10%] bg-green-500",
      2: "w-[30%] bg-green-400",
      3: "w-[50%] bg-yellow-500",
      4: "w-[70%] bg-orange-500",
      5: "w-[90%] bg-red-500",
    },
  },
  defaultVariants: {
    level: 1,
  },
});

const timelineDotVariants = cva(
  "w-3 h-3 rounded-full border-4 border-background shrink-0 flex-shrink-0",
  {
    variants: {
      verdict: {
        GOOD: "bg-green-500 border-green-500",
        OK: "bg-blue-500 border-blue-500",
        CAUTION: "bg-yellow-500 border-yellow-500",
        NOT_OK: "bg-orange-500 border-orange-500",
        BAD: "bg-red-500 border-red-500",
      },
    },
    defaultVariants: {
      verdict: "OK",
    },
  }
);

interface ConversationTimelineProps {
  messages: TimelineMessage[];
  className?: string;
  showTimestamp?: boolean;
  maxPreviewLength?: number;
  isPro?: boolean;
}

export function ConversationTimeline({
  messages,
  className,
  showTimestamp = true,
  maxPreviewLength = 120,
  isPro = false,
}: ConversationTimelineProps) {
  // Only render for Pro users - Free tier users don't get conversation context analysis
  if (!isPro) {
    return null;
  }

  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (timestamp: Date | string) => {
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const getVerdictLabel = (verdict: TimelineMessage["analysis"]["verdict"]) => {
    const labels: Record<TimelineMessage["analysis"]["verdict"], string> = {
      GOOD: "Good",
      OK: "Appropriate",
      CAUTION: "Review Recommended",
      NOT_OK: "Likely Problematic",
      BAD: "Definitely Problematic",
    };
    return labels[verdict];
  };

  const getSeverityLabel = (level: number) => {
    const labels: Record<number, string> = {
      1: "Minimal",
      2: "Low",
      3: "Moderate",
      4: "High",
      5: "Severe",
    };
    return labels[level] || "Unknown";
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  if (messages.length === 0) {
    return (
      <div className={cn("text-center py-12 text-muted-foreground", className)}>
        <p className="text-sm">No messages in this conversation</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {messages.map((message, index) => {
        const isLast = index === messages.length - 1;
        const verdict = message.analysis.verdict;
        const severityLevel = message.analysis.severity.level;
        const isExpanded = expandedId === message.id;

        return (
          <div key={message.id} className="relative">
            {/* Timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-border" style={{ bottom: isLast ? 0 : "-1.5rem" }} />

            <div className="relative flex gap-4">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(timelineDotVariants({ verdict }), "relative z-10")}
                  role="img"
                  aria-label={`Message verdict: ${getVerdictLabel(verdict)}`}
                />
                {/* Connecting line handled by the absolute div above */}
              </div>

              {/* Message content */}
              <div className="flex-1 min-w-0">
                {/* Header with timestamp and verdict badge */}
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {showTimestamp && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                        {formatTimestamp(message.timestamp)}
                      </span>
                    )}
                    <Badge variant={verdict === "GOOD" || verdict === "OK" ? "success" : verdict === "CAUTION" ? "warning" : "destructive"}>
                      {getVerdictLabel(verdict)}
                    </Badge>
                  </div>
                  <button
                    onClick={() => toggleExpand(message.id)}
                    className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground shrink-0"
                    aria-label={isExpanded ? "Collapse message" : "Expand message"}
                    aria-expanded={isExpanded}
                  >
                    <svg
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isExpanded && "rotate-180"
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Message preview */}
                <div className="mb-3">
                  <p className="text-sm text-foreground line-clamp-2">{truncateText(message.text, maxPreviewLength)}</p>
                </div>

                {/* Severity bar */}
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Severity</span>
                    <span className="font-medium text-foreground">
                      {getSeverityLabel(severityLevel)} ({severityLevel}/5)
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full overflow-hidden">
                    <div className={severityBarVariants({ level: severityLevel })} />
                  </div>
                </div>

                {/* Categories preview */}
                {message.analysis.categories.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-1.5">
                    {message.analysis.categories.slice(0, 3).map((cat) => (
                      <Badge
                        key={cat.category}
                        variant="outline"
                        className="text-xs gap-1 h-5 px-2"
                      >
                        {cat.label}
                        <span className="text-muted-foreground">{(cat.score * 100).toFixed(0)}%</span>
                      </Badge>
                    ))}
                    {message.analysis.categories.length > 3 && (
                      <Badge variant="outline" className="text-xs h-5 px-2 text-muted-foreground">
                        +{message.analysis.categories.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Expanded content */}
                {isExpanded && (
                  <Card className="mt-4 border-border/50">
                    <CardContent className="pt-4">
                      <div className="space-y-4">
                        {/* Full message text */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Full Message
                          </h4>
                          <p className="text-sm text-foreground whitespace-pre-wrap bg-muted/50 p-3 rounded-lg">
                            {message.text}
                          </p>
                        </div>

                        {/* Detailed analysis */}
                        <div className="grid gap-4 sm:grid-cols-2">
                          {/* Confidence */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Confidence
                            </h4>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-primary h-full rounded-full transition-all duration-300"
                                  style={{ width: `${Math.round(message.analysis.confidence * 100)}%` }}
                                />
                              </div>
                              <span className="text-sm font-mono text-foreground">
                                {Math.round(message.analysis.confidence * 100)}%
                              </span>
                            </div>
                          </div>

                          {/* Severity detail */}
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Severity Level
                            </h4>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-secondary rounded-full h-2 overflow-hidden">
                                <div className={severityBarVariants({ level: severityLevel })} />
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {getSeverityLabel(severityLevel)}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* All categories */}
                        {message.analysis.categories.length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Detected Categories
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {message.analysis.categories.map((cat) => (
                                <Badge
                                  key={cat.category}
                                  variant="outline"
                                  className="text-xs gap-1.5 h-5 px-2.5"
                                >
                                  {cat.label}
                                  <span className="text-muted-foreground font-mono">
                                    {(cat.score * 100).toFixed(0)}%
                                  </span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Feedback */}
                        <div>
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                            Analysis
                          </h4>
                          <p className="text-sm text-foreground mb-3">{message.analysis.feedback.explanation}</p>

                          {message.analysis.feedback.suggestions.length > 0 && (
                            <div>
                              <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                Suggestions
                              </h5>
                              <ul className="space-y-1.5">
                                {message.analysis.feedback.suggestions.map((suggestion, i) => (
                                  <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                    <span className="text-muted-foreground shrink-0 mt-0.5">•</span>
                                    <span>{suggestion}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {message.analysis.feedback.rephrased && (
                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                              <h5 className="text-xs font-semibold text-green-800 dark:text-green-200 uppercase tracking-wider mb-1">
                                Suggested Rephrase
                              </h5>
                              <p className="text-sm text-green-700 dark:text-green-300 italic">
                                "{message.analysis.feedback.rephrased}"
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Context analysis */}
                        {message.analysis.contextAnalysis && (
                          <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                              Conversation Context
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <span className="text-xs font-medium text-muted-foreground">Flow: </span>
                                <Badge
                                  variant={
                                    message.analysis.contextAnalysis.flow === "positive"
                                      ? "success"
                                      : message.analysis.contextAnalysis.flow === "negative" ||
                                        message.analysis.contextAnalysis.flow === "escalating"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-xs capitalize"
                                >
                                  {message.analysis.contextAnalysis.flow}
                                </Badge>
                              </div>

                              {message.analysis.contextAnalysis.patterns.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    Patterns Detected
                                  </h5>
                                  <div className="flex flex-wrap gap-1.5">
                                    {message.analysis.contextAnalysis.patterns.map((pattern, i) => (
                                      <Badge key={i} variant="outline" className="text-xs h-5 px-2">
                                        {pattern}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {message.analysis.contextAnalysis.recommendations.length > 0 && (
                                <div>
                                  <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                    Recommendations
                                  </h5>
                                  <ul className="space-y-1">
                                    {message.analysis.contextAnalysis.recommendations.map((rec, i) => (
                                      <li key={i} className="text-sm text-foreground flex items-start gap-2">
                                        <span className="text-primary shrink-0 mt-0.5">→</span>
                                        <span>{rec}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

