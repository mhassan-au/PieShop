import {
  formatMessageWithParameters,
  type MessageKey,
} from "@/messages/catalogue";

export type AppErrorCode =
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "FORBIDDEN"
  | "UNEXPECTED_ERROR";

export type ErrorSeverity = "debug" | "info" | "warning" | "error" | "fatal";
export type SafeErrorContext = Readonly<
  Record<string, string | number | boolean | null>
>;

const statusByCode: Record<AppErrorCode, number> = {
  VALIDATION_FAILED: 400,
  NOT_FOUND: 404,
  CONFLICT: 409,
  FORBIDDEN: 403,
  UNEXPECTED_ERROR: 500,
};

type AppErrorOptions = {
  code: Exclude<AppErrorCode, "UNEXPECTED_ERROR">;
  publicMessageKey: Extract<
    MessageKey,
    `validation.${string}` | `error.${string}`
  >;
  publicMessageParameters?: Record<string, string | number>;
  severity: ErrorSeverity;
  isRetryable: boolean;
  internalCause?: unknown;
  safeContext?: SafeErrorContext;
  requestId?: string;
  traceId?: string;
  referenceId?: string;
};

export type PublicErrorEnvelope = {
  error: {
    code: AppErrorCode;
    message: string;
    referenceId: string;
  };
};

export class AppError extends Error {
  readonly code: Exclude<AppErrorCode, "UNEXPECTED_ERROR">;
  readonly publicMessageKey: Extract<
    MessageKey,
    `validation.${string}` | `error.${string}`
  >;
  readonly publicMessageParameters?: Record<string, string | number>;
  readonly severity: ErrorSeverity;
  readonly isRetryable: boolean;
  readonly safeContext: SafeErrorContext;
  readonly requestId?: string;
  readonly traceId?: string;
  readonly referenceId: string;

  constructor(options: AppErrorOptions) {
    super(options.code, { cause: options.internalCause });
    this.name = "AppError";
    this.code = options.code;
    this.publicMessageKey = options.publicMessageKey;
    this.publicMessageParameters = options.publicMessageParameters;
    this.severity = options.severity;
    this.isRetryable = options.isRetryable;
    this.safeContext = Object.freeze({ ...options.safeContext });
    this.requestId = options.requestId;
    this.traceId = options.traceId;
    this.referenceId = options.referenceId ?? createErrorReferenceId();
  }
}

export function createErrorReferenceId(): string {
  return `err_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

export function createPublicErrorEnvelope(
  error: unknown,
  fallbackReferenceId = createErrorReferenceId(),
): { status: number; body: PublicErrorEnvelope } {
  if (error instanceof AppError) {
    return {
      status: statusByCode[error.code],
      body: {
        error: {
          code: error.code,
          message: formatMessageWithParameters(
            error.publicMessageKey,
            error.publicMessageParameters,
          ),
          referenceId: error.referenceId,
        },
      },
    };
  }

  return {
    status: statusByCode.UNEXPECTED_ERROR,
    body: {
      error: {
        code: "UNEXPECTED_ERROR",
        message: formatMessageWithParameters("error.unexpected.message"),
        referenceId: fallbackReferenceId,
      },
    },
  };
}
