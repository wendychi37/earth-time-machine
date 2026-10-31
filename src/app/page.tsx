import { BottomSheet, TimelineSlot } from "@/components/BottomSheet";
import { ControlPanel } from "@/components/ControlPanel";
import { GlobeOverlay } from "@/components/GlobeOverlay";
import { PanelTabs } from "@/components/PanelTabs";
import { EventList } from "@/features/events/EventList";
import { GlobeView } from "@/features/globe/GlobeView";
import { TimelineSwitch } from "@/features/plates/TimelineSwitch";
import { TimelinePanel } from "@/features/timeline/TimelinePanel";
import { messages } from "@/messages/zh-Hant";

/**
 * 版面（參考「時區小教室」）：地球有自己的視窗，只在邊角放標題、年份與底圖小按鈕。
 * 手機：地球 → 可收起的下方面板 → 最下方的分頁列（年份／同一時期／圖層／介紹）。
 * 桌面：左邊地球、下方時間軸；右邊一欄是分頁與面板。
 */
export default function Home() {
  return (
    <main className="flex h-dvh w-full flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_22rem] sm:grid-rows-[auto_minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,1fr)_26rem]">
      <section aria-label={messages.panel.globe} className="relative min-h-0 flex-1 sm:col-start-1 sm:row-span-2 sm:row-start-1">
        <GlobeView />
        <GlobeOverlay />
        <EventList />
      </section>
      <BottomSheet>
        <TimelineSlot>
          <TimelineSwitch>
            <TimelinePanel />
          </TimelineSwitch>
        </TimelineSlot>
        <ControlPanel />
      </BottomSheet>
      <PanelTabs />
    </main>
  );
}
