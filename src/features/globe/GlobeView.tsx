"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";
import { messages } from "@/messages/zh-Hant";
import { useBoundariesAtYear } from "@/features/boundaries/useBoundariesAtYear";
import { useEventsNearYear } from "@/features/events/useEvents";
import { isWebGLAvailable } from "./webgl";
import { useModernCountries } from "./useModernCountries";

const GlobeCanvas = dynamic(() => import("./GlobeCanvas"), {
  ssr: false,
  loading: () => <GlobeStatus text={messages.globe.loading} />,
});

function GlobeStatus({ text }: { text: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted" role="status">
      {text}
    </div>
  );
}

const noopSubscribe = () => () => {};

/** 3D 地球的進入點：只在瀏覽器端載入 WebGL，並處理不支援的情況。 */
export function GlobeView() {
  const webgl = useSyncExternalStore(noopSubscribe, isWebGLAvailable, () => null);
  const modernCountries = useModernCountries();
  const { displayed } = useBoundariesAtYear();
  const events = useEventsNearYear();

  if (webgl === null) return <GlobeStatus text={messages.globe.loading} />;
  if (!webgl) return <GlobeStatus text={messages.globe.webglUnsupported} />;
  return <GlobeCanvas modernCountries={modernCountries} boundaries={displayed?.features ?? null} events={events} />;
}
