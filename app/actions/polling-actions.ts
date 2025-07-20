"use server";

import { getMultiProviderResearchState } from "@/lib/redis";

export async function pollResearchProgress(researchId: string) {
	try {
		const state = await getMultiProviderResearchState(researchId);

		if (!state) {
			return {
				success: false,
				error: "Research not found",
			};
		}

		// Transform the multi-provider state to match our UI expectations
		const providers = state.providers.map((providerName) => {
			const providerResult = state.providerResults[providerName];
			if (!providerResult) {
				return {
					provider: providerName,
					status: "pending" as const,
					progress: `Initializing ${providerName}...`,
				};
			}

			return {
				provider: providerName,
				status:
					providerResult.status === "completed"
						? ("completed" as const)
						: providerResult.status === "failed"
							? ("error" as const)
							: ("processing" as const),
				progress: getProgressMessage(providerName, providerResult.status),
				result: providerResult.finalReport,
			};
		});

		// Determine overall status
		const allCompleted = providers.every((p) => p.status === "completed");
		const anyFailed = providers.some((p) => p.status === "error");
		const overallStatus = anyFailed
			? "error"
			: allCompleted
				? "completed"
				: state.status === "planning"
					? "initializing"
					: "processing";

		// Generate completed steps based on provider progress
		const completedSteps: string[] = [];
		if (state.status !== "planning")
			completedSteps.push("Research initialized");
		if (state.sharedSearchResults.length > 0)
			completedSteps.push("Search sources gathered");
		const completedProviders = providers.filter(
			(p) => p.status === "completed",
		).length;
		if (completedProviders > 0)
			completedSteps.push(
				`${completedProviders}/${providers.length} providers completed`,
			);
		if (state.consolidatedReport)
			completedSteps.push("Final report synthesized");

		return {
			success: true,
			data: {
				id: state.id,
				query: state.originalQuery,
				status: overallStatus,
				providers,
				currentStep: getCurrentStep(state.status, providers),
				completedSteps,
				finalReport: state.consolidatedReport,
				createdAt: state.createdAt,
				updatedAt: state.updatedAt,
			},
		};
	} catch (error) {
		console.error("Error polling research progress:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
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

function getCurrentStep(
	overallStatus: string,
	providers: Array<{ status: string }>,
): string {
	if (overallStatus === "planning") return "Initializing research process";

	const completedCount = providers.filter(
		(p) => p.status === "completed",
	).length;
	const totalCount = providers.length;

	if (completedCount === totalCount) return "Synthesizing final report";
	if (completedCount > 0)
		return `Processing responses (${completedCount}/${totalCount} complete)`;

	return "AI providers analyzing in parallel";
}
