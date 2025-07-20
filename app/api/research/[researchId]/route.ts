import { getMultiProviderResearchState, getResearchState } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET(
	request: Request,
	{ params }: { params: { researchId: string } },
) {
	const researchId = params.researchId;

	try {
		// Check if it's a multi-provider research (starts with "multi_research_")
		if (researchId.startsWith("multi_research_")) {
			const multiState = await getMultiProviderResearchState(researchId);

			if (!multiState) {
				return NextResponse.json(
					{ error: "Multi-provider research not found" },
					{ status: 404 },
				);
			}

			return NextResponse.json({
				type: "multi-provider",
				data: multiState,
			});
		}

		// Check if it's a regular research (starts with "research_")
		if (researchId.startsWith("research_")) {
			const state = await getResearchState(researchId);

			if (!state) {
				return NextResponse.json(
					{ error: "Research not found" },
					{ status: 404 },
				);
			}

			return NextResponse.json({
				type: "single",
				data: state,
			});
		}

		// Try both if no clear prefix
		const [multiState, singleState] = await Promise.all([
			getMultiProviderResearchState(researchId),
			getResearchState(researchId),
		]);

		if (multiState) {
			return NextResponse.json({
				type: "multi-provider",
				data: multiState,
			});
		}

		if (singleState) {
			return NextResponse.json({
				type: "single",
				data: singleState,
			});
		}

		return NextResponse.json({ error: "Research not found" }, { status: 404 });
	} catch (error) {
		console.error("Failed to fetch research:", error);
		return NextResponse.json(
			{ error: "Failed to fetch research" },
			{ status: 500 },
		);
	}
}
