const DAY_NAMES = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];

export function sessionOccursOnDate(session, date) {
  if (!date || session.is_active === false) return false;
  if (session.cancelled_dates?.includes(date)) return false;
  if (session.end_date && date >= session.end_date) return false;
  if (session.start_date && date < session.start_date) return false;
  if (!session.is_recurring) return session.date === date;
  const day = new Date(`${date}T12:00:00`).getDay();
  return session.day_of_week === DAY_NAMES[day];
}

export function invalidateSessionViews(queryClient) {
  return Promise.all(["allSessions", "sessions", "adminSessions"].map((key) =>
    queryClient.invalidateQueries({ queryKey: [key] })
  ));
}