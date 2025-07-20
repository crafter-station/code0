import { getMultiProviderResearchState, listResearchStates } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		// Only get multi-provider research for sidebar display
		// Individual research items will be shown as sub-items within multi-provider research
		const multiResearchIds = await listResearchStates("multi_research:*");

		// Process multi-provider research
		const multiResearchStates = await Promise.all(
			multiResearchIds.map(async (id) => {
				const state = await getMultiProviderResearchState(id);
				if (!state) return null;

				// Get individual results from the multi-provider state
				const individualResults = state.providers.map((provider) => {
					const providerResult = state.providerResults[provider];
					if (!providerResult) {
						return {
							provider,
							status: "pending" as const,
							progress: `${provider} initializing...`,
							researchId: `research_run_${provider}_${id.replace("multi_research_", "")}`,
						};
					}

					return {
						provider,
						status:
							providerResult.status === "completed"
								? ("completed" as const)
								: providerResult.status === "failed"
									? ("error" as const)
									: ("processing" as const),
						progress: getProgressMessage(provider, providerResult.status),
						result: providerResult.finalReport,
						researchId: `research_run_${provider}_${id.replace("multi_research_", "")}`,
					};
				});

				return {
					id: state.id,
					title: state.originalQuery || "Untitled Multi-Provider Research",
					timestamp:
						state.createdAt || state.updatedAt || new Date().toISOString(),
					status: state.status || "completed",
					type: "multi-provider" as const,
					providers: state.providers || [],
					individualResults,
				};
			}),
		);

		// Filter valid states and sort by timestamp, newest first
		const validStates = multiResearchStates
			.filter((state): state is NonNullable<typeof state> => state !== null)
			.sort(
				(a, b) =>
					new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
			);

		return NextResponse.json(validStates);
	} catch (error) {
		console.error("Failed to fetch research states:", error);
		return NextResponse.json(
			{ error: "Failed to fetch research states" },
			{ status: 500 },
		);
	}
}

function getProgressMessage(providerName: string, status: string): string {
	switch (status) {
		case "planning":
			return `${providerName} is analyzing the research query...`;
		case "searching":
			return `${providerName} is gathering relevant sources...`;
		case "reflecting":
			return `${providerName} is analyzing findings and identifying gaps...`;
		case "writing":
			return `${providerName} is generating comprehensive analysis...`;
		case "completed":
			return `${providerName} analysis complete`;
		case "failed":
			return `${providerName} encountered an error`;
		default:
			return `${providerName} is processing...`;
	}
}
