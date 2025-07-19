"use client";

import PromptInput from "@/components/PromptInput";
import Header from "../components/Header";

export default function Home() {
	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className="pt-8">
				<PromptInput />
			</main>
		</div>
	);
}
