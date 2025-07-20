"use client";

import {
	AnthropicIcon,
	CrafterIcon,
	GeminiIcon,
	OpenAIIcon,
	PerplexityIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Github } from "lucide-react";
import Link from "next/link";

export default function Home() {
	return (
		<div className="relative flex size-full min-h-screen flex-col items-center justify-center">
			{/* Main Content */}
			<div className="flex w-full max-w-3xl flex-col items-center justify-center gap-4 px-4 pt-8 pb-4">
				{/* Built by badge */}
				<a
					href="https://crafter.station"
					target="_blank"
					rel="noreferrer"
					className="relative flex w-[200px] flex-row items-center justify-center gap-1 rounded border border-border bg-muted px-4 py-2"
				>
					<div className="whitespace-nowrap text-muted-foreground text-xs">
						Built by
					</div>
					<CrafterIcon className="ml-1 h-4 w-4" />
					<span className="ml-1 font-medium text-foreground text-xs">
						Crafter Station
					</span>
				</a>

				{/* Hero Text */}
				<div className="mb-6 flex w-full flex-col gap-4">
					<p className="text-center font-medium font-serif text-[32px] text-foreground md:text-[40px]">
						Ultra Deep Research Reports
					</p>
					<p className="mx-auto max-w-[364px] text-center text-base text-muted-foreground">
						Have 4 AI models research in parallel, synthesize findings, and turn
						every question into an ultra-comprehensive report
					</p>
				</div>

				{/* CTA Button */}
				<div className="flex flex-col gap-2">
					<Link href="/chat">
						<Button
							size="lg"
							className="cursor-pointer gap-1.5 rounded border-[0.5px] px-5 py-2"
						>
							<p className="font-medium text-base">Generate Ultra Report</p>
						</Button>
					</Link>
					<p className="pb-4 text-center text-muted-foreground text-xs">
						Fully{" "}
						<a
							href="https://github.com/user/ultra-deep-research"
							className="font-semibold underline transition hover:text-primary"
						>
							open source
						</a>
					</p>
				</div>

				{/* How it works section */}
				<div className="mb-12 flex min-h-[258px] w-fit max-w-[760px] flex-col gap-4 overflow-hidden rounded-xl border border-border bg-muted px-7 py-5 md:w-full">
					<p className="text-center font-serif text-base text-foreground md:text-left">
						How it works:
					</p>

					<div className="flex flex-col items-center gap-3 md:flex-row">
						{/* Step 1 */}
						<Card className="relative w-[226px] overflow-hidden rounded-xl bg-card p-[7px]">
							<div className="flex h-[92px] w-full max-w-[212px] items-center justify-center rounded bg-gradient-to-br from-primary/10 to-chart-1/10">
								<div className="flex items-center gap-2">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
										1
									</div>
									<span className="font-medium text-primary text-sm">
										Ask Question
									</span>
								</div>
							</div>
							<div className="flex flex-col gap-2 px-2">
								<p className="font-medium text-base text-card-foreground">
									Ask your question
								</p>
								<p className="mb-2 text-muted-foreground text-xs">
									Type any topic or problem into the prompt box.
								</p>
							</div>
						</Card>

						{/* Step 2 */}
						<Card className="relative w-[226px] overflow-hidden rounded-xl bg-card p-[7px]">
							<div className="flex h-[92px] w-full max-w-[212px] items-center justify-center rounded bg-gradient-to-br from-chart-1/10 to-chart-2/10">
								<div className="flex items-center gap-2">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-1 font-bold text-primary-foreground">
										4
									</div>
									<span className="font-medium text-chart-1 text-sm">
										Deep Research
									</span>
								</div>
							</div>
							<div className="flex flex-col gap-2 px-2">
								<p className="font-medium text-base text-card-foreground">
									Deep Research & Refine
								</p>
								<p className="mb-2 text-muted-foreground text-xs">
									4 AI models research in parallel, extracting comprehensive
									insights.
								</p>
							</div>
						</Card>

						{/* Step 3 */}
						<Card className="relative w-[226px] overflow-hidden rounded-xl bg-card p-[7px]">
							<div className="flex h-[92px] w-full max-w-[212px] items-center justify-center rounded bg-gradient-to-br from-chart-3/10 to-chart-4/10">
								<div className="flex items-center gap-2">
									<div className="flex h-8 w-8 items-center justify-center rounded-full bg-chart-3 font-bold text-primary-foreground">
										∞
									</div>
									<span className="font-medium text-chart-3 text-sm">
										Ultra Report
									</span>
								</div>
							</div>
							<div className="flex flex-col gap-2 px-2">
								<p className="font-medium text-base text-card-foreground">
									Get Ultra Report
								</p>
								<p className="mb-2 text-muted-foreground text-xs">
									Receive a synthesized, referenced ultra-report you can save or
									share.
								</p>
							</div>
						</Card>
					</div>
				</div>
			</div>

			{/* Footer */}
			<div className="fixed bottom-4 left-0 z-50 flex w-full items-center justify-center px-4 py-2 text-muted-foreground text-xs leading-5">
				<div className="flex flex-row items-center gap-0">
					<div className="flex items-center gap-2 px-3">
						<span className="text-xs">Powered By</span>
						<a
							target="_blank"
							rel="noreferrer"
							href="https://openai.com"
							className="flex items-center font-semibold transition hover:text-primary"
							title="OpenAI"
						>
							<OpenAIIcon className="h-4 w-4" />
						</a>
						<a
							target="_blank"
							rel="noreferrer"
							href="https://anthropic.com"
							className="flex items-center font-semibold transition hover:text-primary"
							title="Anthropic"
						>
							<AnthropicIcon className="h-4 w-4" />
						</a>
						<a
							target="_blank"
							rel="noreferrer"
							href="https://gemini.google.com"
							className="flex items-center font-semibold transition hover:text-primary"
							title="Google Gemini"
						>
							<GeminiIcon className="h-4 w-4" />
						</a>
						<a
							target="_blank"
							rel="noreferrer"
							href="https://perplexity.ai"
							className="flex items-center font-semibold transition hover:text-primary"
							title="Perplexity"
						>
							<PerplexityIcon className="h-4 w-4" />
						</a>
					</div>
					<span className="mx-2 h-5 w-px bg-border" />
					<a
						href="https://blog.com/ultra-deep-research"
						target="_blank"
						rel="noreferrer"
						className="px-3 font-semibold text-xs transition-colors hover:text-muted-foreground"
					>
						Blog on how it works
					</a>
					<span className="mx-2 h-5 w-px bg-border" />
					<div className="flex items-center gap-2 px-3">
						<a
							href="https://github.com/user/ultra-deep-research"
							target="_blank"
							rel="noreferrer"
							aria-label="GitHub"
							className="flex items-center gap-2 font-semibold transition-colors hover:text-muted-foreground"
						>
							<Github className="h-[18px] w-[18px]" />
							Star on GitHub
						</a>
					</div>
				</div>
			</div>
		</div>
	);
}
