// src/app/(dashboard)/history/page.tsx
// History page with previous analyses and new session capability

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Clock,
  Plus,
  Search,
  Filter,
} from "lucide-react";

interface Analysis {
  id: string;
  verdict: "GOOD" | "OK" | "CAUTION" | "NOT_OK" | "BAD";
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
  charCount: number;
  isConversation: boolean;
  createdAt: string;
  inputText: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const verdictConfig = {
  GOOD: { color: "bg-green-100 text-green-800", label: "Good" },
  OK: { color: "bg-blue-100 text-blue-800", label: "OK" },
  CAUTION: { color: "bg-yellow-100 text-yellow-800", label: "Caution" },
  NOT_OK: { color: "bg-red-100 text-red-800", label: "Not OK" },
  BAD: { color: "bg-red-200 text-red-900", label: "Bad" },
};

export default function HistoryPage() {
  const router = useRouter();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterVerdict, setFilterVerdict] = useState<string>("all");

  const fetchHistory = useCallback(async (page = 1) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (searchQuery) params.set("search", searchQuery);
      if (filterVerdict !== "all") params.set("verdict", filterVerdict);

      const response = await fetch(`/api/history?${params}`);
      if (!response.ok) throw new Error("Failed to fetch history");

      const data = await response.json();
      setAnalyses(data.analyses);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setIsLoading(false);
    }
  }, [filterVerdict, searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams({ page: "1", limit: "20" });
    if (searchQuery) params.set("search", searchQuery);
    if (filterVerdict !== "all") params.set("verdict", filterVerdict);

    const controller = new AbortController();
    fetch(`/api/history?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch history");
        return response.json() as Promise<{
          analyses: Analysis[];
          pagination: Pagination;
        }>;
      })
      .then((data) => {
        setAnalyses(data.analyses);
        setPagination(data.pagination);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Failed to fetch history:", error);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [searchQuery, filterVerdict]);

  const handleNewAnalysis = () => {
    router.push("/dashboard/analyze");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this analysis?")) return;
    try {
      const response = await fetch(`/api/history/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete");
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete analysis");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateText = (text: string, maxLength = 80) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + "...";
  };

  const filteredAnalyses = analyses;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analysis History</h1>
          <p className="text-muted-foreground mt-1">
            Review your past tone analyses and start new sessions.
          </p>
        </div>
        <Button onClick={handleNewAnalysis} className="gap-2">
          <Plus className="h-4 w-4" />
          New Analysis
        </Button>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search analyses..."
                value={searchQuery}
                onChange={(e) => {
                  setIsLoading(true);
                  setSearchQuery(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={filterVerdict}
                onChange={(e) => {
                  setIsLoading(true);
                  setFilterVerdict(e.target.value);
                }}
                className="pl-10 pr-8 py-2 border border-input bg-background rounded-md text-sm appearance-none"
              >
                <option value="all">All Verdicts</option>
                <option value="GOOD">Good</option>
                <option value="OK">OK</option>
                <option value="CAUTION">Caution</option>
                <option value="NOT_OK">Not OK</option>
                <option value="BAD">Bad</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History List */}
      <Card>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="py-12 text-center">
              <div className="inline-flex items-center gap-2 text-muted-foreground">
                <div className="h-5 w-5 animate-spin border-2 border-primary border-t-transparent rounded-full" />
                <span>Loading history...</span>
              </div>
            </div>
          ) : filteredAnalyses.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-medium mb-2">No analyses yet</h3>
              <p className="text-muted-foreground mb-6">
                Start analyzing your messages to build your history.
              </p>
              <Button onClick={handleNewAnalysis} className="gap-2">
                <Plus className="h-4 w-4" />
                Create First Analysis
              </Button>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {filteredAnalyses.map((analysis) => {
                  const vConfig = verdictConfig[analysis.verdict];
                  const preview = truncateText(analysis.inputText);
                  return (
                    <Link
                      key={analysis.id}
                      href={`/dashboard/analyze?id=${analysis.id}`}
                      className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors group"
                    >
                      <div className={cn("flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center", vConfig.color)}>
                        <Badge variant="outline" className="text-xs">
                          {vConfig.label}
                        </Badge>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium truncate pr-4">{preview}</p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {analysis.charCount} chars
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(analysis.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-600"
                              aria-label="Delete analysis"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(analysis.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            {analysis.severity.level}/5 severity
                          </span>
                          {analysis.isConversation && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              Conversation
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsLoading(true);
                        void fetchHistory(pagination.page - 1);
                      }}
                      disabled={pagination.page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsLoading(true);
                        void fetchHistory(pagination.page + 1);
                      }}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}