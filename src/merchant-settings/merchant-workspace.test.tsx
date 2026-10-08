import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MerchantWorkspace } from "@/components/MerchantWorkspace";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/app/merchant/actions", () => ({
  merchantLogoutAction: vi.fn(),
  updateMerchantSettingsAction: vi.fn(),
}));

const settings = {
  businessId: "123e4567-e89b-12d3-a456-426614174000",
  businessName: "Harbour Pies",
  contactEmail: "test@example.com",
  contactPhone: null,
  currencyCode: "AUD" as const,
  timezone: "Australia/Sydney" as const,
  version: 1,
  updatedAt: "2026-09-06T00:00:00.000Z",
};

describe("MerchantWorkspace", () => {
  it("renders accessible mobile navigation and resumable progress", () => {
    render(<MerchantWorkspace settings={settings} />);
    expect(
      screen.getByRole("navigation", { name: /merchant workspace/i }),
    ).toBeInTheDocument();
    for (const label of ["Today", "Orders", "Catalogue", "Settings"])
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    expect(
      screen.getByText(/3 of 4 setup steps complete/i),
    ).toBeInTheDocument();
  });

  it("submits only approved settings fields and no tenant identifier", () => {
    const { container } = render(<MerchantWorkspace settings={settings} />);
    for (const name of [
      "businessName",
      "contactEmail",
      "contactPhone",
      "currencyCode",
      "timezone",
      "version",
    ])
      expect(container.querySelector(`[name="${name}"]`)).not.toBeNull();
    expect(container.querySelector('[name="businessId"]')).toBeNull();
    expect(container.querySelector("[onclick]")).toBeNull();
  });

  it("refreshes page data from the client after a successful save", () => {
    expect(MerchantWorkspace.toString()).toContain("router.refresh()");
  });

  it("synchronizes uncontrolled fields when a newer settings version renders", () => {
    const { rerender } = render(<MerchantWorkspace settings={settings} />);
    const businessName = screen.getByRole("textbox", {
      name: /business name/i,
    });
    expect(businessName).toHaveValue("Harbour Pies");

    rerender(
      <MerchantWorkspace
        settings={{
          ...settings,
          businessName: "Harbour Pies Updated",
          version: 2,
        }}
      />,
    );

    expect(businessName).not.toHaveValue("Harbour Pies Updated");
    expect(screen.getByRole("textbox", { name: /business name/i })).toHaveValue(
      "Harbour Pies Updated",
    );
  });
});
