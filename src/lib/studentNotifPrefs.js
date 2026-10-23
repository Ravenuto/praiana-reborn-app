export const DELIVERY_OPTIONS = ["both", "email", "app"];

export function notificationChannels(value) {
  const mode = DELIVERY_OPTIONS.includes(value) ? value : "both";
  return { email: mode !== "app", app: mode !== "email" };
}

export function isDeliverableStudent(email, guestType) {
  return !guestType && typeof email === "string" && email.includes("@") && !email.toLowerCase().endsWith(".invalid");
}