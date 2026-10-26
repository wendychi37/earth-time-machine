import type { Geometry } from "geojson";
import type { BoundaryFeature, BorderPrecision } from "@/types/boundary";
import type { EventSource, HistoricalEvent, LocationPrecision } from "@/types/event";
import type { CalendarSystem, DateQualifier, HistoricalDate } from "@/types/time";

/** RPC get_boundaries_at 回傳的一列 */
export interface BoundaryRow {
  id: string;
  name_in_source: string | null;
  subject_to: string | null;
  border_precision: number | null;
  confidence: number;
  geometry: Geometry;
}

/** RPC get_events_between 回傳的一列 */
export interface EventRow {
  id: string;
  title_zh_hant: string;
  summary_zh_hant: string;
  start_earliest: number;
  start_latest: number;
  start_precision: number;
  start_qualifier: DateQualifier;
  start_calendar: CalendarSystem;
  start_month: number | null;
  start_day: number | null;
  start_original_text: string | null;
  end_earliest: number | null;
  end_latest: number | null;
  end_precision: number | null;
  end_qualifier: DateQualifier | null;
  end_calendar: CalendarSystem | null;
  end_month: number | null;
  end_day: number | null;
  end_original_text: string | null;
  lat: number;
  lon: number;
  location_label: string;
  location_precision: LocationPrecision;
  category: HistoricalEvent["category"];
  wikidata_qid: string | null;
  wikipedia_zh_title: string | null;
  wikipedia_en_title: string | null;
  is_demo: boolean;
  review_status: HistoricalEvent["reviewStatus"];
  sources: EventSource[];
}

export function toBoundaryFeature(row: BoundaryRow): BoundaryFeature {
  const p = row.border_precision;
  return {
    type: "Feature",
    geometry: row.geometry,
    properties: {
      id: row.id,
      name: row.name_in_source,
      subjecto: row.subject_to,
      partOf: null,
      borderPrecision: p === 1 || p === 2 || p === 3 ? (p as BorderPrecision) : null,
      confidence: row.confidence,
      wikipedia: null,
    },
  };
}

function toDate(
  earliest: number,
  latest: number,
  precision: number,
  qualifier: DateQualifier,
  calendar: CalendarSystem,
  month: number | null,
  day: number | null,
  originalText: string | null,
): HistoricalDate {
  return {
    earliest,
    latest,
    precision,
    qualifier,
    calendar,
    ...(month ? { month } : {}),
    ...(day ? { day } : {}),
    ...(originalText ? { originalText } : {}),
  };
}

export function toHistoricalEvent(r: EventRow): HistoricalEvent {
  const start = toDate(
    r.start_earliest, r.start_latest, r.start_precision, r.start_qualifier, r.start_calendar,
    r.start_month, r.start_day, r.start_original_text,
  );
  const end =
    r.end_earliest === null || r.end_latest === null
      ? null
      : toDate(
          r.end_earliest, r.end_latest, r.end_precision ?? r.start_precision, r.end_qualifier ?? "exact",
          r.end_calendar ?? r.start_calendar, r.end_month, r.end_day, r.end_original_text,
        );
  return {
    id: r.id,
    title: r.title_zh_hant,
    summary: r.summary_zh_hant,
    period: { start, end },
    location: { lat: r.lat, lon: r.lon },
    locationLabel: r.location_label,
    locationPrecision: r.location_precision,
    category: r.category,
    wikidataQid: r.wikidata_qid,
    wikipedia: { zh: r.wikipedia_zh_title, en: r.wikipedia_en_title },
    sources: r.sources,
    isDemo: r.is_demo,
    reviewStatus: r.review_status,
  };
}
