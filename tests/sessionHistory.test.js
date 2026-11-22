import { describe, it, expect } from "vitest";
import { sessionForDate, recurringEditPatch, occurrenceNotes, occurrenceNotesPatch } from "../src/lib/sessionHistory.js";
import { sessionOccursOnDate } from "../src/lib/sessionVisibility.js";
import { computeClassesTaught } from "../src/lib/classesTaught.js";

const original = { id: "sexy", instructor: "Raissa", is_recurring: true, is_active: true, day_of_week: "quinta", start_date: "2026-11-05", time: "19:00", max_students: 3 };
const edited = { ...original, ...recurringEditPatch(original, { ...original, instructor: "Lorena" }, "2026-11-10") };
describe("date-effective recurring edits", () => {
  it("keeps Raissa before November 10 and Lorena from November 10", () => {
    expect(sessionForDate(edited, "2026-11-05").instructor).toBe("Raissa");
    expect(sessionForDate(edited, "2026-11-10").instructor).toBe("Lorena");
    expect(sessionForDate(edited, "2026-11-19").instructor).toBe("Lorena");
  });
  it("keeps the booking identity, capacity and credits outside the edit", () => {
    const patch = recurringEditPatch(original, { ...original, instructor: "Lorena" }, "2026-11-10");
    expect(Object.keys(patch)).toEqual(["session_versions"]);
    expect(sessionForDate(edited, "2026-11-12").id).toBe("sexy");
    expect(sessionForDate(edited, "2026-11-12").max_students).toBe(3);
  });
  it("attributes existing November 5 attendance to Raissa and November 12 to Lorena", () => {
    const result = computeClassesTaught({ sessions: [edited], bookings: ["2026-11-05", "2026-11-12"].map(session_date => ({ session_id: "sexy", session_date, status: "presente" })), month: "2026-11", today: "2026-11-20", ownerName: "Raissa" });
    expect(result.Raissa.map(c => c.date)).toEqual(["2026-11-05"]);
    expect(result.Lorena.map(c => c.date)).toEqual(["2026-11-12"]);
  });
  it("preserves earlier weekdays and closure exceptions", () => {
    const s = { ...original, cancelled_dates: ["2026-12-24"], ...recurringEditPatch(original, { day_of_week: "terca" }, "2026-11-10") };
    expect(sessionOccursOnDate(sessionForDate(s, "2026-11-05"), "2026-11-05")).toBe(true);
    expect(sessionOccursOnDate(sessionForDate(s, "2026-11-12"), "2026-11-12")).toBe(false);
    expect(sessionOccursOnDate(sessionForDate(s, "2026-11-10"), "2026-11-10")).toBe(true);
    expect(sessionForDate(s, "2026-12-24").cancelled_dates).toEqual(["2026-12-24"]);
  });
  it("retains later scheduled versions and rejects invalid boundaries", () => {
    const future = { ...edited, ...recurringEditPatch(edited, { instructor: "Bea" }, "2026-12-01") };
    const middle = { ...future, ...recurringEditPatch(future, { instructor: "Lorena" }, "2026-11-17") };
    expect(sessionForDate(middle, "2026-12-03").instructor).toBe("Bea");
    expect(() => recurringEditPatch(original, {}, "2026-11-01")).toThrow();
    expect(() => recurringEditPatch(original, {}, "")).toThrow();
  });
});

describe("occurrence note editing", () => {
  const session = {
    ...original,
    override_notes: "old legacy note",
    session_overrides: { "2026-08-27": { notes: "earlier note" } },
    session_versions: [{ from: "2026-11-26", data: {
      max_students: 5,
      session_overrides: { "2026-08-27": { notes: "earlier note" }, "2026-11-26": { notes: "day note", other: true } },
    } }],
  };
  it("loads only the selected date's effective notes, not the legacy field", () => {
    expect(occurrenceNotes(session, "2026-11-26")).toBe("day note");
    expect(occurrenceNotes(session, "2026-11-19")).toBe("");
  });
  it("persists removal without later versions reviving it or changing another date", () => {
    const saved = { ...session, ...occurrenceNotesPatch(session, "2026-11-26", "") };
    expect(occurrenceNotes(saved, "2026-11-26")).toBe("");
    expect(occurrenceNotes(saved, "2026-08-27")).toBe("earlier note");
    expect(sessionForDate(saved, "2026-11-26").max_students).toBe(5);
    expect(sessionForDate(saved, "2026-11-26").session_overrides["2026-11-26"].other).toBe(true);
    expect(saved.id).toBe(session.id);
  });
  it("keeps the note on its selected day when the recurring edit starts on another date", () => {
    const dated = { ...session, ...recurringEditPatch(session, { instructor: "Lorena" }, "2026-11-23") };
    const saved = { ...dated, ...occurrenceNotesPatch(dated, "2026-11-26", "updated note") };
    expect(occurrenceNotes(saved, "2026-11-26")).toBe("updated note");
    expect(occurrenceNotes(saved, "2026-11-23")).toBe("");
    expect(sessionForDate(saved, "2026-11-19").instructor).toBe("Raissa");
  });
});