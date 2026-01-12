export const bytesToHex = (bytes: Uint8Array) =>
	Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

export const hexToBytes = (hex: string) => {
	const normalized = hex.trim().toLowerCase();
	if (normalized.length % 2 !== 0) {
		throw new Error("Hex string must have an even length.");
	}

	const bytes = new Uint8Array(normalized.length / 2);
	for (let i = 0; i < normalized.length; i += 2) {
		bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
	}
	return bytes;
};
