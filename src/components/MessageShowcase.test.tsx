import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MessageShowcase } from "./MessageShowcase";

describe("MessageShowcase", () => {
  it("shows the four copy states as demonstrations", () => {
    render(<MessageShowcase />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /PieShop.*Clear words when they matter/i,
      }),
    ).toBeVisible();
    expect(screen.getByText("Validation", { exact: true })).toBeVisible();
    expect(screen.getByText("Confirmation", { exact: true })).toBeVisible();
    expect(screen.getByText("Success", { exact: true })).toBeVisible();
    expect(screen.getByText("Failure", { exact: true })).toBeVisible();
    expect(screen.getByText(/wording demonstrations only/i)).toBeVisible();
  });
});
