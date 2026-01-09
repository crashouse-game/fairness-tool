import type { SolanaTransaction } from "@/lib/types";

const EVENT_NAMES = ["CrashRoundPrepared", "CrashGameStarted", "CrashRoundFinalized"] as const;

export type CrashEventName = (typeof EVENT_NAMES)[number];

export type CrashRoundPreparedEvent = {
	version: number;
	roundId: bigint;
	commitHash: Uint8Array;
	roundProfitCap: bigint;
	maxProfitPerBet: bigint;
};

export type CrashGameStartedEvent = {
	version: number;
	roundId: bigint;
	blockhash: Uint8Array;
};

export type CrashRoundFinalizedEvent = {
	version: number;
	roundId: bigint;
	localE: Uint8Array;
	crashPointBps: bigint;
	blockhash: Uint8Array;
};

type IdlFieldType = string | { array: [IdlFieldType, number] } | { option: IdlFieldType };

type IdlField = {
	name: string;
	type: IdlFieldType;
};

type EventDefinition = {
	name: CrashEventName;
	discriminator: Uint8Array;
	fields: IdlField[];
};
const eventDefinitions = new Map<CrashEventName, EventDefinition>([
	[
		"CrashRoundPrepared",
		{
			name: "CrashRoundPrepared",
			discriminator: new Uint8Array([165, 49, 14, 167, 228, 13, 143, 147]),
			fields: [
				{ name: "version", type: "u8" },
				{ name: "round_id", type: "u64" },
				{ name: "commit_hash", type: { array: ["u8", 32] } },
				{ name: "round_profit_cap", type: "u64" },
				{ name: "max_profit_per_bet", type: "u64" },
			],
		},
	],
	[
		"CrashGameStarted",
		{
			name: "CrashGameStarted",
			discriminator: new Uint8Array([49, 42, 221, 91, 164, 50, 168, 214]),
			fields: [
				{ name: "version", type: "u8" },
				{ name: "round_id", type: "u64" },
				{ name: "blockhash", type: { array: ["u8", 32] } },
			],
		},
	],
	[
		"CrashRoundFinalized",
		{
			name: "CrashRoundFinalized",
			discriminator: new Uint8Array([228, 227, 238, 99, 245, 160, 232, 143]),
			fields: [
				{ name: "version", type: "u8" },
				{ name: "round_id", type: "u64" },
				{ name: "local_e", type: { array: ["u8", 32] } },
				{ name: "crash_point_bps", type: "u64" },
				{ name: "blockhash", type: { array: ["u8", 32] } },
			],
		},
	],
]);

const LOG_PREFIX = "Program data: ";

const decodeBase64 = (value: string) => {
	if (typeof atob === "function") {
		const binary = atob(value);
		const bytes = new Uint8Array(binary.length);
		for (let i = 0; i < binary.length; i += 1) {
			bytes[i] = binary.charCodeAt(i);
		}
		return bytes;
	}

	if (typeof Buffer !== "undefined") {
		return Uint8Array.from(Buffer.from(value, "base64"));
	}

	throw new Error("Base64 decoder not available.");
};

const encodeBase64 = (bytes: Uint8Array) => {
	if (typeof btoa === "function") {
		let binary = "";
		for (const byte of bytes) {
			binary += String.fromCharCode(byte);
		}
		return btoa(binary);
	}

	if (typeof Buffer !== "undefined") {
		return Buffer.from(bytes).toString("base64");
	}

	throw new Error("Base64 encoder not available.");
};

const readU8 = (bytes: Uint8Array, offset: number) => bytes[offset] ?? 0;

const readU64 = (bytes: Uint8Array, offset: number) => {
	let value = 0n;
	for (let i = 0; i < 8; i += 1) {
		value |= BigInt(bytes[offset + i] ?? 0) << (8n * BigInt(i));
	}
	return value;
};

const readBytes = (bytes: Uint8Array, offset: number, length: number) =>
	bytes.slice(offset, offset + length);

const decodeField = (
	fieldType: IdlFieldType,
	bytes: Uint8Array,
	offsetRef: { offset: number },
): unknown => {
	if (typeof fieldType === "string") {
		if (fieldType === "u8") {
			const value = readU8(bytes, offsetRef.offset);
			offsetRef.offset += 1;
			return value;
		}

		if (fieldType === "u64") {
			const value = readU64(bytes, offsetRef.offset);
			offsetRef.offset += 8;
			return value;
		}

		if (fieldType === "pubkey") {
			const value = readBytes(bytes, offsetRef.offset, 32);
			offsetRef.offset += 32;
			return value;
		}

		throw new Error(`Unsupported field type: ${fieldType}`);
	}

	if ("array" in fieldType) {
		const [inner, length] = fieldType.array;
		if (inner !== "u8") {
			throw new Error("Only u8 arrays are supported.");
		}
		const value = readBytes(bytes, offsetRef.offset, length);
		offsetRef.offset += length;
		return value;
	}

	if ("option" in fieldType) {
		const isSome = readU8(bytes, offsetRef.offset) === 1;
		offsetRef.offset += 1;
		if (!isSome) {
			return null;
		}
		return decodeField(fieldType.option, bytes, offsetRef);
	}

	throw new Error("Unsupported IDL field type.");
};

const decodeEventData = (definition: EventDefinition, bytes: Uint8Array) => {
	const offsetRef = { offset: 0 };
	const data: Record<string, unknown> = {};

	for (const field of definition.fields) {
		data[field.name] = decodeField(field.type, bytes, offsetRef);
	}

	return data;
};

const encodeField = (fieldType: IdlFieldType, value: unknown, output: number[]) => {
	if (typeof fieldType === "string") {
		if (fieldType === "u8") {
			output.push(Number(value ?? 0) & 0xff);
			return;
		}

		if (fieldType === "u64") {
			const raw = coerceBigInt(value);
			for (let i = 0; i < 8; i += 1) {
				output.push(Number((raw >> (8n * BigInt(i))) & 0xffn));
			}
			return;
		}

		if (fieldType === "pubkey") {
			if (!(value instanceof Uint8Array) || value.length !== 32) {
				throw new Error("pubkey must be a 32-byte Uint8Array.");
			}
			output.push(...value);
			return;
		}
	}

	if (typeof fieldType === "object" && "array" in fieldType) {
		const [inner, length] = fieldType.array;
		if (inner !== "u8") {
			throw new Error("Only u8 arrays are supported.");
		}
		if (!(value instanceof Uint8Array) || value.length !== length) {
			throw new Error(`Expected Uint8Array length ${length}.`);
		}
		output.push(...value);
		return;
	}

	if (typeof fieldType === "object" && "option" in fieldType) {
		if (value === null || value === undefined) {
			output.push(0);
			return;
		}
		output.push(1);
		encodeField(fieldType.option, value, output);
		return;
	}

	throw new Error("Unsupported IDL field type for encoding.");
};

const encodeEventData = (definition: EventDefinition, values: Record<string, unknown>) => {
	const output: number[] = [];
	for (const field of definition.fields) {
		encodeField(field.type, values[field.name], output);
	}
	return new Uint8Array(output);
};

const matchDiscriminator = (bytes: Uint8Array, discriminator: Uint8Array) => {
	if (bytes.length < discriminator.length) {
		return false;
	}

	for (let i = 0; i < discriminator.length; i += 1) {
		if (bytes[i] !== discriminator[i]) {
			return false;
		}
	}

	return true;
};

const decodeEventFromBytes = (bytes: Uint8Array) => {
	for (const definition of eventDefinitions.values()) {
		if (!matchDiscriminator(bytes, definition.discriminator)) {
			continue;
		}

		const data = decodeEventData(definition, bytes.slice(8));
		return { name: definition.name, data };
	}

	return null;
};

const extractBase64Payload = (logLine: string) => {
	if (logLine.startsWith(LOG_PREFIX)) {
		return logLine.slice(LOG_PREFIX.length).trim();
	}

	const markerIndex = logLine.indexOf(LOG_PREFIX);
	if (markerIndex >= 0) {
		return logLine.slice(markerIndex + LOG_PREFIX.length).trim();
	}

	return null;
};

const decodeEventsFromLogs = (logs: string[] = []) => {
	const events: { name: CrashEventName; data: Record<string, unknown> }[] = [];

	for (const logLine of logs) {
		const base64 = extractBase64Payload(logLine);
		if (!base64) {
			continue;
		}

		try {
			const bytes = decodeBase64(base64);
			const event = decodeEventFromBytes(bytes);
			if (event) {
				events.push(event);
			}
		} catch {
			continue;
		}
	}

	return events;
};

const findEventData = (logs: string[], name: CrashEventName) =>
	decodeEventsFromLogs(logs).find((event) => event.name === name)?.data ?? null;

const coerceBigInt = (value: unknown) => {
	if (typeof value === "bigint") {
		return value;
	}
	if (typeof value === "number") {
		return BigInt(value);
	}
	if (typeof value === "string") {
		return BigInt(value);
	}
	return 0n;
};

const asBigInt = (value: unknown) => coerceBigInt(value);

const asUint8Array = (value: unknown) => (value instanceof Uint8Array ? value : new Uint8Array());

export const parseCrashRoundPrepared = (logs: string[] = []): CrashRoundPreparedEvent | null => {
	const data = findEventData(logs, "CrashRoundPrepared");
	if (!data) {
		return null;
	}

	return {
		version: Number(data.version ?? 0),
		roundId: asBigInt(data.round_id),
		commitHash: asUint8Array(data.commit_hash),
		roundProfitCap: asBigInt(data.round_profit_cap),
		maxProfitPerBet: asBigInt(data.max_profit_per_bet),
	};
};

export const parseCrashGameStarted = (logs: string[] = []): CrashGameStartedEvent | null => {
	const data = findEventData(logs, "CrashGameStarted");
	if (!data) {
		return null;
	}

	return {
		version: Number(data.version ?? 0),
		roundId: asBigInt(data.round_id),
		blockhash: asUint8Array(data.blockhash),
	};
};

export const parseCrashRoundFinalized = (logs: string[] = []): CrashRoundFinalizedEvent | null => {
	const data = findEventData(logs, "CrashRoundFinalized");
	if (!data) {
		return null;
	}

	return {
		version: Number(data.version ?? 0),
		roundId: asBigInt(data.round_id),
		localE: asUint8Array(data.local_e),
		crashPointBps: asBigInt(data.crash_point_bps),
		blockhash: asUint8Array(data.blockhash),
	};
};

export const extractCrashInputs = ({
	commitTx,
	blockhashTx,
	revealTx,
}: {
	commitTx: SolanaTransaction | null;
	blockhashTx: SolanaTransaction | null;
	revealTx: SolanaTransaction | null;
}) => {
	const commitEvent = commitTx ? parseCrashRoundPrepared(commitTx.logs) : null;
	const startedEvent = blockhashTx ? parseCrashGameStarted(blockhashTx.logs) : null;
	const finalizedEvent = revealTx ? parseCrashRoundFinalized(revealTx.logs) : null;

	return {
		commitHash: commitEvent?.commitHash,
		publicRandomValue: startedEvent?.blockhash ?? finalizedEvent?.blockhash,
		localSecret: finalizedEvent?.localE,
		crashPointBps: finalizedEvent?.crashPointBps,
		roundId: finalizedEvent?.roundId ?? startedEvent?.roundId ?? commitEvent?.roundId,
	};
};

const getDefinition = (name: CrashEventName) => {
	const definition = eventDefinitions.get(name);
	if (!definition) {
		throw new Error(`Missing IDL definition for ${name}.`);
	}
	return definition;
};

const encodeEvent = (name: CrashEventName, values: Record<string, unknown>) => {
	const definition = getDefinition(name);
	const payload = encodeEventData(definition, values);
	const bytes = new Uint8Array(definition.discriminator.length + payload.length);
	bytes.set(definition.discriminator, 0);
	bytes.set(payload, definition.discriminator.length);
	return encodeBase64(bytes);
};

export const encodeCrashRoundPreparedLog = (event: CrashRoundPreparedEvent) =>
	`${LOG_PREFIX}${encodeEvent("CrashRoundPrepared", {
		version: event.version,
		round_id: event.roundId,
		commit_hash: event.commitHash,
		round_profit_cap: event.roundProfitCap,
		max_profit_per_bet: event.maxProfitPerBet,
	})}`;

export const encodeCrashGameStartedLog = (event: CrashGameStartedEvent) =>
	`${LOG_PREFIX}${encodeEvent("CrashGameStarted", {
		version: event.version,
		round_id: event.roundId,
		blockhash: event.blockhash,
	})}`;

export const encodeCrashRoundFinalizedLog = (event: CrashRoundFinalizedEvent) =>
	`${LOG_PREFIX}${encodeEvent("CrashRoundFinalized", {
		version: event.version,
		round_id: event.roundId,
		local_e: event.localE,
		crash_point_bps: event.crashPointBps,
		blockhash: event.blockhash,
	})}`;
