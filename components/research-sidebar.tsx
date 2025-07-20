"use client";

import { CrafterIcon, GithubIcon } from "@/components/icons";
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
import { useClerk, useUser } from "@clerk/nextjs";
import {
	ChevronUp,
	LogOut,
	MessageSquare,
	Plus,
	Settings,
	User,
} from "lucide-react";
import type * as React from "react";
import { useEffect, useState } from "react";

interface ResearchItem {
	id: string;
	title: string;
	timestamp: string;
	status: string;
}

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

export function ResearchSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const { user } = useUser();
	const { signOut } = useClerk();
	const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchResearchItems = async () => {
			try {
				setIsLoading(true);
				setError(null);
				const response = await fetch("/api/research/list");
				if (!response.ok) {
					throw new Error("Failed to fetch research items");
				}
				const data = await response.json();
				setResearchItems(data);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unknown error");
				console.error("Failed to fetch research items:", err);
			} finally {
				setIsLoading(false);
			}
		};

		fetchResearchItems();
	}, []);

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

					{isLoading ? (
						<p className="text-left text-base text-muted-foreground group-data-[collapsible=icon]:hidden">
							Loading...
						</p>
					) : error ? (
						<p className="text-left text-base text-destructive group-data-[collapsible=icon]:hidden">
							Error: {error}
						</p>
					) : researchItems.length > 0 ? (
						<SidebarMenu>
							{researchItems.map((item) => (
								<SidebarMenuItem key={item.id}>
									<SidebarMenuButton
										size="lg"
										className="justify-start hover:bg-accent hover:text-accent-foreground group-data-[collapsible=icon]:justify-center"
										tooltip={item.title}
									>
										<a
											href={`/chat/${item.id}`}
											className="flex flex-row items-center gap-2"
										>
											<MessageSquare className="h-4 w-4 text-muted-foreground" />
											<div className="flex flex-col items-start gap-1 group-data-[collapsible=icon]:hidden">
												<span className="w-full max-w-[22ch] truncate text-ellipsis font-medium text-foreground text-sm">
													{item.title}
												</span>
												<span className="text-muted-foreground text-xs">
													{formatTimestamp(item.timestamp)}
												</span>
											</div>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
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
