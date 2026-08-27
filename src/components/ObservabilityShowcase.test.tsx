import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ObservabilityShowcase } from "./ObservabilityShowcase";

describe("ObservabilityShowcase", () => {
  it("shows sanitised local log and Telegram previews", async () => {
    render(await ObservabilityShowcase());

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /PieShop.*Useful evidence. Less exposure/i,
      }),
    ).toBeVisible();
    expect(screen.getByText("Structured debug event")).toBeVisible();
    expect(screen.getByText("Telegram critical alert")).toBeVisible();
    expect(screen.getAllByText(/\[REDACTED\]/)).not.toHaveLength(0);
    expect(screen.getByText(/Nothing was transmitted/i)).toBeVisible();
  });
});
