export type PatternVisibility = {
  breakouts: boolean;
  breakdowns: boolean;
  doubleBottoms: boolean;
  doubleTops: boolean;
  movingAverageCrosses: boolean;
  pivots: boolean;
};


type PatternControlsProps = {
  visibility:
    PatternVisibility;

  onChange:
    (
      visibility:
        PatternVisibility,
    ) => void;
};


const patternOptions: {
  key:
    keyof PatternVisibility;

  label: string;
}[] = [
  {
    key: "breakouts",
    label: "Breakouts",
  },

  {
    key: "breakdowns",
    label: "Breakdowns",
  },

  {
    key: "doubleBottoms",
    label: "Double Bottom",
  },

  {
    key: "doubleTops",
    label: "Double Top",
  },

  {
    key: "movingAverageCrosses",
    label: "MA Crosses",
  },

  {
    key: "pivots",
    label: "Swing Points",
  },
];


export default function PatternControls({
  visibility,
  onChange,
}: PatternControlsProps) {
  const allEnabled =
    patternOptions.every(
      (
        option,
      ) =>
        visibility[
          option.key
        ],
    );


  function toggle(
    key:
      keyof PatternVisibility,
  ) {
    onChange({
      ...visibility,

      [key]:
        !visibility[
          key
        ],
    });
  }


  function toggleAll() {
    const nextValue =
      !allEnabled;


    onChange({
      breakouts:
        nextValue,

      breakdowns:
        nextValue,

      doubleBottoms:
        nextValue,

      doubleTops:
        nextValue,

      movingAverageCrosses:
        nextValue,

      pivots:
        nextValue,
    });
  }


  return (
    <div>

      <div className="flex flex-wrap items-center gap-2">

        <span className="mr-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
          Patterns
        </span>


        <ToggleButton
          active={
            allEnabled
          }

          onClick={
            toggleAll
          }
        >
          All
        </ToggleButton>


        {patternOptions.map(
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
              {option.label}
            </ToggleButton>
          ),
        )}

      </div>


      <p className="mt-2 text-[10px] leading-5 text-zinc-700">
        Pattern detection is automated technical analysis,
        not a prediction of future price movement.
      </p>

    </div>
  );
}


function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
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
          ? "border-blue-800/70 bg-blue-950/40 text-blue-300"
          : "border-zinc-900 bg-black text-zinc-600 hover:border-zinc-700 hover:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}