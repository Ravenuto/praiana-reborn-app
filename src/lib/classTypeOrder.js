// Existing modalities without an order retain their original creation order.
export function sortClassTypes(items) {
  return [...items].sort((a, b) => {
    const aOrder = Number.isFinite(Number(a.sort_order)) && a.sort_order !== undefined && a.sort_order !== null ? Number(a.sort_order) : Infinity;
    const bOrder = Number.isFinite(Number(b.sort_order)) && b.sort_order !== undefined && b.sort_order !== null ? Number(b.sort_order) : Infinity;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return String(a.created_date || '').localeCompare(String(b.created_date || '')) || String(a.id).localeCompare(String(b.id));
  });
}