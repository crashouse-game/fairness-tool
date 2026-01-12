import { EDGE_BPS } from "@/lib/config";
import { computeCrashPointFromValues } from "@/lib/crashPoint";
import { hexToBytes } from "@/lib/bytes";
import type { SolanaTransaction } from "@/lib/types";
import {
	encodeCrashGameStartedLog,
	encodeCrashRoundFinalizedLog,
	encodeCrashRoundPreparedLog,
} from "@/services/crashEvents";
import { demoGames } from "./demoGames";

const baseTime = 1731100000;
const baseSlot = 225000000;
const roundProfitCap = 150_000n;
const maxProfitPerBet = 12_500n;

const createTransaction = (
	signature: string,
	offsetSeconds: number,
	logs: string[],
): SolanaTransaction => ({
	signature,
	slot: baseSlot + offsetSeconds,
	blockTime: baseTime + offsetSeconds,
	err: null,
	logs,
	raw: null,
});

const buildDemoTransactions = async () => {
	const transactions: Record<string, SolanaTransaction> = {};

	for (const [index, game] of demoGames.entries()) {
		const roundId = BigInt(game.gameId);
		const offset = index * 180;
		const crashResult = await computeCrashPointFromValues(
			game.blockhash,
			game.localSecret,
			EDGE_BPS,
		);
		const commitHash = hexToBytes(crashResult.commitHashHex);

		const preparedLog = encodeCrashRoundPreparedLog({
			version: 1,
			roundId,
			commitHash,
			roundProfitCap,
			maxProfitPerBet,
		});

		const startedLog = encodeCrashGameStartedLog({
			version: 1,
			roundId,
			blockhash: game.blockhash,
		});

		const finalizedLog = encodeCrashRoundFinalizedLog({
			version: 1,
			roundId,
			localE: game.localSecret,
			crashPointBps: crashResult.crashValueBps,
			blockhash: game.blockhash,
		});

		transactions[game.commitTx] = createTransaction(game.commitTx, offset, [preparedLog]);
		transactions[game.blockhashTx] = createTransaction(game.blockhashTx, offset + 60, [startedLog]);
		transactions[game.revealTx] = createTransaction(game.revealTx, offset + 120, [finalizedLog]);
	}

	return transactions;
};

let demoTransactionsPromise: Promise<Record<string, SolanaTransaction>> | null = null;

export const getDemoTransactions = () => {
	if (!demoTransactionsPromise) {
		demoTransactionsPromise = buildDemoTransactions();
	}

	return demoTransactionsPromise;
};
