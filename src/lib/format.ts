import type { SolanaNetwork } from "./types";

export const truncateMiddle = (value: string, head = 6, tail = 6) => {
	if (value.length <= head + tail + 3) {
		return value;
	}

	return `${value.slice(0, head)}...${value.slice(-tail)}`;
};

export const formatTimestamp = (unixTime?: number | null) => {
	if (!unixTime) {
		return "Pending";
	}

	return new Date(unixTime * 1000).toLocaleString("en-GB", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
};

export const formatCrashPoint = (value: number | null) => {
	if (value === null || Number.isNaN(value)) {
		return "--";
	}

	const truncated = Math.floor(value * 100) / 100;
	return `${truncated.toFixed(2)}x`;
};

export const explorerTxUrl = (signature: string, network?: SolanaNetwork) => {
	const base = "https://solscan.io/tx";
	if (!network || network === "mainnet-beta") {
		return `${base}/${signature}`;
	}

	return `${base}/${signature}?cluster=${network}`;
};
