import { describe, expect, it } from "vitest";

import { redact } from "./redaction";

describe("redact", () => {
  it("redacts sensitive values even under neutral keys", () => {
    expect(
      redact({
        first: "Bearer synthetic-token-value",
        second: "+61 412 345 678",
        third: "123-456 12345678",
        fourth: "payid@example.test",
        safe: "order_ready",
      }),
    ).toEqual({
      first: "[REDACTED]",
      second: "[REDACTED]",
      third: "[REDACTED]",
      fourth: "[REDACTED]",
      safe: "order_ready",
    });
  });

  it("bounds deep and oversized values", () => {
    expect(redact({ note: "x".repeat(600) })).toEqual({
      note: `${"x".repeat(497)}...`,
    });
  });
});
