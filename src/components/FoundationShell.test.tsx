import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FoundationShell } from "./FoundationShell";

describe("FoundationShell", () => {
  it("identifies PieShop and exposes a single primary heading", () => {
    render(<FoundationShell />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /PieShop.*Orders should feel simple/i,
      }),
    ).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("states that product functionality is not active", () => {
    render(<FoundationShell />);

    expect(
      screen.getByText(
        "No merchant, order or payment features are active yet.",
      ),
    ).toBeVisible();
  });
});
