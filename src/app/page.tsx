import { AppHeader } from "@/components/AppHeader";
import { BoundaryGapBanner } from "@/features/boundaries/BoundaryStatus";
import { BaseMapToggle } from "@/features/globe/BaseMapToggle";
import { GlobeView } from "@/features/globe/GlobeView";
import { LayerToggles } from "@/features/globe/LayerToggles";
import { EventList } from "@/features/events/EventList";
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
        <div className="pointer-events-auto flex flex-col items-end gap-2" data-label-avoid>
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
        </div>
        {/* 像 Google 地圖左下角的「地圖／地形」切換 */}
        <div className="pointer-events-auto self-start" data-label-avoid>
          <BaseMapToggle />
        </div>
        <div className="pointer-events-auto mx-auto w-full max-w-5xl" data-label-avoid>
          <TimelinePanel />
        </div>
      </div>
    </main>
  );
}
