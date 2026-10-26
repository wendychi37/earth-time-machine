import { describe, expect, it } from "vitest";
import { messages } from "@/messages/zh-Hant";

describe("messages", () => {
  it("提供繁體中文站名", () => {
    expect(messages.app.title).toBe("地球時光機");
  });
});
