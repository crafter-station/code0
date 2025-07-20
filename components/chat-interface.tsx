"use client";

import {
	AnthropicIcon,
	GeminiIcon,
	OpenAIIcon,
	PerplexityIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import {
	type RefinementQuestionsType,
	refinementQuestionsSchema,
} from "@/lib/schemas/refinement-questions";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useUser } from "@clerk/nextjs";
import { ArrowUp, Loader2 } from "lucide-react";
import * as React from "react";

export function ChatInterface() {
	const { user } = useUser();
	const [message, setMessage] = React.useState("");
	const [isGenerating, setIsGenerating] = React.useState(false);
	const [questions, setQuestions] = React.useState<
		RefinementQuestionsType["questions"]
	>([]);

	const {
		object: questionsData,
		submit: submitQuestion,
		isLoading: isGeneratingQuestions,
	} = useObject({
		api: "/api/ai/completion/questions",
		schema: refinementQuestionsSchema,
	});

	// Update local state when streamed data changes
	React.useEffect(() => {
		if (questionsData?.questions) {
			setQuestions(questionsData.questions);
		}
	}, [questionsData]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (message.trim()) {
			const questionText = message;
			setMessage("");
			setQuestions([]); // Clear previous questions
			submitQuestion({ question: questionText });
		}
	};

	const handleRefinementGenerate = (_answers: Record<string, string>) => {
		setIsGenerating(true);
		setQuestions([]); // Clear questions when starting research
		setTimeout(() => {
			setIsGenerating(false);
		}, 3000);
	};

	const handleRefinementSkip = () => {
		setIsGenerating(true);
		setQuestions([]); // Clear questions when starting research
		setTimeout(() => {
			setIsGenerating(false);
		}, 3000);
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			// Create a synthetic form event
			const formEvent = new Event("submit", {
				bubbles: true,
				cancelable: true,
			}) as unknown as React.FormEvent;
			handleSubmit(formEvent);
		}
	};

	return (
		<div className="flex h-full flex-col">
			{/* Header */}
			<header className="flex h-16 shrink-0 items-center gap-2 border-border border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
				<div className="flex items-center gap-2 px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					<div className="flex items-center gap-2">
						<h1 className="font-medium text-foreground text-lg">
							Welcome Back, {user?.firstName || user?.username || "User"}
						</h1>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<div className="flex flex-1 flex-col items-center justify-center p-4">
				<div className="w-full max-w-4xl space-y-8">
					{/* Streaming Questions Display */}
					{(questions?.length || isGeneratingQuestions) && (
						<Card className="space-y-4 p-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<h3 className="font-semibold text-lg">
										Refine Your Research
									</h3>
									{isGeneratingQuestions && (
										<div className="flex items-center space-x-2">
											<Loader2 className="h-4 w-4 animate-spin" />
											<span className="text-muted-foreground text-sm">
												Generating questions...
											</span>
										</div>
									)}
								</div>

								{questions?.map((question, index) => (
									<div
										key={question?.id || index}
										className="slide-in-from-bottom-2 animate-in space-y-2 rounded-lg border bg-muted/20 p-4 duration-300"
									>
										<div className="font-medium text-sm">
											{question?.question || "Generating question..."}
										</div>
										{question?.placeholder && (
											<div className="text-muted-foreground text-xs">
												{question.placeholder}
											</div>
										)}
									</div>
								))}

								{!isGeneratingQuestions &&
									questions &&
									questions.length > 0 && (
										<div className="flex gap-2 pt-4">
											<Button
												onClick={() => handleRefinementGenerate({})}
												className="flex-1"
												type="button"
											>
												Generate with Refinements
											</Button>
											<Button
												variant="outline"
												onClick={handleRefinementSkip}
												className="flex-1"
											>
												Skip Refinements
											</Button>
										</div>
									)}
							</div>
						</Card>
					)}

					{/* Welcome Message */}
					{!questions?.length && !isGenerating && !isGeneratingQuestions && (
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
					{!questions?.length && !isGeneratingQuestions && (
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
									disabled={
										!message.trim() || isGenerating || isGeneratingQuestions
									}
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
