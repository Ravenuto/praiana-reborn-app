export function splitNotes(value) {
  return String(value || "").split("\n").map((s) => s.trim()).filter(Boolean);
}
