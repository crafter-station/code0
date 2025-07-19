"use client";

import {
	AnthropicIcon,
	GeminiIcon,
	OpenAIIcon,
	PerplexityIcon,
} from "@/components/icons";
import { RefinementQuestions } from "@/components/refinement-questions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import { ArrowUp } from "lucide-react";
import * as React from "react";

export function ChatInterface() {
	const [message, setMessage] = React.useState("");
	const [isGenerating, setIsGenerating] = React.useState(false);
	const [showRefinement, setShowRefinement] = React.useState(false);
	const [originalQuestion, setOriginalQuestion] = React.useState("");

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (message.trim()) {
			setOriginalQuestion(message);
			setShowRefinement(true);
			setMessage("");
		}
	};

	const handleRefinementGenerate = (answers: Record<string, string>) => {
		setShowRefinement(false);
		setIsGenerating(true);
		// Simulate research generation with refinement
		setTimeout(() => {
			setIsGenerating(false);
			setOriginalQuestion("");
		}, 3000);
	};

	const handleRefinementSkip = () => {
		setShowRefinement(false);
		setIsGenerating(true);
		// Simulate research generation without refinement
		setTimeout(() => {
			setIsGenerating(false);
			setOriginalQuestion("");
		}, 3000);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSubmit(e);
		}
	};

	// Sample refinement questions - in real app, these would be AI-generated
	const refinementQuestions = [
		{
			id: "aspect",
			question:
				"What specific aspect of the quantum computing syllabus are you interested in (e.g., introductory concepts, advanced topics, practical applications)?",
			placeholder: "Answer here...",
		},
		{
			id: "purpose",
			question:
				"What is the purpose of your research (e.g., academic course, personal interest, professional development)?",
			placeholder: "Answer here...",
		},
		{
			id: "constraints",
			question:
				"Are there any constraints or specific requirements (e.g., level of the course, institution, duration)?",
			placeholder: "Answer here...",
		},
	];

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<header className="flex h-16 shrink-0 items-center gap-2 border-border border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
				<div className="flex items-center gap-2 px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					<div className="flex items-center gap-2">
						<h1 className="font-medium text-foreground text-lg">
							Welcome Back, Railly
						</h1>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<div className="flex flex-1 flex-col items-center justify-center p-4">
				<div className="w-full max-w-4xl space-y-8">
					{/* Refinement Questions */}
					{showRefinement && (
						<RefinementQuestions
							questions={refinementQuestions}
							onGenerate={handleRefinementGenerate}
							onSkip={handleRefinementSkip}
						/>
					)}

					{/* Welcome Message */}
					{!showRefinement && !isGenerating && (
						<div className="space-y-4 text-center">
							<h2 className="font-medium font-serif text-[32px] text-foreground md:text-[40px]">
								What would you like to research today?
							</h2>
							<p className="mx-auto max-w-[480px] text-base text-muted-foreground">
								Ask any question and get comprehensive insights from 4 AI models
								working in parallel
							</p>
						</div>
					)}

					{/* Research Status */}
					{isGenerating && (
						<Card className="space-y-4 p-6">
							<div className="text-center">
								<h3 className="mb-4 font-semibold text-lg">
									Research in Progress
								</h3>
								<div className="grid grid-cols-2 gap-4">
									<div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
										<OpenAIIcon className="h-5 w-5" />
										<div className="flex-1">
											<div className="font-medium text-sm">OpenAI</div>
											<div className="text-muted-foreground text-xs">
												Analyzing...
											</div>
										</div>
										<div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
									</div>
									<div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
										<AnthropicIcon className="h-5 w-5" />
										<div className="flex-1">
											<div className="font-medium text-sm">Anthropic</div>
											<div className="text-muted-foreground text-xs">
												Researching...
											</div>
										</div>
										<div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
									</div>
									<div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
										<GeminiIcon className="h-5 w-5" />
										<div className="flex-1">
											<div className="font-medium text-sm">Gemini</div>
											<div className="text-muted-foreground text-xs">
												Processing...
											</div>
										</div>
										<div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
									</div>
									<div className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3">
										<PerplexityIcon className="h-5 w-5" />
										<div className="flex-1">
											<div className="font-medium text-sm">Perplexity</div>
											<div className="text-muted-foreground text-xs">
												Gathering data...
											</div>
										</div>
										<div className="h-2 w-2 animate-pulse rounded-full bg-yellow-500" />
									</div>
								</div>
							</div>
						</Card>
					)}

					{/* Input Form */}
					{!showRefinement && (
						<form onSubmit={handleSubmit} className="space-y-4">
							<div className="relative">
								<Textarea
									placeholder="Ask any research question..."
									value={message}
									onChange={(e) => setMessage(e.target.value)}
									onKeyDown={handleKeyDown}
									className="min-h-[120px] resize-none border-border bg-background pr-12 text-foreground placeholder:text-muted-foreground"
									disabled={isGenerating}
								/>
								<Button
									type="submit"
									size="sm"
									className="absolute right-3 bottom-3 h-8 w-8 p-0"
									disabled={!message.trim() || isGenerating}
								>
									<ArrowUp className="h-4 w-4" />
									<span className="sr-only">Send message</span>
								</Button>
							</div>

							<div className="text-center">
								<p className="text-muted-foreground text-xs">
									Powered by{" "}
									<span className="inline-flex items-center gap-1">
										<OpenAIIcon className="h-3 w-3" />
										<AnthropicIcon className="h-3 w-3" />
										<GeminiIcon className="h-3 w-3" />
										<PerplexityIcon className="h-3 w-3" />
									</span>{" "}
									working together
								</p>
							</div>
						</form>
					)}
				</div>
			</div>
		</div>
	);
}
