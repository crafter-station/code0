"use client";

import { type ModelResponse, mockModelResponses } from "@/lib/mock-responses";
import { Clock } from "lucide-react";
import { useState } from "react";
import { AnthropicIcon, GeminiIcon, OpenAIIcon, PerplexityIcon } from "./icons";
import { MarkdownContent } from "./markdown-content";

interface ModelResponseTabsProps {
	responses?: ModelResponse[];
}

export function ModelResponseTabs({
	responses = mockModelResponses,
}: ModelResponseTabsProps) {
	const [activeTab, setActiveTab] = useState<ModelResponse["model"]>("grok");

	const getTabIcon = (model: ModelResponse["model"]) => {
		switch (model) {
			case "grok":
				return <PerplexityIcon className="h-4 w-4" />;
			case "gemini":
				return <GeminiIcon className="h-4 w-4" />;
			case "openai":
				return <OpenAIIcon className="h-4 w-4" />;
			case "anthropic":
				return <AnthropicIcon className="h-4 w-4" />;
			case "summary":
				return <Clock className="h-4 w-4" />;
			default:
				return null;
		}
	};

	const getTabColor = (model: ModelResponse["model"]) => {
		switch (model) {
			case "grok":
				return "border-purple-500 text-purple-600 bg-purple-50 dark:bg-purple-950/30";
			case "gemini":
				return "border-blue-500 text-blue-600 bg-blue-50 dark:bg-blue-950/30";
			case "openai":
				return "border-green-500 text-green-600 bg-green-50 dark:bg-green-950/30";
			case "anthropic":
				return "border-amber-500 text-amber-600 bg-amber-50 dark:bg-amber-950/30";
			case "summary":
				return "border-orange-500 text-orange-600 bg-orange-50 dark:bg-orange-950/30";
			default:
				return "border-gray-500 text-gray-600 bg-gray-50 dark:bg-gray-950/30";
		}
	};

	const activeResponse = responses.find((r) => r.model === activeTab);

	return (
		<div className="w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm">
			{/* Tabs Header */}
			<div className="border-border border-b bg-muted/30">
				<div className="flex overflow-x-auto">
					{responses.map((response) => (
						<button
							type="button"
							key={response.model}
							onClick={() => setActiveTab(response.model)}
							className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-6 py-4 font-medium text-sm transition-all duration-200 hover:bg-muted/50 ${
								activeTab === response.model
									? `${getTabColor(response.model)} border-current`
									: "border-transparent text-muted-foreground hover:text-foreground"
							}`}
						>
							{getTabIcon(response.model)}
							{response.title}
							{activeTab === response.model && response.responseTime && (
								<span className="text-xs opacity-75">
									{response.responseTime}
								</span>
							)}
						</button>
					))}
				</div>
			</div>

			{/* Content Area */}
			{activeResponse && (
				<div className="p-6">
					{/* Response Metadata */}
					<div className="mb-6 flex items-center justify-between border-border border-b pb-4">
						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								{getTabIcon(activeResponse.model)}
								<h3 className="font-semibold text-foreground text-lg">
									{activeResponse.title}
								</h3>
							</div>
							{activeResponse.responseTime && (
								<span className="rounded-full bg-muted px-2 py-1 text-muted-foreground text-xs">
									{activeResponse.responseTime}
								</span>
							)}
						</div>

						{activeResponse.tokens && (
							<div className="flex items-center gap-2 text-muted-foreground text-sm">
								<span>{activeResponse.tokens.toLocaleString()} tokens</span>
							</div>
						)}
					</div>

					{/* Response Content */}
					<div className="prose-container">
						<MarkdownContent content={activeResponse.content} />
					</div>

					{/* Footer */}
					<div className="mt-6 border-border border-t pt-4">
						<div className="flex items-center justify-between text-muted-foreground text-xs">
							<span>
								Generated: {new Date(activeResponse.timestamp).toLocaleString()}
							</span>
							<div className="flex items-center gap-4">
								<span>Model: {activeResponse.model.toUpperCase()}</span>
								{activeResponse.tokens && (
									<span>Tokens: {activeResponse.tokens.toLocaleString()}</span>
								)}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
