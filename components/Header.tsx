import { Activity, Sparkles } from "lucide-react";
import Link from "next/link";
import { UserButton } from "./UserButton";

export default function Header() {
	return (
		<nav className="flex h-16 w-full items-center justify-between border-b bg-white px-6 dark:bg-gray-900">
			<div className="flex items-center gap-6">
				<Link href="/">
					<span className="font-bold text-lg">Ultra Deep Research</span>
				</Link>

				{/* Ultra Deep Research Navigation */}
				<div className="hidden items-center gap-4 md:flex">
					<Link
						href="/research"
						className="flex items-center gap-2 px-3 py-2 font-medium text-gray-700 text-sm transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
					>
						<Sparkles className="h-4 w-4" />
						Start Research
					</Link>
					<Link
						href="/providers/live"
						className="flex items-center gap-2 px-3 py-2 font-medium text-gray-700 text-sm transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
					>
						<Activity className="h-4 w-4" />
						Live States
					</Link>
				</div>
			</div>
			<div className="flex items-center gap-2">
				<UserButton />
			</div>
		</nav>
	);
}
