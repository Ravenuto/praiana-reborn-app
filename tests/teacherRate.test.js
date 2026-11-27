import { describe, it, expect } from "vitest";
import { rateFor } from "../src/lib/classesTaught.js";
describe("hora/aula", () => {
  it("dona do estúdio padrão R$15", () => expect(rateFor("o", "o", [])).toBe(1500));
  it("professora padrão R$40", () => expect(rateFor("t", "o", [])).toBe(4000));
  it("valor cadastrado prevalece", () => expect(rateFor("t", "o", [{ student_id: "t", amount_cents: 5000 }])).toBe(5000));
});
