import { SignIn } from "@clerk/nextjs";

export default function Page() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="w-full max-w-md p-6">
				<SignIn routing="path" path="/sign-in" />
			</div>
		</div>
	);
}
