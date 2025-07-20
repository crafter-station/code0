import { getMultiProviderResearchState, getResearchState } from "@/lib/redis";
import type {
	KnowledgeGap,
	ResearchPlan,
	SearchResult,
} from "@/lib/research-types";
import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ researchId: string }> },
) {
	const { researchId } = await params;
	console.log("API: Looking for research with ID:", researchId);

	try {
		// Check if it's a multi-provider research (starts with "multi_research_")
		if (researchId.startsWith("multi_research_")) {
			console.log("API: Checking multi-provider research for:", researchId);
			const multiState = await getMultiProviderResearchState(researchId);

			if (!multiState) {
				console.log("API: Multi-provider research not found:", researchId);
				return NextResponse.json(
					{ error: "Multi-provider research not found" },
					{ status: 404 },
				);
			}

			console.log(
				"API: Original provider results:",
				JSON.stringify(multiState.providerResults, null, 2),
			);

			// Enhance provider results with actual individual research data
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

			// Get all research keys to find related individual research
			const { redis } = await import("@/lib/redis");
			const allResearchKeys = await redis.keys("research:*");

			// Extract the base ID from multi-provider research ID
			const baseId = researchId
				.replace("multi_research_", "")
				.replace("run_", "");
			console.log("API: Base ID to search for:", baseId);

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
								`API: Found individual research for ${provider} with key: ${foundKey}`,
							);
							break;
						}
					} catch (error) {
						// Pattern not found, continue
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
										`API: Found matching research for ${provider} with key: ${foundKey} (by content match)`,
									);
									break;
								}
							} catch (error) {
								// Continue searching
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
					console.log(`API: Enhanced provider result for ${provider}:`, {
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
						`API: No individual research found for ${provider}, using placeholder`,
					);
				}
			}

			console.log("API: Found multi-provider research:", researchId);
			return NextResponse.json({
				type: "multi-provider",
				data: {
					...multiState,
					providerResults: enhancedProviderResults,
				},
			});
		}

		// Check if it's a regular research (starts with "research_")
		if (researchId.startsWith("research_")) {
			const state = await getResearchState(researchId);

			if (!state) {
				return NextResponse.json(
					{ error: "Research not found" },
					{ status: 404 },
				);
			}

			return NextResponse.json({
				type: "single",
				data: state,
			});
		}

		// Try both if no clear prefix
		const [multiState, singleState] = await Promise.all([
			getMultiProviderResearchState(researchId),
			getResearchState(researchId),
		]);

		if (multiState) {
			console.log(
				"API: Found multi-provider research (no prefix):",
				researchId,
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
									`API: Found matching research (fallback) for ${provider} with key: ${keyId}`,
								);
								break;
							}
						} catch (error) {
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

			return NextResponse.json({
				type: "multi-provider",
				data: {
					...multiState,
					providerResults: enhancedProviderResults,
				},
			});
		}

		if (singleState) {
			return NextResponse.json({
				type: "single",
				data: singleState,
			});
		}

		return NextResponse.json({ error: "Research not found" }, { status: 404 });
	} catch (error) {
		console.error("Failed to fetch research:", error);
		return NextResponse.json(
			{ error: "Failed to fetch research" },
			{ status: 500 },
		);
	}
}
