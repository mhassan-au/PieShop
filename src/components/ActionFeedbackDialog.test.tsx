import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionFeedbackDialog } from "./ActionFeedbackDialog";

describe("ActionFeedbackDialog", () => {
  it("shows success and error feedback in the centralized app dialog", () => {
    const { rerender } = render(
      <ActionFeedbackDialog state={{ status: "success", message: "Saved." }} />,
    );
    expect(screen.getByRole("dialog")).toHaveTextContent("Completed");
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    rerender(
      <ActionFeedbackDialog state={{ status: "error", message: "Failed." }} />,
    );
    expect(screen.getByRole("dialog")).toHaveTextContent(
      "Something went wrong",
    );
  });
});
