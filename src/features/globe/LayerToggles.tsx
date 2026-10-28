"use client";

import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

export function LayerToggles() {
  const layers = useAppStore((s) => s.layers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);
  const items = [
    { key: "labels", label: messages.layers.labels },
    { key: "historical", label: messages.layers.historical },
    { key: "eras", label: messages.layers.eras },
    { key: "cultures", label: messages.layers.cultures },
    { key: "events", label: messages.layers.events },
  ] as const;

  return (
    <fieldset className="rounded-lg border border-panel-border bg-panel px-3 py-2 text-sm backdrop-blur">
      <legend className="sr-only">{messages.layers.title}</legend>
      <p aria-hidden className="mb-0.5 text-xs font-semibold text-muted">
        {messages.layers.title}
      </p>
      {items.map(({ key, label }) => (
        <label key={key} className="flex cursor-pointer items-center gap-2 py-0.5">
          <input type="checkbox" className="size-4 accent-accent" checked={layers[key]} onChange={() => toggleLayer(key)} />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
