import { z } from "zod";

// Research query and result types
export const ResearchQuerySchema = z.object({
	query: z.string().min(1, "Query cannot be empty"),
	maxSources: z.number().min(1).max(20).default(10),
	depth: z.enum(["quick", "surface", "deep", "comprehensive"]).default("deep"),
});

export const SearchResultSchema = z.object({
	title: z.string(),
	url: z.string().url(),
	snippet: z.string(),
	content: z.string().optional(),
	relevanceScore: z.number().min(0).max(1),
	timestamp: z.string().datetime(),
	faviconUrl: z.string().nullable().optional(),
});

export const ResearchPlanSchema = z.object({
	originalQuery: z.string(),
	searchQueries: z.array(z.string()),
	expectedOutcome: z.string(),
	researchDepth: z.enum(["quick", "surface", "deep", "comprehensive"]),
	estimatedDuration: z.number(),
});

export const KnowledgeGapSchema = z.object({
	topic: z.string(),
	description: z.string(),
	priority: z.enum(["low", "medium", "high"]),
	suggestedQueries: z.array(z.string()),
});

export const ResearchStateSchema = z.object({
	id: z.string(),
	status: z.enum([
		"planning",
		"searching",
		"reflecting",
		"writing",
		"completed",
		"failed",
	]),
	originalQuery: z.string(),
	plan: ResearchPlanSchema.optional(),
	searchResults: z.array(SearchResultSchema).default([]),
	knowledgeGaps: z.array(KnowledgeGapSchema).default([]),
	iterations: z.number().default(0),
	maxIterations: z.number().default(3),
	finalReport: z.string().optional(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

// Export types
export type ResearchQuery = z.infer<typeof ResearchQuerySchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type ResearchPlan = z.infer<typeof ResearchPlanSchema>;
export type KnowledgeGap = z.infer<typeof KnowledgeGapSchema>;
export type ResearchState = z.infer<typeof ResearchStateSchema>;

// Multi-provider research types
export const MultiProviderResearchStateSchema = z.object({
	id: z.string(),
	status: z.enum(["planning", "searching", "analyzing", "completed", "failed"]),
	originalQuery: z.string(),
	depth: z.enum(["quick", "surface", "deep", "comprehensive"]),
	providers: z.array(z.string()),
	sharedSearchResults: z.array(SearchResultSchema).default([]),
	providerResults: z.record(
		z.object({
			provider: z.string(),
			plan: ResearchPlanSchema.optional(),
			searchResults: z.array(SearchResultSchema).default([]),
			knowledgeGaps: z.array(KnowledgeGapSchema).default([]),
			finalReport: z.string().optional(),
			status: z.enum([
				"planning",
				"searching",
				"reflecting",
				"writing",
				"completed",
				"failed",
			]),
			iterations: z.number().default(0),
			createdAt: z.string().datetime(),
			updatedAt: z.string().datetime(),
		}),
	),
	consolidatedReport: z.string().optional(),
	createdAt: z.string().datetime(),
	updatedAt: z.string().datetime(),
});

export const ProviderComparisonSchema = z.object({
	similarities: z.array(z.string()),
	differences: z.array(z.string()),
	complementaryInsights: z.array(z.string()),
	overallConfidence: z.number().min(0).max(1),
});

export type MultiProviderResearchState = z.infer<
	typeof MultiProviderResearchStateSchema
>;
export type ProviderComparison = z.infer<typeof ProviderComparisonSchema>;
