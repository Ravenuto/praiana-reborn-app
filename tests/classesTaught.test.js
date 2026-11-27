import { describe, it, expect } from "vitest";
import { computeClassesTaught } from "../src/lib/classesTaught.js";

const sessions = [{ id: "a", instructor: "", time: "18:00" }, { id: "b", instructor: "Ana", time: "19:00" }];
const run = (bookings) => computeClassesTaught({ bookings, sessions, month: "2026-10", today: "2026-10-21", nowTime: "19:30", ownerName: "Raissa" });

describe("aulas dadas", () => {
  it("aula com várias alunas conta como 1", () => {
    const r = run([{ session_id: "b", session_date: "2026-10-05", status: "presente" }, { session_id: "b", session_date: "2026-10-05", status: "confirmada" }]);
    expect(r.Ana.length).toBe(1);
  });
  it("aula sem professora vai para Raissa", () => {
    expect(run([{ session_id: "a", session_date: "2026-10-05", status: "confirmada" }]).Raissa.length).toBe(1);
  });
  it("aula só com canceladas não conta", () => {
    expect(run([{ session_id: "a", session_date: "2026-10-05", status: "cancelada" }]).Raissa).toBeUndefined();
  });
  it("aula futura não conta", () => {
    expect(run([{ session_id: "a", session_date: "2026-10-25", status: "confirmada" }]).Raissa).toBeUndefined();
  });
  it("aula de hoje às 18h conta só a partir das 19h", () => {
    expect(run([{ session_id: "a", session_date: "2026-10-21", status: "confirmada" }]).Raissa.length).toBe(1);
  });
  it("aula de hoje às 19h ainda não conta às 19h30", () => {
    expect(run([{ session_id: "b", session_date: "2026-10-21", status: "confirmada" }]).Ana).toBeUndefined();
  });
});
