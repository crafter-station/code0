"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface EnvVariable {
	id: string;
	name: string;
	value: string;
}

export default function Home() {
	const [showEnvSection, setShowEnvSection] = useState(false);
	const [projectName, setProjectName] = useState("");
	const [description, setDescription] = useState("");
	const [envVariables, setEnvVariables] = useState<EnvVariable[]>([
		{ id: "1", name: "", value: "" },
	]);

	const handleContinue = () => {
		setShowEnvSection(true);
	};

	const addEnvVariable = () => {
		const newId = (envVariables.length + 1).toString();
		setEnvVariables([...envVariables, { id: newId, name: "", value: "" }]);
	};

	const updateEnvVariable = (
		id: string,
		field: "name" | "value",
		newValue: string,
	) => {
		setEnvVariables(
			envVariables.map((env) =>
				env.id === id ? { ...env, [field]: newValue } : env,
			),
		);
	};

	return (
		<div className="min-h-screen bg-background">
			{/* Top Navigation */}
			<nav className="border-border/40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container flex h-16 items-center justify-between">
					<h1 className="font-bold text-2xl tracking-tight">code0</h1>
					<div className="flex items-center gap-4">
						<Link href="/research">
							<Button variant="outline" className="rounded-xl">
								Deep Research Pipeline
							</Button>
						</Link>
					</div>
				</div>
			</nav>

			{/* Main Content */}
			<main className="container mx-auto px-4 py-12">
				<div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
					<div className="w-full max-w-2xl space-y-8">
						{/* Initial Form */}
						<Card className="border-0 shadow-black/5 shadow-lg">
							<CardContent className="p-8">
								<div className="space-y-6">
									<div className="grid gap-6 md:grid-cols-2">
										<div className="space-y-2">
											<label
												htmlFor="project-name"
												className="font-medium text-foreground text-sm"
											>
												Project Name
											</label>
											<Input
												id="project-name"
												placeholder="Enter project name"
												value={projectName}
												onChange={(e) => setProjectName(e.target.value)}
												className="rounded-2xl border-border/50 bg-background"
											/>
										</div>
										<div className="space-y-2">
											<label
												htmlFor="description"
												className="font-medium text-foreground text-sm"
											>
												Description
											</label>
											<Input
												id="description"
												placeholder="Enter description"
												value={description}
												onChange={(e) => setDescription(e.target.value)}
												className="rounded-2xl border-border/50 bg-background"
											/>
										</div>
									</div>

									{!showEnvSection && (
										<div className="flex justify-center pt-4">
											<Button
												onClick={handleContinue}
												className="rounded-2xl px-8 py-2 font-medium"
												size="lg"
											>
												Continue
											</Button>
										</div>
									)}
								</div>
							</CardContent>
						</Card>

						{/* Environment Variables Section */}
						{showEnvSection && (
							<Card className="border-0 shadow-black/5 shadow-lg">
								<CardHeader className="pb-6">
									<CardTitle className="font-semibold text-xl">
										Environment Variables
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									{envVariables.map((envVar, index) => (
										<div key={envVar.id} className="flex items-center gap-3">
											<div className="flex-1">
												<Input
													placeholder="Variable name"
													value={envVar.name}
													onChange={(e) =>
														updateEnvVariable(envVar.id, "name", e.target.value)
													}
													className="rounded-2xl border-border/50 bg-background"
												/>
											</div>
											<div className="flex-1">
												<Input
													placeholder="Variable value"
													value={envVar.value}
													onChange={(e) =>
														updateEnvVariable(
															envVar.id,
															"value",
															e.target.value,
														)
													}
													className="rounded-2xl border-border/50 bg-background"
												/>
											</div>
											<Button
												onClick={addEnvVariable}
												variant="outline"
												size="icon"
												className="rounded-2xl border-border/50 bg-transparent hover:bg-accent/50"
											>
												<Plus className="h-4 w-4" />
												<span className="sr-only">
													Add environment variable
												</span>
											</Button>
										</div>
									))}

									<div className="flex justify-center pt-6">
										<Button
											className="rounded-2xl px-8 py-2 font-medium"
											size="lg"
										>
											Deploy Project
										</Button>
									</div>
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
