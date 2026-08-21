/**
 * Conversão segura de datas vindas de dados (banco, formulários, etc).
 * Aceita "YYYY-MM-DD", ISO completo (com hora) ou objeto Date.
 * Retorna null quando o valor é ausente ou inválido — nunca lança.
 */
export function parseDateSafe(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value !== "string") return null;

  const str = value.trim();
  if (!str) return null;

  // "YYYY-MM-DD" → meio-dia local para evitar problemas de fuso
  const d = /^\d{4}-\d{2}-\d{2}$/.test(str)
    ? new Date(`${str}T12:00:00`)
    : new Date(str);

  return isNaN(d.getTime()) ? null : d;
}

export default parseDateSafe;
