import type { Geometry, Position } from "geojson";
import type { MapCountry } from "@/types/geo";

/** 地球儀配色：柔和、孩子容易分辨的 7 色（對應 Natural Earth MAPCOLOR7）。 */
export const COUNTRY_COLORS = ["#f3d27f", "#b9dc8c", "#f4b49c", "#c8b7e6", "#9fd8c8", "#f6c3d6", "#e6c49c"];
export const OCEAN_COLOR = "#8ec5ea";
const ANTARCTICA_COLOR = "#f4f7fa";
const GRATICULE_COLOR = "rgba(255,255,255,0.45)";
const COAST_COLOR = "rgba(60,80,100,0.55)";

export function countryColor(country: MapCountry): string {
  if (country.properties.iso === "ATA") return ANTARCTICA_COLOR;
  const i = (country.properties.color - 1) % COUNTRY_COLORS.length;
  return COUNTRY_COLORS[i < 0 ? 0 : i];
}

function polygonsOf(g: Geometry): Position[][][] {
  if (g.type === "Polygon") return [g.coordinates];
  if (g.type === "MultiPolygon") return g.coordinates;
  return [];
}

/**
 * 在 2D 畫布上畫出等距長方投影的政治地圖（海洋、經緯線、各國色塊、海岸線），
 * 之後當作地球的貼圖。國界另以 3D 線條畫，拉近時才不會糊。
 */
export function drawPoliticalMap(ctx: CanvasRenderingContext2D, width: number, height: number, countries: MapCountry[]) {
  const px = (lon: number) => ((lon + 180) / 360) * width;
  const py = (lat: number) => ((90 - lat) / 180) * height;
  const scale = width / 4096;

  ctx.fillStyle = OCEAN_COLOR;
  ctx.fillRect(0, 0, width, height);

  // 經緯線每 15°
  ctx.strokeStyle = GRATICULE_COLOR;
  ctx.lineWidth = 1.2 * scale;
  ctx.beginPath();
  for (let lon = -180; lon <= 180; lon += 15) {
    ctx.moveTo(px(lon), 0);
    ctx.lineTo(px(lon), height);
  }
  for (let lat = -75; lat <= 75; lat += 15) {
    ctx.moveTo(0, py(lat));
    ctx.lineTo(width, py(lat));
  }
  ctx.stroke();

  const trace = (polygon: Position[][]) => {
    for (const ring of polygon) {
      ring.forEach(([lon, lat], i) => (i === 0 ? ctx.moveTo(px(lon), py(lat)) : ctx.lineTo(px(lon), py(lat))));
      ctx.closePath();
    }
  };

  for (const country of countries) {
    ctx.fillStyle = countryColor(country);
    ctx.beginPath();
    for (const polygon of polygonsOf(country.geometry)) trace(polygon);
    ctx.fill("evenodd");
  }

  // 外框；資料在 ±180° 經線與南極點被切開，那些切口不畫線
  const isCut = (a: Position, b: Position) =>
    (Math.abs(a[0]) > 179.99 && Math.abs(b[0]) > 179.99) || (a[1] < -89.99 && b[1] < -89.99);
  ctx.strokeStyle = COAST_COLOR;
  ctx.lineWidth = 1.4 * scale;
  ctx.lineJoin = "round";
  ctx.beginPath();
  for (const country of countries) {
    for (const polygon of polygonsOf(country.geometry)) {
      for (const ring of polygon) {
        ctx.moveTo(px(ring[0][0]), py(ring[0][1]));
        for (let i = 1; i < ring.length; i++) {
          const [lon, lat] = ring[i];
          if (isCut(ring[i - 1], ring[i])) ctx.moveTo(px(lon), py(lat));
          else ctx.lineTo(px(lon), py(lat));
        }
      }
    }
  }
  ctx.stroke();
}
