import { getMultiProviderResearchState, listResearchStates } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		// Get all multi-provider research IDs (ultra deep research)
		const multiResearchIds = await listResearchStates("multi_research:*");

		// Fetch all active multi-provider research states
		const providerStates = await Promise.all(
			multiResearchIds.map(async (id) => {
				const state = await getMultiProviderResearchState(id);
				if (!state) return null;

				// Only return active research (not completed or failed)
				if (state.status === "completed" || state.status === "failed") {
					return null;
				}

				// Transform provider results for real-time display
				const providers = state.providers.map((providerName) => {
					const providerResult = state.providerResults[providerName];
					return {
						name: providerName,
						status: providerResult?.status || "planning",
						iterations: providerResult?.iterations || 0,
						hasReport: !!providerResult?.finalReport,
						lastUpdated: providerResult?.updatedAt || state.updatedAt,
					};
				});

				return {
					researchId: state.id,
					query: state.originalQuery,
					overallStatus: state.status,
					depth: state.depth,
					providers,
					createdAt: state.createdAt,
					updatedAt: state.updatedAt,
				};
			}),
		);

		// Filter out null results
		const activeStates = providerStates.filter(Boolean);

		return NextResponse.json({
			success: true,
			data: activeStates,
			timestamp: new Date().toISOString(),
		});
	} catch (error) {
		console.error("Failed to fetch provider states:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to fetch provider states",
				timestamp: new Date().toISOString(),
			},
			{ status: 500 },
		);
	}
}
