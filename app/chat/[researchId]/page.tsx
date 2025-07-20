import { ResearchDisplay } from "@/components/research-display";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getMultiProviderResearchState, getResearchState } from "@/lib/redis";
import type {
	KnowledgeGap,
	MultiProviderResearchState,
	ResearchPlan,
	ResearchState,
	SearchResult,
} from "@/lib/research-types";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ResearchResponse {
	type: "single" | "multi-provider";
	data: ResearchState | MultiProviderResearchState;
}

interface ResearchPageProps {
	params: Promise<{ researchId: string }>;
}

async function fetchResearchData(
	researchId: string,
): Promise<ResearchResponse | null> {
	try {
		// Check if it's a multi-provider research (starts with "multi_research_")
		if (researchId.startsWith("multi_research_")) {
			const multiState = await getMultiProviderResearchState(researchId);
			if (multiState) {
				console.log(
					"Original multi-provider state:",
					JSON.stringify(multiState.providerResults, null, 2),
				);

				// The issue is that providerResults are not being populated with actual data
				// Let's fetch the individual research entries and populate the provider results
				const enhancedProviderResults: Record<
					string,
					{
						provider: string;
						plan?: ResearchPlan;
						searchResults: SearchResult[];
						knowledgeGaps: KnowledgeGap[];
						finalReport?: string;
						status:
							| "planning"
							| "searching"
							| "reflecting"
							| "writing"
							| "completed"
							| "failed";
						iterations: number;
						createdAt: string;
						updatedAt: string;
					}
				> = {};

				// First, let's get all research keys to find related individual research
				const { redis } = await import("@/lib/redis");
				const allResearchKeys = await redis.keys("research:*");
				console.log("All research keys:", allResearchKeys);

				// Extract the base ID from multi-provider research ID
				const baseId = researchId
					.replace("multi_research_", "")
					.replace("run_", "");
				console.log("Base ID to search for:", baseId);

				for (const provider of multiState.providers) {
					// Try different patterns to find the individual research
					const possiblePatterns = [
						`research:research_run_${provider}_${baseId}`,
						`research:research_run_${baseId}`, // Generic pattern
						`research:${provider}_${baseId}`,
						`research:run_${provider}_${baseId}`,
					];

					let individualState = null;
					let foundKey = null;

					// Try exact patterns first
					for (const pattern of possiblePatterns) {
						const keyWithoutPrefix = pattern.replace("research:", "");
						try {
							individualState = await getResearchState(keyWithoutPrefix);
							if (individualState) {
								foundKey = keyWithoutPrefix;
								console.log(
									`Found individual research for ${provider} with key: ${foundKey}`,
								);
								break;
							}
						} catch (_error) {
							console.log(`Pattern ${pattern} not found for ${provider}`);
						}
					}

					// If no exact match, search through all keys for potential matches
					if (!individualState) {
						for (const key of allResearchKeys) {
							const keyId = key.replace("research:", "");
							if (keyId.includes(baseId) || keyId.includes(provider)) {
								try {
									const testState = await getResearchState(keyId);
									if (
										testState &&
										testState.originalQuery === multiState.originalQuery
									) {
										individualState = testState;
										foundKey = keyId;
										console.log(
											`Found matching research for ${provider} with key: ${foundKey} (by content match)`,
										);
										break;
									}
								} catch (_error) {
									console.log(`Error checking key ${keyId}:`, _error);
								}
							}
						}
					}

					if (individualState) {
						enhancedProviderResults[provider] = {
							provider,
							plan: individualState.plan,
							searchResults: individualState.searchResults,
							knowledgeGaps: individualState.knowledgeGaps,
							finalReport: individualState.finalReport,
							status: individualState.status,
							iterations: individualState.iterations,
							createdAt: individualState.createdAt,
							updatedAt: individualState.updatedAt,
						};
						console.log(`Enhanced provider result for ${provider}:`, {
							status: individualState.status,
							sources: individualState.searchResults?.length || 0,
							hasReport: !!individualState.finalReport,
						});
					} else {
						// Use existing provider result or create placeholder
						const existingResult = multiState.providerResults?.[provider];
						enhancedProviderResults[provider] = existingResult || {
							provider,
							plan: undefined,
							searchResults: [],
							knowledgeGaps: [],
							finalReport: undefined,
							status: "planning" as const,
							iterations: 0,
							createdAt: new Date().toISOString(),
							updatedAt: new Date().toISOString(),
						};
						console.log(
							`No individual research found for ${provider}, using placeholder`,
						);
					}
				}

				console.log(
					"Enhanced provider results:",
					JSON.stringify(enhancedProviderResults, null, 2),
				);

				return {
					type: "multi-provider",
					data: {
						...multiState,
						providerResults: enhancedProviderResults,
					},
				};
			}
		}

		// Check if it's a regular research (starts with "research_")
		if (researchId.startsWith("research_")) {
			const state = await getResearchState(researchId);
			if (state) {
				return {
					type: "single",
					data: state,
				};
			}
		}

		// Try both if no clear prefix
		const [multiState, singleState] = await Promise.all([
			getMultiProviderResearchState(researchId),
			getResearchState(researchId),
		]);

		if (multiState) {
			console.log(
				"Multi-provider state (no prefix):",
				JSON.stringify(multiState, null, 2),
			);

			// Apply same enhancement logic for fallback case
			const enhancedProviderResults: Record<
				string,
				{
					provider: string;
					plan?: ResearchPlan;
					searchResults: SearchResult[];
					knowledgeGaps: KnowledgeGap[];
					finalReport?: string;
					status:
						| "planning"
						| "searching"
						| "reflecting"
						| "writing"
						| "completed"
						| "failed";
					iterations: number;
					createdAt: string;
					updatedAt: string;
				}
			> = {};
			const { redis } = await import("@/lib/redis");
			const allResearchKeys = await redis.keys("research:*");
			const baseId = researchId;

			for (const provider of multiState.providers) {
				let individualState = null;

				// Search through all keys for potential matches
				for (const key of allResearchKeys) {
					const keyId = key.replace("research:", "");
					if (keyId.includes(baseId) || keyId.includes(provider)) {
						try {
							const testState = await getResearchState(keyId);
							if (
								testState &&
								testState.originalQuery === multiState.originalQuery
							) {
								individualState = testState;
								console.log(
									`Found matching research (fallback) for ${provider} with key: ${keyId}`,
								);
								break;
							}
						} catch (_error) {
							// Continue searching
						}
					}
				}

				if (individualState) {
					enhancedProviderResults[provider] = {
						provider,
						plan: individualState.plan,
						searchResults: individualState.searchResults,
						knowledgeGaps: individualState.knowledgeGaps,
						finalReport: individualState.finalReport,
						status: individualState.status,
						iterations: individualState.iterations,
						createdAt: individualState.createdAt,
						updatedAt: individualState.updatedAt,
					};
				} else {
					const existingResult = multiState.providerResults?.[provider];
					enhancedProviderResults[provider] = existingResult || {
						provider,
						plan: undefined,
						searchResults: [],
						knowledgeGaps: [],
						finalReport: undefined,
						status: "planning" as const,
						iterations: 0,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};
				}
			}

			return {
				type: "multi-provider",
				data: {
					...multiState,
					providerResults: enhancedProviderResults,
				},
			};
		}

		if (singleState) {
			return {
				type: "single",
				data: singleState,
			};
		}

		return null;
	} catch (_error) {
		console.error("Failed to fetch research:", _error);
		return null;
	}
}

export default async function ResearchPage({ params }: ResearchPageProps) {
	const { researchId } = await params;
	const research = await fetchResearchData(researchId);

	if (!research) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Card className="max-w-md p-6">
					<div className="mb-4 flex items-center gap-3 text-destructive">
						<AlertCircle className="h-5 w-5" />
						<h2 className="font-semibold">Error</h2>
					</div>
					<p className="mb-4 text-muted-foreground">Research not found</p>
					<Link href="/chat">
						<Button variant="outline" className="w-full">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Home
						</Button>
					</Link>
				</Card>
			</div>
		);
	}

	return (
		<ResearchDisplay
			researchType={research.type}
			data={research.data}
			researchId={researchId}
		/>
	);
}
