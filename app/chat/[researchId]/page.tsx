"use client";

import { pollResearchProgress } from "@/app/actions/polling-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle,
	Clock,
	Copy,
	Download,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

interface ProviderStatus {
	provider: string;
	status: "pending" | "processing" | "completed" | "error";
	progress?: string;
	result?: string;
	error?: string;
}

interface ResearchProgress {
	id: string;
	query: string;
	status:
		| "initializing"
		| "searching"
		| "processing"
		| "synthesizing"
		| "completed"
		| "error";
	providers: ProviderStatus[];
	currentStep?: string;
	completedSteps: string[];
	finalReport?: string;
	createdAt: string;
	updatedAt: string;
}

export default function ResearchPage() {
	const { researchId } = useParams();
	const [progress, setProgress] = useState<ResearchProgress | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const scrollRef = useRef<HTMLDivElement>(null);

	// Poll for updates every 2 seconds
	useEffect(() => {
		if (!researchId) return;

		const pollProgress = async () => {
			try {
				const result = await pollResearchProgress(researchId as string);

				if (!result.success) {
					setError(result.error || "Failed to fetch research progress");
					setIsLoading(false);
					return;
				}

				if (!result.data) {
					setError("No data received from research progress");
					setIsLoading(false);
					return;
				}

				const progressData: ResearchProgress = {
					id: result.data.id,
					query: result.data.query,
					status: result.data.status as ResearchProgress["status"],
					providers: result.data.providers,
					currentStep: result.data.currentStep,
					completedSteps: result.data.completedSteps,
					finalReport: result.data.finalReport,
					createdAt: result.data.createdAt,
					updatedAt: result.data.updatedAt,
				};

				setProgress(progressData);
				setIsLoading(false);
			} catch (err) {
				setError(
					err instanceof Error
						? err.message
						: "Failed to fetch research progress",
				);
				setIsLoading(false);
			}
		};

		// Initial load
		pollProgress();

		// Set up polling interval (every 5 seconds as requested)
		const interval = setInterval(pollProgress, 5000);

		return () => clearInterval(interval);
	}, [researchId]);

	// Auto-scroll to bottom when new content appears
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [progress?.updatedAt]);

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
					<p className="text-muted-foreground">Initializing research...</p>
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

	if (!progress) return null;

	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "processing":
				return (
					<div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
				);
			case "error":
				return <AlertCircle className="h-4 w-4 text-red-500" />;
			default:
				return <Clock className="h-4 w-4 text-muted-foreground" />;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "completed":
				return "text-green-500";
			case "processing":
				return "text-blue-500";
			case "error":
				return "text-red-500";
			default:
				return "text-muted-foreground";
		}
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Header */}
			<div className="sticky top-0 z-50 border-border border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container mx-auto px-4 py-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Link href="/">
								<Button variant="ghost" size="sm">
									<ArrowLeft className="mr-2 h-4 w-4" />
									Back
								</Button>
							</Link>
							<div>
								<h1 className="font-semibold text-lg">Ultra Deep Research</h1>
								<p className="max-w-md truncate text-muted-foreground text-sm">
									{progress.query}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							{progress.status === "completed" && (
								<>
									<Button variant="outline" size="sm">
										<Copy className="mr-2 h-4 w-4" />
										Copy
									</Button>
									<Button variant="outline" size="sm">
										<Download className="mr-2 h-4 w-4" />
										Export
									</Button>
								</>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Main Content */}
			<div className="container mx-auto px-4 py-6">
				<div className="grid gap-6 lg:grid-cols-3">
					{/* Progress Sidebar */}
					<div className="lg:col-span-1">
						<Card className="sticky top-24 p-6">
							<h2 className="mb-4 flex items-center gap-2 font-semibold">
								{getStatusIcon(progress.status)}
								Research Progress
							</h2>

							{/* Overall Status */}
							<div className="mb-6">
								<div className="mb-2 flex items-center justify-between">
									<span className="font-medium text-sm">Status</span>
									<span
										className={`font-medium text-sm ${getStatusColor(progress.status)}`}
									>
										{progress.status.charAt(0).toUpperCase() +
											progress.status.slice(1)}
									</span>
								</div>
								{progress.currentStep && (
									<p className="text-muted-foreground text-xs">
										{progress.currentStep}
									</p>
								)}
							</div>

							{/* Provider Status */}
							<div className="space-y-4">
								<h3 className="font-medium text-sm">AI Providers</h3>
								{progress.providers.map((provider, index) => (
									<div key={provider.provider} className="space-y-2">
										<div className="flex items-center justify-between">
											<span className="font-medium text-sm">
												{provider.provider}
											</span>
											{getStatusIcon(provider.status)}
										</div>
										{provider.progress && (
											<p className="text-muted-foreground text-xs">
												{provider.progress}
											</p>
										)}
										{provider.status === "completed" && (
											<div className="rounded bg-green-50 p-2 text-green-600 text-xs">
												✓ Analysis complete
											</div>
										)}
									</div>
								))}
							</div>

							{/* Completed Steps */}
							{progress.completedSteps.length > 0 && (
								<div className="mt-6">
									<h3 className="mb-3 font-medium text-sm">Completed Steps</h3>
									<div className="space-y-2">
										{progress.completedSteps.map((step, index) => (
											<div
												key={`${step}-${
													// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
													index
												}`}
												className="flex items-center gap-2 text-sm"
											>
												<CheckCircle className="h-3 w-3 text-green-500" />
												<span className="text-muted-foreground">{step}</span>
											</div>
										))}
									</div>
								</div>
							)}
						</Card>
					</div>

					{/* Results Area */}
					<div className="lg:col-span-2">
						<div
							ref={scrollRef}
							className="max-h-[calc(100vh-200px)] space-y-4 overflow-y-auto"
						>
							{/* Live Results */}
							{progress.providers.map(
								(provider, index) =>
									provider.result && (
										<Card key={provider.provider} className="p-6">
											<div className="mb-4 flex items-center gap-2">
												<div className="h-2 w-2 rounded-full bg-green-500" />
												<h3 className="font-semibold">
													{provider.provider} Results
												</h3>
												<span className="text-muted-foreground text-xs">
													{new Date().toLocaleTimeString()}
												</span>
											</div>
											<div className="prose prose-sm max-w-none">
												<p className="text-muted-foreground leading-relaxed">
													{provider.result}
												</p>
											</div>
										</Card>
									),
							)}

							{/* Final Report */}
							{progress.finalReport && (
								<Card className="border-green-200 bg-green-50/50 p-6">
									<div className="mb-4 flex items-center gap-2">
										<CheckCircle className="h-5 w-5 text-green-500" />
										<h3 className="font-semibold text-green-900">
											Ultra Deep Research Report
										</h3>
									</div>
									<div className="prose prose-sm max-w-none">
										<div className="whitespace-pre-wrap text-foreground leading-relaxed">
											{progress.finalReport}
										</div>
									</div>
								</Card>
							)}

							{/* Processing Animation */}
							{progress.status !== "completed" && (
								<Card className="border-dashed p-6">
									<div className="flex items-center gap-3">
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
										<span className="text-muted-foreground">
											Research in progress... New results will appear here
											automatically
										</span>
									</div>
								</Card>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
