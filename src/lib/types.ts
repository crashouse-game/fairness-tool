export type GameId = string;

export type DataMode = "mainnet" | "devnet" | "mocked";

export type SolanaNetwork = "mainnet-beta" | "devnet" | "testnet";

export type BackendGameResponse = {
	gameId: string;
	commitTx: string;
	blockhashTx: string;
	revealTx: string;
	network?: SolanaNetwork;
};

export type SolanaTransaction = {
	signature: string;
	slot: number | null;
	blockTime: number | null;
	err: unknown | null;
	logs: string[];
	raw: unknown | null;
};

export type CrashComputationResult = {
	crashPoint: number | null;
	verified: boolean;
	message?: string;
};

export type FairnessData = {
	backend: BackendGameResponse;
	transactions: {
		commit: SolanaTransaction | null;
		blockhash: SolanaTransaction | null;
		reveal: SolanaTransaction | null;
	};
	result: CrashComputationResult;
};

export type FairnessStatus = "idle" | "loading" | "ready" | "error";

export type TimelineItem = {
	id: string;
	label: string;
	timestamp?: number | null;
	signature?: string;
	status: "pending" | "ok" | "error";
	note?: string;
};
