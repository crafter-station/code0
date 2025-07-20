import { ResearchSidebar } from "@/components/research-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const { userId } = await auth();

	if (!userId) {
		redirect("/sign-up");
	}

	return (
		<SidebarProvider>
			<ResearchSidebar />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
