import type { DataMode } from "@/lib/types";
import { IS_BACKEND_MOCKED } from "@/lib/config";
import { getDataMode } from "@/services/dataSource";
import { getMockBackendResponses } from "@/mock/backendData";
import { getDemoTransactions } from "@/mock/blockchainData";
import { createBackendClient, createMockBackendClient, type BackendClient } from "./backend";
import { createMockSolanaClient, createSolanaClient, type SolanaClient } from "./solana";

let cachedBackendMocked: boolean | null = null;
let cachedBackendClient: BackendClient | null = null;

let cachedSolanaMode: DataMode | null = null;
let cachedSolanaClient: SolanaClient | null = null;

export const getBackendClient = () => {
	if (cachedBackendClient && cachedBackendMocked === IS_BACKEND_MOCKED) {
		return cachedBackendClient;
	}

	cachedBackendMocked = IS_BACKEND_MOCKED;
	cachedBackendClient = IS_BACKEND_MOCKED
		? createMockBackendClient({ games: getMockBackendResponses(getDataMode()) })
		: createBackendClient();

	return cachedBackendClient;
};

export const getSolanaClient = (mode = getDataMode()) => {
	if (cachedSolanaClient && cachedSolanaMode === mode) {
		return cachedSolanaClient;
	}

	cachedSolanaMode = mode;
	cachedSolanaClient =
		mode === "mocked"
			? createMockSolanaClient({ transactions: getDemoTransactions })
			: createSolanaClient();

	return cachedSolanaClient;
};
