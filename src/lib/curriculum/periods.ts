import { bc } from "@/lib/eras/regions";
import { PHASE1_MAX_YEAR, PHASE1_MIN_YEAR } from "@/lib/time/constants";
import type { AstronomicalYear } from "@/types/time";

/**
 * 「課綱重點」的骨架：〈世界史列國歷史發展分合表〉的大時代與每個時代的「基本架構」。
 * 時代名稱與架構條目照講義原文（只把簡體或大陸用語換成臺灣用語）；
 * 講義把「近代世界」再分成 19、20 世紀兩欄，這裡也分成兩段。
 */
export interface CurriculumTheme {
  title: string;
  /** 沒有對應重點事件的架構：點了以後跳到這個年份與地點 */
  at?: { year: AstronomicalYear; lat: number; lon: number };
}

export interface CurriculumPeriod {
  id: string;
  name: string;
  /** 同一個時代再細分時的副標（例如 19 世紀） */
  sub?: string;
  start: AstronomicalYear;
  /** 不含：下一個時代從這一年開始 */
  end: AstronomicalYear;
  color: string;
  themes: CurriculumTheme[];
}

export const CURRICULUM_SOURCE = {
  title: "〈世界史列國歷史發展分合表〉、〈臺灣史、中國史、世界史對照表〉",
  note: "Wendy 提供的教學講義",
};

export const PERIODS: CurriculumPeriod[] = [
  {
    id: "ancient",
    name: "古代文明的發展",
    start: PHASE1_MIN_YEAR,
    end: bc(1000),
    color: "#8a6636",
    themes: [
      { title: "新石器革命", at: { year: PHASE1_MIN_YEAR, lat: 33, lon: 44 } },
      { title: "都市革命" },
      { title: "神話思維" },
    ],
  },
  {
    id: "empires",
    name: "大帝國的建立與哲學突破",
    start: bc(1000),
    end: 476,
    color: "#7d5c93",
    themes: [{ title: "歐亞各大帝國的建立" }, { title: "思想史上的哲學突破：希臘、中國、猶太、印度" }, { title: "佛教與基督教的創建與傳播" }],
  },
  {
    id: "early-medieval",
    name: "中古前期的三大文明",
    start: 476,
    end: 1000,
    color: "#4b7f5c",
    themes: [
      { title: "歐洲日耳曼蠻族入侵" },
      { title: "中古歐洲進入封建社會" },
      { title: "日耳曼人及斯拉夫人的基督教化" },
      { title: "佛教在亞洲的傳播" },
      { title: "伊斯蘭教的建立與擴展" },
      { title: "西方三大勢力：西歐封建、東歐拜占庭、伊斯蘭帝國" },
    ],
  },
  {
    id: "medieval-revival",
    name: "中古復興",
    start: 1000,
    end: 1300,
    color: "#587533",
    themes: [
      { title: "中古歐洲的復興" },
      { title: "十字軍東征" },
      { title: "歐洲商業興起" },
      { title: "自由城市與大學的建立" },
      { title: "中產階級的出現：行會" },
      { title: "蒙古西征" },
    ],
  },
  {
    id: "medieval-decline",
    name: "中古衰退",
    start: 1300,
    end: 1500,
    color: "#87574a",
    themes: [
      { title: "中古歐洲的衰弱", at: { year: 1347, lat: 47, lon: 8 } },
      { title: "英法百年戰爭" },
      { title: "黑死病的肆虐" },
      { title: "教會威望的下降：巴比倫之囚與西方教會大分裂" },
      { title: "文藝復興" },
      { title: "君主專制國家的成形" },
      { title: "伊斯蘭教帝國的建立" },
      { title: "地理大發現" },
    ],
  },
  {
    id: "early-modern",
    name: "近代早期世界",
    start: 1500,
    end: 1800,
    color: "#3b6e8f",
    themes: [
      { title: "海外殖民的展開" },
      { title: "大西洋國家興起" },
      { title: "俄國拓展西伯利亞" },
      { title: "哈布斯堡家族之盛衰（奧、西）" },
      { title: "宗教改革" },
      { title: "科學革命→啟蒙運動" },
      { title: "雙元革命：民主革命與工業革命" },
    ],
  },
  {
    id: "modern-19",
    name: "近代世界",
    sub: "19 世紀",
    start: 1800,
    end: 1900,
    color: "#a35a3a",
    themes: [
      { title: "保守主義與自由主義的對抗" },
      { title: "中南美洲獨立" },
      { title: "德、義的統一" },
      { title: "日本明治維新" },
      { title: "初期工業社會與社會主義" },
      { title: "啟蒙與反啟蒙", at: { year: 1830, lat: 50.5, lon: 10 } },
      { title: "新帝國主義" },
      { title: "巴爾幹風雲" },
      { title: "非洲大獵" },
    ],
  },
  {
    id: "modern-20",
    name: "近代世界",
    sub: "20 世紀",
    start: 1900,
    end: PHASE1_MAX_YEAR + 1,
    color: "#a0434a",
    themes: [
      { title: "兩次世界大戰" },
      { title: "蘇俄政權與第三國際" },
      { title: "美國孤立主義與經濟大恐慌" },
      { title: "民族自決和反殖民主義" },
      { title: "冷戰（1945–1991）" },
      { title: "共產政權的瓦解" },
      { title: "新科技的進步與問題" },
    ],
  },
];

export function periodAt(year: AstronomicalYear): CurriculumPeriod {
  return PERIODS.find((p) => year >= p.start && year < p.end) ?? (year < PERIODS[0].start ? PERIODS[0] : PERIODS[PERIODS.length - 1]);
}

export const periodLabel = (p: CurriculumPeriod) => (p.sub ? `${p.name}（${p.sub}）` : p.name);
