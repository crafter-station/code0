import { Card } from "@/components/ui/card";
import {
	getMultiProviderResearchState,
	getResearchState,
	listResearchStates,
	redis,
} from "@/lib/redis";

async function getAllRedisData() {
	try {
		// Get all Redis keys
		const allKeys = await redis.keys("*");
		console.log("All Redis keys:", allKeys);

		// Get multi-provider research IDs
		const multiResearchIds = await listResearchStates("multi_research:*");
		console.log("Multi-provider research IDs:", multiResearchIds);

		// Get regular research IDs
		const singleResearchIds = await listResearchStates("research:*");
		console.log("Single research IDs:", singleResearchIds);

		// Fetch all multi-provider research data
		const multiResearchData = await Promise.all(
			multiResearchIds.map(async (id) => {
				const data = await getMultiProviderResearchState(id);
				return { id, data };
			}),
		);

		// Fetch all single research data
		const singleResearchData = await Promise.all(
			singleResearchIds.map(async (id) => {
				const data = await getResearchState(id);
				return { id, data };
			}),
		);

		return {
			allKeys,
			multiResearchData: multiResearchData.filter((item) => item.data !== null),
			singleResearchData: singleResearchData.filter(
				(item) => item.data !== null,
			),
		};
	} catch (error) {
		console.error("Error fetching Redis data:", error);
		return {
			allKeys: [],
			multiResearchData: [],
			singleResearchData: [],
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}

export default async function RedisDebugPage() {
	const { allKeys, multiResearchData, singleResearchData, error } =
		await getAllRedisData();

	if (error) {
		return (
			<div className="container mx-auto p-6">
				<h1 className="mb-6 font-bold text-2xl">Redis Debug - Error</h1>
				<Card className="bg-red-50 p-4">
					<p className="text-red-700">Error: {error}</p>
				</Card>
			</div>
		);
	}

	return (
		<div className="container mx-auto space-y-8 p-6">
			<h1 className="font-bold text-3xl">Redis Debug Dashboard</h1>

			{/* All Keys Overview */}
			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">
					All Redis Keys ({allKeys.length})
				</h2>
				<div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
					{allKeys.map((key) => (
						<div
							key={key}
							className="rounded bg-gray-100 p-2 font-mono text-sm"
						>
							{key}
						</div>
					))}
				</div>
			</Card>

			{/* Multi-Provider Research */}
			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">
					Multi-Provider Research ({multiResearchData.length})
				</h2>
				<div className="space-y-4">
					{multiResearchData.map((item) => (
						<Card key={item.id} className="border-blue-500 border-l-4 p-4">
							<h3 className="mb-2 font-semibold text-lg">{item.id}</h3>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<p>
										<strong>Status:</strong> {item.data?.status}
									</p>
									<p>
										<strong>Query:</strong> {item.data?.originalQuery}
									</p>
									<p>
										<strong>Providers:</strong>{" "}
										{item.data?.providers.join(", ")}
									</p>
									<p>
										<strong>Has Consolidated Report:</strong>{" "}
										{item.data?.consolidatedReport ? "Yes" : "No"}
									</p>
								</div>
								<div>
									<p>
										<strong>Provider Results:</strong>
									</p>
									<div className="mt-2 space-y-1">
										{item.data?.providers.map((provider) => {
											const result = item.data?.providerResults?.[provider];
											return (
												<div
													key={provider}
													className="rounded bg-gray-50 p-2 text-sm"
												>
													<strong>{provider}:</strong>{" "}
													{result?.status || "No data"}
													{result?.finalReport
														? " (Has Report)"
														: " (No Report)"}
													<br />
													<span className="text-gray-600 text-xs">
														Iterations: {result?.iterations || 0}, Sources:{" "}
														{result?.searchResults?.length || 0}, Gaps:{" "}
														{result?.knowledgeGaps?.length || 0}
													</span>
												</div>
											);
										})}
									</div>
								</div>
							</div>

							{/* Full JSON Data */}
							<details className="mt-4">
								<summary className="cursor-pointer font-medium">
									View Full JSON Data
								</summary>
								<pre className="mt-2 max-h-96 overflow-auto rounded bg-gray-100 p-4 text-xs">
									{JSON.stringify(item.data, null, 2)}
								</pre>
							</details>
						</Card>
					))}
				</div>
			</Card>

			{/* Single Research */}
			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">
					Single Research ({singleResearchData.length})
				</h2>
				<div className="space-y-4">
					{singleResearchData.map((item) => (
						<Card key={item.id} className="border-green-500 border-l-4 p-4">
							<h3 className="mb-2 font-semibold text-lg">{item.id}</h3>
							<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
								<div>
									<p>
										<strong>Status:</strong> {item.data?.status}
									</p>
									<p>
										<strong>Query:</strong> {item.data?.originalQuery}
									</p>
									<p>
										<strong>Iterations:</strong> {item.data?.iterations}
									</p>
									<p>
										<strong>Has Report:</strong>{" "}
										{item.data?.finalReport ? "Yes" : "No"}
									</p>
								</div>
								<div>
									<p>
										<strong>Sources:</strong>{" "}
										{item.data?.searchResults?.length || 0}
									</p>
									<p>
										<strong>Knowledge Gaps:</strong>{" "}
										{item.data?.knowledgeGaps?.length || 0}
									</p>
									<p>
										<strong>Created:</strong>{" "}
										{item.data?.createdAt
											? new Date(item.data.createdAt).toLocaleString()
											: "Unknown"}
									</p>
									<p>
										<strong>Updated:</strong>{" "}
										{item.data?.updatedAt
											? new Date(item.data.updatedAt).toLocaleString()
											: "Unknown"}
									</p>
								</div>
							</div>

							{/* Check if this might be related to a multi-provider research */}
							{item.id.includes("_") && (
								<div className="mt-4 rounded bg-yellow-50 p-3">
									<p className="text-sm">
										<strong>Potential Association:</strong>
									</p>
									<p className="text-xs">
										This ID suggests it might be related to a multi-provider
										research.
									</p>
									<p className="font-mono text-xs">
										Pattern analysis: {item.id}
									</p>
								</div>
							)}

							{/* Full JSON Data */}
							<details className="mt-4">
								<summary className="cursor-pointer font-medium">
									View Full JSON Data
								</summary>
								<pre className="mt-2 max-h-96 overflow-auto rounded bg-gray-100 p-4 text-xs">
									{JSON.stringify(item.data, null, 2)}
								</pre>
							</details>
						</Card>
					))}
				</div>
			</Card>

			{/* Research Associations */}
			<Card className="p-6">
				<h2 className="mb-4 font-semibold text-xl">
					Research Associations Analysis
				</h2>
				<div className="space-y-4">
					{multiResearchData.map((multiItem) => {
						const baseId = multiItem.id.replace("multi_research_", "");
						const relatedSingle = singleResearchData.filter(
							(single) =>
								single.id.includes(baseId) ||
								single.id.includes(multiItem.id.replace("multi_research_", "")),
						);

						return (
							<div key={multiItem.id} className="rounded-lg border p-4">
								<h3 className="mb-2 font-semibold">
									Multi-Research: {multiItem.id}
								</h3>
								<p className="mb-2 text-gray-600 text-sm">Base ID: {baseId}</p>
								<p className="mb-2 text-sm">
									Expected individual research patterns:
								</p>
								<ul className="mb-3 space-y-1 text-xs">
									{multiItem.data?.providers.map((provider) => (
										<li key={provider} className="font-mono">
											research_run_{provider}_{baseId}
										</li>
									))}
								</ul>
								<p className="text-sm">
									<strong>Found related single research:</strong>{" "}
									{relatedSingle.length}
								</p>
								{relatedSingle.map((single) => (
									<div
										key={single.id}
										className="ml-4 rounded bg-green-50 p-2 text-sm"
									>
										{single.id} - Status: {single.data?.status}
									</div>
								))}
							</div>
						);
					})}
				</div>
			</Card>
		</div>
	);
}
