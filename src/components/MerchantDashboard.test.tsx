import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/control/actions", () => ({
  createMerchantAction: vi.fn(),
  issueMerchantInvitationAction: vi.fn(),
  revokeMerchantInvitationAction: vi.fn(),
}));

import { MerchantDashboard } from "./MerchantDashboard";

const merchant = {
  id: "11111111-1111-4111-8111-111111111111",
  publicId: "biz_12345678",
  name: "Example Pies",
  status: "onboarding" as const,
  timezone: "Australia/Sydney",
  currencyCode: "AUD" as const,
  invitationStatus: "draft" as const,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

describe("MerchantDashboard", () => {
  it("renders an accessible allow-listed create form and empty state", () => {
    render(<MerchantDashboard merchants={[]} />);

    expect(
      screen.getByRole("heading", { name: "Add merchant" }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Business name")).toHaveAttribute(
      "name",
      "name",
    );
    expect(screen.getByLabelText("Merchant-owner email")).toHaveAttribute(
      "type",
      "email",
    );
    expect(screen.getByLabelText("Timezone")).toHaveValue("Australia/Sydney");
    expect(
      screen.getByRole("button", { name: "Create merchant" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("No merchants have been added yet."),
    ).toBeInTheDocument();
  });

  it("renders operational metadata without merchant business content", () => {
    const { container } = render(<MerchantDashboard merchants={[merchant]} />);

    expect(screen.getByText("Example Pies")).toBeInTheDocument();
    expect(
      screen.getByText(/biz_12345678.*Australia\/Sydney.*AUD/u),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Onboarding.*Invitation draft/u),
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent(
      /catalogue|customer|order|message|address|payment|bank|transaction/iu,
    );
    expect(
      screen.getByRole("button", { name: "Create preview link" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Development preview only — no email will be sent."),
    ).toBeInTheDocument();
  });
});
