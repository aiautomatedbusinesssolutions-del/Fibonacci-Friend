"use client";

import { useState, useCallback } from "react";
import {
  analyzeTicker,
  type FibResult,
  type HistoricalPrice,
} from "@/lib/fibonacci-logic";

interface UseFibonacciReturn {
  result: FibResult | null;
  isLoading: boolean;
  error: string | null;
  analyze: (
    ticker: string,
    prices: HistoricalPrice[],
    currentPrice: number
  ) => void;
  reset: () => void;
}

export function useFibonacci(): UseFibonacciReturn {
  const [result, setResult] = useState<FibResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(
    (ticker: string, prices: HistoricalPrice[], currentPrice: number) => {
      setIsLoading(true);
      setError(null);
      try {
        const fibResult = analyzeTicker(ticker, prices, currentPrice);
        setResult(fibResult);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong."
        );
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, isLoading, error, analyze, reset };
}
