import { bytesToHex } from "./bytes";

const TWO_POW_32 = 2n ** 32n;
const MAX_X = TWO_POW_32 - 1000n;
const BASIS_POINTS = 10_000n;
const DEFAULT_EDGE_BPS = 100n;

export type CrashPointComputation = {
	commitHashHex: string;
	finalHashHex: string;
	x: bigint;
	crashValueBps: bigint;
	multiplier: number;
};

const sha256 = async (data: Uint8Array) => {
	if (!globalThis.crypto?.subtle) {
		throw new Error("Web Crypto is not available.");
	}

	const payload = new Uint8Array(data);
	const hash = await globalThis.crypto.subtle.digest("SHA-256", payload.buffer);
	return new Uint8Array(hash);
};

const concatBytes = (a: Uint8Array, b: Uint8Array) => {
	const combined = new Uint8Array(a.length + b.length);
	combined.set(a, 0);
	combined.set(b, a.length);
	return combined;
};

const extractU32FromHash = (hash: Uint8Array): bigint => {
	if (hash.length < 4) {
		throw new Error("Hash is too short.");
	}

	return (
		(BigInt(hash[0]) << 24n) | (BigInt(hash[1]) << 16n) | (BigInt(hash[2]) << 8n) | BigInt(hash[3])
	);
};

const mulDiv = (a: bigint, b: bigint, denom: bigint): bigint => {
	if (denom === 0n) {
		throw new Error("Division by zero.");
	}

	return (a * b) / denom;
};

const clampEdge = (edgeBps: bigint) => {
	if (edgeBps < 0n) {
		return 0n;
	}

	if (edgeBps > BASIS_POINTS) {
		return BASIS_POINTS;
	}

	return edgeBps;
};

const calculateCrashPointBps = (x: bigint, edgeBps: bigint): bigint => {
	const cappedX = x > MAX_X ? MAX_X : x;
	const adjustedEdge = clampEdge(edgeBps);
	const denom = TWO_POW_32 - cappedX;
	const factor = BASIS_POINTS - adjustedEdge;
	const crashRaw = mulDiv(factor, TWO_POW_32, denom);

	return crashRaw < BASIS_POINTS ? BASIS_POINTS : crashRaw;
};

export const computeCrashPointFromValues = async (
	publicRandomValue: Uint8Array,
	localSecret: Uint8Array,
	edgeBps: bigint = DEFAULT_EDGE_BPS,
): Promise<CrashPointComputation> => {
	if (publicRandomValue.length !== 32 || localSecret.length !== 32) {
		throw new Error("Both public value and secret must be 32 bytes.");
	}

	const commitHash = await sha256(localSecret);
	const combined = concatBytes(publicRandomValue, localSecret);
	const finalHash = await sha256(combined);
	const x = extractU32FromHash(finalHash);
	const crashValueBps = calculateCrashPointBps(x, edgeBps);

	return {
		commitHashHex: bytesToHex(commitHash),
		finalHashHex: bytesToHex(finalHash),
		x,
		crashValueBps,
		multiplier: Number(crashValueBps) / Number(BASIS_POINTS),
	};
};

export const crashPointBpsToMultiplier = (crashValueBps: bigint) =>
	Number(crashValueBps) / Number(BASIS_POINTS);
