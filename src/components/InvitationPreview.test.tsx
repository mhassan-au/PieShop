import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InvitationPreview } from "./InvitationPreview";

describe("InvitationPreview", () => {
  it("shows only safe live-invitation metadata", () => {
    render(
      <InvitationPreview
        invitation={{
          businessName: "Example Pies",
          expiresAt: "2026-09-06T00:00:00.000Z",
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Confirm your invitation" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("You have been invited to manage Example Pies."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/No account has been created/u),
    ).toBeInTheDocument();
  });

  it("uses one generic unavailable state", () => {
    render(<InvitationPreview invitation={null} />);
    expect(
      screen.getByText("This invitation is unavailable or has expired."),
    ).toBeInTheDocument();
  });
});
