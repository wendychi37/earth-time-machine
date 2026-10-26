import { AppHeader } from "@/components/AppHeader";
import { GlobeView } from "@/features/globe/GlobeView";
import { LayerToggles } from "@/features/globe/LayerToggles";
import { SelectionPanel } from "@/features/globe/SelectionPanel";

export default function Home() {
  return (
    <main className="relative h-dvh w-full">
      <div className="absolute inset-0">
        <GlobeView />
      </div>
      <AppHeader />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-col items-stretch gap-3 p-4 sm:inset-x-auto sm:right-0 sm:top-20 sm:bottom-auto sm:items-end sm:p-6">
        <div className="pointer-events-auto self-end">
          <LayerToggles />
        </div>
        <div className="pointer-events-auto">
          <SelectionPanel />
        </div>
      </div>
    </main>
  );
}
