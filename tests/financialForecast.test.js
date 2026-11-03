import { describe, it, expect } from "vitest";
import { forecastForMonth } from "../src/lib/financialForecast.js";

const plans = [{ key: "mensal", price_value: 100, duration_months: 1 }];
const student = { id: "g", plan: "mensal", plan_start_date: "2026-10-02", is_active: false, financial_inactive_from: "2026-11" };

describe("monthly forecast inactive students", () => {
  it("removes a monthly student from the month she was inactivated", () => {
    expect(forecastForMonth([student], plans, [], "2026-11")).toHaveLength(0);
  });
  it("keeps earlier months while she was active", () => {
    expect(forecastForMonth([student], plans, [], "2026-10")).toHaveLength(1);
  });
});
