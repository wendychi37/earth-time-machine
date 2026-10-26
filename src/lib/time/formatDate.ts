import { DatePrecision, type CalendarSystem, type HistoricalDate, type HistoricalPeriod } from "@/types/time";
import { formatYear } from "./format";

const CALENDAR_LABELS: Record<CalendarSystem, string> = {
  gregorian: "格里曆",
  julian: "儒略曆",
  chinese_lunisolar: "農曆",
  islamic: "伊斯蘭曆",
  hebrew: "希伯來曆",
  other: "其他曆法",
};

export function calendarLabel(calendar: CalendarSystem): string {
  return CALENDAR_LABELS[calendar];
}

/**
 * 以繁體中文顯示一個可能不精確的日期。
 * 例：「西元 1453 年 5 月 29 日（儒略曆）」「約西元前 1755 年至西元前 1750 年」
 */
export function formatHistoricalDate(date: HistoricalDate): string {
  const prefix = { exact: "", circa: "約", not_before: "不早於", not_after: "不晚於", disputed: "存疑：" }[date.qualifier];
  let text: string;
  if (date.earliest !== date.latest) {
    text = `${formatYear(date.earliest)}至${formatYear(date.latest)}`;
  } else {
    text = formatYear(date.earliest);
    if (date.precision >= DatePrecision.Month && date.month) {
      text = text.replace(/ 年$/, ` 年 ${date.month} 月`);
      if (date.precision >= DatePrecision.Day && date.day) text += ` ${date.day} 日`;
    }
  }
  // 只有精確到月、日時，曆法差異才會影響日期，需要註明
  const calendar = date.precision >= DatePrecision.Month && date.calendar !== "gregorian" ? `（${calendarLabel(date.calendar)}）` : "";
  return `${prefix}${text}${calendar}`;
}

export function formatPeriod({ start, end }: HistoricalPeriod): string {
  return end ? `${formatHistoricalDate(start)} – ${formatHistoricalDate(end)}` : formatHistoricalDate(start);
}

/** 事件涵蓋的年份範圍（取最寬的可能範圍） */
export function periodRange({ start, end }: HistoricalPeriod): [number, number] {
  return [start.earliest, end ? end.latest : start.latest];
}
