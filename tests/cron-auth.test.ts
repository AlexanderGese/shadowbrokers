import { describe, it, expect } from "vitest";

// Mirror the auth check from all cron routes
function isAuthorized(authHeader: string | null, cronSecret: string): boolean {
  return authHeader === `Bearer ${cronSecret}`;
}

describe("Cron Authentication", () => {
  const SECRET = "sb_shadowbrokers_cron_x7k9m2p4q8r1";

  it("accepts valid bearer token", () => {
    expect(isAuthorized(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("rejects missing header", () => {
    expect(isAuthorized(null, SECRET)).toBe(false);
  });

  it("rejects empty header", () => {
    expect(isAuthorized("", SECRET)).toBe(false);
  });

  it("rejects wrong token", () => {
    expect(isAuthorized("Bearer wrong-token", SECRET)).toBe(false);
  });

  it("rejects token without Bearer prefix", () => {
    expect(isAuthorized(SECRET, SECRET)).toBe(false);
  });

  it("rejects extra spaces", () => {
    expect(isAuthorized(`Bearer  ${SECRET}`, SECRET)).toBe(false);
  });

  it("is case-sensitive", () => {
    expect(isAuthorized(`bearer ${SECRET}`, SECRET)).toBe(false);
    expect(isAuthorized(`BEARER ${SECRET}`, SECRET)).toBe(false);
  });
});
