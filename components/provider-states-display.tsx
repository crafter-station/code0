"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AnthropicIcon, 
  GeminiIcon, 
  OpenAIIcon, 
  XAIIcon 
} from "@/components/icons";
import { Clock, Activity, CheckCircle, XCircle, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProviderState {
  name: string;
  status: "planning" | "searching" | "reflecting" | "writing" | "completed" | "failed";
  iterations: number;
  hasReport: boolean;
  lastUpdated: string;
}

interface ResearchState {
  researchId: string;
  query: string;
  overallStatus: "planning" | "searching" | "analyzing" | "completed" | "failed";
  depth: "quick" | "surface" | "deep" | "comprehensive";
  providers: ProviderState[];
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse {
  success: boolean;
  data: ResearchState[];
  timestamp: string;
  error?: string;
}

const ProviderIcons = {
  openai: OpenAIIcon,
  anthropic: AnthropicIcon,
  google: GeminiIcon,
  xai: XAIIcon,
} as const;

const StatusColors = {
  planning: "bg-blue-500",
  searching: "bg-yellow-500",
  reflecting: "bg-purple-500",
  writing: "bg-orange-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
  analyzing: "bg-indigo-500",
} as const;

const StatusIcons = {
  planning: RefreshCw,
  searching: Activity,
  reflecting: RefreshCw,
  writing: RefreshCw,
  completed: CheckCircle,
  failed: XCircle,
  analyzing: Activity,
} as const;

function getProgressValue(status: string): number {
  switch (status) {
    case "planning": return 20;
    case "searching": return 40;
    case "reflecting": return 60;
    case "writing": return 80;
    case "completed": return 100;
    case "failed": return 0;
    default: return 0;
  }
}

function formatTimeAgo(timestamp: string): string {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
}

export function ProviderStatesDisplay() {
  const [states, setStates] = useState<ResearchState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const fetchStates = async () => {
    try {
      const response = await fetch("/api/providers/states");
      const data: ApiResponse = await response.json();
      
      if (data.success) {
        setStates(data.data);
        setLastUpdate(data.timestamp);
        setError(null);
      } else {
        setError(data.error || "Failed to fetch provider states");
      }
    } catch (err) {
      setError("Network error while fetching provider states");
      console.error("Failed to fetch provider states:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchStates();
    
    // Set up polling every 5 seconds
    const interval = setInterval(fetchStates, 5000);
    
    // Cleanup interval on unmount
    return () => clearInterval(interval);
  }, []);

  if (loading && states.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>Loading provider states...</span>
        </div>
      </div>
    );
  }

  if (error && states.length === 0) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (states.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center text-muted-foreground">
          <Activity className="h-8 w-8 mx-auto mb-2" />
          <p>No active ultra deep research sessions</p>
          <p className="text-sm">Start a multi-provider research to see real-time states</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Ultra Deep Research - Live States</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of AI provider generation states
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last updated: {lastUpdate ? formatTimeAgo(lastUpdate) : "Never"}</span>
        </div>
      </div>

      <div className="space-y-6">
        {states.map((research) => (
          <Card key={research.researchId} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{research.query}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="capitalize">
                      {research.depth} research
                    </Badge>
                    <Badge 
                      variant="secondary" 
                      className={cn(
                        "text-white",
                        StatusColors[research.overallStatus]
                      )}
                    >
                      {research.overallStatus}
                    </Badge>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Started {formatTimeAgo(research.createdAt)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {research.providers.map((provider) => {
                  const IconComponent = ProviderIcons[provider.name as keyof typeof ProviderIcons];
                  const StatusIcon = StatusIcons[provider.status];
                  const progress = getProgressValue(provider.status);
                  
                  return (
                    <Card key={provider.name} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        {IconComponent && (
                          <IconComponent className="h-6 w-6" />
                        )}
                        <div>
                          <div className="font-medium capitalize">{provider.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Iteration {provider.iterations}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <StatusIcon 
                            className={cn(
                              "h-4 w-4",
                              provider.status === "completed" ? "text-green-600" :
                              provider.status === "failed" ? "text-red-600" :
                              "text-blue-600"
                            )}
                          />
                          <span className="text-sm capitalize">{provider.status}</span>
                        </div>
                        
                        <Progress value={progress} className="h-2" />
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{provider.hasReport ? "Report ready" : "Generating..."}</span>
                          <span>{formatTimeAgo(provider.lastUpdated)}</span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}