import { ResearchSidebarContent } from "@/components/research-sidebar-content";
import type { Sidebar } from "@/components/ui/sidebar";
import type * as React from "react";

export function ResearchSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return <ResearchSidebarContent {...props} />;
}
