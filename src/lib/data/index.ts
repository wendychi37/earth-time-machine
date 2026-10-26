import type { Repository } from "./repository";
import { staticRepository } from "./staticRepository";
import { supabaseRepository } from "./supabaseRepository";

/** NEXT_PUBLIC_DATA_SOURCE=supabase 時改從 Supabase 讀取；預設使用 public/data 的靜態檔案。 */
export const repository: Repository =
  process.env.NEXT_PUBLIC_DATA_SOURCE === "supabase" ? supabaseRepository : staticRepository;
