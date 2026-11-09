// Format 2 is a portable transport. Payload schema 1 remains backward compatible.
export const SAVE_FORMAT = 2;
export function checksum(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++)
    hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16).padStart(8, "0");
}
export function encodeSave(payload, savedAt = new Date().toISOString()) {
  const data = JSON.stringify(payload);
  return JSON.stringify({
    game: "soul-land",
    format: SAVE_FORMAT,
    savedAt,
    checksum: checksum(data),
    payload,
  });
}
export function decodeSave(text) {
  try {
    const value = JSON.parse(text);
    if (value?.game === "soul-land") {
      if (
        value.format !== SAVE_FORMAT ||
        typeof value.savedAt !== "string" ||
        !value.payload ||
        checksum(JSON.stringify(value.payload)) !== value.checksum
      )
        return null;
      return value.payload;
    }
    return value?.version === 1 ? value : null;
  } catch {
    return null;
  }
}
