import { APP_MODE, IS_BACKEND_MOCKED } from "@/lib/config";
import type { DataMode } from "@/lib/types";
import { getMockGameOptions } from "@/mock/backendData";

export type GameOption = {
	id: string;
	label: string;
};

const emptyGameOptions: GameOption[] = [];

export const getDataMode = (): DataMode => APP_MODE;

export const isDemoData = (): boolean => IS_BACKEND_MOCKED;

export const getGameOptions = (): GameOption[] =>
	IS_BACKEND_MOCKED ? getMockGameOptions(APP_MODE) : emptyGameOptions;

export const shouldShowManualGameInput = (): boolean => !IS_BACKEND_MOCKED;

export const getDefaultGameId = (): string => {
	if (!IS_BACKEND_MOCKED) {
		return "";
	}

	const options = getMockGameOptions(APP_MODE);
	return options[0]?.id ?? "";
};

export const getRpcLabel = (): string => {
	switch (APP_MODE) {
		case "mocked":
			return "Mocked data";
		case "devnet":
			return "Devnet RPC";
		case "mainnet":
		default:
			return "Mainnet RPC";
	}
};
