"use client";

import { Check, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import {
	vs,
	vscDarkPlus,
} from "react-syntax-highlighter/dist/esm/styles/prism";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
	content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
	const { theme } = useTheme();
	const [copiedCode, setCopiedCode] = useState<string | null>(null);

	const copyToClipboard = async (code: string) => {
		await navigator.clipboard.writeText(code);
		setCopiedCode(code);
		setTimeout(() => setCopiedCode(null), 2000);
	};

	return (
		<div className="prose prose-slate dark:prose-invert max-w-none prose-headings:font-bold prose-a:text-blue-600 prose-code:text-foreground prose-strong:text-foreground prose-a:no-underline hover:prose-a:underline dark:prose-a:text-blue-400">
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				rehypePlugins={[rehypeRaw]}
				components={{
					h1: ({ children }) => (
						<h1 className="mt-8 mb-6 border-border border-b pb-2 font-bold text-3xl text-foreground">
							{children}
						</h1>
					),
					h2: ({ children }) => (
						<h2 className="mt-6 mb-4 font-semibold text-2xl text-foreground">
							{children}
						</h2>
					),
					h3: ({ children }) => (
						<h3 className="mt-5 mb-3 font-medium text-foreground text-xl">
							{children}
						</h3>
					),
					h4: ({ children }) => (
						<h4 className="mt-4 mb-2 font-medium text-foreground text-lg">
							{children}
						</h4>
					),
					a: ({ href, children }) => (
						<a
							href={href}
							className="font-medium text-blue-600 transition-colors duration-200 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
							target="_blank"
							rel="noopener noreferrer"
						>
							{children}
						</a>
					),
					p: ({ children }) => (
						<p className="mb-4 text-foreground/90 leading-relaxed">
							{children}
						</p>
					),
					ul: ({ children }) => (
						<ul className="mb-4 list-inside list-disc space-y-1 text-foreground/90">
							{children}
						</ul>
					),
					ol: ({ children }) => (
						<ol className="mb-4 list-inside list-decimal space-y-1 text-foreground/90">
							{children}
						</ol>
					),
					li: ({ children }) => <li className="pl-2">{children}</li>,
					blockquote: ({ children }) => (
						<blockquote className="my-6 rounded-r-lg border-blue-500 border-l-4 bg-muted/50 py-2 pl-6 text-foreground/80 italic">
							{children}
						</blockquote>
					),
					table: ({ children }) => (
						<div className="my-6 overflow-x-auto">
							<table className="min-w-full border-collapse rounded-lg border border-border">
								{children}
							</table>
						</div>
					),
					thead: ({ children }) => (
						<thead className="bg-muted">{children}</thead>
					),
					th: ({ children }) => (
						<th className="border border-border px-4 py-2 text-left font-semibold text-foreground">
							{children}
						</th>
					),
					td: ({ children }) => (
						<td className="border border-border px-4 py-2 text-foreground/90">
							{children}
						</td>
					),
					code: ({
						inline,
						className,
						children,
						...props
					}: React.ComponentProps<"code"> & { inline?: boolean }) => {
						const match = /language-(\w+)/.exec(className || "");
						const language = match ? match[1] : "";
						const codeString = String(children).replace(/\n$/, "");

						if (!inline && match) {
							return (
								<div className="group relative my-6">
									<div className="flex items-center justify-between rounded-t-lg border border-border border-b-0 bg-muted/80 px-4 py-2">
										<span className="font-medium text-muted-foreground text-sm uppercase">
											{language}
										</span>
										<button
											type="button"
											onClick={() => copyToClipboard(codeString)}
											className="flex items-center gap-1 rounded bg-background px-2 py-1 text-xs transition-colors duration-200 hover:bg-muted"
										>
											{copiedCode === codeString ? (
												<>
													<Check className="h-3 w-3" />
													Copied
												</>
											) : (
												<>
													<Copy className="h-3 w-3" />
													Copy
												</>
											)}
										</button>
									</div>
									<SyntaxHighlighter
										style={theme === "dark" ? vscDarkPlus : vs}
										language={language}
										PreTag="div"
										className="!mt-0 !rounded-t-none !border-t-0 rounded-b-lg border border-border"
										showLineNumbers={true}
										wrapLines={true}
										customStyle={{
											margin: 0,
											padding: "1rem",
											fontSize: "0.875rem",
											lineHeight: "1.5",
										}}
									>
										{codeString}
									</SyntaxHighlighter>
								</div>
							);
						}

						return (
							<code
								className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-foreground text-sm"
								{...props}
							>
								{children}
							</code>
						);
					},
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
