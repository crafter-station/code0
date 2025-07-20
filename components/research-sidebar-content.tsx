import type { ProviderName } from "@/lib/ai-providers";
import { auth } from "@clerk/nextjs/server";

interface ResearchItem {
	id: string;
	title: string;
	timestamp: string;
	status: string;
	type?: "single" | "multi-provider";
	providers?: ProviderName[];
	parentId?: string;
	individualResults?: {
		provider: ProviderName;
		status: "pending" | "processing" | "completed" | "error";
		progress?: string;
		result?: string;
		researchId?: string;
	}[];
}

async function getResearchItems(): Promise<ResearchItem[]> {
	const { userId } = await auth();

	if (!userId) {
		return [];
	}

	try {
		// Use the full URL for server-side fetch
		const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
		const response = await fetch(`${baseUrl}/api/research/list`, {
			headers: {
				Cookie: `clerk-session=${process.env.CLERK_SECRET_KEY}`, // Pass auth if needed
			},
			// Add cache control for server-side fetching
			next: { revalidate: 60 }, // Revalidate every minute
		});

		if (!response.ok) {
			console.error("Failed to fetch research items:", response.status);
			return [];
		}

		const data = await response.json();
		return data;
	} catch (error) {
		console.error("Failed to fetch research items:", error);
		return [];
	}
}

export async function ResearchSidebarContent() {
	const initialResearchItems = await getResearchItems();

	// Import the client component dynamically to avoid SSR issues
	const { ResearchSidebarClient } = await import("./research-sidebar-client");

	return <ResearchSidebarClient initialData={initialResearchItems} />;
}
