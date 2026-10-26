import type { ModernCountry } from "@/types/geo";

/**
 * 資料存取介面。第一階段由靜態檔案實作，之後可替換為 Supabase，元件不需修改。
 */
export interface Repository {
  getModernCountries(): Promise<ModernCountry[]>;
}
