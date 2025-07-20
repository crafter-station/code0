"use client";

import {
	quickResearchAction,
	startResearchAction,
	startMultiProviderResearchAction,
} from "@/app/actions/research-actions";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import type {
	QuickResearchActionState,
	StartResearchActionState,
	MultiProviderResearchActionState,
} from "@/lib/action-types";
import { useActionState, useState } from "react";
import { Activity } from "lucide-react";
import Link from "next/link";

const initialStartState: StartResearchActionState = {
	input: { query: "", depth: "deep" },
	output: { success: false },
};

const initialQuickState: QuickResearchActionState = {
	input: { query: "" },
	output: { success: false },
};

const initialMultiProviderState: MultiProviderResearchActionState = {
	input: { query: "", depth: "comprehensive", enabledProviders: ["openai", "anthropic", "google", "xai"] },
	output: { success: false },
};

export default function ResearchPage() {
	const [startState, startAction, isStartPending] = useActionState(
		startResearchAction,
		initialStartState,
	);
	const [quickState, quickAction, isQuickPending] = useActionState(
		quickResearchAction,
		initialQuickState,
	);
	const [multiProviderState, multiProviderAction, isMultiProviderPending] = useActionState(
		startMultiProviderResearchAction,
		initialMultiProviderState,
	);
	const [activeTab, setActiveTab] = useState<"deep" | "quick" | "ultra">("ultra");

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<div className="container mx-auto space-y-8 py-8">
				<div className="space-y-4 text-center">
					<h1 className="font-bold text-4xl">Ultra Deep Research Pipeline</h1>
					<p className="text-gray-600 text-xl dark:text-gray-400">
						AI-powered research assistant using advanced planning, search, and
						reflection with multiple AI providers
					</p>
					<div className="flex justify-center">
						<Link 
							href="/providers/live" 
							className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
						>
							<Activity className="h-4 w-4" />
							View Live Provider States →
						</Link>
					</div>
				</div>

			{/* Tab Navigation */}
			<div className="flex space-x-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
				<button
					type="button"
					onClick={() => setActiveTab("ultra")}
					className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors ${
						activeTab === "ultra"
							? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-gray-100"
							: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
					}`}
				>
					Ultra Deep Research
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("deep")}
					className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors ${
						activeTab === "deep"
							? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-gray-100"
							: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
					}`}
				>
					Deep Research
				</button>
				<button
					type="button"
					onClick={() => setActiveTab("quick")}
					className={`flex-1 rounded-md px-4 py-2 font-medium text-sm transition-colors ${
						activeTab === "quick"
							? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-gray-100"
							: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
					}`}
				>
					Quick Research
				</button>
			</div>

			{activeTab === "ultra" && (
				<Card>
					<CardHeader>
						<CardTitle>Ultra Deep Research Pipeline</CardTitle>
						<CardDescription>
							Revolutionary multi-provider research that leverages 4 leading AI models (OpenAI, Anthropic, Google, xAI) 
							working in parallel to provide comprehensive analysis from multiple perspectives. 
							This is the most thorough research option available.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form action={multiProviderAction} className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="ultra-query">Research Question</Label>
								<Input
									id="ultra-query"
									name="query"
									placeholder="e.g., What are the implications of artificial general intelligence on society?"
									defaultValue={multiProviderState.input.query}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label>Research Depth</Label>
								<select
									name="depth"
									defaultValue={multiProviderState.input.depth}
									className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
								>
									<option value="comprehensive">Comprehensive (Recommended)</option>
									<option value="deep">Deep</option>
									<option value="surface">Surface</option>
								</select>
							</div>

							<div className="space-y-3">
								<Label>AI Providers (All Selected for Maximum Coverage)</Label>
								<div className="grid grid-cols-2 gap-3">
									{[
										{ id: "openai", label: "OpenAI GPT-4", icon: "🤖" },
										{ id: "anthropic", label: "Anthropic Claude", icon: "🧠" },
										{ id: "google", label: "Google Gemini", icon: "🔍" },
										{ id: "xai", label: "xAI Grok", icon: "🚀" },
									].map((provider) => (
										<div key={provider.id} className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/50">
											<input
												type="checkbox"
												name="providers"
												value={provider.id}
												defaultChecked={true}
												className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
											/>
											<span className="text-sm font-medium">
												{provider.icon} {provider.label}
											</span>
										</div>
									))}
								</div>
							</div>

							{multiProviderState.output.error && (
								<div className="text-destructive text-sm">
									{multiProviderState.output.error}
								</div>
							)}

							{multiProviderState.output.researchId && (
								<div className="space-y-2">
									<div className="text-green-600 text-sm">
										✅ Ultra deep research started successfully!
									</div>
									<a
										href={`/chat/${multiProviderState.output.researchId}`}
										className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
									>
										View Progress →
									</a>
								</div>
							)}

							<Button
								type="submit"
								disabled={isMultiProviderPending}
								className="w-full"
							>
								{isMultiProviderPending
									? "Starting Ultra Deep Research..."
									: "Start Ultra Deep Research"}
							</Button>
						</form>
					</CardContent>
				</Card>
			)}

			{activeTab === "deep" && (
				<Card>
					<CardHeader>
						<CardTitle>Deep Research Pipeline</CardTitle>
						<CardDescription>
							Comprehensive research with planning, iterative search,
							reflection, and detailed reporting. This process can take several
							minutes to complete.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form action={startAction} className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="query">Research Question</Label>
								<Input
									id="query"
									name="query"
									placeholder="e.g., What are the latest developments in AI research pipelines?"
									defaultValue={startState.input.query}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="depth">Research Depth</Label>
								<select
									id="depth"
									name="depth"
									defaultValue={startState.input.depth}
									className="w-full rounded-md border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800"
								>
									<option value="quick">
										Quick (1-2 queries, rapid results, no reflection)
									</option>
									<option value="surface">
										Surface (3-5 queries, quick overview)
									</option>
									<option value="deep">
										Deep (5-8 queries, comprehensive)
									</option>
									<option value="comprehensive">
										Comprehensive (8-12 queries, exhaustive)
									</option>
								</select>
							</div>

							<Button
								type="submit"
								disabled={isStartPending}
								className="w-full"
							>
								{isStartPending
									? "Starting Research..."
									: "Start Deep Research"}
							</Button>

							{startState.output.success && (
								<div className="rounded-md border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
									<h3 className="font-semibold text-green-800 text-lg dark:text-green-200">
										Research Started Successfully!
									</h3>
									<p className="text-green-700 dark:text-green-300">
										{startState.output.data.message}
									</p>
									<p className="mt-2 text-green-600 text-sm dark:text-green-400">
										Research ID: {startState.output.data.researchId}
									</p>
								</div>
							)}

							{!startState.output.success && startState.output.error && (
								<div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
									<h3 className="font-semibold text-lg text-red-800 dark:text-red-200">
										Error
									</h3>
									<p className="text-red-700 dark:text-red-300">
										{startState.output.error}
									</p>
								</div>
							)}
						</form>
					</CardContent>
				</Card>
			)}

			{activeTab === "quick" && (
				<Card>
					<CardHeader>
						<CardTitle>Quick Research</CardTitle>
						<CardDescription>
							Fast research with immediate results. Get a summary and key
							sources in seconds.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form action={quickAction} className="space-y-6">
							<div className="space-y-2">
								<Label htmlFor="quick-query">Research Question</Label>
								<Input
									id="quick-query"
									name="query"
									placeholder="e.g., What is deep research?"
									defaultValue={quickState.input.query}
									required
								/>
							</div>

							<Button
								type="submit"
								disabled={isQuickPending}
								className="w-full"
							>
								{isQuickPending ? "Researching..." : "Quick Research"}
							</Button>

							{quickState.output.success && (
								<div className="space-y-6">
									<div className="rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
										<h3 className="mb-3 font-semibold text-blue-800 text-lg dark:text-blue-200">
											Research Summary
										</h3>
										<div className="prose dark:prose-invert text-blue-700 dark:text-blue-300">
											{quickState.output.data.summary
												.split("\n")
												.map((paragraph, idx) => (
													<p
														key={`summary-${idx}-${paragraph.slice(0, 20)}`}
														className="mb-2"
													>
														{paragraph}
													</p>
												))}
										</div>
									</div>

									<div>
										<h3 className="mb-4 font-semibold text-lg">
											Sources ({quickState.output.data.sources.length})
										</h3>
										<div className="space-y-3">
											{quickState.output.data.sources.map((source, idx) => (
												<Card
													key={`source-${source.url}-${idx}`}
													className="p-4"
												>
													<div className="mb-2 flex items-start justify-between">
														<h4 className="font-semibold text-blue-600 dark:text-blue-400">
															<a
																href={source.url}
																target="_blank"
																rel="noopener noreferrer"
																className="hover:underline"
															>
																{source.title}
															</a>
														</h4>
														<span className="rounded bg-gray-100 px-2 py-1 text-sm dark:bg-gray-800">
															{(source.relevanceScore * 100).toFixed(0)}%
															relevant
														</span>
													</div>
													<p className="text-gray-600 text-sm dark:text-gray-400">
														{source.snippet}
													</p>
												</Card>
											))}
										</div>
									</div>
								</div>
							)}

							{!quickState.output.success && quickState.output.error && (
								<div className="rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
									<h3 className="font-semibold text-lg text-red-800 dark:text-red-200">
										Error
									</h3>
									<p className="text-red-700 dark:text-red-300">
										{quickState.output.error}
									</p>
								</div>
							)}
						</form>
					</CardContent>
				</Card>
			)}

			{/* Information Cards */}
			<div className="grid gap-6 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle>How Deep Research Works</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-start space-x-3">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 font-semibold text-blue-600 text-sm dark:bg-blue-900 dark:text-blue-400">
								1
							</div>
							<div>
								<h4 className="font-semibold">Planning</h4>
								<p className="text-gray-600 text-sm dark:text-gray-400">
									AI analyzes your query and creates comprehensive search
									strategies
								</p>
							</div>
						</div>
						<div className="flex items-start space-x-3">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 font-semibold text-green-600 text-sm dark:bg-green-900 dark:text-green-400">
								2
							</div>
							<div>
								<h4 className="font-semibold">Search</h4>
								<p className="text-gray-600 text-sm dark:text-gray-400">
									Executes multiple targeted searches and gathers comprehensive
									information
								</p>
							</div>
						</div>
						<div className="flex items-start space-x-3">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 font-semibold text-sm text-yellow-600 dark:bg-yellow-900 dark:text-yellow-400">
								3
							</div>
							<div>
								<h4 className="font-semibold">Reflection</h4>
								<p className="text-gray-600 text-sm dark:text-gray-400">
									Identifies knowledge gaps and determines if additional
									research is needed
								</p>
							</div>
						</div>
						<div className="flex items-start space-x-3">
							<div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 font-semibold text-purple-600 text-sm dark:bg-purple-900 dark:text-purple-400">
								4
							</div>
							<div>
								<h4 className="font-semibold">Writing</h4>
								<p className="text-gray-600 text-sm dark:text-gray-400">
									Generates comprehensive reports with analysis and conclusions
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Pipeline Features</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="flex items-center space-x-2">
							<div className="h-2 w-2 rounded-full bg-green-500" />
							<span className="text-sm">
								Iterative improvement with up to 3 research cycles
							</span>
						</div>
						<div className="flex items-center space-x-2">
							<div className="h-2 w-2 rounded-full bg-green-500" />
							<span className="text-sm">
								Automatic knowledge gap identification
							</span>
						</div>
						<div className="flex items-center space-x-2">
							<div className="h-2 w-2 rounded-full bg-green-500" />
							<span className="text-sm">Multi-perspective analysis</span>
						</div>
						<div className="flex items-center space-x-2">
							<div className="h-2 w-2 rounded-full bg-green-500" />
							<span className="text-sm">Structured reporting with sources</span>
						</div>
						<div className="flex items-center space-x-2">
							<div className="h-2 w-2 rounded-full bg-green-500" />
							<span className="text-sm">Configurable research depth</span>
						</div>
						<div className="flex items-center space-x-2">
							<div className="h-2 w-2 rounded-full bg-green-500" />
							<span className="text-sm">Powered by GPT-4 and Claude</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
