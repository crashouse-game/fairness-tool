"use client";

import { Check, Files } from "lucide-react";
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
			className="text-purple hover:text-purple/70 transition"
		>
			{copied ? (
				<span aria-hidden="true">
					<Check size={18} />
				</span>
			) : (
				<Files size={18} />
			)}
		</button>
	);
};

export default CopyButton;
