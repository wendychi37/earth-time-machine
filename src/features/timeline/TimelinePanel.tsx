import { Timeline } from "./Timeline";
import { YearDisplay } from "./YearDisplay";
import { YearInput } from "./YearInput";
import { YearStepper } from "./YearStepper";

/** 地球下方的時間軸：目前年份、微調、輸入與拖曳軸。 */
export function TimelinePanel() {
  return (
    <section className="px-4 pt-1 sm:bg-panel sm:px-5 sm:pt-3">
      {/* 手機上方標題列已經有年份與時代，這裡只留微調與輸入，不重複 */}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 max-sm:flex-nowrap max-sm:gap-x-2">
        <div className="max-sm:hidden">
          <YearDisplay />
        </div>
        <YearStepper />
        <div className="min-w-0 max-sm:flex-1 sm:w-auto">
          <YearInput />
        </div>
      </div>
      <Timeline />
    </section>
  );
}
