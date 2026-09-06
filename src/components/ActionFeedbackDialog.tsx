"use client";

import { useState } from "react";
import { formatMessage } from "@/messages/catalogue";
import { AppDialog } from "./AppDialog";

export function ActionFeedbackDialog({
  state,
}: Readonly<{ state: { status: string; message?: string } }>) {
  const [dismissedState, setDismissedState] = useState<object | null>(null);
  if (!state.message) return null;
  const error = state.status === "error";
  return (
    <AppDialog
      description={state.message}
      onClose={() => setDismissedState(state)}
      open={dismissedState !== state}
      title={formatMessage(
        error ? "dialog.error.title" : "dialog.success.title",
      )}
      tone={error ? "error" : "success"}
    />
  );
}
