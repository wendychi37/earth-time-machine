"use client";

import { CATEGORIES, type ShownCategory } from "@/lib/events/categories";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/**
 * 事件分類的開關：一排彩色膠囊，點一下顯示／隱藏這一類（顏色和地球上的事件點、時間軸密度條相同）。
 * 「全部」恢復顯示每一類。
 */
export function CategoryFilter() {
  const t = messages.categories;
  const filter = useAppStore((s) => s.categoryFilter);
  const setFilter = useAppStore((s) => s.setCategoryFilter);
  const isOn = (id: ShownCategory) => !filter || filter.includes(id);
  const toggle = (id: ShownCategory) => {
    const current = filter ?? CATEGORIES.map((c) => c.id);
    const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
    setFilter(next.length === CATEGORIES.length ? null : next);
  };

  return (
    <fieldset data-testid="category-filter">
      <legend className="mb-1.5 flex w-full items-baseline justify-between text-xs font-semibold text-muted">
        <span>{t.title}</span>
        <button
          type="button"
          onClick={() => setFilter(null)}
          disabled={!filter}
          className="rounded px-1 font-normal text-accent disabled:opacity-0"
        >
          {t.all}
        </button>
      </legend>
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map(({ id, color }) => {
          const on = isOn(id);
          return (
            <button
              key={id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(id)}
              data-testid={`category-${id}`}
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[13px] leading-tight transition ${
                on ? "border-white/20 bg-white/10 text-foreground" : "border-white/10 text-muted line-through decoration-white/30"
              }`}
            >
              <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: on ? color : "transparent", boxShadow: `inset 0 0 0 1.5px ${color}` }} aria-hidden />
              {t.names[id]}
            </button>
          );
        })}
      </div>
      <p className="mt-1.5 text-[11px] text-muted">{t.hint}</p>
    </fieldset>
  );
}
