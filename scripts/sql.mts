/** 產生 SQL 字面值的小工具（只用於本機產生 seed 檔，不處理使用者輸入）。 */
export function lit(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return `array[${value.map(lit).join(", ")}]::text[]`;
  return `'${String(value).replace(/'/g, "''")}'`;
}
