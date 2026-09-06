import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmedActionForm } from "./ConfirmedActionForm";

describe("ConfirmedActionForm", () => {
  it("uses the app dialog and submits only after explicit confirmation", () => {
    const action = vi.fn();
    render(
      <ConfirmedActionForm
        formAction={action}
        button="Suspend"
        cancelLabel="Cancel"
        confirmLabel="Suspend"
        description="Sessions will be revoked."
        fields={{ businessId: "business-1", targetStatus: "suspended" }}
        title="Please confirm"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Suspend" }));
    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Suspend" })[1]!);
    expect(action).toHaveBeenCalledOnce();
    const payload = action.mock.calls[0]![0] as FormData;
    expect(payload.get("businessId")).toBe("business-1");
    expect(payload.get("targetStatus")).toBe("suspended");
  });
});
