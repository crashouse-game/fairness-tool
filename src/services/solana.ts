import { createSolanaRpc } from "@solana/kit";
import { DEFAULT_SOLANA_RPC_URL } from "@/lib/config";
import type { SolanaTransaction } from "@/lib/types";

export type SolanaClient = {
	getTransaction: (signature: string) => Promise<SolanaTransaction>;
	getTransactions: (signatures: string[]) => Promise<SolanaTransaction[]>;
};

type SolanaClientOptions = {
	rpcUrl?: string;
};

type RpcTransactionResult = {
	slot?: number | bigint;
	blockTime?: number | bigint | null;
	meta?: { err?: unknown; logMessages?: string[] | null };
} | null;

type RpcRequest<T> = {
	send: () => Promise<T>;
};

type RpcClient = {
	getTransaction: (signature: string, config: Record<string, unknown>) => RpcRequest<RpcTransactionResult>;
};

export const createSolanaClient = ({
	rpcUrl = DEFAULT_SOLANA_RPC_URL,
}: SolanaClientOptions = {}): SolanaClient => {
	const rpc = createSolanaRpc(rpcUrl) as unknown as RpcClient;
	const config = {
		commitment: "confirmed",
		maxSupportedTransactionVersion: 0,
		encoding: "json",
	} as const;

	const fetchTransaction = async (signature: string) => {
		const result = await rpc.getTransaction(signature, config).send();
		if (!result) {
			throw new Error("Transaction not found.");
		}

		const toNumber = (value: number | bigint | null | undefined) => {
			if (value === null || value === undefined) {
				return null;
			}
			return typeof value === "bigint" ? Number(value) : value;
		};

		return {
			signature,
			slot: toNumber(result.slot),
			blockTime: toNumber(result.blockTime),
			err: result.meta?.err ?? null,
			logs: result.meta?.logMessages ?? [],
			raw: result,
		};
	};

	return {
		getTransaction: fetchTransaction,
		getTransactions: (signatures) => Promise.all(signatures.map(fetchTransaction)),
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
		async getTransactions(signatures) {
			const dataset = await resolveTransactions();
			if (Object.keys(dataset).length === 0) {
				return signatures.map((signature) => ({
					...fallback,
					signature,
				}));
			}

			return signatures.map((signature) => {
				const match = dataset[signature];
				if (!match) {
					throw new Error(`Mock transaction not found: ${signature}`);
				}
				return match;
			});
		},
	};
};
