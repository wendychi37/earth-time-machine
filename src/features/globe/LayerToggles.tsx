"use client";

import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

export function LayerToggles() {
  const modernBorders = useAppStore((s) => s.layers.modernBorders);
  const toggleLayer = useAppStore((s) => s.toggleLayer);

  return (
    <fieldset className="rounded-lg border border-panel-border bg-panel px-3 py-2 text-sm backdrop-blur">
      <legend className="sr-only">{messages.layers.title}</legend>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          className="size-4 accent-accent"
          checked={modernBorders}
          onChange={() => toggleLayer("modernBorders")}
        />
        {messages.layers.modernBorders}
      </label>
    </fieldset>
  );
}
