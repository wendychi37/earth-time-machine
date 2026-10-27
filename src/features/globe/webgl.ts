let cached: boolean | null = null;

/**
 * 檢查瀏覽器是否支援 WebGL。結果只計算一次並快取：
 * 每次檢查都會建立一個 WebGL context，而 Chrome 同時最多保留約 16 個，
 * 超過時會回收最舊的那個（也就是地球的畫布），導致地球消失。
 */
export function isWebGLAvailable(): boolean {
  if (cached !== null) return cached;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    cached = !!gl;
    // 立即釋放檢查用的 context，不佔用名額
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    cached = false;
  }
  return cached;
}
