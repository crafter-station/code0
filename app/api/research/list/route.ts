import { getResearchState, listResearchStates } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const researchIds = await listResearchStates();

		const researchStates = await Promise.all(
			researchIds.map(async (id) => {
				const state = await getResearchState(id);
				if (!state) return null;

				return {
					id: state.id,
					title: state.topic || state.title || "Untitled Research",
					timestamp:
						state.createdAt || state.updatedAt || new Date().toISOString(),
					status: state.status || "completed",
				};
			}),
		);

		const validStates = researchStates.filter(Boolean);

		// Sort by timestamp, newest first
		validStates.sort(
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
