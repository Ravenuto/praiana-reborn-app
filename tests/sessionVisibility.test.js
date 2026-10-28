import { describe, it, expect } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { sessionOccursOnDate, invalidateSessionViews } from "../src/lib/sessionVisibility.js";

const weekly = { id: "weekly", is_recurring: true, is_active: true, day_of_week: "terca" };

describe("visibility of deleted class occurrences", () => {
  it("hides only the deleted day, retaining earlier and later weeks", () => {
    const session = { ...weekly, cancelled_dates: ["2026-11-03"] };
    expect(sessionOccursOnDate(session, "2026-10-27")).toBe(true);
    expect(sessionOccursOnDate(session, "2026-11-03")).toBe(false);
    expect(sessionOccursOnDate(session, "2026-11-10")).toBe(true);
  });
  it("deleting this and subsequent classes keeps previous dates", () => {
    const session = { ...weekly, end_date: "2026-11-03" };
    expect(sessionOccursOnDate(session, "2026-10-27")).toBe(true);
    expect(sessionOccursOnDate(session, "2026-11-03")).toBe(false);
    expect(sessionOccursOnDate(session, "2026-11-10")).toBe(false);
  });
  it("a one-off class appears only on its date and disappears when removed", () => {
    const once = { id: "once", is_recurring: false, date: "2026-11-03", is_active: true };
    expect([once].filter(s => sessionOccursOnDate(s, "2026-11-03"))).toHaveLength(1);
    expect(sessionOccursOnDate(once, "2026-11-10")).toBe(false);
    expect([].filter(s => sessionOccursOnDate(s, "2026-11-03"))).toHaveLength(0);
    expect(sessionOccursOnDate({ ...once, is_active: false }, "2026-11-03")).toBe(false);
  });
  it("does not show fixed classes before the start date", () => {
    const session = { ...weekly, start_date: "2026-11-03" };
    expect(sessionOccursOnDate(session, "2026-10-27")).toBe(false);
    expect(sessionOccursOnDate(session, "2026-11-03")).toBe(true);
  });
  it("invalidates attendance on every cached date along with both schedules", async () => {
    const client = new QueryClient();
    const keys = [["adminSessions", "2026-11-03"], ["adminSessions", "2026-11-10"], ["allSessions"], ["sessions", "terca", "2026-11-03"]];
    keys.forEach(key => client.setQueryData(key, [weekly]));
    await invalidateSessionViews(client);
    keys.forEach(key => expect(client.getQueryState(key)?.isInvalidated).toBe(true));
    client.clear();
  });
});