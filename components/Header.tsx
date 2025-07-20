import Link from "next/link";
import { UserButton } from "./UserButton";

export default function Header() {
	return (
		<nav className="flex h-16 w-full items-center justify-between border-b bg-white px-6">
			<div className="flex items-center gap-4">
				<Link href="/">
					<span className="font-bold text-lg">code0</span>
				</Link>
			</div>
			<div className="flex items-center gap-2">
				<UserButton />
			</div>
		</nav>
	);
}
