import { hexToBytes } from "@/lib/bytes";
import type { SolanaNetwork } from "@/lib/types";

export type DemoGameSeed = {
	gameId: string;
	commitTx: string;
	blockhashTx: string;
	revealTx: string;
	blockhash: Uint8Array;
	localSecret: Uint8Array;
	network?: SolanaNetwork;
	isOnchain?: boolean;
};

const makeSignature = (prefix: string, index: number) =>
	`${prefix}${index.toString().padStart(2, "0")}9gkZ4PjC8wYqH6nS1r2bT5v7a9cDfGhJkLmNpQrStUvWxYz`;

const makeHexSeed = (prefix: string, index: number) => {
	const hexIndex = index.toString(16).padStart(2, "0");
	const seed = `${prefix}${hexIndex}`;
	return seed.repeat(16).slice(0, 64);
};

const realGames: DemoGameSeed[] = [
	{
		gameId: "111569",
		commitTx:
			"4GaMjAaYY8uKjidvx3CH5biWoPE3V7CReGrg6AKXP9YcXCUMKh8P1GrihuWtxySD7LhTkJyswWu6TCuJLGZ4hD3v",
		blockhashTx:
			"4gfACPwBJxHd9d9K4KJKiPHoUBHZkGbm6oWnbiyEa4BASAN8mYfdNvjLBgTFbTpHxfyFvpqRXS6FzfwYy51mz7Vo",
		revealTx:
			"2FsuRQnFGexD9Qf5WjUGsTD8WE75L7jJ5ViBhjkghSTkcKU9Pxpi5ghWgPYn3K23HYu8DSUfJrLPwRHN7W7j8Ux7",
		blockhash: hexToBytes("5db073e9b08d232973d186df688f807bf262e48b4c239c3538bce76c689528b2"),
		localSecret: hexToBytes("29c115c6dc7fd4979c576d7cd4ce5d836baec04d1458e0cd425aaa94067563b5"),
		network: "devnet",
		isOnchain: true,
	},
	{
		gameId: "112114",
		commitTx:
			"3dDJ9tMrsqdbLz7QGBiZwphne1rsLHKQ2Fe57Ek58PH1kkutb48y6MEsUabyp4cPaJwS6kRjvVRRfGS3SMQEWXop",
		blockhashTx:
			"4HZvfoCsNFfEDHmngedRvbZ3nPKnj4wrzQ7UvGdUxVqMuhuSoPEsdo2w3mHhrwow5ScHukMR5xtwoKa8EEJiRcsQ",
		revealTx:
			"5p1mBgBFbP9UQsM9XpEyciySmcPX1HLZn8c8CHk8TkDnoj1t4MyKwzfUD9ismQMv2sTyim3HRueqSupA1UQa51w1",
		blockhash: hexToBytes("7db4f6334f405fc3d1e800e828af670ac9ced0525d05fb077500504db745d8f2"),
		localSecret: hexToBytes("d533ca1d609c2c98cf5d9d2e5929170592fb7d765efba377f77612c618912e31"),
		network: "devnet",
		isOnchain: true,
	},
	{
		gameId: "112115",
		commitTx:
			"2KB6QE5fL5vsLDLcHN5iKAEz4WZWYK9QrcupzjS3Uw2KCuoPiTVeMwX6mUtXg2zgBih5KhL5hVEjnDqTy5bCw9eh",
		blockhashTx:
			"uY6Hdw8KqMGG5ybKTPWcEsiuq1ew6DXT4xSddXPXxJpxUdtQCZgg1524yQWE8qd9dypG1222EptihZNPsPE5LHA",
		revealTx:
			"3MW8yas4KGQoagykJ7EPDKayeoCo9A96j8TwqNoXHeLxJxvc6qkG75vbJWUNFZz3pppt2DxiZoGTagMzLJhnYq9M",
		blockhash: hexToBytes("1a4bca2bb945e6c75f2b6f010924f3fc8a1c057e0092f606f24a953b214a320a"),
		localSecret: hexToBytes("c5965928663e98c264ba9ee2b7a29e6c739d5a1b058f9a4055edf276700c18d7"),
		network: "devnet",
		isOnchain: true,
	},
];

const generatedGames: DemoGameSeed[] = Array.from({ length: 7 }, (_, index) => {
	const gameId = (1258631 + index).toString();
	const commitTx = makeSignature("commit", index);
	const blockhashTx = makeSignature("block", index);
	const revealTx = makeSignature("reveal", index);
	const blockhash = hexToBytes(makeHexSeed("a1", index));
	const localSecret = hexToBytes(makeHexSeed("b2", index));

	return {
		gameId,
		commitTx,
		blockhashTx,
		revealTx,
		blockhash,
		localSecret,
		network: "devnet",
		isOnchain: false,
	};
});

export const demoGames: DemoGameSeed[] = [...realGames, ...generatedGames];
