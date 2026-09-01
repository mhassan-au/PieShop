import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/control/actions", () => ({
  createMerchantAction: vi.fn(),
}));

import { ControlShell } from "./ControlShell";

describe("ControlShell", () => {
  it("renders platform metadata context without merchant business content", () => {
    const { container } = render(
      <ControlShell
        logoutAction={() => undefined}
        revokeSessionAction={() => undefined}
        sessions={[
          {
            id: "11111111-1111-4111-8111-111111111111",
            deviceLabel: "Firefox on Windows",
            createdAt: "2026-09-01T00:00:00.000Z",
            lastActivityAt: "2026-09-01T01:00:00.000Z",
            absoluteExpiresAt: "2026-09-01T12:00:00.000Z",
            idleExpiresAt: "2026-09-01T03:00:00.000Z",
            revokedAt: null,
            revokedReason: null,
            isCurrent: true,
          },
          {
            id: "22222222-2222-4222-8222-222222222222",
            deviceLabel: "Safari on iPhone",
            createdAt: "2026-09-01T00:10:00.000Z",
            lastActivityAt: "2026-09-01T01:10:00.000Z",
            absoluteExpiresAt: "2026-09-01T12:10:00.000Z",
            idleExpiresAt: "2026-09-01T03:10:00.000Z",
            revokedAt: null,
            revokedReason: null,
            isCurrent: false,
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Merchant account administration" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Platform control plane")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Sign out" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Signed-in devices" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Firefox on Windows")).toBeInTheDocument();
    expect(screen.getByText("Current session")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Revoke session" }),
    ).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/[a-f0-9]{64}/u);
    expect(container).not.toHaveTextContent(
      /catalogue|customer|order|message|address|payment|bank|transaction/iu,
    );
  });
});
