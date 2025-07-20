"use client";

import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

export default function PromptInput() {
	return (
		<div className="mx-auto max-w-3xl p-4">
			<div className="flex flex-col gap-2">
				<Textarea
					placeholder="Enter your prompt here..."
					className="min-h-[100px] resize-none"
				/>
				<div className="flex justify-end">
					<Button className="gap-2">
						<Send className="h-4 w-4" />
						Send Prompt
					</Button>
				</div>
			</div>
		</div>
	);
}
