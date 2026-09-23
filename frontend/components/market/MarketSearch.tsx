import type {
  FormEvent,
} from "react";

import Card from "@/components/ui/Card";

import {
  quickSymbols,
} from "@/lib/market/constants";

import type {
  MarketAnalysis,
} from "@/lib/market/types";


type MarketSearchProps = {
  symbol: string;

  analysis:
    MarketAnalysis
    | null;

  loading: boolean;

  historyLoading: boolean;

  onSymbolChange:
    (symbol: string) => void;

  onSubmit:
    (
      event: FormEvent,
    ) => void;

  onQuickSymbol:
    (symbol: string) => void;
};


export default function MarketSearch({
  symbol,
  analysis,
  loading,
  historyLoading,
  onSymbolChange,
  onSubmit,
  onQuickSymbol,
}: MarketSearchProps) {
  return (
    <section>

      <div>

        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-400">
          Research
        </p>


        <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
          Analyze a symbol
        </h2>


        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-zinc-600">
          Search any supported ticker or open a stock directly from the Scanner.
        </p>

      </div>


      <Card className="mt-4">

        <form
          onSubmit={
            onSubmit
          }

          className="flex flex-col gap-3 lg:flex-row"
        >

          <div className="min-w-0 flex-1">

            <label
              htmlFor="market-symbol"
              className="text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-700"
            >
              Ticker symbol
            </label>


            <input
              id="market-symbol"

              value={
                symbol
              }

              onChange={(
                event,
              ) =>
                onSymbolChange(
                  event.target.value
                    .toUpperCase(),
                )
              }

              placeholder="AAPL"

              className="mt-2 w-full rounded-xl border border-zinc-900 bg-black px-4 py-3 text-sm font-medium uppercase text-white outline-none transition placeholder:text-zinc-700 focus:border-zinc-700"
            />

          </div>


          <button
            type="submit"

            disabled={
              loading
              || historyLoading
            }

            className="self-end rounded-xl bg-white px-7 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {
              loading
                ? "Analyzing..."
                : "Analyze"
            }
          </button>

        </form>


        <div className="mt-5 flex flex-wrap items-center gap-2">

          <span className="mr-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
            Quick access
          </span>


          {quickSymbols.map(
            (
              ticker,
            ) => (
              <button
                key={
                  ticker
                }

                type="button"

                onClick={() =>
                  onQuickSymbol(
                    ticker,
                  )
                }

                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  analysis?.symbol
                  === ticker
                    ? "border-zinc-600 bg-zinc-800 text-white"
                    : "border-zinc-900 bg-black text-zinc-500 hover:border-zinc-700 hover:text-white"
                }`}
              >
                {
                  ticker
                }
              </button>
            ),
          )}

        </div>

      </Card>

    </section>
  );
}