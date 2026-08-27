export const REDACTED = "[REDACTED]" as const;

type RedactedValue =
  | string
  | number
  | boolean
  | null
  | RedactedValue[]
  | { [key: string]: RedactedValue };

const maximumDepth = 6;
const maximumArrayItems = 50;
const maximumObjectKeys = 50;
const maximumStringLength = 500;

const sensitiveKeyPattern =
  /password|passcode|secret|token|cookie|authori[sz]ation|session|phone|mobile|address|bankaccount|bankdetails|bsb|payid|email|messagebody|paymentevidence/u;

const sensitiveValuePatterns = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  /\bBearer\s+\S+/iu,
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/u,
  /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/u,
  /\b\d{3}-\d{3}\s+\d{6,10}\b/u,
  /(?:\+\d[\d\s()-]{8,}\d|\b0\d{9}\b|\b\d{3,4}[ -]\d{3}[ -]\d{3,4}\b)/u,
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/iu,
];

function normaliseKey(key: string): string {
  return key.toLowerCase().replaceAll(/[^a-z0-9]/gu, "");
}

function redactString(value: string): string {
  if (sensitiveValuePatterns.some((pattern) => pattern.test(value))) {
    return REDACTED;
  }

  return value.length > maximumStringLength
    ? `${value.slice(0, maximumStringLength - 3)}...`
    : value;
}

export function redact(value: unknown): RedactedValue {
  return redactValue(value, undefined, 0, new WeakSet<object>());
}

export function redactScalar(value: string): string {
  return redactString(value).replaceAll(/[\u0000-\u001f\u007f]+/gu, " ");
}

function redactValue(
  value: unknown,
  key: string | undefined,
  depth: number,
  seen: WeakSet<object>,
): RedactedValue {
  if (key && sensitiveKeyPattern.test(normaliseKey(key))) return REDACTED;
  if (depth > maximumDepth) return "[TRUNCATED]";
  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (typeof value === "string") return redactString(value);
  if (typeof value === "bigint") return value.toString();
  if (typeof value === "undefined") return "[UNDEFINED]";
  if (typeof value === "function" || typeof value === "symbol") {
    return "[UNSUPPORTED]";
  }
  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    return {
      name: redactString(value.name),
      message: REDACTED,
    };
  }
  if (seen.has(value)) return "[CIRCULAR]";
  seen.add(value);

  if (Array.isArray(value)) {
    return value
      .slice(0, maximumArrayItems)
      .map((item) => redactValue(item, undefined, depth + 1, seen));
  }

  return Object.fromEntries(
    Object.entries(value)
      .slice(0, maximumObjectKeys)
      .map(([entryKey, entryValue]) => [
        entryKey,
        redactValue(entryValue, entryKey, depth + 1, seen),
      ]),
  );
}
