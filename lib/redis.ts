import { Redis } from "@upstash/redis";
import type {
	MultiProviderResearchState,
	ResearchState,
} from "./research-types";
import { MultiProviderResearchStateSchema } from "./research-types";

// Initialize Redis client
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!redisUrl || !redisToken) {
	throw new Error(
		"UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set",
	);
}

console.log(
	`Initializing Redis client with URL: ${redisUrl.substring(0, 20)}...`,
);

export const redis = new Redis({
	url: redisUrl,
	token: redisToken,
});

// Test Redis connection on initialization
(async () => {
	try {
		await redis.ping();
		console.log("Redis connection successful");
	} catch (error) {
		console.error("Redis connection failed:", error);
	}
})();

// Helper functions for research state management
function getKey(researchId: string): string {
	const key = `research:${researchId}`;
	console.log(`Redis key for ${researchId}: ${key}`);
	return key;
}

export async function saveResearchState(state: ResearchState): Promise<void> {
	const key = getKey(state.id);
	try {
		// Validate state can be serialized
		const testSerialization = JSON.stringify(state);
		if (testSerialization === "[object Object]") {
			throw new Error(
				"Failed to serialize state - contains non-serializable data",
			);
		}

		// Upstash Redis can handle objects directly or JSON strings
		// Let's use the object directly since Upstash will handle serialization
		await redis.set(key, state, { ex: 3600 * 24 }); // 24 hour expiry

		console.log(`Research state saved successfully for ID: ${state.id}`);
	} catch (error) {
		console.error("Failed to save research state:", error);
		console.error("State object:", state);
		throw new Error(
			`Failed to save research state: ${
				error instanceof Error ? error.message : String(error)
			}`,
		);
	}
}

export async function getResearchState(
	researchId: string,
): Promise<ResearchState | null> {
	const key = getKey(researchId);
	const data = await redis.get(key);

	if (!data) return null;

	try {
		// Upstash Redis automatically parses JSON, so data might already be an object
		if (typeof data === "object" && data !== null) {
			// Data is already parsed as an object
			return data as ResearchState;
		}

		// If it's a string, parse it
		if (typeof data === "string") {
			if (data === "[object Object]" || data.startsWith("[object")) {
				console.error(
					"Invalid data found in Redis, removing corrupted entry:",
					data,
				);
				await redis.del(key);
				return null;
			}
			return JSON.parse(data) as ResearchState;
		}

		// Unexpected data type
		console.error("Unexpected data type from Redis:", typeof data, data);
		await redis.del(key);
		return null;
	} catch (error) {
		console.error("Failed to parse research state:", error);
		console.error("Raw data from Redis:", data);
		console.error("Data type:", typeof data);
		// Clean up corrupted data
		await redis.del(key);
		return null;
	}
}

// Validate that an object can be safely serialized to JSON
function validateSerializable(obj: unknown, path = "root"): void {
	if (obj === null || obj === undefined) return;

	if (typeof obj === "function") {
		throw new Error(
			`Found function at ${path} - functions cannot be serialized`,
		);
	}

	if (typeof obj === "symbol") {
		throw new Error(`Found symbol at ${path} - symbols cannot be serialized`);
	}

	if (obj instanceof Date) return; // Dates are serializable

	if (typeof obj === "object") {
		if (obj.constructor !== Object && obj.constructor !== Array) {
			console.warn(
				`Found complex object type at ${path}:`,
				obj.constructor.name,
			);
		}

		const visited = new Set();
		const stack = [{ obj, path }];

		while (stack.length > 0) {
			const stackItem = stack.pop();
			if (!stackItem) break;

			const { obj: current, path: currentPath } = stackItem;

			if (visited.has(current)) {
				throw new Error(`Circular reference detected at ${currentPath}`);
			}

			visited.add(current);

			if (Array.isArray(current)) {
				for (let index = 0; index < current.length; index++) {
					const item = current[index];
					if (typeof item === "object" && item !== null) {
						stack.push({ obj: item, path: `${currentPath}[${index}]` });
					}
				}
			} else {
				for (const key of Object.keys(current)) {
					const value = (current as Record<string, unknown>)[key];
					if (typeof value === "object" && value !== null) {
						stack.push({ obj: value, path: `${currentPath}.${key}` });
					}
				}
			}
		}
	}
}

export async function updateResearchState(
	researchId: string,
	updates: Partial<ResearchState>,
): Promise<ResearchState | null> {
	try {
		const currentState = await getResearchState(researchId);
		if (!currentState) {
			console.error(`No existing state found for research ID: ${researchId}`);
			return null;
		}

		// Validate updates are serializable
		validateSerializable(updates, "updates");

		const updatedState = {
			...currentState,
			...updates,
			updatedAt: new Date().toISOString(),
		};

		// Validate the complete state
		validateSerializable(updatedState, "updatedState");

		await saveResearchState(updatedState);
		return updatedState;
	} catch (error) {
		console.error("Failed to update research state:", error);
		console.error("Updates:", updates);
		throw error;
	}
}

export async function deleteResearchState(researchId: string): Promise<void> {
	const key = getKey(researchId);
	await redis.del(key);
}

export async function researchStateExists(
	researchId: string,
): Promise<boolean> {
	const key = getKey(researchId);
	const exists = await redis.exists(key);
	return exists === 1;
}

export async function listResearchStates(
	pattern = "research:*",
): Promise<string[]> {
	const keys = await redis.keys(pattern);
	// Remove the appropriate prefix based on the pattern
	if (pattern.startsWith("multi_research:")) {
		return keys.map((key) => key.replace("multi_research:", ""));
	}
	return keys.map((key) => key.replace("research:", ""));
}

// Multi-provider research state management
function getMultiProviderKey(researchId: string): string {
	return `multi_research:${researchId}`;
}

export async function saveMultiProviderResearchState(
	state: MultiProviderResearchState,
): Promise<void> {
	const key = getMultiProviderKey(state.id);
	try {
		const testSerialization = JSON.stringify(state);
		if (testSerialization === "[object Object]") {
			throw new Error(
				"Failed to serialize multi-provider state - contains non-serializable data",
			);
		}
		await redis.set(key, state, { ex: 3600 * 24 }); // 24 hours
		console.log(
			`Multi-provider research state saved successfully for ID: ${state.id}`,
		);
	} catch (error) {
		console.error("Failed to save multi-provider research state:", error);
		throw error;
	}
}

export async function getMultiProviderResearchState(
	researchId: string,
): Promise<MultiProviderResearchState | null> {
	const key = getMultiProviderKey(researchId);
	try {
		console.log(`Multi-provider Redis key for ${researchId}: ${key}`);

		// Check if key exists first
		const exists = await redis.exists(key);
		console.log(`Key ${key} exists: ${exists === 1}`);

		const data = await redis.get(key);

		if (!data) {
			console.log(
				`No multi-provider research state found for ID: ${researchId}`,
			);
			// List all keys to help debug
			const allKeys = await redis.keys("multi_research:*");
			console.log("Available multi-provider keys:", allKeys);
			return null;
		}

		// Handle Upstash Redis JSON parsing
		let parsedData = data;
		if (typeof data === "string") {
			try {
				parsedData = JSON.parse(data);
			} catch (parseError) {
				console.error(
					"Failed to parse multi-provider research state JSON:",
					parseError,
				);
				return null;
			}
		}

		const validation = MultiProviderResearchStateSchema.safeParse(parsedData);
		if (!validation.success) {
			console.error(
				"Invalid multi-provider research state format:",
				validation.error,
			);
			return null;
		}

		console.log(
			`Multi-provider research state retrieved successfully for ID: ${researchId}`,
		);
		return validation.data;
	} catch (error) {
		console.error("Failed to get multi-provider research state:", error);
		return null;
	}
}

export async function updateMultiProviderResearchState(
	researchId: string,
	updates: Partial<MultiProviderResearchState>,
): Promise<void> {
	const currentState = await getMultiProviderResearchState(researchId);
	if (!currentState) {
		throw new Error(
			`Multi-provider research state not found for ID: ${researchId}`,
		);
	}

	const updatedState = {
		...currentState,
		...updates,
		updatedAt: new Date().toISOString(),
	};

	// Sync individual research results into provider results
	await syncIndividualResearchToProviderResults(updatedState);

	await saveMultiProviderResearchState(updatedState);
}

// New function to sync individual research results into multi-provider state
export async function syncIndividualResearchToProviderResults(
	multiState: MultiProviderResearchState,
): Promise<void> {
	try {
		console.log(
			`Syncing individual research for multi-provider: ${multiState.id}`,
		);

		// Get all research keys to find related individual research
		const allResearchKeys = await redis.keys("research:*");
		console.log(`Found ${allResearchKeys.length} research keys for syncing`);

		// Extract base ID for pattern matching
		const baseId = multiState.id
			.replace("multi_research_", "")
			.replace("run_", "");
		console.log(`Base ID for syncing: ${baseId}`);

		// Get all individual research that matches the query
		const candidateResearchByQuery: { keyId: string; state: ResearchState }[] =
			[];

		for (const key of allResearchKeys) {
			const keyId = key.replace("research:", "");
			try {
				const testState = await getResearchState(keyId);
				if (testState && testState.originalQuery === multiState.originalQuery) {
					candidateResearchByQuery.push({ keyId, state: testState });
					console.log(`Found candidate research with matching query: ${keyId}`);
				}
			} catch (error) {
				// Continue searching
			}
		}

		console.log(
			`Found ${candidateResearchByQuery.length} research entries with matching query "${multiState.originalQuery}"`,
		);

		for (const provider of multiState.providers) {
			console.log(`Syncing provider: ${provider}`);

			let individualState = null;
			let foundKey = null;

			// Use any available research that matches the query (since we don't have provider-specific IDs)
			if (candidateResearchByQuery.length > 0) {
				// Try to find one that hasn't been used yet, or just use the first one
				const availableResearch =
					candidateResearchByQuery.find(
						(candidate) =>
							!Object.values(multiState.providerResults || {}).some(
								(result) => result.createdAt === candidate.state.createdAt,
							),
					) || candidateResearchByQuery[0];

				if (availableResearch) {
					individualState = availableResearch.state;
					foundKey = availableResearch.keyId;
					console.log(
						`Using research for ${provider} with key: ${foundKey} (by query match)`,
					);
				}
			}

			// Update provider results with actual data
			if (individualState && individualState.status !== "planning") {
				console.log(
					`Updating provider result for ${provider} with status: ${individualState.status}`,
				);

				// Ensure providerResults exists
				if (!multiState.providerResults) {
					multiState.providerResults = {};
				}

				multiState.providerResults[provider] = {
					provider,
					plan: individualState.plan,
					searchResults: individualState.searchResults || [],
					knowledgeGaps: individualState.knowledgeGaps || [],
					finalReport: individualState.finalReport,
					status: individualState.status,
					iterations: individualState.iterations || 0,
					createdAt: individualState.createdAt,
					updatedAt: individualState.updatedAt,
				};

				console.log(
					`Successfully synced ${provider}: status=${individualState.status}, sources=${individualState.searchResults?.length || 0}, hasReport=${!!individualState.finalReport}`,
				);
			} else {
				console.log(
					`No individual research data found for ${provider} or still in planning state`,
				);

				// Keep existing provider result or create placeholder
				if (!multiState.providerResults) {
					multiState.providerResults = {};
				}

				if (!multiState.providerResults[provider]) {
					multiState.providerResults[provider] = {
						provider,
						plan: undefined,
						searchResults: [],
						knowledgeGaps: [],
						finalReport: undefined,
						status: "planning",
						iterations: 0,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
					};
				}
			}
		}

		console.log(`Completed syncing individual research for ${multiState.id}`);
	} catch (error) {
		console.error(
			`Error syncing individual research for ${multiState.id}:`,
			error,
		);
		// Don't throw - let the update continue even if sync fails
	}
}

// Function to manually sync all existing multi-provider research
export async function syncAllMultiProviderResearch(): Promise<void> {
	try {
		console.log("Starting manual sync of all multi-provider research...");

		const multiResearchIds = await listResearchStates("multi_research:*");
		console.log(
			`Found ${multiResearchIds.length} multi-provider research entries to sync`,
		);

		for (const researchId of multiResearchIds) {
			try {
				const multiState = await getMultiProviderResearchState(researchId);
				if (multiState) {
					console.log(`Syncing multi-provider research: ${researchId}`);
					await syncIndividualResearchToProviderResults(multiState);
					await saveMultiProviderResearchState(multiState);
					console.log(`Successfully synced: ${researchId}`);
				}
			} catch (error) {
				console.error(`Failed to sync ${researchId}:`, error);
				// Continue with next research
			}
		}

		console.log("Completed manual sync of all multi-provider research");
	} catch (error) {
		console.error("Error during manual sync:", error);
		throw error;
	}
}
