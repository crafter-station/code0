import { logger, task } from "@trigger.dev/sdk/v3";
import { generateObject, generateText } from "ai";
import { z } from "zod";
import { getProviderModel } from "../lib/ai-providers";
import {
	getResearchState,
	saveResearchState,
	updateResearchState,
} from "../lib/redis";
import type {
	KnowledgeGap,
	ResearchPlan,
	ResearchState,
	SearchResult,
} from "../lib/research-types";
import { KnowledgeGapSchema, ResearchPlanSchema } from "../lib/research-types";
import { searchWeb } from "./search-web";

/**
 * Main orchestrator task that manages the entire deep research pipeline
 */
export const deepResearchPipeline = task({
	id: "deep-research-pipeline",
	maxDuration: 3600, // 1 hour max
	run: async (
		payload: {
			query: string;
			depth?: "quick" | "surface" | "deep" | "comprehensive";
			provider?: string;
		},
		{ ctx },
	) => {
		// Use the task run ID to ensure the same research ID across retries
		const researchId = `research_${ctx.run.id}`;
		const { query, depth = "deep", provider = "openai" } = payload;

		logger.log("Starting deep research pipeline", {
			researchId,
			query,
			depth,
			provider,
		});

		// Quick mode configuration
		const isQuickMode = depth === "quick";
		const maxIterationsForDepth = isQuickMode
			? 1
			: depth === "surface"
				? 2
				: depth === "deep"
					? 3
					: 4;
		const skipReflection = isQuickMode;
		const maxSourcesPerQuery = isQuickMode ? 3 : 5;

		logger.log("Research configuration", {
			isQuickMode,
			maxIterationsForDepth,
			skipReflection,
			maxSourcesPerQuery,
		});

		// Check if research state already exists (from previous retry)
		let currentState = await getResearchState(researchId);

		if (currentState) {
			logger.log("Found existing research state, resuming", {
				currentState,
				researchId,
			});

			// If already completed, return the result
			if (currentState.status === "completed") {
				logger.log("Research already completed, returning existing result", {
					researchId,
				});
				return {
					researchId,
					status: "completed",
					summary: {
						originalQuery: query,
						totalSources: currentState.searchResults.length,
						iterations: currentState.iterations,
						reportLength: currentState.finalReport?.length || 0,
					},
					finalReport: currentState.finalReport,
				};
			}

			// If failed, start over
			if (currentState.status === "failed") {
				logger.log("Previous attempt failed, starting over", { researchId });
				currentState = null;
			}
		}

		// Initialize research state if none exists
		if (!currentState) {
			const initialState: ResearchState = {
				id: researchId,
				status: "planning",
				originalQuery: query,
				searchResults: [],
				knowledgeGaps: [],
				iterations: 0,
				maxIterations: maxIterationsForDepth,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			logger.log("Creating new research state", { initialState, researchId });

			// Validate the initial state is serializable
			try {
				JSON.stringify(initialState);
			} catch (serializationError) {
				logger.error("Initial state is not serializable", {
					serializationError,
					initialState,
				});
				throw new Error(
					`Initial state cannot be serialized: ${serializationError instanceof Error ? serializationError.message : String(serializationError)}`,
				);
			}

			try {
				await saveResearchState(initialState);
				logger.log("Initial state saved successfully", { researchId });
				currentState = initialState;
			} catch (error) {
				logger.error("Failed to save initial state", {
					error,
					initialState,
					researchId,
				});
				throw new Error(
					`Failed to initialize research state: ${error instanceof Error ? error.message : String(error)}`,
				);
			}
		}

		try {
			// Step 1: Planning (skip if already done)
			if (currentState.status === "planning") {
				logger.log("Phase 1: Planning research approach");
				const planResult = await planningTask.triggerAndWait({
					researchId,
					query,
					depth,
					provider,
				});

				if (!planResult.ok) {
					logger.error("Planning task failed", {
						error: planResult.error,
						researchId,
					});
					throw new Error(`Planning failed: ${planResult.error}`);
				}

				logger.log("Planning task completed successfully", {
					researchId,
					output: planResult.output,
				});
			} else {
				logger.log("Skipping planning phase - already completed", {
					currentStatus: currentState.status,
					researchId,
				});
			}

			// Step 2: Initial Search
			logger.log("Phase 2: Initial search execution", { researchId });

			const state = await getResearchState(researchId);
			logger.log("Retrieved state for search phase", { state, researchId });

			if (!state) {
				logger.error(`Research state not found for ID: ${researchId}`, {
					researchId,
				});
				throw new Error(`Research state not found for ID: ${researchId}`);
			}
			if (!state.plan) {
				logger.error("No plan found in state", { state, researchId });
				throw new Error(
					"Planning phase did not complete successfully - no plan found in state",
				);
			}

			const searchResult = await searchTask.triggerAndWait({
				researchId,
				queries: state.plan.searchQueries,
				maxSources: depth === "surface" ? 5 : depth === "deep" ? 10 : 15,
			});

			if (!searchResult.ok) {
				throw new Error(`Search failed: ${searchResult.error}`);
			}

			// Step 3: Iterative reflection and additional searches (skip in quick mode)
			if (!skipReflection) {
				let currentIteration = 0;
				let shouldContinue = true;

				while (shouldContinue && currentIteration < maxIterationsForDepth) {
					logger.log(
						`Phase 3.${currentIteration + 1}: Reflection and gap analysis`,
					);

					const currentState = await getResearchState(researchId);
					if (!currentState) {
						throw new Error("Research state not found");
					}

					const reflectionResult = await reflectionTask.triggerAndWait({
						researchId,
						searchResults: currentState.searchResults,
						originalQuery: query,
						currentIteration,
						provider,
					});

					if (!reflectionResult.ok) {
						throw new Error(`Reflection failed: ${reflectionResult.error}`);
					}

					shouldContinue = reflectionResult.output.shouldContinue;
					currentIteration++;

					// Additional search if gaps identified
					if (
						shouldContinue &&
						reflectionResult.output.additionalQueries.length > 0
					) {
						logger.log(
							`Phase 3.${currentIteration}: Additional search based on gaps`,
						);

						await searchTask.triggerAndWait({
							researchId,
							queries: reflectionResult.output.additionalQueries,
							maxSources: maxSourcesPerQuery,
						});
					}
				}
			} else {
				logger.log("Skipping reflection phase (quick mode enabled)");
			}

			// Step 4: Final report generation
			logger.log("Phase 4: Generating comprehensive report");
			const finalState = await getResearchState(researchId);
			if (!finalState) {
				throw new Error("Research state not found for final report");
			}

			const writingResult = await writingTask.triggerAndWait({
				researchId,
				originalQuery: query,
				searchResults: finalState.searchResults,
				knowledgeGaps: finalState.knowledgeGaps,
				provider,
			});

			if (!writingResult.ok) {
				throw new Error(`Writing failed: ${writingResult.error}`);
			}

			// Get final state
			const completedState = await getResearchState(researchId);
			if (!completedState) {
				throw new Error("Could not retrieve final state");
			}

			logger.log("Deep research pipeline completed successfully", {
				researchId,
				totalSources: completedState.searchResults.length,
				iterations: completedState.iterations,
				reportLength: completedState.finalReport?.length || 0,
			});

			return {
				researchId,
				status: "completed",
				summary: {
					originalQuery: query,
					totalSources: completedState.searchResults.length,
					iterations: completedState.iterations,
					reportLength: completedState.finalReport?.length || 0,
				},
				finalReport: completedState.finalReport,
			};
		} catch (error) {
			logger.error("Deep research pipeline failed", { researchId, error });

			await updateResearchState(researchId, {
				status: "failed",
			});

			throw error;
		}
	},
});

/**
 * Planning task - generates research plan from initial query
 */
export const planningTask = task({
	id: "research-planning",
	maxDuration: 300, // 5 minutes
	run: async (payload: {
		researchId: string;
		query: string;
		depth: "quick" | "surface" | "deep" | "comprehensive";
		provider: string;
	}) => {
		const { researchId, query, depth, provider } = payload;

		logger.log("Generating research plan", {
			researchId,
			query,
			depth,
			provider,
		});

		// Get the appropriate model for this provider and task
		const planningModel = await getProviderModel(provider, "planning");

		try {
			const depthInstructions = {
				quick: "Create 1-2 focused search queries for rapid results",
				surface: "Create 3-5 focused search queries for a quick overview",
				deep: "Create 5-8 comprehensive search queries covering multiple angles",
				comprehensive:
					"Create 8-12 detailed search queries for exhaustive research",
			};

			const result = await generateObject({
				model: planningModel,
				schema: ResearchPlanSchema,
				experimental_telemetry: { isEnabled: true },
				prompt: `
          You are a research planning expert. Given a research query, create a comprehensive research plan.
          
          Original Query: "${query}"
          Research Depth: ${depth}
          
          Instructions: ${depthInstructions[depth]}
          
          Create search queries that:
          1. Cover different aspects and perspectives of the topic
          2. Include both broad and specific angles
          3. Consider recent developments and historical context
          4. Look for expert opinions and data sources
          5. Include potential counterarguments or alternative viewpoints
          
          Estimate duration in minutes based on the number of queries and expected complexity.
          Provide a clear expected outcome describing what the research should achieve.
        `,
			});

			logger.log("AI planning result received", {
				result: result.object,
				researchId,
			});

			// Validate the AI result is serializable
			try {
				JSON.stringify(result.object);
			} catch (serializationError) {
				logger.error("AI planning result is not serializable", {
					serializationError,
					result: result.object,
				});
				throw new Error(
					`AI planning result cannot be serialized: ${serializationError instanceof Error ? serializationError.message : String(serializationError)}`,
				);
			}

			const plan = result.object as ResearchPlan;

			// Validate the plan before saving
			if (!plan || !plan.searchQueries || !Array.isArray(plan.searchQueries)) {
				logger.error("Invalid plan generated by AI", { plan, researchId });
				throw new Error("AI generated invalid research plan");
			}

			logger.log("Plan generated successfully", { plan, researchId });

			// Update research state
			try {
				logger.log("About to save plan to Redis", { researchId, plan });
				const updatedState = await updateResearchState(researchId, {
					plan,
					status: "searching",
				});
				logger.log("Research state updated with plan", {
					researchId,
					updatedState,
				});

				// Verify the state was saved correctly
				const verifyState = await getResearchState(researchId);
				logger.log("Verified saved state", { researchId, verifyState });
			} catch (error) {
				logger.error("Failed to save plan to Redis", {
					error,
					plan,
					researchId,
				});
				throw error;
			}

			logger.log("Research plan generated successfully", {
				researchId,
				queriesCount: plan.searchQueries.length,
				estimatedDuration: plan.estimatedDuration,
			});

			return { success: true, plan };
		} catch (error) {
			logger.error("Planning task failed", { researchId, error });
			await updateResearchState(researchId, { status: "failed" });
			throw error;
		}
	},
});

/**
 * Search task - executes searches and gathers information
 */
export const searchTask = task({
	id: "research-search",
	maxDuration: 600, // 10 minutes
	run: async (payload: {
		researchId: string;
		queries: string[];
		maxSources: number;
	}) => {
		const { researchId, queries, maxSources } = payload;

		logger.log("Executing search queries", { researchId, queries, maxSources });

		try {
			// Perform searches using Exa in parallel using Trigger.dev batch API
			const allResults: SearchResult[] = [];

			logger.log(
				"Starting parallel search execution using batchTriggerAndWait",
				{
					researchId,
					queryCount: queries.length,
				},
			);

			// Use batchTriggerAndWait for proper parallel execution in Trigger.dev
			const batchResults = await searchWeb.batchTriggerAndWait(
				queries.map((query) => ({
					payload: {
						query,
						numResults: Math.ceil(maxSources / queries.length),
					},
				})),
			);

			// Process all batch results
			for (let i = 0; i < batchResults.runs.length; i++) {
				const result = batchResults.runs[i];
				const query = queries[i];

				try {
					if (result.ok && result.output && result.output.length > 0) {
						const searchResults = result.output.map(
							(searchResult) =>
								({
									title: searchResult.title,
									url: searchResult.url,
									snippet: searchResult.content.substring(0, 200), // Create snippet from content
									content: searchResult.content,
									relevanceScore: calculateRelevanceScore(
										query,
										searchResult.title,
										searchResult.content,
									),
									timestamp: new Date().toISOString(),
									faviconUrl: searchResult.faviconUrl,
								}) satisfies SearchResult,
						);

						allResults.push(...searchResults);
						logger.log(
							`Found ${searchResults.length} results for query: ${query}`,
							{ researchId },
						);
					} else {
						logger.log(`No results found for query: ${query}`, {
							researchId,
							batchResult: result,
						});
					}
				} catch (error) {
					logger.error(`Failed to process results for query: ${query}`, {
						researchId,
						error,
					});
				}
			}

			// Remove duplicates and sort by relevance
			const uniqueResults = removeDuplicates(allResults);
			const enhancedResults = uniqueResults.sort(
				(a, b) => b.relevanceScore - a.relevanceScore,
			);

			// Update research state
			const currentState = await getResearchState(researchId);
			if (currentState) {
				await updateResearchState(researchId, {
					searchResults: [...currentState.searchResults, ...enhancedResults],
				});
			}

			logger.log("Search completed successfully", {
				researchId,
				newResults: enhancedResults.length,
				totalResults: currentState
					? currentState.searchResults.length + enhancedResults.length
					: enhancedResults.length,
			});

			return {
				success: true,
				resultsCount: enhancedResults.length,
				results: enhancedResults,
			};
		} catch (error) {
			logger.error("Search task failed", { researchId, error });
			throw error;
		}
	},
});

/**
 * Reflection task - analyzes results and identifies knowledge gaps
 */
export const reflectionTask = task({
	id: "research-reflection",
	maxDuration: 300, // 5 minutes
	run: async (payload: {
		researchId: string;
		searchResults: SearchResult[];
		originalQuery: string;
		currentIteration: number;
		provider: string;
	}) => {
		const {
			researchId,
			searchResults,
			originalQuery,
			currentIteration,
			provider,
		} = payload;

		logger.log("Analyzing research results", {
			researchId,
			resultsCount: searchResults.length,
			currentIteration,
			provider,
		});

		// Get the appropriate model for this provider and task
		const reflectionModel = await getProviderModel(provider, "reflection");

		try {
			// Analyze for knowledge gaps
			const KnowledgeGapAnalysisSchema = z.object({
				hasGaps: z
					.boolean()
					.describe("Whether there are significant knowledge gaps"),
				gaps: z.array(KnowledgeGapSchema).describe("Identified knowledge gaps"),
				shouldContinue: z
					.boolean()
					.describe("Whether research should continue"),
				reasoning: z.string().describe("Explanation of the analysis"),
			});

			const result = await generateObject({
				model: reflectionModel,
				schema: KnowledgeGapAnalysisSchema,
				experimental_telemetry: { isEnabled: true },
				prompt: `
          You are a research quality analyst. Analyze the current research results and identify knowledge gaps.
          
          Original Query: "${originalQuery}"
          Current Iteration: ${currentIteration}
          Number of Sources: ${searchResults.length}
          
          Search Results Summary:
          ${searchResults
						.map(
							(result, idx) =>
								`${idx + 1}. ${result.title} (Relevance: ${result.relevanceScore})\n   ${result.snippet}`,
						)
						.join("\n\n")}
          
          Analyze the search results and identify:
          1. What aspects of the original query are well-covered
          2. What important information is missing or unclear
          3. What perspectives or viewpoints are underrepresented
          4. What recent developments might be missing
          5. What specific data or evidence is needed
          
          Consider:
          - Quality and relevance of current sources
          - Completeness of coverage for the original query
          - Whether ${currentIteration >= 3 ? "we have reached maximum iterations" : "additional research would be valuable"}
          
          Be critical but realistic about what constitutes sufficient research depth.
        `,
			});

			const gapAnalysis = result.object as {
				hasGaps: boolean;
				gaps: KnowledgeGap[];
				shouldContinue: boolean;
				reasoning: string;
			};

			let additionalQueries: string[] = [];
			if (gapAnalysis.hasGaps && gapAnalysis.shouldContinue) {
				// Generate additional queries
				const QueriesSchema = z.object({
					queries: z
						.array(z.string())
						.describe("Additional search queries to fill knowledge gaps"),
				});

				const queryResult = await generateObject({
					model: reflectionModel,
					schema: QueriesSchema,
					experimental_telemetry: { isEnabled: true },
					prompt: `
            Generate specific search queries to address these knowledge gaps:
            
            ${gapAnalysis.gaps
							.map(
								(gap, idx) =>
									`${idx + 1}. ${gap.topic} (${gap.priority} priority)\n   ${gap.description}\n   Suggested: ${gap.suggestedQueries.join(", ")}`,
							)
							.join("\n\n")}
            
            Create 2-4 focused search queries that would help fill these gaps.
            Make queries specific and actionable for web search.
          `,
				});

				additionalQueries = (queryResult.object as { queries: string[] })
					.queries;
			}

			// Update research state
			const currentState = await getResearchState(researchId);
			if (currentState) {
				await updateResearchState(researchId, {
					knowledgeGaps: [...currentState.knowledgeGaps, ...gapAnalysis.gaps],
					iterations: currentIteration + 1,
					status: gapAnalysis.shouldContinue ? "searching" : "writing",
				});
			}

			logger.log("Reflection completed", {
				researchId,
				hasGaps: gapAnalysis.hasGaps,
				shouldContinue: gapAnalysis.shouldContinue,
				additionalQueries: additionalQueries.length,
			});

			return {
				success: true,
				hasGaps: gapAnalysis.hasGaps,
				shouldContinue: gapAnalysis.shouldContinue,
				reasoning: gapAnalysis.reasoning,
				additionalQueries,
			};
		} catch (error) {
			logger.error("Reflection task failed", { researchId, error });
			throw error;
		}
	},
});

/**
 * Writing task - generates final comprehensive report
 */
export const writingTask = task({
	id: "research-writing",
	maxDuration: 600, // 10 minutes
	run: async (payload: {
		researchId: string;
		originalQuery: string;
		searchResults: SearchResult[];
		knowledgeGaps: KnowledgeGap[];
		provider: string;
	}) => {
		const {
			researchId,
			originalQuery,
			searchResults,
			knowledgeGaps,
			provider,
		} = payload;

		logger.log("Generating final research report", {
			researchId,
			sourcesCount: searchResults.length,
			gapsCount: knowledgeGaps.length,
			provider,
		});

		// Get the appropriate model for this provider and task
		const writingModel = await getProviderModel(provider, "writing");

		try {
			const result = await generateText({
				model: writingModel,
				experimental_telemetry: { isEnabled: true },
				prompt: `
          You are an expert research analyst. Write a comprehensive research report based on the collected information.
          
          Original Research Question: "${originalQuery}"
          
          Available Sources (${searchResults.length} total):
          ${searchResults
						.map(
							(result, idx) =>
								`\n${idx + 1}. **${result.title}** (Relevance: ${(result.relevanceScore * 100).toFixed(1)}%)
               URL: ${result.url}
               Summary: ${result.snippet}
               ${result.content ? `Content: ${result.content.substring(0, 500)}...` : ""}`,
						)
						.join("\n")}
          
          ${
						knowledgeGaps.length > 0
							? `
          Acknowledged Knowledge Gaps:
          ${knowledgeGaps
						.map(
							(gap, idx) =>
								`${idx + 1}. ${gap.topic} (${gap.priority} priority): ${gap.description}`,
						)
						.join("\n")}
          `
							: ""
					}
          
          Write a well-structured research report that:
          
          1. **Executive Summary** (2-3 paragraphs)
             - Clear answer to the original question
             - Key findings and conclusions
             - Confidence level and limitations
          
          2. **Detailed Analysis** (multiple sections as needed)
             - Comprehensive exploration of the topic
             - Different perspectives and viewpoints
             - Supporting evidence and data
             - Critical analysis of sources
          
          3. **Key Insights**
             - Most important discoveries
             - Surprising or counterintuitive findings
             - Practical implications
          
          4. **Limitations and Future Research**
             - Acknowledged gaps in knowledge
             - Areas needing further investigation
             - Confidence level in conclusions
          
          5. **Sources and References**
             - List all sources with proper attribution
             - Note relevance and reliability of sources
          
          Guidelines:
          - Be objective and analytical
          - Cite sources naturally throughout the text
          - Acknowledge uncertainty where appropriate
          - Use clear, professional language
          - Structure with proper headings and sections
          - Aim for comprehensiveness while being concise
          - Include specific data and quotes when available
        `,
			});

			const report = result.text;

			// Update research state
			await updateResearchState(researchId, {
				finalReport: report,
				status: "completed",
			});

			logger.log("Research report generated successfully", {
				researchId,
				reportLength: report.length,
			});

			return {
				success: true,
				report,
				wordCount: report.split(" ").length,
			};
		} catch (error) {
			logger.error("Writing task failed", { researchId, error });
			await updateResearchState(researchId, { status: "failed" });
			throw error;
		}
	},
});

/**
 * Utility task to get research status
 */
export const getResearchStatus = task({
	id: "get-research-status",
	maxDuration: 30,
	run: async (payload: { researchId: string }) => {
		const { researchId } = payload;

		const state = await getResearchState(researchId);
		if (!state) {
			throw new Error(`Research ${researchId} not found`);
		}

		return {
			success: true,
			state: {
				id: state.id,
				status: state.status,
				originalQuery: state.originalQuery,
				iterations: state.iterations,
				sourcesCount: state.searchResults.length,
				gapsCount: state.knowledgeGaps.length,
				hasReport: !!state.finalReport,
				createdAt: state.createdAt,
				updatedAt: state.updatedAt,
			},
		};
	},
});

// Helper functions for search functionality
function calculateRelevanceScore(
	query: string,
	title: string,
	content: string,
): number {
	const queryTerms = query
		.toLowerCase()
		.split(" ")
		.filter((term) => term.length > 2);
	const searchText = `${title} ${content}`.toLowerCase();

	if (queryTerms.length === 0) return 0.5;

	let totalScore = 0;
	let maxPossibleScore = 0;

	for (const term of queryTerms) {
		maxPossibleScore += 1;

		// Check for exact matches
		const exactMatches = (searchText.match(new RegExp(term, "gi")) || [])
			.length;
		if (exactMatches > 0) {
			totalScore += Math.min(exactMatches * 0.3, 1.0);
		}

		// Check for partial matches in title (weighted higher)
		if (title.toLowerCase().includes(term)) {
			totalScore += 0.5;
		}

		// Check for partial matches in content
		if (content.toLowerCase().includes(term)) {
			totalScore += 0.2;
		}
	}

	// Normalize score and add base relevance
	const normalizedScore = Math.min(totalScore / maxPossibleScore, 1.0);
	return Math.max(normalizedScore, 0.1); // Minimum score of 0.1
}

function removeDuplicates(results: SearchResult[]): SearchResult[] {
	const seen = new Set<string>();
	return results.filter((result) => {
		if (seen.has(result.url)) {
			return false;
		}
		seen.add(result.url);
		return true;
	});
}
