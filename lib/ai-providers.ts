import type { LanguageModel } from "ai";

// AI Provider Configuration
export const AI_PROVIDERS = {
	openai: {
		name: "OpenAI",
		models: {
			planning: "gpt-4o",
			reflection: "gpt-4o",
			writing: "gpt-4o",
		},
		strengths: ["Reasoning", "Code Analysis", "Structured Output"],
		color: "#10a37f",
	},
	anthropic: {
		name: "Anthropic",
		models: {
			planning: "claude-3-5-sonnet-20241022",
			reflection: "claude-3-5-sonnet-20241022",
			writing: "claude-3-5-sonnet-20241022",
		},
		strengths: ["Long Context", "Analysis", "Creative Writing"],
		color: "#f97316",
	},
	google: {
		name: "Google",
		models: {
			planning: "gemini-1.5-pro-latest",
			reflection: "gemini-1.5-pro-latest",
			writing: "gemini-1.5-pro-latest",
		},
		strengths: ["Factual Knowledge", "Multi-modal", "Reasoning"],
		color: "#4285f4",
	},
	xai: {
		name: "xAI",
		models: {
			planning: "grok-beta",
			reflection: "grok-beta",
			writing: "grok-beta",
		},
		strengths: ["Real-time Data", "Humor", "Unconventional Thinking"],
		color: "#000000",
	},
} as const;

export type ProviderName = keyof typeof AI_PROVIDERS;

// Get available providers based on environment
export function getAvailableProviders(): ProviderName[] {
	const available: ProviderName[] = [];

	if (process.env.OPENAI_API_KEY) available.push("openai");
	if (process.env.ANTHROPIC_API_KEY) available.push("anthropic");
	if (process.env.GOOGLE_GENERATIVE_AI_API_KEY) available.push("google");
	if (process.env.XAI_API_KEY) available.push("xai");

	return available;
}

/**
 * Get the appropriate model for a given provider and task type
 */
export async function getProviderModel(
	provider: string,
	taskType: "planning" | "reflection" | "writing",
): Promise<LanguageModel> {
	switch (provider) {
		case "openai": {
			const { openai } = await import("@ai-sdk/openai");
			return openai("gpt-4o");
		}
		case "anthropic": {
			const { anthropic } = await import("@ai-sdk/anthropic");
			return anthropic("claude-3-5-sonnet-20241022");
		}
		case "google": {
			const { google } = await import("@ai-sdk/google");
			return google("gemini-2.5-pro");
		}
		case "xai": {
			const { xai } = await import("@ai-sdk/xai");
			return xai("grok-3");
		}
		default: {
			const { openai: defaultOpenai } = await import("@ai-sdk/openai");
			return defaultOpenai("gpt-4o");
		}
	}
}
