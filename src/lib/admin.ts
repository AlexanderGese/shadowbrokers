export const ADMIN_EMAIL = "alexander.gese07@gmail.com";

export function isAdmin(email: string | undefined | null): boolean {
  return email === ADMIN_EMAIL;
}
