import { exa } from "@/lib/exa";
import type { SearchResult } from "@/lib/research-types";
import { cacheSearchResults, getCachedSearchResults } from "@/lib/search-cache";
import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

export type ExaSearchResult = {
	title: string;
	url: string;
	content: string;
	faviconUrl: string | null;
};

export const searchWeb = schemaTask({
	id: "search-web",
	schema: z.object({
		query: z.string(),
		numResults: z.number().min(1).max(10).default(5),
	}),
	async run({ query, numResults }) {
		// Check cache first for performance optimization
		const cachedResults = await getCachedSearchResults(query);
		if (cachedResults) {
			console.log(`Using cached results for query: "${query}"`);
			// Convert cached SearchResult to ExaSearchResult format
			return cachedResults.slice(0, numResults).map((result) => ({
				title: result.title,
				url: result.url,
				content: result.content || "",
				faviconUrl: result.faviconUrl ?? null,
			})) satisfies ExaSearchResult[];
		}

		console.log(`Performing new search for query: "${query}"`);

		const { results } = await exa.searchAndContents(query, {
			livecrawl: "always",
			numResults,
		});

		if (results.length < 1) {
			return [];
		}

		const searchResults = results.map((result) => ({
			title: result.title || "Untitled",
			url: result.url,
			content: result.text || "",
			faviconUrl: result.favicon ?? null,
		})) satisfies ExaSearchResult[];

		// Cache results for future use (convert to SearchResult format)
		const cacheableResults: SearchResult[] = searchResults.map((result) => ({
			title: result.title,
			url: result.url,
			snippet: result.content.substring(0, 200),
			content: result.content,
			relevanceScore: 0.5, // Default relevance
			timestamp: new Date().toISOString(),
			faviconUrl: result.faviconUrl,
		}));

		await cacheSearchResults(query, cacheableResults);

		return searchResults;
	},
});
