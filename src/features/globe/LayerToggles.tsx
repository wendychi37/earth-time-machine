"use client";

import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

export function LayerToggles() {
  const layers = useAppStore((s) => s.layers);
  const toggleLayer = useAppStore((s) => s.toggleLayer);
  const items = [
    { key: "curriculum", label: messages.layers.curriculum },
    { key: "labels", label: messages.layers.labels },
    { key: "historical", label: messages.layers.historical },
    { key: "eras", label: messages.layers.eras },
    { key: "cultures", label: messages.layers.cultures },
    { key: "events", label: messages.layers.events },
  ] as const;

  return (
    <fieldset className="grid grid-cols-2 gap-x-3 text-sm sm:grid-cols-1">
      <legend className="sr-only">{messages.layers.title}</legend>
      <p aria-hidden className="col-span-full mb-1 text-xs font-semibold text-muted">
        {messages.layers.title}
      </p>
      {items.map(({ key, label }) => (
        <label key={key} className="flex cursor-pointer items-center gap-2 py-1.5 leading-snug">
          <input type="checkbox" className="size-5 shrink-0 accent-accent" checked={layers[key]} onChange={() => toggleLayer(key)} />
          {label}
        </label>
      ))}
    </fieldset>
  );
}
