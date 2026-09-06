import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AppDialog } from "./AppDialog";

describe("AppDialog", () => {
  it("renders an app-owned accessible confirmation and invokes explicit actions", () => {
    const confirm = vi.fn();
    const close = vi.fn();
    render(
      <AppDialog
        cancelLabel="Cancel"
        confirmLabel="Suspend"
        description="Sessions will be revoked."
        onClose={close}
        onConfirm={confirm}
        open
        title="Suspend merchant?"
        tone="warning"
      />,
    );
    expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Suspend" })).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
    fireEvent.click(screen.getByRole("button", { name: "Suspend" }));
    expect(confirm).toHaveBeenCalledOnce();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
  });
});
