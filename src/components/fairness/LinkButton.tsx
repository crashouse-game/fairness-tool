"use client";

import { Link } from "lucide-react";

import { explorerTxUrl } from "@/lib/format";
import type { SolanaNetwork } from "@/lib/types";

type LinkButtonProps = {
	signature: string;
	network?: SolanaNetwork;
};

const LinkButton = ({ signature, network }: LinkButtonProps) => {
	return (
		<a
			href={explorerTxUrl(signature, network)}
			target="_blank"
			rel="noreferrer"
			aria-label="Open transaction in explorer"
			className="text-purple hover:text-purple/70 transition"
		>
			<Link size={18} />
		</a>
	);
};

export default LinkButton;
