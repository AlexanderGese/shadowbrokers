import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";

// Mirror the signPayload function from src/lib/custom-webhooks.ts
function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("hex");
}

describe("Webhook HMAC Signing", () => {
  it("produces a valid hex string", () => {
    const sig = signPayload('{"test": true}', "my-secret");
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  it("same payload + secret produces same signature", () => {
    const payload = '{"event":"alert","ticker":"AAPL"}';
    const secret = "webhook-secret-123";
    const sig1 = signPayload(payload, secret);
    const sig2 = signPayload(payload, secret);
    expect(sig1).toBe(sig2);
  });

  it("different payloads produce different signatures", () => {
    const secret = "same-secret";
    const sig1 = signPayload('{"ticker":"AAPL"}', secret);
    const sig2 = signPayload('{"ticker":"TSLA"}', secret);
    expect(sig1).not.toBe(sig2);
  });

  it("different secrets produce different signatures", () => {
    const payload = '{"ticker":"AAPL"}';
    const sig1 = signPayload(payload, "secret-1");
    const sig2 = signPayload(payload, "secret-2");
    expect(sig1).not.toBe(sig2);
  });

  it("can be verified by recreating the signature", () => {
    const payload = '{"event":"briefing.generated","data":{}}';
    const secret = "verify-me";
    const signature = signPayload(payload, secret);

    // Verification: recompute and compare
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    expect(signature).toBe(expected);
  });

  it("handles empty payload", () => {
    const sig = signPayload("", "secret");
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });

  it("handles unicode in payload", () => {
    const sig = signPayload('{"text":"🟢 AAPL UP"}', "secret");
    expect(sig).toMatch(/^[a-f0-9]{64}$/);
  });
});
