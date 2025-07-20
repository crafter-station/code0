import { Card } from "@/components/ui/card";
import {
	getMultiProviderResearchState,
	getResearchState,
	listResearchStates,
} from "@/lib/redis";

async function analyzeResearchAssociations() {
	try {
		// Get all multi-provider research
		const multiResearchIds = await listResearchStates("multi_research:*");
		const singleResearchIds = await listResearchStates("research:*");

		console.log("Multi-provider research IDs:", multiResearchIds);
		console.log("Single research IDs:", singleResearchIds);

		// Fetch all data
		const multiResearchData = await Promise.all(
			multiResearchIds.map(async (id) => {
				const data = await getMultiProviderResearchState(id);
				return { id, data };
			}),
		);

		const singleResearchData = await Promise.all(
			singleResearchIds.map(async (id) => {
				const data = await getResearchState(id);
				return { id, data };
			}),
		);

		// Filter out null data
		const validMulti = multiResearchData.filter((item) => item.data !== null);
		const validSingle = singleResearchData.filter((item) => item.data !== null);

		// Try to find associations
		const associations = validMulti.map((multiItem) => {
			const potentialMatches = validSingle.filter((singleItem) => {
				// Try multiple matching strategies
				const baseId = multiItem.id
					.replace("multi_research_", "")
					.replace("run_", "");
				const singleId = singleItem.id;

				// Strategy 1: Direct ID inclusion
				const directMatch =
					singleId.includes(baseId) ||
					baseId.includes(singleId.replace("research_run_", ""));

				// Strategy 2: Query matching
				const queryMatch =
					singleItem.data?.originalQuery === multiItem.data?.originalQuery;

				// Strategy 3: Time proximity (within 30 minutes)
				const multiTime = new Date(multiItem.data?.createdAt || 0).getTime();
				const singleTime = new Date(singleItem.data?.createdAt || 0).getTime();
				const timeDiff = Math.abs(multiTime - singleTime);
				const timeMatch = timeDiff < 30 * 60 * 1000; // 30 minutes

				return directMatch || queryMatch || timeMatch;
			});

			return {
				multiProvider: multiItem,
				potentialMatches,
				associations: potentialMatches.map((match) => ({
					singleId: match.id,
					reasons: {
						directIdMatch: match.id.includes(
							multiItem.id.replace("multi_research_", "").replace("run_", ""),
						),
						queryMatch:
							match.data?.originalQuery === multiItem.data?.originalQuery,
						timeProximity:
							Math.abs(
								new Date(multiItem.data?.createdAt || 0).getTime() -
									new Date(match.data?.createdAt || 0).getTime(),
							) <
							30 * 60 * 1000,
					},
					singleData: {
						status: match.data?.status,
						query: match.data?.originalQuery,
						iterations: match.data?.iterations,
						sources: match.data?.searchResults?.length || 0,
						hasReport: !!match.data?.finalReport,
						created: match.data?.createdAt,
					},
				})),
			};
		});

		return {
			multiCount: validMulti.length,
			singleCount: validSingle.length,
			associations,
			allSingleIds: validSingle.map((s) => s.id),
			allMultiIds: validMulti.map((m) => m.id),
		};
	} catch (error) {
		console.error("Error analyzing associations:", error);
		return {
			error: error instanceof Error ? error.message : "Unknown error",
			multiCount: 0,
			singleCount: 0,
			associations: [],
			allSingleIds: [],
			allMultiIds: [],
		};
	}
}

export default async function RedisAssociationsPage() {
	const analysis = await analyzeResearchAssociations();

	if (analysis.error) {
		return (
			<div className="container mx-auto p-6">
				<h1 className="mb-6 font-bold text-2xl">
					Redis Associations Debug - Error
				</h1>
				<Card className="bg-red-50 p-4">
					<p className="text-red-700">Error: {analysis.error}</p>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto space-y-8 p-6">
			<h1 className="font-bold text-3xl">Research Associations Analysis</h1>

			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">Overview</h2>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<p>
							<strong>Multi-provider research entries:</strong>{" "}
							{analysis.multiCount}
						</p>
						<p>
							<strong>Single research entries:</strong> {analysis.singleCount}
						</p>
					</div>
					<div>
						<p>
							<strong>Potential associations found:</strong>{" "}
							{analysis.associations.reduce(
								(sum, a) => sum + a.potentialMatches.length,
								0,
							)}
						</p>
					</div>
				</div>
			</Card>

			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">All Research IDs</h2>
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<h3 className="mb-2 font-medium">Multi-provider Research:</h3>
						<div className="space-y-1">
							{analysis.allMultiIds.map((id) => (
								<div
									key={id}
									className="rounded bg-blue-50 p-2 font-mono text-sm"
								>
									{id}
								</div>
							))}
						</div>
					</div>
					<div>
						<h3 className="mb-2 font-medium">Single Research:</h3>
						<div className="space-y-1">
							{analysis.allSingleIds.map((id) => (
								<div
									key={id}
									className="rounded bg-green-50 p-2 font-mono text-sm"
								>
									{id}
								</div>
							))}
						</div>
					</div>
				</div>
			</Card>

			<div className="space-y-6">
				{analysis.associations.map((assoc) => (
					<Card key={assoc.multiProvider.id} className="p-6">
						<h2 className="mb-4 font-semibold text-xl">
							{assoc.multiProvider.id}
						</h2>

						<div className="mb-4 rounded bg-gray-50 p-4">
							<p>
								<strong>Query:</strong>{" "}
								{assoc.multiProvider.data?.originalQuery}
							</p>
							<p>
								<strong>Status:</strong> {assoc.multiProvider.data?.status}
							</p>
							<p>
								<strong>Providers:</strong>{" "}
								{assoc.multiProvider.data?.providers.join(", ")}
							</p>
							<p>
								<strong>Has Consolidated Report:</strong>{" "}
								{assoc.multiProvider.data?.consolidatedReport ? "Yes" : "No"}
							</p>
							<p>
								<strong>Created:</strong> {assoc.multiProvider.data?.createdAt}
							</p>
						</div>

						<h3 className="mb-3 font-medium">
							Potential Matches ({assoc.potentialMatches.length})
						</h3>

						{assoc.associations.length > 0 ? (
							<div className="space-y-3">
								{assoc.associations.map((match) => (
									<div key={match.singleId} className="rounded-lg border p-4">
										<div className="mb-2 flex items-start justify-between">
											<h4 className="font-medium font-mono text-sm">
												{match.singleId}
											</h4>
											<div className="flex gap-2">
												{match.reasons.directIdMatch && (
													<span className="rounded bg-green-100 px-2 py-1 text-green-700 text-xs">
														ID Match
													</span>
												)}
												{match.reasons.queryMatch && (
													<span className="rounded bg-blue-100 px-2 py-1 text-blue-700 text-xs">
														Query Match
													</span>
												)}
												{match.reasons.timeProximity && (
													<span className="rounded bg-yellow-100 px-2 py-1 text-xs text-yellow-700">
														Time Match
													</span>
												)}
											</div>
										</div>

										<div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
											<div>
												<span className="text-gray-600">Status:</span>{" "}
												{match.singleData.status}
											</div>
											<div>
												<span className="text-gray-600">Iterations:</span>{" "}
												{match.singleData.iterations}
											</div>
											<div>
												<span className="text-gray-600">Sources:</span>{" "}
												{match.singleData.sources}
											</div>
											<div>
												<span className="text-gray-600">Has Report:</span>{" "}
												{match.singleData.hasReport ? "Yes" : "No"}
											</div>
										</div>

										<div className="mt-2 text-sm">
											<span className="text-gray-600">Query:</span>{" "}
											{match.singleData.query}
										</div>
										<div className="mt-1 text-gray-500 text-xs">
											Created: {match.singleData.created}
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="rounded bg-yellow-50 p-4">
								<p className="text-yellow-700">
									No potential matches found for this multi-provider research.
								</p>
								<p className="mt-1 text-sm text-yellow-600">
									Expected patterns: research_run_[provider]_
									{assoc.multiProvider.id
										.replace("multi_research_", "")
										.replace("run_", "")}
								</p>
							</div>
						)}
					</Card>
				))}
			</div>

			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">
					Unmatched Single Research
				</h2>
				{(() => {
					const allMatchedIds = analysis.associations.flatMap((a) =>
						a.associations.map((match) => match.singleId),
					);
					const unmatchedIds = analysis.allSingleIds.filter(
						(id) => !allMatchedIds.includes(id),
					);

					return unmatchedIds.length > 0 ? (
						<div className="space-y-2">
							{unmatchedIds.map((id) => (
								<div
									key={id}
									className="rounded bg-gray-100 p-2 font-mono text-sm"
								>
									{id}
								</div>
							))}
						</div>
					) : (
						<p className="text-green-600">
							All single research entries have potential matches!
						</p>
					);
				})()}
			</Card>
		</div>
	);
}
