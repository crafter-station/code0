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

// Mock data for previous chats
const mockChats = [
	{
		id: "1",
		title: "Climate Change Impact on Agriculture",
		timestamp: "2 hours ago",
	},
	{
		id: "2",
		title: "Quantum Computing Applications",
		timestamp: "1 day ago",
	},
	{
		id: "3",
		title: "AI Ethics in Healthcare",
		timestamp: "3 days ago",
	},
	{
		id: "4",
		title: "Renewable Energy Storage Solutions",
		timestamp: "1 week ago",
	},
];

export function ResearchSidebar({
	...props
}: React.ComponentProps<typeof Sidebar>) {
	const { user } = useUser();
	const { signOut } = useClerk();

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

					{mockChats.length > 0 ? (
						<SidebarMenu>
							{mockChats.map((chat) => (
								<SidebarMenuItem key={chat.id}>
									<SidebarMenuButton
										size="lg"
										className="justify-start hover:bg-accent hover:text-accent-foreground group-data-[collapsible=icon]:justify-center"
										tooltip={chat.title}
									>
										<a
											href={`/chat/${chat.id}`}
											className="flex flex-row items-center gap-2"
										>
											<MessageSquare className="h-4 w-4 text-muted-foreground" />
											<div className="flex flex-col items-start gap-1 group-data-[collapsible=icon]:hidden">
												<span className="w-full max-w-[22ch] truncate text-ellipsis font-medium text-foreground text-sm">
													{chat.title}
												</span>
												<span className="text-muted-foreground text-xs">
													{chat.timestamp}
												</span>
											</div>
										</a>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					) : (
						<p className="text-left text-base text-muted-foreground group-data-[collapsible=icon]:hidden">
							No chats yet.
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
