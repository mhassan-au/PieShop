const catalogue = {
  "brand.name": {
    template: "PieShop",
    placeholders: [],
  },
  "brand.description": {
    template: "Simple conversational ordering for small merchants.",
    placeholders: [],
  },
  "foundation.eyebrow": {
    template: "Foundation milestone",
    placeholders: [],
  },
  "foundation.title": {
    template: "Orders should feel simple.",
    placeholders: [],
  },
  "foundation.description": {
    template:
      "PieShop is being built as one calm place for small merchants to receive, confirm and fulfil conversational orders.",
    placeholders: [],
  },
  "foundation.footer": {
    template: "No merchant, order or payment features are active yet.",
    placeholders: [],
  },
  "showcase.status.label": {
    template: "Part 0.2",
    placeholders: [],
  },
  "showcase.status.value": {
    template: "Message and error review",
    placeholders: [],
  },
  "showcase.eyebrow": {
    template: "Copy laboratory",
    placeholders: [],
  },
  "showcase.title": {
    template: "Clear words when they matter.",
    placeholders: [],
  },
  "showcase.description": {
    template:
      "Every prompt, success and setback will use one carefully managed message catalogue.",
    placeholders: [],
  },
  "showcase.notice": {
    template:
      "These are wording demonstrations only. No order will be created or changed.",
    placeholders: [],
  },
  "showcase.states.title": {
    template: "Four moments to review",
    placeholders: [],
  },
  "showcase.validation.label": {
    template: "Validation",
    placeholders: [],
  },
  "showcase.confirmation.label": {
    template: "Confirmation",
    placeholders: [],
  },
  "showcase.success.label": {
    template: "Success",
    placeholders: [],
  },
  "showcase.failure.label": {
    template: "Failure",
    placeholders: [],
  },
  "observability.status.label": {
    template: "Part 0.3",
    placeholders: [],
  },
  "observability.status.value": {
    template: "Privacy-first observability",
    placeholders: [],
  },
  "observability.eyebrow": {
    template: "Signal workshop",
    placeholders: [],
  },
  "observability.title": {
    template: "Useful evidence. Less exposure.",
    placeholders: [],
  },
  "observability.description": {
    template:
      "Logs keep the operational facts needed to investigate a problem while sensitive values are removed before they reach any destination.",
    placeholders: [],
  },
  "observability.notice": {
    template:
      "Local deterministic previews only. Nothing was transmitted to Telegram or Sentry.",
    placeholders: [],
  },
  "observability.debug.title": {
    template: "Structured debug event",
    placeholders: [],
  },
  "observability.debug.label": {
    template: "JSONL / local",
    placeholders: [],
  },
  "observability.debug.description": {
    template:
      "One machine-readable JSONL record with UTC time and request/trace correlation.",
    placeholders: [],
  },
  "observability.alert.title": {
    template: "Telegram critical alert",
    placeholders: [],
  },
  "observability.alert.label": {
    template: "Telegram / preview",
    placeholders: [],
  },
  "observability.alert.description": {
    template:
      "A short operator signal with safe identifiers—never the full log or stack trace.",
    placeholders: [],
  },
  "observability.controls.title": {
    template: "Safety controls active",
    placeholders: [],
  },
  "observability.controls.redaction": {
    template: "Recursive redaction",
    placeholders: [],
  },
  "observability.controls.correlation": {
    template: "Request + trace correlation",
    placeholders: [],
  },
  "observability.controls.providers": {
    template: "External providers off",
    placeholders: [],
  },
  "observability.next": {
    template:
      "Durable live storage and immutable daily Supabase archives begin after the database security foundation.",
    placeholders: [],
  },
  "validation.phone.invalid": {
    template: "Enter a valid phone number, including the area or country code.",
    placeholders: [],
  },
  "confirmation.order.submit": {
    template: "Confirm this order for {customerName}?",
    placeholders: ["customerName"],
  },
  "confirmation.order.detail": {
    template: "Check the items, delivery details and total before confirming.",
    placeholders: [],
  },
  "confirmation.order.action": {
    template: "Confirm order",
    placeholders: [],
  },
  "success.order.ready": {
    template: "Order {orderReference} is ready for review.",
    placeholders: ["orderReference"],
  },
  "success.order.detail": {
    template: "The merchant can check the details before accepting it.",
    placeholders: [],
  },
  "error.unexpected.title": {
    template: "We couldn’t load this page",
    placeholders: [],
  },
  "error.unexpected.message": {
    template:
      "Something went wrong. Try again, or share the reference below if you need support.",
    placeholders: [],
  },
  "error.reference": {
    template: "Reference: {referenceId}",
    placeholders: ["referenceId"],
  },
  "error.retry": {
    template: "Try again",
    placeholders: [],
  },
} as const;

export type MessageKey = keyof typeof catalogue;

type PlaceholderFor<Key extends MessageKey> =
  (typeof catalogue)[Key]["placeholders"][number];

export type MessageParametersFor<Key extends MessageKey> = [
  PlaceholderFor<Key>,
] extends [never]
  ? never
  : { [Parameter in PlaceholderFor<Key>]: string | number };

type FormatArguments<Key extends MessageKey> = [
  MessageParametersFor<Key>,
] extends [never]
  ? []
  : [parameters: MessageParametersFor<Key>];

const parameterError =
  "Message parameters do not match the catalogue definition";

export function formatMessage<Key extends MessageKey>(
  key: Key,
  ...args: FormatArguments<Key>
): string {
  return formatMessageWithParameters(
    key,
    args[0] as Record<string, unknown> | undefined,
  );
}

export function formatMessageWithParameters(
  key: MessageKey,
  parameters?: Record<string, unknown>,
): string {
  const definition = catalogue[key];
  const expected = new Set<string>(definition.placeholders);
  const supplied = Object.keys(parameters ?? {});

  if (
    supplied.length !== expected.size ||
    supplied.some((name) => !expected.has(name))
  ) {
    throw new Error(parameterError);
  }

  for (const name of expected) {
    const value = parameters?.[name];
    if (typeof value !== "string" && typeof value !== "number") {
      throw new Error(parameterError);
    }
  }

  return definition.template.replaceAll(
    /\{([A-Za-z][A-Za-z0-9]*)\}/gu,
    (_, name: string) => String(parameters?.[name]),
  );
}
