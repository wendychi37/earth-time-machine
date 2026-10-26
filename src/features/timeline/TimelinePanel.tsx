import { BoundaryLegendBar } from "@/features/boundaries/BoundaryStatus";
import { Timeline } from "./Timeline";
import { YearDisplay } from "./YearDisplay";
import { YearInput } from "./YearInput";
import { YearStepper } from "./YearStepper";

/** 畫面底部的時間軸面板：目前年份、輸入、微調與拖曳軸。 */
export function TimelinePanel() {
  return (
    <section className="rounded-xl border border-panel-border bg-panel px-3 pt-3 backdrop-blur sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <YearDisplay />
        <div className="flex flex-wrap items-center gap-2">
          <YearStepper />
          <YearInput />
        </div>
      </div>
      <Timeline />
      <div className="min-h-[4.75rem] sm:min-h-[3.25rem] border-t border-panel-border py-2">
        <BoundaryLegendBar />
      </div>
    </section>
  );
}
