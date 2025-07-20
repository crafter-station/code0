"use client";

import {
	AnthropicIcon,
	CrafterIcon,
	GeminiIcon,
	GithubIcon,
	OpenAIIcon,
	XAIIcon,
} from "@/components/icons";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";
import type { ProviderName } from "@/lib/ai-providers";
import { useClerk, useUser } from "@clerk/nextjs";
import { ChevronUp, LogOut, Plus, Settings, User } from "lucide-react";
import type * as React from "react";
import { useState } from "react";

interface ResearchItem {
	id: string;
	title: string;
	timestamp: string;
	status: string;
	type?: "single" | "multi-provider";
	providers?: ProviderName[];
	parentId?: string;
	individualResults?: {
		provider: ProviderName;
		status: "pending" | "processing" | "completed" | "error";
		progress?: string;
		result?: string;
		researchId?: string;
	}[];
}

const ProviderIcons: Record<
	ProviderName,
	React.ComponentType<{ className?: string }>
> = {
	openai: OpenAIIcon,
	anthropic: AnthropicIcon,
	google: GeminiIcon,
	xai: XAIIcon,
};

function formatTimestamp(timestamp: string): string {
	const date = new Date(timestamp);
	const now = new Date();
	const diffMs = now.getTime() - date.getTime();
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
	const diffDays = Math.floor(diffHours / 24);

	if (diffHours < 1) return "Just now";
	if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
	if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
	if (diffDays < 30)
		return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
	return date.toLocaleDateString();
}

interface ResearchSidebarClientProps {
	initialData: ResearchItem[];
}

export function ResearchSidebarClient({
	initialData,
	...props
}: ResearchSidebarClientProps & React.ComponentProps<typeof Sidebar>) {
	const { user } = useUser();
	const { signOut } = useClerk();
	// Only show multi-provider research items
	const [researchItems, setResearchItems] = useState<ResearchItem[]>(
		initialData.filter(
			(item) => item.type === "multi-provider" && !item.parentId,
		),
	);

	const handleSignOut = () => {
		signOut({ redirectUrl: "/" });
	};

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarHeader>
				<div className="flex flex-col gap-2">
					<div className="flex flex-row items-center justify-center py-2">
						<a className="flex flex-row items-center gap-2" href="/">
							<div className="flex flex-row items-center gap-2">
								<div className="text-foreground">
									<CrafterIcon className="size-6" />
								</div>
								<span className="font-bold text-foreground text-lg tracking-tighter group-data-[collapsible=icon]:hidden">
									Ultra Deep Research
								</span>
							</div>
						</a>
					</div>

					<SidebarMenuButton
						size="lg"
						tooltip="New Report"
						variant="outline"
						className="justify-center"
					>
						<Plus className="h-4 w-4" />
						<span className="text-center font-medium group-data-[collapsible=icon]:hidden">
							New Report
						</span>
					</SidebarMenuButton>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel className="font-medium text-muted-foreground text-xs">
						Your reports
					</SidebarGroupLabel>

					{researchItems.length > 0 ? (
						<SidebarMenu>
							{researchItems.map((item) => {
								const providers = item.providers || [];

								return (
									<SidebarMenuItem key={item.id}>
										<SidebarMenuButton
											size="lg"
											className="h-auto justify-start p-3 hover:bg-accent hover:text-accent-foreground group-data-[collapsible=icon]:justify-center"
											tooltip={item.title}
											asChild
										>
											<a
												href={`/chat/${item.id}`}
												className="flex flex-col items-start justify-start gap-2"
											>
												{/* First row: Icon, title, and truncated text */}
												<span className="max-w-full flex-1 text-ellipsis text-start font-medium text-foreground text-sm leading-tight">
													{item.title}
												</span>

												{/* Second row: Provider icons and timestamp */}
												<div className="flex w-full items-center justify-between group-data-[collapsible=icon]:hidden">
													<div className="flex items-center gap-1">
														{providers.map((provider) => {
															const IconComponent = ProviderIcons[provider];
															return IconComponent ? (
																<IconComponent
																	key={provider}
																	className="h-3.5 w-3.5"
																/>
															) : null;
														})}
													</div>
													<span className="text-muted-foreground text-xs">
														{formatTimestamp(item.timestamp)}
													</span>
												</div>
											</a>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					) : (
						<p className="text-left text-base text-muted-foreground group-data-[collapsible=icon]:hidden">
							No research reports yet.
						</p>
					)}
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className="gap-0">
				<div className="flex w-full flex-col border-border border-t py-2">
					<SidebarMenuButton
						tooltip="View on GitHub"
						asChild
						className="w-full justify-center"
					>
						<a
							href="https://github.com/user/ultra-deep-research"
							target="_blank"
							rel="noopener noreferrer"
							className="flex items-center gap-2 text-muted-foreground text-sm transition-colors hover:text-foreground"
						>
							<GithubIcon className="h-4 w-4" />
							<span className="group-data-[collapsible=icon]:hidden">
								View on GitHub
							</span>
						</a>
					</SidebarMenuButton>
				</div>

				<div className="flex flex-row items-center gap-2 border-border border-t px-5 pt-3">
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<SidebarMenuButton
								tooltip={
									user?.fullName ||
									user?.emailAddresses[0]?.emailAddress ||
									"User"
								}
								className="w-full justify-start p-0 data-[state=open]:bg-accent"
							>
								<div className="flex w-full items-center justify-between gap-2">
									<div className="flex items-center gap-2">
										<div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-chart-1 font-medium text-primary-foreground text-sm">
											{user?.firstName?.charAt(0) ||
												user?.emailAddresses[0]?.emailAddress?.charAt(0) ||
												"U"}
										</div>
										<span className="font-medium text-foreground text-sm group-data-[collapsible=icon]:hidden">
											{user?.firstName ||
												user?.emailAddresses[0]?.emailAddress?.split("@")[0] ||
												"User"}
										</span>
									</div>
									<ChevronUp className="h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
								</div>
							</SidebarMenuButton>
						</DropdownMenuTrigger>
						<DropdownMenuContent side="top" align="end" className="w-56">
							<DropdownMenuItem className="flex items-center gap-2">
								<User className="h-4 w-4" />
								<div className="flex flex-col">
									<span className="text-sm">{user?.fullName || "User"}</span>
									<span className="text-muted-foreground text-xs">
										{user?.emailAddresses[0]?.emailAddress}
									</span>
								</div>
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem className="flex items-center gap-2">
								<Settings className="h-4 w-4" />
								Settings
							</DropdownMenuItem>
							<DropdownMenuSeparator />
							<DropdownMenuItem
								className="flex items-center gap-2 text-destructive focus:text-destructive"
								onClick={handleSignOut}
							>
								<LogOut className="h-4 w-4" />
								Sign out
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</SidebarFooter>

			<SidebarRail />
		</Sidebar>
	);
}
