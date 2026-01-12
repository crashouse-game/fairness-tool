import type { BackendGameResponse, DataMode } from "@/lib/types";
import { demoGames } from "./demoGames";

export const demoBackendResponses: BackendGameResponse[] = demoGames.map((game) => ({
	gameId: game.gameId,
	commitTx: game.commitTx,
	blockhashTx: game.blockhashTx,
	revealTx: game.revealTx,
	network: game.network ?? "devnet",
}));

const onchainBackendResponses = demoBackendResponses.filter((game, index) => {
	const source = demoGames[index];
	return source?.isOnchain;
});

export const demoGameOptions = demoBackendResponses.map((game) => ({
	id: game.gameId,
	label: `Game #${game.gameId}`,
}));

const onchainGameOptions = onchainBackendResponses.map((game) => ({
	id: game.gameId,
	label: `Game #${game.gameId}`,
}));

export const getMockBackendResponses = (mode: DataMode) => {
	if (mode === "mocked") {
		return demoBackendResponses;
	}
	if (mode === "devnet") {
		return onchainBackendResponses;
	}
	return [];
};

export const getMockGameOptions = (mode: DataMode) => {
	if (mode === "mocked") {
		return demoGameOptions;
	}
	if (mode === "devnet") {
		return onchainGameOptions;
	}
	return [];
};
