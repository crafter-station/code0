export type StartResearchActionState = {
	input: {
		query: string;
		depth: "quick" | "surface" | "deep" | "comprehensive";
	};
	output:
		| { success: true; data: { researchId: string; message: string } }
		| { success: false; error?: string };
};

export type GetResearchStatusActionState = {
	input: {
		researchId: string;
	};
	output:
		| {
				success: true;
				data: {
					status: string;
					originalQuery: string;
					iterations: number;
					sourcesCount: number;
					gapsCount: number;
					hasReport: boolean;
					createdAt: string;
					updatedAt: string;
					finalReport?: string;
				};
		  }
		| { success: false; error?: string };
};

export type QuickResearchActionState = {
	input: {
		query: string;
	};
	output:
		| {
				success: true;
				data: {
					summary: string;
					sources: Array<{
						title: string;
						url: string;
						snippet: string;
						relevanceScore: number;
					}>;
				};
		  }
		| { success: false; error?: string };
};

export type MultiProviderResearchActionState = {
	input: {
		query: string;
		depth: "quick" | "surface" | "deep" | "comprehensive";
		enabledProviders?: string[];
	};
	output:
		| { success: true; data: { researchId: string; message: string } }
		| { success: false; error?: string };
};
