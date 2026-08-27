import type { CriticalAlertTransport } from "./critical-alerts";

type TelegramTransportOptions = {
  botToken: string;
  chatId: string;
  timeoutMs?: number;
  fetchImplementation?: typeof fetch;
};

export function createTelegramTransport(
  options: TelegramTransportOptions,
): CriticalAlertTransport {
  const fetchImplementation = options.fetchImplementation ?? fetch;
  const timeoutMs = options.timeoutMs ?? 5_000;

  return {
    async send(message: string): Promise<void> {
      const response = await fetchImplementation(
        `https://api.telegram.org/bot${options.botToken}/sendMessage`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            chat_id: options.chatId,
            text: message.slice(0, 4096),
            disable_web_page_preview: true,
          }),
          signal: AbortSignal.timeout(timeoutMs),
        },
      );

      if (!response.ok) throw new Error("Telegram alert delivery failed");
      const result: unknown = await response.json();
      if (
        typeof result !== "object" ||
        result === null ||
        !("ok" in result) ||
        result.ok !== true
      ) {
        throw new Error("Telegram alert delivery failed");
      }
    },
  };
}
