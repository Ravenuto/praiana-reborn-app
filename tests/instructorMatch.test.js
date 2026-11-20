import { describe, it, expect } from "vitest";
import { instructorMatches } from "../src/lib/instructorMatch";
describe("presenças da professora", () => {
  it("mostra aula da própria professora mesmo com nome completo", () => expect(instructorMatches("Lorena", "Lorena Souza")).toBe(true));
  it("esconde aula de outra professora", () => expect(instructorMatches("Raissa", "Lorena Souza")).toBe(false));
});
