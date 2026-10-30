import type { Track } from "./keyEvents";

/** 臺灣史、中國史、東亞史、世界史的顏色（白字對比 5:1 以上） */
export const TRACK_COLORS: Record<Track, string> = {
  tw: "#2b7a55",
  cn: "#b4443e",
  ea: "#7a4f9a",
  world: "#3f67a8",
};

export const TRACKS: Track[] = ["tw", "cn", "ea", "world"];
