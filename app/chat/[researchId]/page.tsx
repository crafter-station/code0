"use client";

import { ResearchDisplay } from "@/components/research-display";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
	MultiProviderResearchState,
	ResearchState,
} from "@/lib/research-types";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface ResearchResponse {
	type: "single" | "multi-provider";
	data: ResearchState | MultiProviderResearchState;
}

export default function ResearchPage() {
	const { researchId } = useParams();
	const [research, setResearch] = useState<ResearchResponse | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	// Poll for updates every 5 seconds
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!researchId) return;

		let retryCount = 0;
		const maxRetries = 12; // Try for 1 minute (5s * 12 = 60s)

		const fetchResearch = async () => {
			try {
				const response = await fetch(`/api/research/${researchId}`);

				if (!response.ok) {
					if (response.status === 404) {
						retryCount++;
						if (retryCount >= maxRetries) {
							setError("Research not found after multiple attempts");
							setIsLoading(false);
						}
						// Don't set error immediately for 404s - research might still be creating
						return;
					}
					setError("Failed to fetch research");
					setIsLoading(false);
					return;
				}

				const data: ResearchResponse = await response.json();
				setResearch(data);
				setIsLoading(false);
				retryCount = 0; // Reset retry count on success
			} catch (err) {
				setError(
					err instanceof Error ? err.message : "Failed to fetch research",
				);
				setIsLoading(false);
			}
		};

		// Initial load
		fetchResearch();

		// Set up polling interval
		const interval = setInterval(() => {
			// Keep polling if:
			// 1. No research found yet (might still be creating)
			// 2. Research exists but not completed/failed
			if (
				!research ||
				(research?.data.status !== "completed" &&
					research?.data.status !== "failed")
			) {
				fetchResearch();
			}
		}, 5000);

		return () => clearInterval(interval);
	}, [researchId, research?.data.status]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<div className="text-center">
						<p className="text-muted-foreground">Loading research...</p>
						<p className="mt-2 text-muted-foreground text-sm">
							{researchId &&
							typeof researchId === "string" &&
							researchId.startsWith("multi_research_")
								? "Initializing AI models for Ultra Deep Research..."
								: "Loading research data..."}
						</p>
					</div>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Card className="max-w-md p-6">
					<div className="mb-4 flex items-center gap-3 text-destructive">
						<AlertCircle className="h-5 w-5" />
						<h2 className="font-semibold">Error</h2>
					</div>
					<p className="mb-4 text-muted-foreground">{error}</p>
					<Link href="/">
						<Button variant="outline" className="w-full">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Home
						</Button>
					</Link>
				</Card>
			</div>
		);
	}

	if (!research) return null;

	return <ResearchDisplay researchType={research.type} data={research.data} />;
}
