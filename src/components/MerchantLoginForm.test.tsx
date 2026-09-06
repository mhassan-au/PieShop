import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/merchant/login/actions", () => ({
  requestReturningMerchantMagicLinkAction: vi.fn(),
}));

import { MerchantLoginForm } from "./MerchantLoginForm";

describe("MerchantLoginForm", () => {
  it("renders an accessible email-only login without password or signup", () => {
    render(<MerchantLoginForm />);
    expect(screen.getByLabelText("Merchant email")).toHaveAttribute(
      "autocomplete",
      "email",
    );
    expect(screen.queryByLabelText(/password/iu)).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Email me a sign-in link" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("link", { name: /sign up|register/iu }),
    ).not.toBeInTheDocument();
  });
});
