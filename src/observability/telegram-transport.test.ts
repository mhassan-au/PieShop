import { describe, expect, it, vi } from "vitest";

import { createTelegramTransport } from "./telegram-transport";

describe("Telegram HTTP transport", () => {
  it("uses a bounded JSON sendMessage request", async () => {
    const fetchImplementation = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ ok: true, result: {} }),
    });
    const transport = createTelegramTransport({
      botToken: "synthetic-token",
      chatId: "synthetic-chat",
      timeoutMs: 1_000,
      fetchImplementation,
    });

    await expect(transport.send("safe alert")).resolves.toBeUndefined();
    expect(fetchImplementation).toHaveBeenCalledWith(
      "https://api.telegram.org/botsynthetic-token/sendMessage",
      expect.objectContaining({
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: "synthetic-chat",
          text: "safe alert",
          disable_web_page_preview: true,
        }),
      }),
    );
  });

  it("throws only within the transport boundary for a failed API response", async () => {
    const transport = createTelegramTransport({
      botToken: "synthetic-token",
      chatId: "synthetic-chat",
      fetchImplementation: vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ ok: false }),
      }),
    });

    await expect(transport.send("safe alert")).rejects.toThrow(
      "Telegram alert delivery failed",
    );
  });
});
