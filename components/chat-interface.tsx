"use client";

import { startMultiProviderResearchAction } from "@/app/actions/research-actions";
import {
	AnthropicIcon,
	GeminiIcon,
	OpenAIIcon,
	XAIIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Textarea } from "@/components/ui/textarea";
import type { MultiProviderResearchActionState } from "@/lib/action-types";
import { AI_PROVIDERS, type ProviderName } from "@/lib/ai-providers";
import {
	type RefinementQuestionsType,
	refinementQuestionsSchema,
} from "@/lib/schemas/refinement-questions";
import { experimental_useObject as useObject } from "@ai-sdk/react";
import { useUser } from "@clerk/nextjs";
import { ArrowUp, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

export function ChatInterface() {
	const { user } = useUser();
	const router = useRouter();
	const [message, setMessage] = React.useState("");
	const [isGenerating, setIsGenerating] = React.useState(false);
	const [questions, setQuestions] = React.useState<
		RefinementQuestionsType["questions"]
	>([]);
	const [questionAnswers, setQuestionAnswers] = React.useState<
		Record<string, string>
	>({});
	const [showProviderSelection, setShowProviderSelection] =
		React.useState(false);
	const [selectedProviders, setSelectedProviders] = React.useState<
		ProviderName[]
	>(["openai", "anthropic", "google", "xai"]);
	const [currentQuery, setCurrentQuery] = React.useState("");

	const {
		object: questionsData,
		submit: submitQuestion,
		isLoading: isGeneratingQuestions,
	} = useObject<RefinementQuestionsType>({
		api: "/api/ai/completion/questions",
		schema: refinementQuestionsSchema,
	});

	// Update local state when streamed data changes
	React.useEffect(() => {
		if (questionsData?.questions) {
			// Filter out questions that don't have all required properties
			const validQuestions = questionsData.questions.filter(
				(q): q is { id: string; question: string; placeholder: string } =>
					q !== undefined &&
					typeof q.id === "string" &&
					typeof q.question === "string" &&
					typeof q.placeholder === "string",
			);
			setQuestions(validQuestions);
		}
	}, [questionsData]);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (message.trim()) {
			const questionText = message;
			setCurrentQuery(questionText);
			setMessage("");
			setQuestions([]); // Clear previous questions
			submitQuestion({ question: questionText });
		}
	};

	const handleRefinementGenerate = () => {
		// Move to provider selection with refined query
		setQuestions([]);
		setShowProviderSelection(true);
	};

	const handleRefinementSkip = () => {
		// Move to provider selection with original query
		setQuestions([]);
		setShowProviderSelection(true);
	};

	const handleProviderToggle = (provider: ProviderName) => {
		setSelectedProviders((prev) =>
			prev.includes(provider)
				? prev.filter((p) => p !== provider)
				: [...prev, provider],
		);
	};

	const handleStartResearch = async () => {
		if (selectedProviders.length === 0 || !currentQuery.trim()) return;

		setIsGenerating(true);
		try {
			const formData = new FormData();

			// Build refined query from answers if available
			let finalQuery = currentQuery;
			if (Object.keys(questionAnswers).length > 0) {
				const answersText = Object.entries(questionAnswers)
					.filter(([_questionId, answer]) => answer.trim())
					.map(([questionId, answer]) => {
						const question = questions.find((q) => q.id === questionId);
						return question ? `${question.question}: ${answer}` : answer;
					})
					.join("\n\n");

				if (answersText) {
					finalQuery = `${currentQuery}\n\nAdditional context:\n${answersText}`;
				}
			}

			formData.append("query", finalQuery);
			formData.append("depth", "comprehensive");

			// Add selected providers
			for (const provider of selectedProviders) {
				formData.append("providers", provider);
			}

			const result = await startMultiProviderResearchAction(
				{
					input: {
						query: finalQuery,
						depth: "comprehensive",
						enabledProviders: selectedProviders,
					},
					output: { success: false },
				} as MultiProviderResearchActionState,
				formData,
			);

			if (result.output.success) {
				console.log("Research started successfully:", result.output.data);

				// Verify the research exists before redirecting
				const researchId = result.output.data.researchId;
				console.log("Checking research existence for ID:", researchId);

				try {
					const verifyResponse = await fetch(`/api/research/${researchId}`);
					if (verifyResponse.ok) {
						console.log(
							"Research verified, redirecting to:",
							`/chat/${researchId}`,
						);
						router.push(`/chat/${researchId}`);
					} else {
						console.warn(
							"Research not found immediately, will redirect anyway (polling will handle)",
						);
						router.push(`/chat/${researchId}`);
					}
				} catch (verifyError) {
					console.warn(
						"Error verifying research, redirecting anyway:",
						verifyError,
					);
					router.push(`/chat/${researchId}`);
				}
			} else {
				// Handle error case
				console.error("Research failed:", result.output.error);
				// You might want to show a toast notification here
			}
		} catch (error) {
			console.error("Failed to start research:", error);
			// You might want to show a user-friendly error message here
		} finally {
			setIsGenerating(false);
		}
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
					{(questions?.length || isGeneratingQuestions) &&
						!showProviderSelection && (
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
												<Textarea
													placeholder={question.placeholder}
													value={questionAnswers[question.id] || ""}
													onChange={(e) =>
														setQuestionAnswers((prev) => ({
															...prev,
															[question.id]: e.target.value,
														}))
													}
													className="mt-2 min-h-[80px] resize-none"
												/>
											)}
										</div>
									))}

									{!isGeneratingQuestions &&
										questions &&
										questions.length > 0 && (
											<div className="flex gap-2 pt-4">
												<Button
													onClick={handleRefinementGenerate}
													className="flex-1"
													type="button"
												>
													Continue with Answers
												</Button>
												<Button
													variant="outline"
													onClick={handleRefinementSkip}
													className="flex-1"
												>
													Skip Questions
												</Button>
											</div>
										)}
								</div>
							</Card>
						)}

					{/* Provider Selection */}
					{showProviderSelection && !isGenerating && (
						<Card className="space-y-6 p-6">
							<div className="space-y-2 text-center">
								<h3 className="font-semibold text-lg">Select AI Models</h3>
								<p className="text-muted-foreground text-sm">
									Choose which AI models should research &ldquo;{currentQuery}
									&rdquo;
								</p>
							</div>

							<div className="grid grid-cols-2 gap-4">
								{Object.entries(AI_PROVIDERS).map(([key, provider]) => {
									const providerKey = key as ProviderName;
									const isSelected = selectedProviders.includes(providerKey);
									const IconComponent = {
										openai: OpenAIIcon,
										anthropic: AnthropicIcon,
										google: GeminiIcon,
										xai: XAIIcon,
									}[providerKey];

									return (
										<button
											type="button"
											key={providerKey}
											onClick={() => handleProviderToggle(providerKey)}
											className={`relative flex items-center gap-3 rounded-lg border p-4 text-left transition-all hover:bg-muted/50 ${
												isSelected
													? "border-primary bg-primary/5 ring-1 ring-primary"
													: "border-border bg-background"
											}`}
										>
											{IconComponent && (
												<IconComponent className="h-6 w-6 flex-shrink-0" />
											)}
											<div className="min-w-0 flex-1">
												<div className="font-medium text-sm">
													{provider.name}
												</div>
												<div className="text-muted-foreground text-xs">
													{provider.strengths.slice(0, 2).join(", ")}
												</div>
											</div>
											{isSelected && (
												<Check className="h-4 w-4 flex-shrink-0 text-primary" />
											)}
										</button>
									);
								})}
							</div>

							<div className="flex gap-2">
								<Button
									onClick={handleStartResearch}
									disabled={selectedProviders.length === 0}
									className="flex-1"
								>
									Start Research ({selectedProviders.length} models)
								</Button>
								<Button
									variant="outline"
									onClick={() => setShowProviderSelection(false)}
								>
									Back
								</Button>
							</div>
						</Card>
					)}

					{/* Welcome Message */}
					{!questions?.length &&
						!isGenerating &&
						!isGeneratingQuestions &&
						!showProviderSelection && (
							<div className="space-y-4 text-center">
								<h2 className="font-medium font-serif text-[32px] text-foreground md:text-[40px]">
									What would you like to research today?
								</h2>
								<p className="mx-auto max-w-[480px] text-base text-muted-foreground">
									Ask any question and get comprehensive insights from 4 AI
									models working in parallel
								</p>
							</div>
						)}

					{/* Research Status */}
					{isGenerating && (
						<Card className="space-y-4 p-6">
							<div className="text-center">
								<h3 className="mb-4 font-semibold text-lg">
									Launching Research Pipeline
								</h3>
								<div className="mb-4 flex items-center justify-center gap-3">
									<Loader2 className="h-5 w-5 animate-spin" />
									<span className="text-muted-foreground text-sm">
										Initializing {selectedProviders.length} AI models...
									</span>
								</div>
								<div className="grid grid-cols-2 gap-3">
									{selectedProviders.map((providerKey) => {
										const provider = AI_PROVIDERS[providerKey];
										const IconComponent = {
											openai: OpenAIIcon,
											anthropic: AnthropicIcon,
											google: GeminiIcon,
											xai: XAIIcon,
										}[providerKey];

										return (
											<div
												key={providerKey}
												className="flex items-center gap-3 rounded-lg border bg-muted/50 p-3"
											>
												{IconComponent && <IconComponent className="h-5 w-5" />}
												<div className="flex-1">
													<div className="font-medium text-sm">
														{provider.name}
													</div>
													<div className="text-muted-foreground text-xs">
														Preparing...
													</div>
												</div>
												<div className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
											</div>
										);
									})}
								</div>
							</div>
						</Card>
					)}

					{/* Input Form */}
					{!questions?.length &&
						!isGeneratingQuestions &&
						!showProviderSelection && (
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
											<XAIIcon className="h-3 w-3" />
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
