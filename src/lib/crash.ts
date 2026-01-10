import { bytesToHex } from "./bytes";
import { EDGE_BPS } from "./config";
import { computeCrashPointFromValues } from "./crashPoint";
import type { CrashComputationResult, SolanaTransaction } from "./types";

export type CrashInputs = {
	commitTx: SolanaTransaction | null;
	blockhashTx: SolanaTransaction | null;
	revealTx: SolanaTransaction | null;
	publicRandomValue?: Uint8Array | null;
	localSecret?: Uint8Array | null;
	commitHash?: Uint8Array | null;
	crashPointBps?: bigint | null;
	edgeBps?: bigint;
};

export const computeCrashPoint = async ({
	commitTx,
	blockhashTx,
	revealTx,
	publicRandomValue,
	localSecret,
	commitHash,
	crashPointBps,
	edgeBps,
}: CrashInputs): Promise<CrashComputationResult> => {
	if (!commitTx || !blockhashTx || !revealTx) {
		return {
			crashPoint: null,
			verified: false,
			message: "Waiting for on-chain data.",
		};
	}

	if (!publicRandomValue || !localSecret) {
		return {
			crashPoint: null,
			verified: false,
			message: "Crash inputs not parsed yet.",
		};
	}

	try {
		const resolvedEdgeBps = edgeBps ?? EDGE_BPS;
		const result = await computeCrashPointFromValues(
			publicRandomValue,
			localSecret,
			resolvedEdgeBps,
		);

		let verified = true;
		let message = "Crash point computed.";

		if (commitHash && commitHash.length === 32) {
			const commitHashHex = bytesToHex(commitHash);
			if (commitHashHex !== result.commitHashHex) {
				verified = false;
				message = "Commit hash mismatch.";
			}
		}

		if (typeof crashPointBps === "bigint" && crashPointBps !== result.crashValueBps) {
			verified = false;
			if (message === "Crash point computed.") {
				message = "Crash point mismatch.";
			}
		}

		return {
			crashPoint: result.multiplier,
			verified,
			message,
		};
	} catch (error) {
		return {
			crashPoint: null,
			verified: false,
			message: error instanceof Error ? error.message : "Crash computation failed.",
		};
	}
};
