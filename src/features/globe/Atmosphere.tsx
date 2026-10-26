"use client";

import { AdditiveBlending, BackSide } from "three";

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    float intensity = pow(0.62 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    gl_FragColor = vec4(0.35, 0.62, 1.0, 1.0) * intensity;
  }
`;

/** 地球外圍的大氣光暈（菲涅耳效果）。 */
export function Atmosphere() {
  return (
    <mesh scale={1.12} raycast={() => null}>
      <sphereGeometry args={[1, 64, 32]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        blending={AdditiveBlending}
        side={BackSide}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
