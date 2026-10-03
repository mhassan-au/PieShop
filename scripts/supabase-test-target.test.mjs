import assert from "node:assert/strict";
import test from "node:test";

import {
  assertSafeSupabaseTestTarget,
  safeDatabaseCode,
  safeDatabaseFailure,
} from "./supabase-test-target.mjs";

const validInput = {
  appEnvironment: "test",
  projectUrl: "https://abcdefghijklmnopqrst.supabase.co",
  databaseUrl:
    "postgresql://postgres.abcdefghijklmnopqrst:password@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres",
  projectConfirmation: "abcdefghijklmnopqrst",
};

test("accepts one matching, explicitly confirmed development target", () => {
  assert.deepEqual(assertSafeSupabaseTestTarget(validInput), {
    projectRef: "abcdefghijklmnopqrst",
    databaseHost: "aws-0-ap-southeast-2.pooler.supabase.com",
  });
});

for (const [name, override, expectedCode] of [
  [
    "unsafe environment",
    { appEnvironment: "production" },
    "unsafe_environment",
  ],
  [
    "missing confirmation",
    { projectConfirmation: "" },
    "confirmation_mismatch",
  ],
  [
    "different project",
    { projectConfirmation: "zzzzzzzzzzzzzzzzzzzz" },
    "confirmation_mismatch",
  ],
  [
    "transaction pooler",
    {
      databaseUrl:
        "postgresql://postgres.abcdefghijklmnopqrst:password@aws-0-ap-southeast-2.pooler.supabase.com:6543/postgres",
    },
    "unsafe_database_port",
  ],
  [
    "non-Supabase host",
    { databaseUrl: "postgresql://user:password@example.com:5432/postgres" },
    "unsafe_database_host",
  ],
]) {
  test(`rejects ${name} with a stable code`, () => {
    assert.throws(
      () => assertSafeSupabaseTestTarget({ ...validInput, ...override }),
      (error) => error instanceof Error && error.message === expectedCode,
    );
  });
}

test("redacts arbitrary database failures", () => {
  const secret = "postgresql://user:secret@example.com/data";
  const result = safeDatabaseFailure(new Error(`connection failed: ${secret}`));

  assert.equal(result, "database_operation_failed");
  assert.equal(result.includes(secret), false);
});

test("exposes only a valid SQLSTATE code", () => {
  assert.equal(safeDatabaseCode({ code: "42725", detail: "secret" }), "42725");
  assert.equal(safeDatabaseCode({ code: "unsafe-secret" }), null);
  assert.equal(safeDatabaseCode(new Error("secret")), null);
});
