// @ts-nocheck
"use client";

import {
	AnthropicIcon,
	GeminiIcon,
	OpenAIIcon,
	XAIIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AI_PROVIDERS, type ProviderName } from "@/lib/ai-providers";
import type {
	MultiProviderResearchState,
	ResearchState,
} from "@/lib/research-types";
import {
	AlertCircle,
	ArrowLeft,
	CheckCircle,
	Clock,
	Copy,
	Download,
	Loader2,
} from "lucide-react";
import Link from "next/link";

const ProviderIcons: Record<
	ProviderName,
	React.ComponentType<{ className?: string }>
> = {
	openai: OpenAIIcon,
	anthropic: AnthropicIcon,
	google: GeminiIcon,
	xai: XAIIcon,
};

interface ResearchDisplayProps {
	researchType: "single" | "multi-provider";
	data: ResearchState | MultiProviderResearchState;
}

export function ResearchDisplay({ researchType, data }: ResearchDisplayProps) {
	if (researchType === "single") {
		return <SingleResearchDisplay data={data as ResearchState} />;
	}

	return (
		<MultiProviderResearchDisplay data={data as MultiProviderResearchState} />
	);
}

function SingleResearchDisplay({ data }: { data: ResearchState }) {
	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "processing":
			case "searching":
			case "analyzing":
				return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
			case "failed":
				return <AlertCircle className="h-4 w-4 text-red-500" />;
			default:
				return <Clock className="h-4 w-4 text-muted-foreground" />;
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
								<h1 className="font-semibold text-lg">Research Report</h1>
								<p className="max-w-md truncate text-muted-foreground text-sm">
									{data.originalQuery}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							{data.status === "completed" && (
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

			{/* Content */}
			<div className="container mx-auto px-4 py-6">
				<div className="grid gap-6 lg:grid-cols-4">
					{/* Status Sidebar */}
					<div className="lg:col-span-1">
						<Card className="sticky top-24 p-6">
							<h2 className="mb-4 flex items-center gap-2 font-semibold">
								{getStatusIcon(data.status)}
								Status
							</h2>
							<div className="space-y-3">
								<div>
									<div className="mb-1 text-muted-foreground text-xs">
										Status
									</div>
									<div className="font-medium text-sm capitalize">
										{data.status}
									</div>
								</div>
								<div>
									<div className="mb-1 text-muted-foreground text-xs">
										Iterations
									</div>
									<div className="font-medium text-sm">{data.iterations}</div>
								</div>
								<div>
									<div className="mb-1 text-muted-foreground text-xs">
										Sources
									</div>
									<div className="font-medium text-sm">
										{data.searchResults?.length || 0}
									</div>
								</div>
								<div>
									<div className="mb-1 text-muted-foreground text-xs">
										Knowledge Gaps
									</div>
									<div className="font-medium text-sm">
										{data.knowledgeGaps?.length || 0}
									</div>
								</div>
							</div>
						</Card>
					</div>

					{/* Main Content */}
					<div className="lg:col-span-3">
						{data.finalReport ? (
							<Card className="p-6">
								<h3 className="mb-4 font-semibold text-lg">Research Report</h3>
								<div className="prose prose-sm max-w-none">
									<div className="whitespace-pre-wrap leading-relaxed">
										{data.finalReport}
									</div>
								</div>
							</Card>
						) : (
							<Card className="border-dashed p-6">
								<div className="flex items-center gap-3">
									<Loader2 className="h-4 w-4 animate-spin" />
									<span className="text-muted-foreground">
										Research in progress...
									</span>
								</div>
							</Card>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

function MultiProviderResearchDisplay({
	data,
}: { data: MultiProviderResearchState }) {
	const getStatusIcon = (status: string) => {
		switch (status) {
			case "completed":
				return <CheckCircle className="h-4 w-4 text-green-500" />;
			case "processing":
			case "searching":
			case "analyzing":
				return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
			case "failed":
				return <AlertCircle className="h-4 w-4 text-red-500" />;
			default:
				return <Clock className="h-4 w-4 text-muted-foreground" />;
		}
	};

	const providers = data.providers || [];
	const hasConsolidatedReport = data.consolidatedReport;

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
									{data.originalQuery}
								</p>
							</div>
						</div>
						<div className="flex items-center gap-2">
							{data.status === "completed" && (
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

			{/* Content */}
			<div className="container mx-auto px-4 py-6">
				<div className="grid gap-6 lg:grid-cols-4">
					{/* Status Sidebar */}
					<div className="lg:col-span-1">
						<Card className="sticky top-24 p-6">
							<h2 className="mb-4 flex items-center gap-2 font-semibold">
								{getStatusIcon(data.status)}
								Progress
							</h2>

							<div className="mb-6">
								<div className="mb-2 text-muted-foreground text-xs">
									Overall Status
								</div>
								<div className="font-medium text-sm capitalize">
									{data.status}
								</div>
							</div>

							{/* Provider Status */}
							<div className="space-y-4">
								<h3 className="font-medium text-sm">AI Models</h3>
								{providers.map((provider) => {
									const providerName = provider as ProviderName;
									const IconComponent = ProviderIcons[providerName];
									const providerResult = data.providerResults?.[provider];
									const status = providerResult?.status || "planning";

									return (
										<div
											key={provider}
											className="flex items-center justify-between"
										>
											<div className="flex items-center gap-2">
												{IconComponent && <IconComponent className="h-4 w-4" />}
												<span className="font-medium text-sm">
													{AI_PROVIDERS[providerName]?.name || provider}
												</span>
											</div>
											{getStatusIcon(status)}
										</div>
									);
								})}
							</div>
						</Card>
					</div>

					{/* Main Content with Tabs */}
					<div className="lg:col-span-3">
						<Tabs
							defaultValue={
								hasConsolidatedReport ? "consolidated" : providers[0]
							}
							className="w-full"
						>
							<TabsList
								className="mb-6 grid w-full grid-cols-auto"
								style={{
									gridTemplateColumns: `repeat(${hasConsolidatedReport ? providers.length + 1 : providers.length}, minmax(0, 1fr))`,
								}}
							>
								{hasConsolidatedReport && (
									<TabsTrigger
										value="consolidated"
										className="flex items-center gap-2"
									>
										<CheckCircle className="h-4 w-4" />
										Consolidated Report
									</TabsTrigger>
								)}
								{providers.map((provider) => {
									const providerName = provider as ProviderName;
									const IconComponent = ProviderIcons[providerName];
									return (
										<TabsTrigger
											key={provider}
											value={provider}
											className="flex items-center gap-2"
										>
											{IconComponent && <IconComponent className="h-4 w-4" />}
											{AI_PROVIDERS[providerName]?.name || provider}
										</TabsTrigger>
									);
								})}
							</TabsList>

							{/* Consolidated Report Tab */}
							{hasConsolidatedReport && (
								<TabsContent value="consolidated">
									<Card className="border-green-200 bg-green-50/50 p-6">
										<div className="mb-4 flex items-center gap-2">
											<CheckCircle className="h-5 w-5 text-green-500" />
											<h3 className="font-semibold text-green-900">
												Consolidated Ultra Deep Research Report
											</h3>
										</div>
										<div className="prose prose-sm max-w-none">
											<div className="whitespace-pre-wrap text-foreground leading-relaxed">
												{data.consolidatedReport}
											</div>
										</div>
									</Card>
								</TabsContent>
							)}

							{/* Individual Provider Tabs */}
							{providers.map((provider) => {
								const providerResult = data.providerResults?.[provider];
								const providerName = provider as ProviderName;
								const IconComponent = ProviderIcons[providerName];

								return (
									<TabsContent key={provider} value={provider}>
										<Card className="p-6">
											<div className="mb-4 flex items-center gap-2">
												{IconComponent && <IconComponent className="h-5 w-5" />}
												<h3 className="font-semibold">
													{AI_PROVIDERS[providerName]?.name || provider}{" "}
													Analysis
												</h3>
												{getStatusIcon(providerResult?.status || "planning")}
											</div>

											{providerResult?.finalReport ? (
												<div className="prose prose-sm max-w-none">
													<div className="whitespace-pre-wrap leading-relaxed">
														{providerResult.finalReport}
													</div>
												</div>
											) : (
												<div className="flex items-center gap-3 text-muted-foreground">
													<Loader2 className="h-4 w-4 animate-spin" />
													<span>
														{providerResult?.status === "completed"
															? "Analysis complete, waiting for final report..."
															: "Research in progress..."}
													</span>
												</div>
											)}

											{/* Provider Info */}
											<div className="mt-6 border-border border-t pt-4">
												<div className="text-muted-foreground text-sm">
													<strong>Strengths:</strong>{" "}
													{AI_PROVIDERS[providerName]?.strengths.join(", ")}
												</div>
												{providerResult && (
													<div className="mt-2 grid grid-cols-3 gap-4 text-sm">
														<div>
															<div className="text-muted-foreground text-xs">
																Iterations
															</div>
															<div className="font-medium">
																{providerResult.iterations}
															</div>
														</div>
														<div>
															<div className="text-muted-foreground text-xs">
																Sources
															</div>
															<div className="font-medium">
																{providerResult.searchResults?.length || 0}
															</div>
														</div>
														<div>
															<div className="text-muted-foreground text-xs">
																Knowledge Gaps
															</div>
															<div className="font-medium">
																{providerResult.knowledgeGaps?.length || 0}
															</div>
														</div>
													</div>
												)}
											</div>
										</Card>
									</TabsContent>
								);
							})}
						</Tabs>
					</div>
				</div>
			</div>
		</div>
	);
}
