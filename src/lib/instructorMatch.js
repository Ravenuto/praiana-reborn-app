// Compara o nome da professora da aula com o nome da conta, tolerando acentos,
// maiúsculas e nome completo vs. primeiro nome ("Lorena" x "Lorena Souza").
const norm = (v) => String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/\s+/g, " ");

export function instructorMatches(sessionInstructor, teacherName) {
  const a = norm(sessionInstructor);
  const b = norm(teacherName);
  if (!b) return true;
  if (!a) return false;
  if (a === b) return true;
  return a.split(" ")[0] === b.split(" ")[0];
}
