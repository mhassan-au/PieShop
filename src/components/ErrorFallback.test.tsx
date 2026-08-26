import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ErrorFallback } from "./ErrorFallback";

describe("ErrorFallback", () => {
  it("shows safe recovery copy and a reference ID", () => {
    render(
      <ErrorFallback referenceId="err_safe_reference" onRetry={() => {}} />,
    );

    expect(
      screen.getByRole("heading", { name: "We couldn’t load this page" }),
    ).toBeVisible();
    expect(screen.getByText(/err_safe_reference/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Try again" })).toBeVisible();
  });

  it("runs the supplied recovery action", () => {
    const onRetry = vi.fn();
    render(<ErrorFallback referenceId="err_retry" onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));

    expect(onRetry).toHaveBeenCalledOnce();
  });
});
