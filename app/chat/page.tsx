"use client";

import { ChatInterface } from "@/components/chat-interface";
import { ResearchSidebar } from "@/components/research-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function ChatPage() {
	return (
		<SidebarProvider>
			<ResearchSidebar />
			<SidebarInset>
				<ChatInterface />
			</SidebarInset>
		</SidebarProvider>
	);
}
