import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ControlShell } from "./ControlShell";

describe("ControlShell", () => {
  it("renders platform metadata context without merchant business content", () => {
    const { container } = render(<ControlShell />);

    expect(
      screen.getByRole("heading", { name: "Merchant account administration" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Platform control plane")).toHaveLength(2);
    expect(container).not.toHaveTextContent(
      /catalogue|customer|order|message|address|payment|bank|transaction/iu,
    );
  });
});
