"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { computeCrashPoint } from "@/lib/crash";
import type { FairnessData, FairnessStatus } from "@/lib/types";
import { extractCrashInputs } from "@/services/crashEvents";
import { getBackendClient, getSolanaClient } from "@/services/clients";
import type { BackendClient } from "@/services/backend";
import type { SolanaClient } from "@/services/solana";

type UseFairnessOptions = {
	auto?: boolean;
	backendClient?: BackendClient;
	solanaClient?: SolanaClient;
};

type FairnessState = {
	status: FairnessStatus;
	data?: FairnessData;
	error?: string;
};

export const useFairness = (gameId: string, options: UseFairnessOptions = {}) => {
	const requestId = useRef(0);
	const [state, setState] = useState<FairnessState>({ status: "idle" });

	const verify = useCallback(async () => {
		const trimmedGameId = gameId.trim();
		if (!trimmedGameId) {
			setState({ status: "error", error: "Missing game number." });
			return;
		}

		const currentRequest = ++requestId.current;
		setState({ status: "loading" });

		try {
			const backendClient = options.backendClient ?? getBackendClient();
			const solanaClient = options.solanaClient ?? getSolanaClient();
			const backend = await backendClient.fetchGameById(trimmedGameId);
			const [commitTx, blockhashTx, revealTx] = await Promise.all([
				solanaClient.getTransaction(backend.commitTx),
				solanaClient.getTransaction(backend.blockhashTx),
				solanaClient.getTransaction(backend.revealTx),
			]);

			const crashInputs = extractCrashInputs({ commitTx, blockhashTx, revealTx });
			const result = await computeCrashPoint({
				commitTx,
				blockhashTx,
				revealTx,
				publicRandomValue: crashInputs.publicRandomValue ?? null,
				localSecret: crashInputs.localSecret ?? null,
				commitHash: crashInputs.commitHash ?? null,
				crashPointBps: crashInputs.crashPointBps ?? null,
			});

			if (currentRequest !== requestId.current) {
				return;
			}

			setState({
				status: "ready",
				data: {
					backend,
					transactions: {
						commit: commitTx,
						blockhash: blockhashTx,
						reveal: revealTx,
					},
					result,
				},
			});
		} catch (error) {
			if (currentRequest !== requestId.current) {
				return;
			}

			setState({
				status: "error",
				error: error instanceof Error ? error.message : "Unknown error.",
			});
		}
	}, [gameId, options.backendClient, options.solanaClient]);

	useEffect(() => {
		if (!options.auto) {
			return;
		}

		if (!gameId.trim()) {
			return;
		}

		verify();
	}, [gameId, options.auto, verify]);

	return {
		...state,
		verify,
		isLoading: state.status === "loading",
		isReady: state.status === "ready",
		hasError: state.status === "error",
	};
};
