import type { DataMode, SolanaNetwork } from "./types";

const normalizeRpcSetting = (value?: string) => (value ?? "").trim();

const resolveMode = (rpcUrl: string): DataMode => {
	if (!rpcUrl) {
		return "mocked";
	}
	if (rpcUrl.includes("devnet")) {
		return "devnet";
	}
	return "mainnet";
};

const resolveRpcUrl = (rpcSetting: string) => {
	if (rpcSetting === "devnet") {
		return "https://api.devnet.solana.com";
	}
	if (rpcSetting === "mainnet") {
		return "https://api.mainnet-beta.solana.com";
	}
	return rpcSetting;
};

const rpcSetting = normalizeRpcSetting(process.env.NEXT_PUBLIC_SOLANA_RPC_URL);

export const DEFAULT_SOLANA_RPC_URL = resolveRpcUrl(rpcSetting);
export const APP_MODE = resolveMode(DEFAULT_SOLANA_RPC_URL);
export const IS_MOCKED_MODE = APP_MODE === "mocked";

const normalizeBackendUrl = (value?: string) => (value ?? "").trim();

export const BACKEND_URL = normalizeBackendUrl(process.env.NEXT_PUBLIC_BACKEND_URL);
export const IS_BACKEND_MOCKED = BACKEND_URL.length === 0;
export const DEFAULT_BACKEND_URL = BACKEND_URL;

const defaultNetwork: SolanaNetwork =
	APP_MODE === "devnet" || APP_MODE === "mocked" ? "devnet" : "mainnet-beta";

export const DEFAULT_NETWORK = defaultNetwork;

export const SOURCE_URL = process.env.NEXT_PUBLIC_SOURCE_URL ?? "";
