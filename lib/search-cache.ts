import { z } from "zod";
import { redis } from "./redis";
import type { SearchResult } from "./research-types";

// Cache configuration
const CACHE_TTL = 60 * 60 * 24 * 7; // 7 days
const SIMILARITY_THRESHOLD = 0.8; // 80% similarity threshold
const MAX_CACHE_RESULTS = 50; // Max results to cache per query

// Compressed cache entry schema
const CachedSearchResultSchema = z.object({
	query: z.string(),
	normalizedQuery: z.string(),
	results: z.array(
		z.object({
			title: z.string(),
			url: z.string(),
			snippet: z.string(),
			content: z.string().optional(),
			relevanceScore: z.number(),
			timestamp: z.string(),
			faviconUrl: z.string().nullable().optional(),
		}),
	),
	cacheTimestamp: z.string(),
	hitCount: z.number().default(1),
	compressed: z.boolean().default(false),
});

type CachedSearchResult = z.infer<typeof CachedSearchResultSchema>;

/**
 * Normalize query for better similarity matching
 */
function normalizeQuery(query: string): string {
	return (
		query
			.toLowerCase()
			.trim()
			// Remove common words that don't affect search meaning
			.replace(
				/\b(the|a|an|and|or|but|in|on|at|to|for|of|with|by|from|as|is|was|are|were|be|been|have|has|had|do|does|did|will|would|could|should|may|might|can|about|what|when|where|why|how)\b/g,
				"",
			)
			// Remove extra spaces
			.replace(/\s+/g, " ")
			.trim()
			// Remove punctuation except important chars
			.replace(/[^\w\s\-]/g, "")
			// Sort words for better matching
			.split(" ")
			.filter((word) => word.length > 2)
			.sort()
			.join(" ")
	);
}

/**
 * Calculate similarity between two normalized queries using Jaccard similarity
 */
function calculateQuerySimilarity(query1: string, query2: string): number {
	const norm1 = normalizeQuery(query1);
	const norm2 = normalizeQuery(query2);

	if (norm1 === norm2) return 1.0;

	const words1 = new Set(norm1.split(" "));
	const words2 = new Set(norm2.split(" "));

	const intersection = new Set([...words1].filter((word) => words2.has(word)));
	const union = new Set([...words1, ...words2]);

	return intersection.size / union.size;
}

/**
 * Generate cache key for search query
 */
function getCacheKey(normalizedQuery: string): string {
	return `search_cache:${normalizedQuery}`;
}

/**
 * Generate index key for query similarity lookup
 */
function getIndexKey(): string {
	return "search_cache:index";
}

/**
 * Compress search results for efficient storage
 */
function compressResults(results: SearchResult[]): SearchResult[] {
	return results.map((result) => ({
		...result,
		// Truncate content for caching (keep full content in individual cache if needed)
		content: result.content
			? `${result.content.substring(0, 1000)}...`
			: undefined,
		// Truncate snippet if too long
		snippet:
			result.snippet.length > 300
				? `${result.snippet.substring(0, 300)}...`
				: result.snippet,
	}));
}

/**
 * Find similar cached queries
 */
async function findSimilarCachedQueries(query: string): Promise<string[]> {
	try {
		const normalizedQuery = normalizeQuery(query);
		const indexKey = getIndexKey();

		// Get all cached query indexes
		const cachedQueries = await redis.smembers(indexKey);

		const similarQueries: { query: string; similarity: number }[] = [];

		for (const cachedQuery of cachedQueries) {
			const similarity = calculateQuerySimilarity(normalizedQuery, cachedQuery);
			if (similarity >= SIMILARITY_THRESHOLD) {
				similarQueries.push({ query: cachedQuery, similarity });
			}
		}

		// Sort by similarity (highest first)
		return similarQueries
			.sort((a, b) => b.similarity - a.similarity)
			.map((item) => item.query);
	} catch (error) {
		console.error("Error finding similar cached queries:", error);
		return [];
	}
}

/**
 * Get cached search results
 */
export async function getCachedSearchResults(
	query: string,
): Promise<SearchResult[] | null> {
	try {
		const normalizedQuery = normalizeQuery(query);

		// First try exact match
		const exactKey = getCacheKey(normalizedQuery);
		let cached = await redis.get(exactKey);

		if (!cached) {
			// Try similar queries
			const similarQueries = await findSimilarCachedQueries(query);

			if (similarQueries.length > 0) {
				const similarKey = getCacheKey(similarQueries[0]);
				cached = await redis.get(similarKey);

				if (cached) {
					console.log(
						`Cache hit with similar query: "${similarQueries[0]}" for "${query}"`,
					);
				}
			}
		} else {
			console.log(`Cache hit with exact query: "${query}"`);
		}

		if (!cached) {
			return null;
		}

		// Parse and validate cached data
		const parsed = CachedSearchResultSchema.safeParse(cached);
		if (!parsed.success) {
			console.error("Invalid cached search result format:", parsed.error);
			return null;
		}

		// Update hit count
		const updatedCache = {
			...parsed.data,
			hitCount: parsed.data.hitCount + 1,
		};

		// Update cache with new hit count
		await redis.setex(getCacheKey(normalizedQuery), CACHE_TTL, updatedCache);

		console.log(
			`Cache hit for query "${query}" (${parsed.data.results.length} results, hit count: ${updatedCache.hitCount})`,
		);

		return parsed.data.results;
	} catch (error) {
		console.error("Error getting cached search results:", error);
		return null;
	}
}

/**
 * Cache search results
 */
export async function cacheSearchResults(
	query: string,
	results: SearchResult[],
): Promise<void> {
	try {
		if (results.length === 0) {
			console.log(`Not caching empty results for query: "${query}"`);
			return;
		}

		const normalizedQuery = normalizeQuery(query);
		const cacheKey = getCacheKey(normalizedQuery);
		const indexKey = getIndexKey();

		// Compress results for efficient storage
		const compressedResults = compressResults(
			results.slice(0, MAX_CACHE_RESULTS),
		);

		const cacheEntry: CachedSearchResult = {
			query,
			normalizedQuery,
			results: compressedResults,
			cacheTimestamp: new Date().toISOString(),
			hitCount: 1,
			compressed: true,
		};

		// Store in cache
		await redis.setex(cacheKey, CACHE_TTL, cacheEntry);

		// Add to index for similarity matching
		await redis.sadd(indexKey, normalizedQuery);
		await redis.expire(indexKey, CACHE_TTL);

		console.log(
			`Cached ${compressedResults.length} search results for query: "${query}"`,
		);
	} catch (error) {
		console.error("Error caching search results:", error);
	}
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
	totalCachedQueries: number;
	cacheHitRate: number;
	topQueries: Array<{ query: string; hitCount: number }>;
}> {
	try {
		const indexKey = getIndexKey();
		const cachedQueries = await redis.smembers(indexKey);

		const queryStats: Array<{ query: string; hitCount: number }> = [];

		for (const normalizedQuery of cachedQueries) {
			const cacheKey = getCacheKey(normalizedQuery);
			const cached = await redis.get(cacheKey);

			if (cached) {
				const parsed = CachedSearchResultSchema.safeParse(cached);
				if (parsed.success) {
					queryStats.push({
						query: parsed.data.query,
						hitCount: parsed.data.hitCount,
					});
				}
			}
		}

		const totalQueries = queryStats.length;
		const totalHits = queryStats.reduce((sum, stat) => sum + stat.hitCount, 0);
		const cacheHitRate =
			totalQueries > 0 ? (totalHits - totalQueries) / totalHits : 0;

		const topQueries = queryStats
			.sort((a, b) => b.hitCount - a.hitCount)
			.slice(0, 10);

		return {
			totalCachedQueries: totalQueries,
			cacheHitRate,
			topQueries,
		};
	} catch (error) {
		console.error("Error getting cache stats:", error);
		return {
			totalCachedQueries: 0,
			cacheHitRate: 0,
			topQueries: [],
		};
	}
}

/**
 * Clear cache (for maintenance)
 */
export async function clearSearchCache(): Promise<void> {
	try {
		const indexKey = getIndexKey();
		const cachedQueries = await redis.smembers(indexKey);

		// Delete all cached queries
		const deletePromises = cachedQueries.map((normalizedQuery) =>
			redis.del(getCacheKey(normalizedQuery)),
		);

		await Promise.all(deletePromises);

		// Clear index
		await redis.del(indexKey);

		console.log(`Cleared ${cachedQueries.length} cached search queries`);
	} catch (error) {
		console.error("Error clearing search cache:", error);
	}
}
