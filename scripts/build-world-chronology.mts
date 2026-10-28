/**
 * 由 data/chronology/raw.json（fetch-world-chronology.mjs 下載）產生 public/data/chronology/world-chronology.json。
 * 用法：npx tsx scripts/build-world-chronology.mts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { buildChronology, type RawChronology } from "../src/lib/chronology/build";
import { packChronology } from "../src/lib/chronology/compact";
import { makeCountryLocator } from "../src/lib/chronology/country";
import { COUNTRY_CHRONOLOGIES, FOREIGN_CHRONOLOGIES } from "../src/lib/chronology/sources";
import type { ModernCountry, ModernCountryProps } from "../src/types/geo";

const raw = JSON.parse(readFileSync("data/chronology/raw.json", "utf8")) as RawChronology;
const topo = JSON.parse(readFileSync("public/data/modern/ne_110m_admin0.topojson", "utf8")) as Topology<{
  countries: GeometryCollection<ModernCountryProps>;
}>;
const countries = feature(topo, topo.objects.countries).features as ModernCountry[];
const countryAt = makeCountryLocator(countries);
const { events, skipped } = buildChronology(raw, { countryAt });
const out = packChronology(
  {
    notice: "內容取自中文維基百科〈世界史年表〉各頁（CC BY-SA 4.0），未經改寫；地點由原文連結的 Wikidata 條目推算。",
    license: raw.license,
    fetchedAt: raw.fetchedAt,
  },
  events,
);
writeFileSync("public/data/chronology/world-chronology.json", JSON.stringify(out) + "\n");
const located = events.filter((e) => e.location).length;
const withCountry = events.filter((e) => e.country).length;
console.log(`${events.length} 條事件（${located} 條可放上地球，${withCountry} 條對應到今日國家），略過 ${skipped.length} 條：`);
for (const s of skipped) console.log("  " + s);

// 各國歷史年表（scripts/fetch-country-chronologies.mts 下載）
if (existsSync("data/chronology/countries-raw.json")) {
  const countriesRaw = JSON.parse(readFileSync("data/chronology/countries-raw.json", "utf8")) as RawChronology;
  const byIso = new Map(countries.map((c) => [c.properties.iso, { iso: c.properties.iso, nameZh: c.properties.nameZh }]));
  const pageCountry = (page: RawChronology["pages"][number]) => {
    const source = [...COUNTRY_CHRONOLOGIES, ...FOREIGN_CHRONOLOGIES].find((s) => s.page === page.sourcePage);
    const country = source && (byIso.get(source.iso) ?? (source.nameZh ? { iso: source.iso, nameZh: source.nameZh } : undefined));
    return source && country ? { country, fallback: source.fallback, skipYears: source.skipYears } : null;
  };
  const built = buildChronology(countriesRaw, {
    countryAt,
    idPrefix: "cc",
    pageCountry,
  });

  // 外文國家年表（scripts/fetch-foreign-chronologies.mts 下載），內容用 data/chronology/translations/en.json 的譯文
  if (existsSync("data/chronology/foreign-raw.json")) {
    const foreignRaw = JSON.parse(readFileSync("data/chronology/foreign-raw.json", "utf8")) as RawChronology;
    const translations = JSON.parse(readFileSync("data/chronology/translations/en.json", "utf8")) as Record<string, string>;
    const missing = new Set<string>();
    const foreign = buildChronology(foreignRaw, {
      countryAt,
      idPrefix: "fc",
      pageCountry,
      translate: (original) => translations[original] ?? (missing.add(original), null),
    });
    built.events.push(...foreign.events);
    // 尚未翻譯的原文，供下次翻譯
    writeFileSync("data/chronology/translations/en-missing.json", JSON.stringify([...missing], null, 1) + "\n");
    console.log(`外文年表：${foreign.events.length} 條，尚未翻譯 ${missing.size} 條`);
  }
  const packed = packChronology(
    {
      notice:
        "內容取自中文維基百科各國歷史年表（CC BY-SA 4.0），未經改寫；中文維基百科沒有年表的國家譯自英文維基百科（AI 翻譯，附原文）。地點由原文連結的 Wikidata 條目推算，找不到時以該國代表位置示意。",
      license: countriesRaw.license,
      fetchedAt: countriesRaw.fetchedAt,
    },
    built.events,
  );
  writeFileSync("public/data/chronology/country-chronologies.json", JSON.stringify(packed) + "\n");
  console.log(`各國年表：${built.events.length} 條，略過 ${built.skipped.length} 條`);
  for (const p of countriesRaw.pages) console.log(`  ${p.displayTitle}：${built.events.filter((e) => e.sources[0].title.includes(p.displayTitle)).length} 條`);
}
