import type {
  CandleInterval,
  ChartRange,
  IntervalMode,
} from "@/lib/market/types";

import {
  chartRanges,
  intervalButtons,
  validIntervals,
} from "@/lib/market/constants";


type ChartControlsProps = {
  range: ChartRange;
  intervalMode: IntervalMode;
  activeInterval: CandleInterval;
  loading: boolean;

  onRangeChange:
    (range: ChartRange) => void;

  onIntervalChange:
    (interval: IntervalMode) => void;
};


export default function ChartControls({
  range,
  intervalMode,
  activeInterval,
  loading,
  onRangeChange,
  onIntervalChange,
}: ChartControlsProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-zinc-900 pb-4 xl:flex-row xl:items-center xl:justify-between">

      <ControlGroup
        label="Range"
      >
        {chartRanges.map(
          (
            option,
          ) => (
            <ControlButton
              key={
                option
              }

              active={
                range
                === option
              }

              disabled={
                loading
              }

              onClick={() =>
                onRangeChange(
                  option,
                )
              }
            >
              {option}
            </ControlButton>
          ),
        )}
      </ControlGroup>


      <ControlGroup
        label="Candles"
      >
        {intervalButtons.map(
          (
            option,
          ) => {
            const unavailable =
              option.value
              !== "auto"
              && !validIntervals[
                range
              ].includes(
                option.value,
              );


            const active =
              intervalMode
              === option.value;


            return (
              <ControlButton
                key={
                  option.value
                }

                active={
                  active
                }

                disabled={
                  loading
                  || unavailable
                }

                onClick={() =>
                  onIntervalChange(
                    option.value,
                  )
                }
              >
                {option.label}

                {
                  option.value
                  === "auto"
                  && intervalMode
                  === "auto"
                    ? (
                        <span className="ml-1 text-[9px] text-zinc-600">
                          {activeInterval}
                        </span>
                      )
                    : null
                }
              </ControlButton>
            );
          },
        )}
      </ControlGroup>

    </div>
  );
}


function ControlGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">

      <span className="mr-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
        {label}
      </span>

      {children}

    </div>
  );
}


function ControlButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"

      disabled={
        disabled
      }

      onClick={
        onClick
      }

      className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
        active
          ? "border-zinc-600 bg-zinc-800 text-white"
          : "border-zinc-900 bg-black text-zinc-600 hover:border-zinc-700 hover:text-zinc-300"
      } disabled:cursor-not-allowed disabled:opacity-30`}
    >
      {children}
    </button>
  );
}