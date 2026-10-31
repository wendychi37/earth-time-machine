"use client";

import { CATEGORIES, type ShownCategory } from "@/lib/events/categories";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/**
 * 地球上方一排可以左右滑的分類膠囊（打開「歷史大事」圖層時才出現）。
 * 點一下顯示／隱藏這一類；和「圖層」分頁裡的分類開關是同一組設定。
 */
export function CategoryChips() {
  const t = messages.categories;
  const show = useAppStore((s) => s.layers.events);
  const filter = useAppStore((s) => s.categoryFilter);
  const setFilter = useAppStore((s) => s.setCategoryFilter);
  if (!show) return null;
  const isOn = (id: ShownCategory) => !filter || filter.includes(id);
  const toggle = (id: ShownCategory) => {
    const current = filter ?? CATEGORIES.map((c) => c.id);
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    setFilter(next.length === CATEGORIES.length ? null : next);
  };

  return (
    <div
      role="group"
      aria-label={t.title}
      className="pointer-events-auto flex gap-1.5 overflow-x-auto px-3 py-2 [scrollbar-width:none] sm:px-4"
      data-label-avoid
      data-testid="category-chips"
    >
      {CATEGORIES.map(({ id, color }) => {
        const on = isOn(id);
        return (
          <button
            key={id}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(id)}
            className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] bg-navy/80 px-3 text-[13px] backdrop-blur ${
              on ? "text-on-navy" : "text-on-navy/50 line-through"
            }`}
            style={{ borderColor: on ? color : "rgb(243 232 210 / 0.25)" }}
          >
            <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: on ? color : "transparent", boxShadow: `inset 0 0 0 1.5px ${color}` }} aria-hidden />
            {t.names[id]}
          </button>
        );
      })}
    </div>
  );
}
