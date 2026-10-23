export const DELIVERY_OPTIONS = ["both", "email", "app"];

export function notificationChannels(value: unknown) {
  const mode = typeof value === 'string' && DELIVERY_OPTIONS.includes(value) ? value : "both";
  return { email: mode !== "app", app: mode !== "email" };
}

export function isDeliverableStudent(email: unknown, guestType: unknown) {
  return !guestType && typeof email === "string" && email.includes("@") && !email.toLowerCase().endsWith(".invalid");
}