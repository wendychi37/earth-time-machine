import { AppHeader } from "@/components/AppHeader";
import { BoundaryGapBanner } from "@/features/boundaries/BoundaryStatus";
import { BaseMapToggle } from "@/features/globe/BaseMapToggle";
import { GlobeView } from "@/features/globe/GlobeView";
import { LayerToggles } from "@/features/globe/LayerToggles";
import { CultureCard } from "@/features/archaeology/CultureCard";
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
        {/* 手機：選取資訊在時間軸上方；桌面：固定在右側「圖層」面板下方，避免蓋住開關 */}
        <div className="era-shift-cards pointer-events-auto sm:fixed sm:z-20 sm:right-6 sm:top-60" data-label-avoid>
          <SelectionPanel />
          <SelectedEventCard />
          <CultureCard />
          <EraCard />
        </div>
        {/* 手機：在時間軸上方；桌面：固定在左側 */}
        <div className="era-shift-left flex flex-col sm:fixed sm:bottom-56 sm:left-6 sm:top-28 sm:w-80 lg:w-96" data-label-avoid>
          <SameEraPanel />
        </div>
        {/* 像 Google 地圖的「地圖／地形」切換：手機在左下，桌面在右下（左側是「同一時期的世界」） */}
        <div className="pointer-events-auto self-start sm:self-end" data-label-avoid>
          <BaseMapToggle />
        </div>
        <div className="pointer-events-auto mx-auto w-full max-w-5xl" data-label-avoid>
          <TimelinePanel />
        </div>
      </div>
    </main>
  );
}
