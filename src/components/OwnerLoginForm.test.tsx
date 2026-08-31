import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/login/actions", () => ({
  ownerLoginAction: vi.fn(),
}));

import { OwnerLoginForm } from "./OwnerLoginForm";

describe("OwnerLoginForm", () => {
  it("renders an accessible password login without signup or recovery paths", () => {
    render(<OwnerLoginForm />);

    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");
    expect(email).toHaveAttribute("type", "email");
    expect(email).toHaveAttribute("autocomplete", "email");
    expect(password).toHaveAttribute("type", "password");
    expect(password).toHaveAttribute("autocomplete", "current-password");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled();
    expect(
      screen.queryByRole("link", { name: /sign up|register|forgot|recover/iu }),
    ).not.toBeInTheDocument();
  });
});
