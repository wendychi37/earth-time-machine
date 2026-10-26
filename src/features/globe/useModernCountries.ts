"use client";

import { useEffect, useState } from "react";
import { repository } from "@/lib/data";
import type { ModernCountry } from "@/types/geo";

export function useModernCountries(): ModernCountry[] | null {
  const [countries, setCountries] = useState<ModernCountry[] | null>(null);
  useEffect(() => {
    let cancelled = false;
    repository
      .getModernCountries()
      .then((c) => !cancelled && setCountries(c))
      .catch((err) => console.error(err));
    return () => {
      cancelled = true;
    };
  }, []);
  return countries;
}
