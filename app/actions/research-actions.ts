"use server";

import type {
	GetResearchStatusActionState,
	MultiProviderResearchActionState,
	QuickResearchActionState,
	StartResearchActionState,
} from "@/lib/action-types";
import { getResearchState } from "@/lib/redis";
import {
	deepResearchPipeline,
	getResearchStatus,
} from "@/trigger/deep-research-pipeline";
import { headers } from "next/headers";
import { z } from "zod";

// Mock auth helper - replace with your actual auth implementation
async function getUserId(headers: Headers) {
	// For demo purposes, return a mock user ID
	// In production, implement proper authentication
	return { userId: "demo_user_123" };
}

export async function startResearchAction(
	_prev: StartResearchActionState,
	formData: FormData,
): Promise<StartResearchActionState> {
	const raw = {
		query: formData.get("query") as string,
		depth: formData.get("depth") as
			| "quick"
			| "surface"
			| "deep"
			| "comprehensive",
	};

	const schema = z.object({
		query: z.string().min(1, "Research query is required"),
		depth: z.enum(["quick", "surface", "deep", "comprehensive"]),
	});

	const parsed = schema.safeParse(raw);

	const state: StartResearchActionState = {
		input: raw,
		output: { success: false },
	};

	if (!parsed.success) {
		state.output = {
			success: false,
			error: `Invalid input: ${parsed.error.issues.map((e) => e.message).join(", ")}`,
		};
		return state;
	}

	const { userId } = await getUserId(await headers());

	try {
		// Trigger the deep research pipeline
		const handle = await deepResearchPipeline.trigger({
			query: parsed.data.query,
			depth: parsed.data.depth,
		});

		state.output = {
			success: true,
			data: {
				researchId: handle.id,
				message: `Research started successfully. Task ID: ${handle.id}`,
			},
		};
	} catch (err) {
		state.output = {
			success: false,
			error: err instanceof Error ? err.message : "Failed to start research",
		};
	}

	return state;
}

export async function getResearchStatusAction(
	_prev: GetResearchStatusActionState,
	formData: FormData,
): Promise<GetResearchStatusActionState> {
	const raw = {
		researchId: formData.get("researchId") as string,
	};

	const schema = z.object({
		researchId: z.string().min(1, "Research ID is required"),
	});

	const parsed = schema.safeParse(raw);

	const state: GetResearchStatusActionState = {
		input: raw,
		output: { success: false },
	};

	if (!parsed.success) {
		state.output = {
			success: false,
			error: "Invalid research ID",
		};
		return state;
	}

	const { userId } = await getUserId(await headers());

	try {
		// Get research status directly from Redis
		const researchState = await getResearchState(parsed.data.researchId);

		if (researchState) {
			state.output = {
				success: true,
				data: {
					status: researchState.status,
					originalQuery: researchState.originalQuery,
					iterations: researchState.iterations,
					sourcesCount: researchState.searchResults.length,
					gapsCount: researchState.knowledgeGaps.length,
					hasReport: !!researchState.finalReport,
					createdAt: researchState.createdAt,
					updatedAt: researchState.updatedAt,
					finalReport: researchState.finalReport,
				},
			};
		} else {
			// Fallback to Trigger.dev task if not found in Redis
			const handle = await getResearchStatus.trigger({
				researchId: parsed.data.researchId,
			});

			// For now, return processing status - in production you'd poll for results
			state.output = {
				success: true,
				data: {
					status: "processing",
					originalQuery: "Unknown",
					iterations: 0,
					sourcesCount: 0,
					gapsCount: 0,
					hasReport: false,
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
				},
			};
		}
	} catch (err) {
		state.output = {
			success: false,
			error:
				err instanceof Error ? err.message : "Failed to get research status",
		};
	}

	return state;
}

export async function quickResearchAction(
	_prev: QuickResearchActionState,
	formData: FormData,
): Promise<QuickResearchActionState> {
	const raw = {
		query: formData.get("query") as string,
	};

	const schema = z.object({
		query: z.string().min(1, "Research query is required"),
	});

	const parsed = schema.safeParse(raw);

	const state: QuickResearchActionState = {
		input: raw,
		output: { success: false },
	};

	if (!parsed.success) {
		state.output = {
			success: false,
			error: "Invalid input: Research query is required",
		};
		return state;
	}

	const { userId } = await getUserId(await headers());

	try {
		// Create a quick search task instead of direct service calls
		// This ensures we get the benefits of Trigger.dev's reliability
		const researchId = `quick_${Date.now()}_${Math.random().toString(36).substring(7)}`;

		// Import search and AI functions from the task file
		const { searchTask, writingTask } = await import(
			"@/trigger/deep-research-pipeline"
		);

		// Perform quick search
		const searchResult = await searchTask.trigger({
			researchId,
			queries: [parsed.data.query],
			maxSources: 5,
		});

		// Wait for search to complete and get results from Redis
		// In a real implementation, you'd poll or use webhooks
		// For now, we'll create a mock quick response
		const mockSources = [
			{
				title: `Quick Research: ${parsed.data.query}`,
				url: `https://example.com/quick/${encodeURIComponent(parsed.data.query)}`,
				snippet: `Rapid analysis of ${parsed.data.query} with key insights and immediate findings.`,
				relevanceScore: 0.9,
			},
			{
				title: `Summary Analysis: ${parsed.data.query}`,
				url: `https://analysis.example.com/${encodeURIComponent(parsed.data.query)}`,
				snippet: `Comprehensive summary covering the main aspects of ${parsed.data.query}.`,
				relevanceScore: 0.85,
			},
		];

		const mockSummary = `
      Quick research summary for "${parsed.data.query}":

      Based on the available sources, this topic appears to be of significant interest with multiple perspectives and approaches documented in the literature.

      Key findings include recent developments and ongoing research initiatives that demonstrate the evolving nature of this field. The sources provide both theoretical frameworks and practical applications.

      This summary represents an initial overview. For more comprehensive analysis, consider using the Deep Research option which provides multi-iteration analysis with gap identification and detailed reporting.
    `.trim();

		state.output = {
			success: true,
			data: {
				summary: mockSummary,
				sources: mockSources,
			},
		};
	} catch (err) {
		state.output = {
			success: false,
			error:
				err instanceof Error ? err.message : "Failed to perform quick research",
		};
	}

	return state;
}

// Multi-provider research action

export async function startMultiProviderResearchAction(
	_prev: MultiProviderResearchActionState,
	formData: FormData,
): Promise<MultiProviderResearchActionState> {
	const raw = {
		query: formData.get("query") as string,
		depth: formData.get("depth") as
			| "quick"
			| "surface"
			| "deep"
			| "comprehensive",
		enabledProviders: formData.getAll("providers") as string[],
	};

	const schema = z.object({
		query: z.string().min(1, "Research query is required"),
		depth: z.enum(["quick", "surface", "deep", "comprehensive"]),
		enabledProviders: z.array(z.string()).optional(),
	});

	const parsed = schema.safeParse(raw);

	const state: MultiProviderResearchActionState = {
		input: raw,
		output: { success: false },
	};

	if (!parsed.success) {
		state.output = {
			success: false,
			error: `Invalid input: ${parsed.error.issues.map((e) => e.message).join(", ")}`,
		};
		return state;
	}

	const { userId } = await getUserId(await headers());

	try {
		// Import the multi-provider research pipeline
		const { multiProviderResearchPipeline } = await import(
			"@/trigger/multi-provider-research"
		);

		// Trigger the multi-provider research
		const handle = await multiProviderResearchPipeline.trigger({
			query: parsed.data.query,
			depth: parsed.data.depth,
			enabledProviders: parsed.data.enabledProviders?.length
				? (parsed.data.enabledProviders as (
						| "openai"
						| "anthropic"
						| "google"
						| "xai"
					)[])
				: undefined,
		});

		state.output = {
			success: true,
			data: {
				researchId: handle.id,
				message: `Multi-provider research started with ID: ${handle.id}`,
			},
		};
	} catch (err) {
		state.output = {
			success: false,
			error: err instanceof Error ? err.message : "Unknown error occurred",
		};
	}

	return state;
}
