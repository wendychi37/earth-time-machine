"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { messages } from "@/messages/zh-Hant";
import { useBoundariesAtYear } from "@/features/boundaries/useBoundariesAtYear";
import { useEventsNearYear } from "@/features/events/useEvents";
import { isWebGLAvailable } from "./webgl";
import { GlobeErrorBoundary } from "./GlobeErrorBoundary";

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
const CONTEXT_RESTORE_DELAY_MS = 800;
/** 連續重試幾次都失敗就停下來，請使用者重新整理，避免無限循環 */
const MAX_RESTORE_ATTEMPTS = 5;

/** 3D 地球的進入點：只在瀏覽器端載入 WebGL，並處理不支援的情況。 */
export function GlobeView() {
  const webgl = useSyncExternalStore(noopSubscribe, isWebGLAvailable, () => null);
  const { displayed } = useBoundariesAtYear();
  const events = useEventsNearYear();
  // 畫布被回收時換一個 key，讓 React 重新建立整個 3D 畫面
  const [canvasKey, setCanvasKey] = useState(0);
  const [lost, setLost] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const handleContextLost = useCallback(() => {
    setLost(true);
    setAttempts((n) => n + 1);
  }, []);
  // 畫面正常建立後，重試次數歸零
  const handleCreated = useCallback(() => setAttempts(0), []);

  useEffect(() => {
    if (!lost) return;
    const timer = setTimeout(() => {
      setCanvasKey((k) => k + 1);
      setLost(false);
    }, CONTEXT_RESTORE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [lost]);

  if (webgl === null) return <GlobeStatus text={messages.globe.loading} />;
  if (!webgl) return <GlobeStatus text={messages.globe.webglUnsupported} />;
  if (attempts > MAX_RESTORE_ATTEMPTS) return <GlobeStatus text={messages.globe.contextFailed} />;
  if (lost) return <GlobeStatus text={messages.globe.contextLost} />;
  return (
    <GlobeErrorBoundary key={canvasKey} onError={handleContextLost}>
      <GlobeCanvas
        boundaries={displayed?.features ?? null}
        events={events}
        onContextLost={handleContextLost}
        onCreated={handleCreated}
      />
    </GlobeErrorBoundary>
  );
}
