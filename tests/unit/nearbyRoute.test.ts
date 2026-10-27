import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/events/nearby/route";

const binding = (qid: string, label: string) => ({
  e: { value: `http://www.wikidata.org/entity/${qid}` },
  eLabel: { value: label },
  date: { value: "1895-05-29T00:00:00Z" },
  prec: { value: "11" },
  coord: { value: "Point(121.5 25)" },
  own: { value: "Point(121.5 25)" },
  dist: { value: "3" },
  links: { value: "10" },
});

/** 依查詢策略（是否含 wikibase:around）回傳不同結果與延遲 */
function mockWikidata(time: { delay: number; rows?: unknown[]; status?: number }, place: { delay: number; rows?: unknown[]; status?: number }) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init: RequestInit) => {
      const spec = decodeURIComponent(url).includes("wikibase:around") ? place : time;
      return new Promise((resolve, reject) => {
        const t = setTimeout(
          () => resolve(new Response(JSON.stringify({ results: { bindings: spec.rows ?? [] } }), { status: spec.status ?? 200 })),
          spec.delay,
        );
        init.signal?.addEventListener("abort", () => {
          clearTimeout(t);
          reject(new Error("aborted"));
        });
      });
    }),
  );
}

const call = (qs = "lat=25&lon=121.5&year=1895") => GET(new NextRequest(`http://localhost/api/events/nearby?${qs}`));

afterEach(() => vi.unstubAllGlobals());

describe("/api/events/nearby", () => {
  it("參數錯誤回傳 400", async () => {
    expect((await call("lat=abc&lon=0&year=1")).status).toBe(400);
  });
  it("時間優先較慢但在寬限時間內回來時，採用時間優先的結果", async () => {
    mockWikidata({ delay: 50, rows: [binding("Q1", "時間優先")] }, { delay: 5, rows: [binding("Q2", "地點優先")] });
    const json = await (await call()).json();
    expect(json.events.map((e: { title: string }) => e.title)).toEqual(["時間優先"]);
  });
  it("時間優先失敗時採用地點優先", async () => {
    mockWikidata({ delay: 5, status: 500 }, { delay: 20, rows: [binding("Q2", "地點優先")] });
    const json = await (await call()).json();
    expect(json.events[0].title).toBe("地點優先");
  });
  it("兩者都失敗回傳 502", async () => {
    mockWikidata({ delay: 5, status: 500 }, { delay: 5, status: 429 });
    expect((await call()).status).toBe(502);
  });
  it("沒有事件時回傳空清單並可快取", async () => {
    mockWikidata({ delay: 5 }, { delay: 1 });
    const res = await call();
    expect((await res.json()).events).toEqual([]);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage");
  });
});
