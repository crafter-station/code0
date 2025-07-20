"use client";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import * as React from "react";

interface RefinementQuestionsProps {
	questions: Array<{
		id: string;
		question: string;
		placeholder: string;
	}>;
	onGenerate: (answers: Record<string, string>) => void;
	onSkip: () => void;
}

export function RefinementQuestions({
	questions,
	onGenerate,
	onSkip,
}: RefinementQuestionsProps) {
	const [answers, setAnswers] = React.useState<Record<string, string>>({});

	const handleAnswerChange = (questionId: string, value: string) => {
		setAnswers((prev) => ({
			...prev,
			[questionId]: value,
		}));
	};

	const handleGenerate = () => {
		onGenerate(answers);
	};

	return (
		<Card className="mx-auto w-full max-w-4xl">
			<CardHeader>
				<h2 className="font-medium font-serif text-[24px] text-foreground md:text-[28px]">
					Answer some questions for a more accurate report
				</h2>
				<p className="text-base text-muted-foreground">
					This is optional, you can skip this by clicking "Generate Report" or
					"Skip".
				</p>
			</CardHeader>

			<CardContent>
				<div className="space-y-8">
					{questions.map((question) => (
						<div key={question.id} className="space-y-4">
							<label
								htmlFor={`question-${question.id}`}
								className="block font-medium text-base text-foreground leading-relaxed"
							>
								{question.question}
							</label>
							<Textarea
								id={`question-${question.id}`}
								placeholder={question.placeholder}
								value={answers[question.id] || ""}
								onChange={(e) =>
									handleAnswerChange(question.id, e.target.value)
								}
								className="min-h-[80px] resize-none border-border bg-background text-foreground placeholder:text-muted-foreground"
								rows={3}
							/>
						</div>
					))}
				</div>
			</CardContent>

			<CardFooter>
				<div className="flex w-full flex-col gap-3 sm:flex-row">
					<Button
						onClick={handleGenerate}
						size="lg"
						className="flex-1 cursor-pointer gap-1.5 rounded border-[0.5px] px-6 py-3 sm:flex-none"
					>
						<span className="font-medium text-base">Generate Report</span>
					</Button>
					<Button
						onClick={onSkip}
						variant="outline"
						size="lg"
						className="flex-1 cursor-pointer gap-1.5 rounded border-[0.5px] px-6 py-3 sm:flex-none"
					>
						<span className="font-medium text-base">Skip</span>
					</Button>
				</div>
			</CardFooter>
		</Card>
	);
}
