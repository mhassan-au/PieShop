"use client";

import { useState, type ReactNode } from "react";
import { AppDialog, type DialogTone } from "./AppDialog";

export function ConfirmedActionForm({
  formAction,
  fields,
  button,
  title,
  description,
  confirmLabel,
  cancelLabel,
  tone = "warning",
  disabled = false,
}: Readonly<{
  formAction: (formData: FormData) => void | Promise<void>;
  fields: Readonly<Record<string, string>>;
  button: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  tone?: DialogTone;
  disabled?: boolean;
}>) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className="min-h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold disabled:opacity-60"
        disabled={disabled}
        onClick={() => setOpen(true)}
        type="button"
      >
        {button}
      </button>
      <AppDialog
        cancelLabel={cancelLabel}
        confirmLabel={confirmLabel}
        description={description}
        onClose={() => setOpen(false)}
        onConfirm={() => {
          const formData = new FormData();
          Object.entries(fields).forEach(([name, value]) =>
            formData.set(name, value),
          );
          setOpen(false);
          void formAction(formData);
        }}
        open={open}
        title={title}
        tone={tone}
      />
    </>
  );
}
