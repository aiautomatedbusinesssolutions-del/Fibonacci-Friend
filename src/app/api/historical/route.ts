import { NextResponse } from "next/server";
import { getHistoricalPrices } from "@/lib/fmp-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { data: null, error: "Missing ?symbol= parameter." },
      { status: 400 }
    );
  }

  const result = await getHistoricalPrices(symbol);

  if (result.error) {
    return NextResponse.json(result, { status: 502 });
  }

  return NextResponse.json(result);
}
