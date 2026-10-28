"use client";

import { useEffect, useMemo } from "react";
import { BufferAttribute, BufferGeometry, DoubleSide } from "three";
import { colorForName } from "@/lib/boundaries/colors";
import { regionForPolity, regionShade } from "@/lib/eras/query";
import { buildFillArrays } from "@/lib/geo/polygonMesh";
import { geometryToLinePositions } from "@/lib/geo/ringLines";
import type { BoundaryFeature } from "@/types/boundary";

interface BoundaryLayerProps {
  features: BoundaryFeature[];
  /** 開啟「各地朝代」圖層時，同一地區的國家用該地區的色系，和朝代名牌、色帶同色 */
  colorByRegion?: boolean;
}

/** 未標示政權的區域不填色也不畫框，避免看起來像一個國家 */
const isNamed = (f: BoundaryFeature) => !!f.properties.name;

/**
 * 歷史疆域：依政權上色的半透明面 + 邊界線。
 * 近似、中等或未標示精度的邊界用虛線，依國際法確定的邊界（精度 3）用實線。
 */
export function BoundaryLayer({ features, colorByRegion = false }: BoundaryLayerProps) {
  const fill = useMemo(() => {
    const { positions, colors } = buildFillArrays(features, (f) => {
      if (!isNamed(f)) return null;
      const name = f.properties.subjecto ?? f.properties.name!;
      const region = colorByRegion ? regionForPolity(f.properties.name, f.geometry) : null;
      return region ? regionShade(region, name) : colorForName(name);
    });
    const g = new BufferGeometry();
    g.setAttribute("position", new BufferAttribute(positions, 3));
    g.setAttribute("color", new BufferAttribute(colors, 3));
    return g;
  }, [features, colorByRegion]);

  const [approxLines, preciseLines] = useMemo(() => {
    const named = features.filter(isNamed);
    const toGeometry = (list: BoundaryFeature[]) => {
      const g = new BufferGeometry();
      g.setAttribute("position", new BufferAttribute(geometryToLinePositions(list.map((f) => f.geometry), 1.0025), 3));
      return g;
    };
    return [
      toGeometry(named.filter((f) => f.properties.borderPrecision !== 3)),
      toGeometry(named.filter((f) => f.properties.borderPrecision === 3)),
    ];
  }, [features]);

  useEffect(() => () => [fill, approxLines, preciseLines].forEach((g) => g.dispose()), [fill, approxLines, preciseLines]);

  return (
    <group raycast={() => null}>
      <mesh geometry={fill} raycast={() => null} renderOrder={1}>
        <meshBasicMaterial vertexColors transparent opacity={colorByRegion ? 0.45 : 0.32} depthWrite={false} side={DoubleSide} />
      </mesh>
      <lineSegments
        geometry={approxLines}
        raycast={() => null}
        renderOrder={2}
        onUpdate={(self) => self.computeLineDistances()}
      >
        <lineDashedMaterial color="#ffd27a" dashSize={0.006} gapSize={0.004} transparent opacity={0.85} depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={preciseLines} raycast={() => null} renderOrder={2}>
        <lineBasicMaterial color="#ffd27a" transparent opacity={0.95} depthWrite={false} />
      </lineSegments>
    </group>
  );
}
