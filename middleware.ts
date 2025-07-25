import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/chat(.*)"]);

export default clerkMiddleware(async (auth, req) => {
	if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Include all API routes except uploadthing
		"/api/((?!uploadthing).*)",
		// Include all trpc routes
		"/trpc/(.*)",
	],
};
