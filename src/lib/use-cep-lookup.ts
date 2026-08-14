"use client";

import { useState } from "react";
import { onlyDigits } from "@/lib/masks";

interface CepResult {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  complement: string;
}

export function useCepLookup() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function lookup(cep: string): Promise<CepResult | null> {
    const digits = onlyDigits(cep);
    if (digits.length !== 8) return null;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cep/${digits}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Não foi possível consultar o CEP.");
        return null;
      }
      return data as CepResult;
    } catch {
      setError("Não foi possível consultar o CEP.");
      return null;
    } finally {
      setLoading(false);
    }
  }

  return { lookup, loading, error };
}
