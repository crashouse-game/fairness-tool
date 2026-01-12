"use client";

import { useState } from "react";

type CopyButtonProps = {
	value: string;
};

const CopyButton = ({ value }: CopyButtonProps) => {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(value);
			setCopied(true);
			window.setTimeout(() => setCopied(false), 1200);
		} catch {
			setCopied(false);
		}
	};

	return (
		<button
			type="button"
			onClick={handleCopy}
			aria-label="Copy transaction signature"
			className="rounded-full border border-white/10 p-2 text-xs text-white/70 transition hover:border-white/30 hover:text-white"
		>
			{copied ? (
				<span aria-hidden="true">Copied</span>
			) : (
				<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-4 w-4">
					<path
						d="M9 8a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V8Z"
						stroke="currentColor"
						strokeWidth="1.5"
					/>
					<path
						d="M15 6V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h1"
						stroke="currentColor"
						strokeWidth="1.5"
					/>
				</svg>
			)}
		</button>
	);
};

export default CopyButton;
