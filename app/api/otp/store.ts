// app/api/otp/store.ts
export const otpStore: Record<string, { otp: string; expires: number }> = {};
export const otpCooldown: Record<string, number> = {};

// normalize phone number for consistent keys
export function normalizePhone(phone: string): string {
  if (!phone) return "";
  return phone.replace(/\s+/g, "").replace(/^\+/, ""); 
  // removes spaces, strips leading "+" → "+919734276834" -> "919734276834"
}
