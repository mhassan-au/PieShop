"use client";

import { useEffect, useRef } from "react";

export type DialogTone = "info" | "success" | "warning" | "error";

type Props = Readonly<{
  open: boolean;
  title: string;
  description: string;
  tone?: DialogTone;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm?: () => void;
  onClose: () => void;
}>;

const toneClass: Record<DialogTone, string> = {
  info: "border-sky-300/30 text-sky-100",
  success: "border-emerald-300/30 text-emerald-100",
  warning: "border-amber-300/30 text-amber-100",
  error: "border-rose-300/30 text-rose-100",
};

export function AppDialog({
  open,
  title,
  description,
  tone = "info",
  confirmLabel,
  cancelLabel,
  busy = false,
  onConfirm,
  onClose,
}: Props) {
  const panel = useRef<HTMLElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    primary.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
      if (event.key === "Tab") {
        const controls = panel.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!controls?.length) return;
        const first = controls[0]!;
        const last = controls[controls.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus?.focus();
    };
  }, [busy, onClose, open]);
  if (!open) return null;

  return (
    <div
      aria-labelledby="app-dialog-title"
      aria-describedby="app-dialog-description"
      aria-modal="true"
      className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-5 backdrop-blur-sm"
      role="dialog"
    >
      <section
        className={`w-full max-w-md rounded-3xl border bg-stone-900 p-6 shadow-2xl ${toneClass[tone]}`}
        ref={panel}
      >
        <h2 className="font-serif text-2xl font-semibold" id="app-dialog-title">
          {title}
        </h2>
        <p
          className="mt-3 text-sm leading-6 text-stone-300"
          id="app-dialog-description"
        >
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          {cancelLabel ? (
            <button
              className="min-h-11 rounded-xl border border-white/20 px-4 text-sm font-semibold"
              disabled={busy}
              onClick={onClose}
              type="button"
            >
              {cancelLabel}
            </button>
          ) : null}
          <button
            className="min-h-11 rounded-xl bg-orange-400 px-4 text-sm font-bold text-stone-950 disabled:opacity-60"
            disabled={busy}
            onClick={onConfirm ?? onClose}
            ref={primary}
            type="button"
          >
            {confirmLabel ?? "Close"}
          </button>
        </div>
      </section>
    </div>
  );
}
