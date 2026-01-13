import { DEFAULT_BACKEND_URL } from "@/lib/config";
import type { BackendGameResponse } from "@/lib/types";

export type BackendClient = {
	fetchGameById: (gameId: string) => Promise<BackendGameResponse>;
};

type BackendClientOptions = {
	baseUrl?: string;
	fetchFn?: typeof fetch;
};

export const createBackendClient = ({
	baseUrl = DEFAULT_BACKEND_URL,
	fetchFn = fetch,
}: BackendClientOptions = {}): BackendClient => {
	return {
		async fetchGameById(gameId) {
			const normalizedBase = baseUrl.trim().replace(/\/$/, "");
			if (!normalizedBase) {
				throw new Error("Backend URL is not configured.");
			}
			const url = `${normalizedBase}/fairness/${gameId}`;
			const response = await fetchFn(url.toString(), {
				headers: { accept: "application/json" },
				cache: "no-store",
			});

			if (!response.ok) {
				const contentType = response.headers.get("content-type") ?? "";
				let errorDetail: string | undefined;

				if (response.status === 404) {
					throw new Error("Game not found. Please check the game ID and try again.");
				} else if (response.status === 500) {
					throw new Error("Internal server error. Please try again later.");
				}

				try {
					if (contentType.includes("application/json")) {
						const body = (await response.json()) as { error?: unknown };
						if (typeof body?.error === "string") {
							errorDetail = body.error;
						}
					} else {
						const text = await response.text();
						errorDetail = text ? text.trim() : undefined;
					}
				} catch {
					// ignore parsing errors
				}

				const message = errorDetail
					? `Backend error (${response.status}): ${errorDetail}`
					: `Backend error (${response.status}).`;
				throw new Error(message);
			}

			return (await response.json()) as BackendGameResponse;
		},
	};
};

type MockBackendOptions = {
	games?: BackendGameResponse[];
	fallback?: BackendGameResponse;
};

const defaultMockResponse: BackendGameResponse = {
	gameId: "0",
	commitTx: "mockCommitTx",
	blockhashTx: "mockBlockhashTx",
	revealTx: "mockRevealTx",
	network: "mainnet-beta",
};

export const createMockBackendClient = (options: MockBackendOptions = {}): BackendClient => {
	const games = options.games ?? [];
	const fallback = options.fallback ?? defaultMockResponse;
	const index = new Map(games.map((game) => [game.gameId, game]));

	return {
		async fetchGameById(gameId) {
			if (index.size > 0) {
				const match = index.get(gameId);
				if (!match) {
					throw new Error(`Mock game not found: ${gameId}`);
				}
				return match;
			}

			return {
				...fallback,
				gameId,
			};
		},
	};
};
