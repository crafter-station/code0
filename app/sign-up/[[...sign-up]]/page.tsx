import { SignUp } from "@clerk/nextjs";

export default function Page() {
	return (
		<div className="flex min-h-screen items-center justify-center bg-background">
			<div className="w-full max-w-md p-6">
				<SignUp routing="path" path="/sign-up" />
			</div>
		</div>
	);
}
