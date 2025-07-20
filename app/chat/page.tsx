"use client";

import { ChatInterface } from "@/components/chat-interface";
import { ResearchSidebar } from "@/components/research-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const router = useRouter();

	useEffect(() => {
		if (isLoaded && !isSignedIn) {
			router.push("/sign-up");
		}
	}, [isLoaded, isSignedIn, router]);

	if (!isLoaded) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
			</div>
		);
	}

	if (!isSignedIn) {
		return null;
	}

	return (
		<SidebarProvider>
			<ResearchSidebar />
			<SidebarInset>
				<ChatInterface />
			</SidebarInset>
		</SidebarProvider>
	);
}
