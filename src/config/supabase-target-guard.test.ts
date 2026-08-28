import { describe, expect, it } from "vitest";

import { assertSafeSupabaseTarget } from "./supabase-target-guard";

const developmentTarget = {
  appEnvironment: "test",
  projectUrl: "https://abcdefghijklmnopqrst.supabase.co",
  databaseUrl:
    "postgresql://postgres.abcdefghijklmnopqrst:synthetic-password@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres",
  destructiveConfirmation: "abcdefghijklmnopqrst",
};

describe("assertSafeSupabaseTarget", () => {
  it("accepts an explicitly confirmed test project when URL and database project references match", () => {
    expect(() => assertSafeSupabaseTarget(developmentTarget)).not.toThrow();
  });

  it.each(["staging", "production"])(
    "rejects destructive work in %s",
    (appEnvironment) => {
      expect(() =>
        assertSafeSupabaseTarget({ ...developmentTarget, appEnvironment }),
      ).toThrow(/environment/u);
    },
  );

  it("rejects a database URL belonging to another Supabase project", () => {
    expect(() =>
      assertSafeSupabaseTarget({
        ...developmentTarget,
        databaseUrl:
          "postgresql://postgres.zyxwvutsrqponmlkjihg:synthetic-password@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres",
      }),
    ).toThrow(/project/u);
  });

  it("requires the project reference to be typed as destructive confirmation", () => {
    expect(() =>
      assertSafeSupabaseTarget({
        ...developmentTarget,
        destructiveConfirmation: "wrong-project",
      }),
    ).toThrow(/confirmation/u);
  });

  it("rejects non-Supabase database hosts", () => {
    expect(() =>
      assertSafeSupabaseTarget({
        ...developmentTarget,
        databaseUrl:
          "postgresql://postgres:synthetic-password@example.com:5432/postgres",
      }),
    ).toThrow(/host/u);
  });
});
