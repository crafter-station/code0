import {
	getMultiProviderResearchState,
	getResearchState,
	listResearchStates,
} from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		// Get both regular and multi-provider research
		const [singleResearchIds, multiResearchIds] = await Promise.all([
			listResearchStates("research:*"),
			listResearchStates("multi_research:*"),
		]);

		// Process single research
		const singleResearchStates = await Promise.all(
			singleResearchIds.map(async (id) => {
				const state = await getResearchState(id);
				if (!state) return null;

				return {
					id: state.id,
					title: state.topic || state.title || "Untitled Research",
					timestamp:
						state.createdAt || state.updatedAt || new Date().toISOString(),
					status: state.status || "completed",
					type: "single" as const,
				};
			}),
		);

		// Process multi-provider research
		const multiResearchStates = await Promise.all(
			multiResearchIds.map(async (id) => {
				const state = await getMultiProviderResearchState(id);
				if (!state) return null;

				return {
					id: state.id,
					title: state.originalQuery || "Untitled Multi-Provider Research",
					timestamp:
						state.createdAt || state.updatedAt || new Date().toISOString(),
					status: state.status || "completed",
					type: "multi-provider" as const,
					providers: state.providers || [],
				};
			}),
		);

		// Combine and filter valid states
		const allStates = [
			...singleResearchStates.filter(Boolean),
			...multiResearchStates.filter(Boolean),
		];

		// Sort by timestamp, newest first
		allStates.sort(
			(a, b) =>
				new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
		);

		return NextResponse.json(allStates);
	} catch (error) {
		console.error("Failed to fetch research states:", error);
		return NextResponse.json(
			{ error: "Failed to fetch research states" },
			{ status: 500 },
		);
	}
}
