import { syncAllMultiProviderResearch } from "@/lib/redis";
import { NextResponse } from "next/server";

export async function POST() {
	try {
		console.log("Manual sync requested via API");
		await syncAllMultiProviderResearch();

		return NextResponse.json({
			success: true,
			message:
				"Successfully synced all multi-provider research with individual research data",
		});
	} catch (error) {
		console.error("Error during manual sync:", error);
		return NextResponse.json(
			{
				success: false,
				error:
					error instanceof Error ? error.message : "Unknown error occurred",
			},
			{ status: 500 },
		);
	}
}

export async function GET() {
	return NextResponse.json({
		message: "Use POST to trigger manual sync of all multi-provider research",
		endpoint: "/api/debug/sync-research",
		method: "POST",
	});
}
