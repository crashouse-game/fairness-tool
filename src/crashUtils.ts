import crypto from "crypto";

// ---------- Constants ----------
const TWO_POW_32 = 2n ** 32n;
const MAX_X = TWO_POW_32 - 1000n; // Safety cap to avoid near-zero denominators
const BASIS_POINTS = 10_000n; // F = 10,000 bps (1.00x)
const EDGE_BASIS_POINTS = 100n; // default edge (can be overridden)

// ---------- Helpers ----------
export function sha256(buffer: Buffer): Buffer {
	return crypto.createHash("sha256").update(buffer).digest();
}

// First 4 bytes (big-endian) -> u32 -> bigint
function extractU32FromHash(hash: Buffer): bigint {
	return BigInt(hash.readUInt32BE(0));
}

// Safe mulDiv using BigInt (floor(a*b/denom))
function mulDiv(a: bigint, b: bigint, denom: bigint): bigint {
	if (denom === 0n) throw new Error("Division by zero");
	return (a * b) / denom;
}

// ---------- Crash math (edge applied multiplicatively with clamp) ----------
function calculateCrashPoint(
	x: bigint,
	f: bigint = BASIS_POINTS,
	edgeBps: bigint = EDGE_BASIS_POINTS,
): bigint {
	// Clamp X so denominator >= 1000
	const cappedX = x > MAX_X ? MAX_X : x;

	// Edge sanity: clamp to [0, F]
	let adjustedEdge = edgeBps;
	if (adjustedEdge < 0n) adjustedEdge = 0n;
	if (adjustedEdge > f) adjustedEdge = f;

	// crash_raw = floor((F - edge) * 2^32 / (2^32 - X))
	const denom = TWO_POW_32 - cappedX;
	const factor = f - adjustedEdge;
	const crashRaw = mulDiv(factor, TWO_POW_32, denom);

	// Final crash (bps), guaranteed >= F
	return crashRaw < f ? f : crashRaw;
}

// ---------- Main API ----------
export function initCrashValue(
	publicRandomValue: Buffer, // 32-byte blockhash (or any 32B public randomness)
	localSecret: Buffer, // 32-byte server secret committed earlier
	edgeBps: bigint = EDGE_BASIS_POINTS, // optional override
) {
	if (publicRandomValue.length !== 32 || localSecret.length !== 32) {
		throw new Error("Both public value and secret must be 32 bytes.");
	}

	// Commitment (what you'd store/verify on-chain)
	const commitHash = sha256(localSecret);

	// Hash(blockhash || localSecret) -> derive X from first 4 bytes (BE)
	const combined = Buffer.concat([publicRandomValue, localSecret]); // 64 bytes
	const finalHash = sha256(combined);
	const x = extractU32FromHash(finalHash);

	// Crash using multiplicative edge with 1.00x floor
	const crashValue = calculateCrashPoint(x, BASIS_POINTS, edgeBps);

	return {
		commitHash: Array.from(commitHash),
		finalHash: finalHash.toString("hex"),
		x: x.toString(),
		crashValue: crashValue.toString(),
		// NOTE: Number() may lose precision for huge multipliers; fine for typical ranges.
		multiplier: Number(crashValue) / Number(BASIS_POINTS),
	};
}
