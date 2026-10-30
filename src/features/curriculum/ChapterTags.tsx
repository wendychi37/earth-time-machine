"use client";

import { Html } from "@react-three/drei";
import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import { useFacingCamera } from "@/features/events/EventMarkers";
import { COURSES, chaptersAt, type Chapter, type Course } from "@/lib/curriculum/courses";
import { TRACK_COLORS } from "@/lib/curriculum/tracks";
import { latLonToVector3 } from "@/lib/geo/sphere";
import { messages } from "@/messages/zh-Hant";
import { useAppStore } from "@/store/useAppStore";

/** 標籤立在地面上方多高（地球半徑 = 1）；四門課高度不同，同一個地方也不會疊在一起 */
const HEIGHT: Record<Course["id"], number> = { tw: 0.05, cn: 0.09, ea: 0.13, world: 0.07 };
const UP = new Vector3(0, 1, 0);

/**
 * 地球上的四門課章節標籤：平常不顯示，在「重點」分頁或時間軸點了某一章，那一章的標籤才立在代表地點上方，
 * 跟著地球轉；時間移出這一章就收起。點標籤打開「重點」分頁。
 */
export function ChapterTags() {
  const year = useAppStore((s) => s.year);
  const shown = useAppStore((s) => s.shownChapter);
  const tags = COURSES.flatMap((course) =>
    chaptersAt(course, year)
      .filter((chapter) => shown?.track === course.id && shown.n === chapter.n)
      .map((chapter) => ({ course, chapter })),
  );
  return (
    <group name={messages.curriculum.tagsLabel}>
      {tags.map(({ course, chapter }, i) => (
        <ChapterTag key={`${course.id}-${chapter.n}`} course={course} chapter={chapter} lift={i % 2 ? 0.02 : 0} />
      ))}
    </group>
  );
}

function ChapterTag({ course, chapter, lift }: { course: Course; chapter: Chapter; lift: number }) {
  const focusOn = useAppStore((s) => s.focusOn);
  const height = HEIGHT[course.id] + lift;
  const color = TRACK_COLORS[course.id];
  const { base, top, quaternion } = useMemo(() => {
    const base = latLonToVector3(chapter.lat, chapter.lon, 1);
    const top = base.clone().multiplyScalar(1 + height);
    return { base, top, quaternion: new Quaternion().setFromUnitVectors(UP, base.clone().normalize()) };
  }, [chapter.lat, chapter.lon, height]);
  const mid = base.clone().lerp(top, 0.5);
  const topArr = top.toArray() as [number, number, number];
  const labelRef = useFacingCamera(topArr);
  const t = messages.curriculum;
  return (
    <group>
      <mesh position={mid} quaternion={quaternion} raycast={() => null}>
        <cylinderGeometry args={[0.0018, 0.0018, height, 6]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={base} raycast={() => null}>
        <sphereGeometry args={[0.006, 12, 8]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <group position={topArr}>
        <Html center zIndexRange={[25, 21]} style={{ pointerEvents: "none" }}>
          {/* 標籤再往上抬一截（下方一條細線指回地面），正對著看時也不會蓋住地點上的 ★ 重點事件 */}
          <div ref={labelRef} className="pointer-events-none flex -translate-y-1/2 flex-col items-center">
            <button
              type="button"
              onClick={() => {
                // 已經在「重點」分頁時不要收起面板
                useAppStore.setState({ panelTab: "focus", panelOpen: true });
                focusOn(chapter);
              }}
              title={`${t.chapterLabel(course.name, chapter.n)}【${chapter.title}】`}
              className="pointer-events-auto flex max-w-44 items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-bold leading-tight text-white shadow-lg ring-1 ring-white/40 hover:ring-white"
              style={{ backgroundColor: color }}
              data-testid="chapter-tag"
            >
              <span>{t.chapterLabel(course.name, chapter.n)}</span>
              <span className="truncate font-medium opacity-90">{chapter.title}</span>
            </button>
            <span className="h-4 w-px" style={{ backgroundColor: color }} aria-hidden />
          </div>
        </Html>
      </group>
    </group>
  );
}
