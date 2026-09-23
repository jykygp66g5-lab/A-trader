export type OverlayVisibility = {
  support: boolean;
  resistance: boolean;

  target: boolean;
  invalidation: boolean;

  sma20: boolean;
  sma50: boolean;
  sma200: boolean;

  ema9: boolean;
  ema20: boolean;

  volume: boolean;
};


type ChartOverlaysProps = {
  visibility:
    OverlayVisibility;

  onChange:
    (
      visibility:
        OverlayVisibility,
    ) => void;
};


const levelOptions: {
  key:
    keyof OverlayVisibility;

  label: string;
}[] = [
  {
    key: "support",
    label: "Support",
  },

  {
    key: "resistance",
    label: "Resistance",
  },

  {
    key: "target",
    label: "Target",
  },

  {
    key: "invalidation",
    label: "Invalidation",
  },
];


const movingAverageOptions: {
  key:
    keyof OverlayVisibility;

  label: string;
}[] = [
  {
    key: "sma20",
    label: "SMA 20",
  },

  {
    key: "sma50",
    label: "SMA 50",
  },

  {
    key: "sma200",
    label: "SMA 200",
  },

  {
    key: "ema9",
    label: "EMA 9",
  },

  {
    key: "ema20",
    label: "EMA 20",
  },
];


export default function ChartOverlays({
  visibility,
  onChange,
}: ChartOverlaysProps) {
  function toggle(
    key:
      keyof OverlayVisibility,
  ) {
    onChange({
      ...visibility,

      [key]:
        !visibility[
          key
        ],
    });
  }


  return (
    <div className="space-y-3">

      <div className="flex flex-wrap items-center gap-2">

        <span className="mr-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
          Levels
        </span>


        {levelOptions.map(
          (
            option,
          ) => (
            <ToggleButton
              key={
                option.key
              }

              active={
                visibility[
                  option.key
                ]
              }

              onClick={() =>
                toggle(
                  option.key,
                )
              }
            >
              {
                option.label
              }
            </ToggleButton>
          ),
        )}

      </div>


      <div className="flex flex-wrap items-center gap-2">

        <span className="mr-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
          Indicators
        </span>


        {movingAverageOptions.map(
          (
            option,
          ) => (
            <ToggleButton
              key={
                option.key
              }

              active={
                visibility[
                  option.key
                ]
              }

              onClick={() =>
                toggle(
                  option.key,
                )
              }
            >
              {
                option.label
              }
            </ToggleButton>
          ),
        )}


        <ToggleButton
          active={
            visibility.volume
          }

          onClick={() =>
            toggle(
              "volume",
            )
          }
        >
          Volume
        </ToggleButton>

      </div>

    </div>
  );
}


function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;

  onClick:
    () => void;

  children:
    React.ReactNode;
}) {
  return (
    <button
      type="button"

      onClick={
        onClick
      }

      aria-pressed={
        active
      }

      className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition ${
        active
          ? "border-emerald-800/70 bg-emerald-950/30 text-emerald-300"
          : "border-zinc-900 bg-black text-zinc-600 hover:border-zinc-700 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}


/* =========================================================
   DEFAULT VISIBILITY
========================================================= */

export const defaultOverlayVisibility:
  OverlayVisibility = {
    support: true,

    resistance: true,

    target: true,

    invalidation: true,

    sma20: false,

    sma50: true,

    sma200: true,

    ema9: false,

    ema20: false,

    volume: true,
  };