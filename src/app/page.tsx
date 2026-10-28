import { AppHeader } from "@/components/AppHeader";
import { BoundaryGapBanner } from "@/features/boundaries/BoundaryStatus";
import { GlobeView } from "@/features/globe/GlobeView";
import { LayerToggles } from "@/features/globe/LayerToggles";
import { SameEraPanel } from "@/features/chronology/SameEraPanel";
import { EventList } from "@/features/events/EventList";
import { EraCard } from "@/features/eras/EraCard";
import { SelectedEventCard } from "@/features/events/SelectedEventCard";
import { SelectionPanel } from "@/features/globe/SelectionPanel";
import { TimelinePanel } from "@/features/timeline/TimelinePanel";

export default function Home() {
  return (
    <main className="relative h-dvh w-full">
      <div className="absolute inset-0">
        <GlobeView />
      </div>
      <AppHeader />
      <div className="pointer-events-none absolute right-0 top-0 z-10 p-4 sm:p-6">
        <div className="pointer-events-auto flex flex-col items-end gap-2">
          <LayerToggles />
          <EventList />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-24 z-10 flex justify-center px-4 sm:top-6">
        <div className="pointer-events-auto">
          <BoundaryGapBanner />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col gap-3 p-3 sm:p-6">
        {/* 手機：選取資訊在時間軸上方；桌面：固定在右上角 */}
        <div className="pointer-events-auto sm:fixed sm:right-6 sm:top-24">
          <SelectionPanel />
          <SelectedEventCard />
          <EraCard />
        </div>
        {/* 手機：在時間軸上方；桌面：固定在左側 */}
        <div className="flex flex-col sm:fixed sm:bottom-56 sm:left-6 sm:top-28 sm:w-80 lg:w-96">
          <SameEraPanel />
        </div>
        <div className="pointer-events-auto mx-auto w-full max-w-5xl">
          <TimelinePanel />
        </div>
      </div>
    </main>
  );
}
