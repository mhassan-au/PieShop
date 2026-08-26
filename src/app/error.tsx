"use client";

import { useState } from "react";

import { ErrorFallback } from "@/components/ErrorFallback";
import { createErrorReferenceId } from "@/errors/app-error";

export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [referenceId] = useState(
    () => error.digest ?? createErrorReferenceId(),
  );

  return <ErrorFallback referenceId={referenceId} onRetry={retry} />;
}
