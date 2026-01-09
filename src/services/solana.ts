import { DEFAULT_SOLANA_RPC_URL } from "@/lib/config";
import type { SolanaTransaction } from "@/lib/types";

export type SolanaClient = {
	getTransaction: (signature: string) => Promise<SolanaTransaction>;
};

type SolanaClientOptions = {
	rpcUrl?: string;
	fetchFn?: typeof fetch;
};

type RpcResponse<T> = {
	result?: T;
	error?: { message?: string };
};

export const createSolanaClient = ({
	rpcUrl = DEFAULT_SOLANA_RPC_URL,
	fetchFn = fetch,
}: SolanaClientOptions = {}): SolanaClient => {
	return {
		async getTransaction(signature) {
			const response = await fetchFn(rpcUrl, {
				method: "POST",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({
					jsonrpc: "2.0",
					id: 1,
					method: "getTransaction",
					params: [
						signature,
						{
							maxSupportedTransactionVersion: 0,
							commitment: "confirmed",
						},
					],
				}),
			});

			if (!response.ok) {
				throw new Error(`RPC error (${response.status}).`);
			}

			const payload = (await response.json()) as RpcResponse<{
				slot?: number;
				blockTime?: number;
				meta?: { err?: unknown; logMessages?: string[] };
			} | null>;

			if (payload.error) {
				throw new Error(payload.error.message ?? "RPC error.");
			}

			if (!payload.result) {
				throw new Error("Transaction not found.");
			}

			return {
				signature,
				slot: payload.result.slot ?? null,
				blockTime: payload.result.blockTime ?? null,
				err: payload.result.meta?.err ?? null,
				logs: payload.result.meta?.logMessages ?? [],
				raw: payload.result,
			};
		},
	};
};

type MockSolanaOptions = {
	transactions?:
		| Record<string, SolanaTransaction>
		| Promise<Record<string, SolanaTransaction>>
		| (() => Promise<Record<string, SolanaTransaction>>);
	fallback?: SolanaTransaction;
};

const defaultMockTransaction: SolanaTransaction = {
	signature: "mock",
	slot: 0,
	blockTime: Math.floor(Date.now() / 1000),
	err: null,
	logs: [],
	raw: null,
};

export const createMockSolanaClient = (options: MockSolanaOptions = {}): SolanaClient => {
	const transactions = options.transactions;
	const fallback = options.fallback ?? defaultMockTransaction;
	let resolvedTransactions: Record<string, SolanaTransaction> | null = null;
	let resolvingPromise: Promise<Record<string, SolanaTransaction>> | null = null;

	const resolveTransactions = async () => {
		if (resolvedTransactions) {
			return resolvedTransactions;
		}

		if (!resolvingPromise) {
			resolvingPromise = (async () => {
				if (!transactions) {
					return {};
				}
				if (typeof transactions === "function") {
					return transactions();
				}
				return transactions;
			})();
		}

		resolvedTransactions = await resolvingPromise;
		return resolvedTransactions;
	};

	return {
		async getTransaction(signature) {
			const dataset = await resolveTransactions();
			const match = dataset[signature];
			if (match) {
				return match;
			}

			if (Object.keys(dataset).length > 0) {
				throw new Error(`Mock transaction not found: ${signature}`);
			}

			return {
				...fallback,
				signature,
			};
		},
	};
};
