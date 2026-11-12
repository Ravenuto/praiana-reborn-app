import { describe, it, expect, vi } from "vitest";
import { closuresOnDate, closurePayload, saveClosure } from "../src/lib/studioClosures.js";

describe("studio closures", () => {
  it.each(["holiday", "recess", "vacation"])("closes an inclusive period for %s", type => {
    const closure = closurePayload({ type, start: "2026-12-23", end: "2027-01-04", message: "Voltamos dia 05!" });
    expect(closuresOnDate([closure], "2026-12-22")).toHaveLength(0);
    expect(closuresOnDate([closure], "2026-12-23")).toHaveLength(1);
    expect(closuresOnDate([closure], "2027-01-04")).toHaveLength(1);
    expect(closuresOnDate([closure], "2027-01-05")).toHaveLength(0);
  });
  it("retains existing single-day holidays", () => {
    expect(closuresOnDate([{ date: "2026-11-15", label: "Feriado" }], "2026-11-15")).toHaveLength(1);
    expect(closuresOnDate([{ date: "2026-11-15" }], "2026-11-16")).toHaveLength(0);
  });
  it("rejects a reversed period before saving", async () => {
    const entity = { create: vi.fn() };
    await expect(saveClosure(entity, null, { type: "vacation", start: "2027-01-04", end: "2026-12-23", message: "" })).rejects.toThrow();
    expect(entity.create).not.toHaveBeenCalled();
  });
  it.each(["holiday", "recess", "vacation"])("saving %s changes only the closure, never plans", async type => {
    const entity = { create: vi.fn().mockResolvedValue({ id: "new" }) };
    await saveClosure(entity, null, { type, start: "2026-12-23", end: "2027-01-04", message: "" });
    expect(entity.create).toHaveBeenCalledExactlyOnceWith({ date: "2026-12-23", start_date: "2026-12-23", end_date: "2027-01-04", closure_type: type, label: { holiday: "Feriado", recess: "Recesso", vacation: "Férias" }[type], message: { holiday: "Não teremos aula hoje. Bom descanso 💙", recess: "Estamos em recesso. Bom descanso 💙", vacation: "Estúdio em férias coletivas. Aproveite o descanso! 💙" }[type] });
  });
});