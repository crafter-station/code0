import {
	AI_PROVIDERS,
	type ProviderName,
	getAvailableProviders,
	getProviderModel,
} from "@/lib/ai-providers";
import {
	getMultiProviderResearchState,
	saveMultiProviderResearchState,
	updateMultiProviderResearchState,
} from "@/lib/redis";
import type {
	MultiProviderResearchState,
	ProviderComparison,
	SearchResult,
} from "@/lib/research-types";
import { ProviderComparisonSchema } from "@/lib/research-types";
import { logger, task } from "@trigger.dev/sdk/v3";
import { generateObject, generateText } from "ai";
import { deepResearchPipeline } from "./deep-research-pipeline";

/**
 * Multi-Provider Research Pipeline
 * Orchestrates parallel research across OpenAI, Anthropic, Google, and xAI
 */
export const multiProviderResearchPipeline = task({
	id: "multi-provider-research-pipeline",
	maxDuration: 3600 * 2, // 2 hours max for comprehensive multi-provider research
	run: async (
		payload: {
			query: string;
			depth?: "quick" | "surface" | "deep" | "comprehensive";
			enabledProviders?: ProviderName[];
		},
		{ ctx },
	) => {
		const { query, depth = "deep", enabledProviders } = payload;
		const researchId = `multi_research_${ctx.run.id}`;

		logger.log("Starting multi-provider research pipeline", {
			researchId,
			query,
			depth,
			enabledProviders,
		});

		// Get available providers
		const availableProviders = getAvailableProviders();
		const targetProviders = enabledProviders
			? enabledProviders.filter((p) => availableProviders.includes(p))
			: availableProviders;

		if (targetProviders.length === 0) {
			throw new Error(
				"No AI providers are available. Please check your API keys.",
			);
		}

		logger.log("Available providers", { targetProviders, availableProviders });

		// Initialize multi-provider research state
		let currentState = await getMultiProviderResearchState(researchId);

		if (!currentState) {
			const initialState: MultiProviderResearchState = {
				id: researchId,
				status: "planning",
				originalQuery: query,
				depth,
				providers: targetProviders,
				sharedSearchResults: [],
				providerResults: {},
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// Initialize provider-specific results
			for (const provider of targetProviders) {
				initialState.providerResults[provider] = {
					provider,
					status: "planning",
					searchResults: [],
					knowledgeGaps: [],
					iterations: 0,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				};
			}

			await saveMultiProviderResearchState(initialState);
			currentState = initialState;
		}

		try {
			// Phase 1: Run parallel research streams
			logger.log(
				"Phase 1: Starting parallel research streams across providers",
			);

			await updateMultiProviderResearchState(researchId, {
				status: "searching",
			});

			// Create batch research tasks for all providers using Trigger.dev batch API
			logger.log(
				"Triggering batch research using batchTriggerAndWait for proper parallel execution",
			);

			const batchResults = await deepResearchPipeline.batchTriggerAndWait(
				targetProviders.map((provider) => {
					return {
						payload: {
							query,
							depth,
							provider,
						},
					};
				}),
			);

			// Process batch results
			const providerResults = batchResults.runs.map((result, index) => {
				const provider = targetProviders[index];

				try {
					if (result.ok && result.output) {
						logger.log(`Research completed for ${provider}`, {
							provider,
							status: result.output.status,
						});
						return {
							provider,
							success: true,
							result: result.output,
						};
					}

					// Handle failed results
					const errorMessage = !result.ok
						? "Task execution failed"
						: "No output received";
					logger.error(`Research failed for ${provider}`, {
						provider,
						error: errorMessage,
					});
					return {
						provider,
						success: false,
						error: errorMessage,
					};
				} catch (error) {
					logger.error(`Research stream failed for ${provider}`, {
						provider,
						error,
					});
					return {
						provider,
						success: false,
						error: error instanceof Error ? error.message : String(error),
					};
				}
			});

			logger.log("All provider research streams completed", {
				completed: providerResults.filter((r) => r.success).length,
				failed: providerResults.filter((r) => !r.success).length,
			});

			// Phase 2: Consolidate and analyze results
			logger.log("Phase 2: Consolidating results across providers");

			await updateMultiProviderResearchState(researchId, {
				status: "analyzing",
			});

			const successfulResults = providerResults.filter(
				(r) => r.success && r.result,
			);

			if (successfulResults.length === 0) {
				throw new Error("All provider research streams failed");
			}

			// Aggregate all search results
			const allSearchResults: SearchResult[] = [];
			const providerReports: Array<{ provider: string; report: string }> = [];

			for (const result of successfulResults) {
				if (result.result) {
					// Add provider's search results
					// Note: We'd need to get the actual search results from the individual research state

					// Add provider's final report
					if (result.result.finalReport) {
						providerReports.push({
							provider: result.provider,
							report: result.result.finalReport,
						});
					}
				}
			}

			// Phase 3: Generate cross-provider analysis
			logger.log("Phase 3: Generating cross-provider analysis");

			const crossAnalysis = await generateCrossProviderAnalysis(
				query,
				providerReports,
				targetProviders,
			);

			// Phase 4: Generate consolidated report
			logger.log("Phase 4: Generating consolidated report");

			const consolidatedReport = await generateConsolidatedReport(
				query,
				providerReports,
				crossAnalysis,
				targetProviders,
			);

			// Update final state
			await updateMultiProviderResearchState(researchId, {
				status: "completed",
				consolidatedReport,
			});

			logger.log("Multi-provider research pipeline completed successfully", {
				researchId,
				providersUsed: successfulResults.map((r) => r.provider),
				reportLength: consolidatedReport.length,
			});

			return {
				researchId,
				status: "completed",
				summary: {
					originalQuery: query,
					depth,
					providersUsed: successfulResults.map((r) => r.provider),
					totalProviders: targetProviders.length,
					successfulProviders: successfulResults.length,
					reportLength: consolidatedReport.length,
				},
				consolidatedReport,
				providerReports,
				crossAnalysis,
			};
		} catch (error) {
			logger.error("Multi-provider research pipeline failed", {
				researchId,
				error,
			});

			await updateMultiProviderResearchState(researchId, {
				status: "failed",
			});

			throw error;
		}
	},
});

/**
 * Generate cross-provider analysis comparing insights across AI providers
 */
async function generateCrossProviderAnalysis(
	query: string,
	providerReports: Array<{ provider: string; report: string }>,
	providers: ProviderName[],
): Promise<ProviderComparison> {
	try {
		// Use OpenAI for analysis if available, otherwise use the first available provider
		const analysisProvider = providers.includes("openai")
			? "openai"
			: providers[0];
		const model = await getProviderModel(analysisProvider, "writing");

		logger.log("Generating cross-provider analysis", {
			analysisProvider,
			reportCount: providerReports.length,
		});

		const result = await generateObject({
			model,
			schema: ProviderComparisonSchema,
			experimental_telemetry: { isEnabled: true },
			prompt: `
        You are an expert research analyst comparing insights from multiple AI providers.
        
        Original Research Query: "${query}"
        
        Provider Reports:
        ${providerReports
					.map(
						(report, idx) => `
        ${idx + 1}. ${AI_PROVIDERS[report.provider as ProviderName]?.name || report.provider} Report:
        ${report.report.substring(0, 2000)}...
        `,
					)
					.join("\n")}
        
        Analyze these reports and provide:
        
        1. **Similarities**: What common insights, findings, or conclusions appear across providers?
        2. **Differences**: What unique perspectives, conflicting information, or different emphases exist?
        3. **Complementary Insights**: How do the different provider strengths complement each other?
        4. **Overall Confidence**: Based on consensus and quality, rate confidence in the research (0-1)
        
        Consider each provider's strengths:
        ${providers.map((p) => `- ${AI_PROVIDERS[p].name}: ${AI_PROVIDERS[p].strengths.join(", ")}`).join("\n")}
        
        Focus on actionable insights and highlight where multiple providers agree vs. disagree.
      `,
		});

		return result.object;
	} catch (error) {
		logger.error("Cross-provider analysis failed", { error });
		return {
			similarities: ["Analysis could not be completed due to technical issues"],
			differences: [],
			complementaryInsights: [],
			overallConfidence: 0.5,
		};
	}
}

/**
 * Generate consolidated report combining insights from all providers
 */
async function generateConsolidatedReport(
	query: string,
	providerReports: Array<{ provider: string; report: string }>,
	crossAnalysis: ProviderComparison,
	providers: ProviderName[],
): Promise<string> {
	try {
		// Use Anthropic for consolidation if available (good at synthesis), otherwise use first available
		const consolidationProvider = providers.includes("anthropic")
			? "anthropic"
			: providers[0];
		const model = await getProviderModel(consolidationProvider, "writing");

		logger.log("Generating consolidated report", {
			consolidationProvider,
			reportCount: providerReports.length,
		});

		const result = await generateText({
			model,
			experimental_telemetry: { isEnabled: true },
			prompt: `
        You are an expert research analyst creating a comprehensive, consolidated research report.
        
        Original Research Query: "${query}"
        
        You have reports from ${providerReports.length} different AI providers, each with unique strengths:
        ${providers.map((p) => `- ${AI_PROVIDERS[p].name}: ${AI_PROVIDERS[p].strengths.join(", ")}`).join("\n")}
        
        Provider Reports:
        ${providerReports
					.map(
						(report, idx) => `
        ## ${AI_PROVIDERS[report.provider as ProviderName]?.name || report.provider} Analysis
        ${report.report}
        `,
					)
					.join("\n\n")}
        
        Cross-Provider Analysis:
        **Common Insights:** ${crossAnalysis.similarities?.join("; ")}
        **Key Differences:** ${crossAnalysis.differences?.join("; ")}
        **Complementary Insights:** ${crossAnalysis.complementaryInsights?.join("; ")}
        **Overall Confidence:** ${Math.round((crossAnalysis.overallConfidence || 0.5) * 100)}%
        
        Create a comprehensive consolidated report that:
        
        1. **Executive Summary** (2-3 paragraphs)
           - Clear answer to the original question
           - Consensus findings across providers
           - Confidence level and key limitations
        
        2. **Comprehensive Analysis** 
           - Synthesize insights from all providers
           - Highlight where providers agree vs. disagree
           - Address conflicting information
           - Leverage each provider's unique strengths
        
        3. **Multi-Perspective Insights**
           - OpenAI: Structured reasoning and analysis
           - Anthropic: Deep contextual understanding
           - Google: Factual grounding and knowledge
           - xAI: Unconventional perspectives
        
        4. **Confidence Assessment**
           - Areas of high consensus
           - Areas of uncertainty or disagreement
           - Reliability assessment of sources
        
        5. **Conclusions and Recommendations**
           - Final answer to the research question
           - Actionable insights
           - Areas for further research
        
        6. **Methodology Note**
           - Brief explanation of multi-provider approach
           - Providers used and their strengths
           - How conflicting information was handled
        
        Focus on synthesis rather than repetition. Where providers disagree, present both perspectives and analyze why they might differ. The goal is a more comprehensive and reliable answer than any single provider could produce.
      `,
		});

		return result.text;
	} catch (error) {
		logger.error("Consolidated report generation failed", { error });
		return `# Multi-Provider Research Report

**Error**: Could not generate consolidated report due to technical issues.

## Individual Provider Reports

${providerReports
	.map(
		(report) => `
### ${AI_PROVIDERS[report.provider as ProviderName]?.name || report.provider}
${report.report}
`,
	)
	.join("\n\n")}
    `;
	}
}
