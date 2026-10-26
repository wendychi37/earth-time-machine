"use client";

import { useId, useState, type FormEvent } from "react";
import { PHASE1_MAX_YEAR, PHASE1_MIN_YEAR } from "@/lib/time/constants";
import { parseYearInput } from "@/lib/time/parse";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/** 直接輸入年份，支援西元前／西元的多種寫法。 */
export function YearInput() {
  const setYear = useAppStore((s) => s.setYear);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputId = useId();
  const errorId = useId();
  const t = messages.timeline;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const result = parseYearInput(text);
    if (!result.ok) return setError(result.error);
    if (result.year < PHASE1_MIN_YEAR || result.year > PHASE1_MAX_YEAR) return setError(t.outOfRange);
    setError(null);
    setYear(result.year);
    setText("");
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className="sr-only">
          {t.inputLabel}
        </label>
        <input
          id={inputId}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.inputPlaceholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          inputMode="text"
          className="w-40 rounded-md border border-panel-border bg-black/30 px-2 py-1.5 text-sm placeholder:text-muted focus:border-accent focus:outline-none sm:w-48"
          data-testid="year-input"
        />
        <button
          type="submit"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-black hover:brightness-110"
        >
          {t.go}
        </button>
      </div>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-300" data-testid="year-error">
          {error}
        </p>
      )}
    </form>
  );
}
