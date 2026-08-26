"use client";

import { useState } from "react";

import { ErrorFallback } from "@/components/ErrorFallback";
import { createErrorReferenceId } from "@/errors/app-error";

import "./globals.css";

export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [referenceId] = useState(
    () => error.digest ?? createErrorReferenceId(),
  );

  return (
    <html lang="en-AU">
      <body>
        <ErrorFallback referenceId={referenceId} onRetry={retry} />
      </body>
    </html>
  );
}
