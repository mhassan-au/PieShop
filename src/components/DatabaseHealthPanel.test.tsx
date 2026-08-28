import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DatabaseHealthPanel } from "./DatabaseHealthPanel";

describe("DatabaseHealthPanel", () => {
  it("shows safe configured status without rendering connection details", () => {
    const { container } = render(<DatabaseHealthPanel isConfigured />);

    expect(
      screen.getByRole("heading", { name: "Cloud database foundation" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Configuration ready")).toBeInTheDocument();
    expect(
      screen.getByText(/No credentials are displayed/i),
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/supabase\.co|postgresql:\/\//iu);
  });

  it("shows a safe incomplete state without naming missing secrets", () => {
    render(<DatabaseHealthPanel isConfigured={false} />);

    expect(screen.getByText("Configuration incomplete")).toBeInTheDocument();
    expect(screen.queryByText(/SUPABASE_/u)).not.toBeInTheDocument();
  });
});
