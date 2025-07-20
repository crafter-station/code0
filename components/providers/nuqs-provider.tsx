"use client";

import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

interface NuqsProviderProps {
	children: ReactNode;
}

export function NuqsProvider({ children }: NuqsProviderProps) {
	return <NuqsAdapter>{children}</NuqsAdapter>;
}
