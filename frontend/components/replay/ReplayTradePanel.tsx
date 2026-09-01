"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";


export type TradeDirection =
  | "long"
  | "short";


export type ReplayTradeMarker = {
  id: string;

  time: string;

  kind:
    | "long-entry"
    | "short-entry"
    | "exit";

  price: number;
};


type OpenPosition = {
  direction: TradeDirection;

  entryPrice: number;

  quantity: number;

  entryTime: string;
};


export type CompletedReplayTrade = {
  id: string;

  direction: TradeDirection;

  entryPrice: number;

  exitPrice: number;

  quantity: number;

  entryTime: string;

  exitTime: string;

  pnl: number;

  returnPercent: number;
};


type ReplayTradePanelProps = {
  symbol: string;

  currentPrice:
    number | null;

  currentTime:
    string | null;

  sessionKey: string;

  onPositionChange?: (
    open: boolean,
  ) => void;

  onMarker?: (
    marker: ReplayTradeMarker,
  ) => void;

  onCompletedTradesChange?: (
    trades: CompletedReplayTrade[],
  ) => void;
};


function calculatePnl(
  direction: TradeDirection,
  entryPrice: number,
  currentPrice: number,
  quantity: number,
) {
  const difference =
    direction === "long"
      ? currentPrice
        - entryPrice
      : entryPrice
        - currentPrice;

  return (
    difference
    * quantity
  );
}


export default function ReplayTradePanel({
  symbol,
  currentPrice,
  currentTime,
  sessionKey,
  onPositionChange,
  onMarker,
  onCompletedTradesChange,
}: ReplayTradePanelProps) {
  const [
    quantity,
    setQuantity,
  ] = useState(
    10,
  );


  const [
    position,
    setPosition,
  ] = useState<
    OpenPosition | null
  >(
    null,
  );


  const [
    completedTrades,
    setCompletedTrades,
  ] = useState<
    CompletedReplayTrade[]
  >(
    [],
  );


  /*
   * Reset paper trading whenever
   * a different replay session
   * is loaded.
   */
  useEffect(
    () => {
      setPosition(
        null,
      );

      setCompletedTrades(
        [],
      );

      setQuantity(
        10,
      );

      onPositionChange?.(
        false,
      );
    },
    [
      sessionKey,
      onPositionChange,
    ],
  );


  /*
   * Send completed trades back
   * to ReplayPage so the page can
   * build session statistics.
   */
  useEffect(
    () => {
      onCompletedTradesChange?.(
        completedTrades,
      );
    },
    [
      completedTrades,
      onCompletedTradesChange,
    ],
  );


  const unrealizedPnl =
    useMemo(
      () => {
        if (
          !position
          || currentPrice === null
        ) {
          return 0;
        }

        return calculatePnl(
          position.direction,
          position.entryPrice,
          currentPrice,
          position.quantity,
        );
      },
      [
        position,
        currentPrice,
      ],
    );


  const unrealizedPercent =
    useMemo(
      () => {
        if (
          !position
          || currentPrice === null
          || position.entryPrice === 0
        ) {
          return 0;
        }

        const priceMove =
          position.direction === "long"
            ? currentPrice
              - position.entryPrice
            : position.entryPrice
              - currentPrice;

        return (
          priceMove
          / position.entryPrice
        ) * 100;
      },
      [
        position,
        currentPrice,
      ],
    );


  const realizedPnl =
    useMemo(
      () => {
        return completedTrades.reduce(
          (
            total,
            trade,
          ) =>
            total
            + trade.pnl,
          0,
        );
      },
      [
        completedTrades,
      ],
    );


  function openTrade(
    direction:
      TradeDirection,
  ) {
    if (
      currentPrice === null
      || currentTime === null
      || position
      || quantity <= 0
    ) {
      return;
    }


    setPosition({
      direction,

      entryPrice:
        currentPrice,

      quantity,

      entryTime:
        currentTime,
    });


    onMarker?.({
      id:
        crypto.randomUUID(),

      time:
        currentTime,

      kind:
        direction === "long"
          ? "long-entry"
          : "short-entry",

      price:
        currentPrice,
    });


    onPositionChange?.(
      true,
    );
  }


  function closeTrade() {
    if (
      !position
      || currentPrice === null
      || currentTime === null
    ) {
      return;
    }


    const pnl =
      calculatePnl(
        position.direction,
        position.entryPrice,
        currentPrice,
        position.quantity,
      );


    const priceMove =
      position.direction === "long"
        ? currentPrice
          - position.entryPrice
        : position.entryPrice
          - currentPrice;


    const returnPercent =
      (
        priceMove
        / position.entryPrice
      ) * 100;


    const trade:
      CompletedReplayTrade = {
        id:
          crypto.randomUUID(),

        direction:
          position.direction,

        entryPrice:
          position.entryPrice,

        exitPrice:
          currentPrice,

        quantity:
          position.quantity,

        entryTime:
          position.entryTime,

        exitTime:
          currentTime,

        pnl,

        returnPercent,
      };


    setCompletedTrades(
      (
        current,
      ) => [
        ...current,
        trade,
      ],
    );


    onMarker?.({
      id:
        crypto.randomUUID(),

      time:
        currentTime,

      kind:
        "exit",

      price:
        currentPrice,
    });


    setPosition(
      null,
    );


    onPositionChange?.(
      false,
    );
  }


  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

        <div>

          <p className="text-sm text-blue-400">
            Paper trading
          </p>


          <h2 className="mt-1 text-xl font-semibold">
            Replay trade
          </h2>


          <p className="mt-2 text-sm text-zinc-500">
            Trades execute at the
            latest revealed candle
            price.
          </p>

        </div>


        <div className="flex flex-wrap gap-6">

          <div>

            <p className="text-xs text-zinc-500">
              Current price
            </p>


            <p className="mt-1 text-lg font-semibold">
              {
                currentPrice === null
                  ? "—"
                  : `$${currentPrice.toFixed(
                      2,
                    )}`
              }
            </p>

          </div>


          <div>

            <p className="text-xs text-zinc-500">
              Realized P&L
            </p>


            <p
              className={`mt-1 text-lg font-semibold ${
                realizedPnl > 0
                  ? "text-emerald-400"
                  : realizedPnl < 0
                    ? "text-red-400"
                    : "text-white"
              }`}
            >
              {
                realizedPnl > 0
                  ? "+"
                  : ""
              }

              $
              {
                realizedPnl
                  .toFixed(2)
              }
            </p>

          </div>

        </div>

      </div>


      {!position && (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">

          <div>

            <label className="mb-2 block text-sm text-zinc-400">
              Shares
            </label>


            <input
              type="number"

              min="1"

              step="1"

              value={
                quantity
              }

              onChange={(
                event,
              ) => {
                const value =
                  Number(
                    event.target.value,
                  );

                if (
                  Number.isFinite(
                    value,
                  )
                ) {
                  setQuantity(
                    Math.max(
                      1,
                      Math.floor(
                        value,
                      ),
                    ),
                  );
                }
              }}

              className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none transition focus:border-blue-500"
            />

          </div>


          <div className="flex items-end">

            <button
              type="button"

              disabled={
                currentPrice === null
              }

              onClick={() =>
                openTrade(
                  "long",
                )
              }

              className="w-full rounded-xl border border-emerald-500 bg-emerald-500 px-5 py-3 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Long
            </button>

          </div>


          <div className="flex items-end">

            <button
              type="button"

              disabled={
                currentPrice === null
              }

              onClick={() =>
                openTrade(
                  "short",
                )
              }

              className="w-full rounded-xl border border-red-500 bg-red-500 px-5 py-3 font-semibold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Short
            </button>

          </div>

        </div>
      )}


      {position && (
        <div className="mt-6 rounded-xl border border-zinc-800 bg-black p-5">

          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">

            <div>

              <div className="flex items-center gap-2">

                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold ${
                    position.direction
                    === "long"
                      ? "bg-emerald-950 text-emerald-400"
                      : "bg-red-950 text-red-400"
                  }`}
                >
                  {
                    position.direction
                      .toUpperCase()
                  }
                </span>


                <span className="text-sm font-medium">
                  {
                    symbol
                  }
                </span>

              </div>


              <p className="mt-3 text-sm text-zinc-500">
                {
                  position.quantity
                }
                {" "}shares at{" "}
                $
                {
                  position.entryPrice
                    .toFixed(2)
                }
              </p>

            </div>


            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">

              <PositionMetric
                label="Entry"

                value={`$${position.entryPrice.toFixed(
                  2,
                )}`}
              />


              <PositionMetric
                label="Current"

                value={
                  currentPrice === null
                    ? "—"
                    : `$${currentPrice.toFixed(
                        2,
                      )}`
                }
              />


              <div>

                <p className="text-xs text-zinc-500">
                  P&L
                </p>


                <p
                  className={`mt-1 font-semibold ${
                    unrealizedPnl > 0
                      ? "text-emerald-400"
                      : unrealizedPnl < 0
                        ? "text-red-400"
                        : "text-white"
                  }`}
                >
                  {
                    unrealizedPnl > 0
                      ? "+"
                      : ""
                  }

                  $
                  {
                    unrealizedPnl
                      .toFixed(2)
                  }
                </p>

              </div>


              <div>

                <p className="text-xs text-zinc-500">
                  Return
                </p>


                <p
                  className={`mt-1 font-semibold ${
                    unrealizedPercent > 0
                      ? "text-emerald-400"
                      : unrealizedPercent < 0
                        ? "text-red-400"
                        : "text-white"
                  }`}
                >
                  {
                    unrealizedPercent > 0
                      ? "+"
                      : ""
                  }

                  {
                    unrealizedPercent
                      .toFixed(2)
                  }%
                </p>

              </div>

            </div>


            <button
              type="button"

              onClick={
                closeTrade
              }

              className="rounded-xl bg-white px-5 py-3 font-semibold text-black transition hover:bg-zinc-200"
            >
              Close Position
            </button>

          </div>

        </div>
      )}


      {completedTrades.length > 0 && (
        <div className="mt-6">

          <div className="flex items-center justify-between">

            <h3 className="font-semibold">
              Replay trades
            </h3>


            <span className="text-xs text-zinc-500">
              {
                completedTrades.length
              }
              {" "}
              {
                completedTrades.length === 1
                  ? "trade"
                  : "trades"
              }
            </span>

          </div>


          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-800">

            {
              completedTrades.map(
                (
                  trade,
                ) => (
                  <div
                    key={
                      trade.id
                    }

                    className="grid gap-3 border-b border-zinc-800 bg-black px-4 py-4 last:border-b-0 sm:grid-cols-6"
                  >

                    <div>

                      <p className="text-xs text-zinc-500">
                        Direction
                      </p>


                      <p
                        className={`mt-1 text-sm font-semibold ${
                          trade.direction
                          === "long"
                            ? "text-emerald-400"
                            : "text-red-400"
                        }`}
                      >
                        {
                          trade.direction
                            .toUpperCase()
                        }
                      </p>

                    </div>


                    <TradeValue
                      label="Shares"

                      value={
                        trade.quantity
                          .toString()
                      }
                    />


                    <TradeValue
                      label="Entry"

                      value={`$${trade.entryPrice.toFixed(
                        2,
                      )}`}
                    />


                    <TradeValue
                      label="Exit"

                      value={`$${trade.exitPrice.toFixed(
                        2,
                      )}`}
                    />


                    <TradeValue
                      label="Return"

                      value={`${trade.returnPercent > 0 ? "+" : ""}${trade.returnPercent.toFixed(
                        2,
                      )}%`}
                    />


                    <div>

                      <p className="text-xs text-zinc-500">
                        P&L
                      </p>


                      <p
                        className={`mt-1 text-sm font-semibold ${
                          trade.pnl > 0
                            ? "text-emerald-400"
                            : trade.pnl < 0
                              ? "text-red-400"
                              : "text-white"
                        }`}
                      >
                        {
                          trade.pnl > 0
                            ? "+"
                            : ""
                        }

                        $
                        {
                          trade.pnl
                            .toFixed(2)
                        }
                      </p>

                    </div>

                  </div>
                ),
              )
            }

          </div>

        </div>
      )}

    </section>
  );
}


function PositionMetric({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div>

      <p className="text-xs text-zinc-500">
        {
          label
        }
      </p>


      <p className="mt-1 font-semibold">
        {
          value
        }
      </p>

    </div>
  );
}


function TradeValue({
  label,
  value,
}: {
  label: string;

  value: string;
}) {
  return (
    <div>

      <p className="text-xs text-zinc-500">
        {
          label
        }
      </p>


      <p className="mt-1 text-sm font-semibold">
        {
          value
        }
      </p>

    </div>
  );
}