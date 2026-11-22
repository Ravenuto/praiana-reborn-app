// Keep one stable session identity: bookings, attendance and credit flags never move.
export function sessionForDate(session, date) {
  const versions = [...(session.session_versions || [])].sort((a, b) => a.from.localeCompare(b.from));
  let result = { ...session };
  for (const version of versions) {
    if (version.from <= date) result = { ...result, ...version.data };
  }
  return { ...result, id: session.id, session_versions: session.session_versions };
}

export function recurringEditPatch(session, changes, from) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(from || "")) throw new Error("Informe a data da alteração.");
  if (session.start_date && from < session.start_date) throw new Error("A alteração não pode começar antes da primeira aula.");
  if (session.end_date && from >= session.end_date) throw new Error("A alteração precisa começar antes do encerramento deste horário.");
  const { id, created_date, session_versions, start_date, end_date, cancelled_dates, is_active, ...data } = changes;
  return {
    session_versions: [
      ...(session.session_versions || []).filter(v => v.from !== from),
      { from, data },
    ].sort((a, b) => a.from.localeCompare(b.from)),
  };
}

export function occurrenceNotes(session, date) {
  return sessionForDate(session, date).session_overrides?.[date]?.notes || "";
}

// Write an explicit empty note too, so no later version can revive a removed note.
export function occurrenceNotesPatch(session, date, notes) {
  const update = (overrides = {}) => ({
    ...overrides,
    [date]: { ...overrides[date], notes },
  });
  return {
    session_overrides: update(session.session_overrides),
    session_versions: (session.session_versions || []).map(version => ({
      ...version,
      data: { ...version.data, session_overrides: update(version.data.session_overrides) },
    })),
  };
}