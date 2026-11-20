import { describe, it, expect } from "vitest";
import { sessionForDate, recurringEditPatch } from "../src/lib/sessionHistory.js";
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