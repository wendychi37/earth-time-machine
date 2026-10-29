import { bc } from "@/lib/eras/regions";
import type { AstronomicalYear } from "@/types/time";

/**
 * 〈臺灣史、中國史、世界史對照表〉的臺灣史、中國史兩欄：每個年份屬於哪個時期。
 * 分期年代照講義（例如清朝治臺從 1684 年設臺灣府算起）。
 */
export interface Stage {
  name: string;
  start: AstronomicalYear;
  /** 不含 */
  end: AstronomicalYear;
}

export const TAIWAN_STAGES: Stage[] = [
  { name: "舊石器時代（長濱文化）", start: -50000, end: bc(5000) },
  { name: "新石器時代（大坌坑、卑南文化）", start: bc(5000), end: 1 },
  { name: "金屬器時代（十三行文化）", start: 1, end: 1624 },
  { name: "荷西時期", start: 1624, end: 1662 },
  { name: "鄭氏時期", start: 1662, end: 1684 },
  { name: "清朝治臺", start: 1684, end: 1895 },
  { name: "日治時期", start: 1895, end: 1945 },
  { name: "中華民國在臺灣", start: 1945, end: 10000 },
];

export const CHINA_STAGES: Stage[] = [
  { name: "新石器時代（龍山文化）", start: -50000, end: bc(1600) },
  { name: "商", start: bc(1600), end: bc(1046) },
  { name: "西周", start: bc(1046), end: bc(770) },
  { name: "東周・春秋", start: bc(770), end: bc(403) },
  { name: "東周・戰國", start: bc(403), end: bc(221) },
  { name: "秦", start: bc(221), end: bc(202) },
  { name: "西漢", start: bc(202), end: 9 },
  { name: "新莽", start: 9, end: 25 },
  { name: "東漢", start: 25, end: 220 },
  { name: "三國", start: 220, end: 265 },
  { name: "西晉", start: 265, end: 317 },
  { name: "東晉、五胡十六國", start: 317, end: 420 },
  { name: "南北朝", start: 420, end: 589 },
  { name: "隋", start: 589, end: 618 },
  { name: "唐", start: 618, end: 907 },
  { name: "五代十國", start: 907, end: 960 },
  { name: "北宋", start: 960, end: 1127 },
  { name: "南宋", start: 1127, end: 1279 },
  { name: "元", start: 1279, end: 1368 },
  { name: "明", start: 1368, end: 1644 },
  { name: "清", start: 1644, end: 1912 },
  { name: "中華民國", start: 1912, end: 1949 },
  { name: "兩岸分治（中華人民共和國）", start: 1949, end: 10000 },
];

export const stageAt = (stages: Stage[], year: AstronomicalYear) => stages.find((s) => year >= s.start && year < s.end) ?? null;
