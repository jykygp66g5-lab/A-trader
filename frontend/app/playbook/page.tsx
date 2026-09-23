"use client";

import type { ReactNode } from "react";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import Sidebar from "@/components/Sidebar";
import PageHeader from "@/components/layout/PageHeader";
import PageSectionNav from "@/components/ui/PageSectionNav";
import Card from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import StatusBadge from "@/components/ui/StatusBadge";

import { api } from "@/lib/api";


/* =========================================================
   TYPES
========================================================= */

type PlaybookSetupApi = {
  id: string;

  name: string;
  description: string;

  market_condition: string;
  timeframe: string;

  max_risk_percent: number;

  entry_rules: string[];
  invalidation_rules: string[];
  target_rules: string[];
  confirmations: string[];
  mistakes_to_avoid: string[];

  created_at: string;
  updated_at: string;
};


type PlaybookSetup = {
  id: string;

  name: string;
  description: string;

  marketCondition: string;
  timeframe: string;

  maxRiskPercent: number;

  entryRules: string[];
  invalidationRules: string[];
  targetRules: string[];
  confirmations: string[];
  mistakesToAvoid: string[];

  createdAt: string;
  updatedAt: string;
};


type PlaybookForm = {
  name: string;
  description: string;

  marketCondition: string;
  timeframe: string;

  maxRiskPercent: string;

  entryRules: string[];
  invalidationRules: string[];
  targetRules: string[];
  confirmations: string[];
  mistakesToAvoid: string[];
};


type RuleField =
  | "entryRules"
  | "invalidationRules"
  | "targetRules"
  | "confirmations"
  | "mistakesToAvoid";


type RuleTone =
  | "positive"
  | "negative"
  | "warning"
  | "info"
  | "neutral";


/* =========================================================
   OPTIONS
========================================================= */

const TIMEFRAMES = [
  "1m",
  "5m",
  "15m",
  "30m",
  "1h",
  "4h",
  "1d",
];


const MARKET_CONDITIONS = [
  "Trending",
  "Range",
  "Breakout",
  "Pullback",
  "Reversal",
  "High volatility",
  "Low volatility",
  "News catalyst",
  "Earnings",
  "Custom",
];


const emptyForm: PlaybookForm = {
  name: "",

  description: "",

  marketCondition:
    "Trending",

  timeframe:
    "5m",

  maxRiskPercent:
    "1",

  entryRules: [
    "",
  ],

  invalidationRules: [
    "",
  ],

  targetRules: [
    "",
  ],

  confirmations: [
    "",
  ],

  mistakesToAvoid: [
    "",
  ],
};


/* =========================================================
   DATA HELPERS
========================================================= */

function mapApiSetup(
  setup: PlaybookSetupApi,
): PlaybookSetup {
  return {
    id:
      setup.id,

    name:
      setup.name,

    description:
      setup.description
      ?? "",

    marketCondition:
      setup.market_condition,

    timeframe:
      setup.timeframe,

    maxRiskPercent:
      setup.max_risk_percent,

    entryRules:
      setup.entry_rules
      ?? [],

    invalidationRules:
      setup.invalidation_rules
      ?? [],

    targetRules:
      setup.target_rules
      ?? [],

    confirmations:
      setup.confirmations
      ?? [],

    mistakesToAvoid:
      setup.mistakes_to_avoid
      ?? [],

    createdAt:
      setup.created_at,

    updatedAt:
      setup.updated_at,
  };
}


function setupToForm(
  setup: PlaybookSetup,
): PlaybookForm {
  return {
    name:
      setup.name,

    description:
      setup.description,

    marketCondition:
      setup.marketCondition,

    timeframe:
      setup.timeframe,

    maxRiskPercent:
      String(
        setup.maxRiskPercent,
      ),

    entryRules:
      setup.entryRules.length
        ? [...setup.entryRules]
        : [""],

    invalidationRules:
      setup.invalidationRules.length
        ? [...setup.invalidationRules]
        : [""],

    targetRules:
      setup.targetRules.length
        ? [...setup.targetRules]
        : [""],

    confirmations:
      setup.confirmations.length
        ? [...setup.confirmations]
        : [""],

    mistakesToAvoid:
      setup.mistakesToAvoid.length
        ? [...setup.mistakesToAvoid]
        : [""],
  };
}


function createEmptyForm():
  PlaybookForm {
  return {
    ...emptyForm,

    entryRules: [
      "",
    ],

    invalidationRules: [
      "",
    ],

    targetRules: [
      "",
    ],

    confirmations: [
      "",
    ],

    mistakesToAvoid: [
      "",
    ],
  };
}


function normalizeRules(
  values: string[],
) {
  return values
    .map(
      (
        value,
      ) =>
        value.trim(),
    )
    .filter(
      Boolean,
    );
}


function formatUpdatedDate(
  value: string,
) {
  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Unknown";
  }


  return date.toLocaleString(
    "en-CA",
    {
      dateStyle:
        "medium",

      timeStyle:
        "short",
    },
  );
}


function getRiskTone(
  risk: number,
):
  | "positive"
  | "warning"
  | "negative"
  | "neutral" {
  if (
    risk <= 0.5
  ) {
    return "positive";
  }


  if (
    risk <= 1
  ) {
    return "info" as never;
  }


  if (
    risk <= 2
  ) {
    return "warning";
  }


  if (
    risk > 2
  ) {
    return "negative";
  }


  return "neutral";
}


function getRiskClass(
  risk: number,
) {
  if (
    risk <= 0.5
  ) {
    return "text-emerald-400";
  }


  if (
    risk <= 1
  ) {
    return "text-blue-400";
  }


  if (
    risk <= 2
  ) {
    return "text-amber-400";
  }


  return "text-red-400";
}


function getConditionTone(
  condition: string,
):
  | "neutral"
  | "positive"
  | "negative"
  | "warning"
  | "info" {
  const normalized =
    condition
      .trim()
      .toLowerCase();


  if (
    normalized.includes(
      "trend",
    )
    || normalized.includes(
      "breakout",
    )
    || normalized.includes(
      "pullback",
    )
  ) {
    return "positive";
  }


  if (
    normalized.includes(
      "reversal",
    )
    || normalized.includes(
      "news",
    )
    || normalized.includes(
      "earnings",
    )
  ) {
    return "warning";
  }


  if (
    normalized.includes(
      "volatility",
    )
  ) {
    return "info";
  }


  return "neutral";
}


/* =========================================================
   PAGE
========================================================= */



const PLAYBOOK_SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "editor", label: "Editor" },
  { id: "setups", label: "Setups" },
] as const;

export default function PlaybookPage() {
  const [
    setups,
    setSetups,
  ] = useState<
    PlaybookSetup[]
  >(
    [],
  );


  const [
    form,
    setForm,
  ] = useState<
    PlaybookForm
  >(
    createEmptyForm(),
  );


  const [
    editingId,
    setEditingId,
  ] = useState<
    string | null
  >(
    null,
  );


  const [
    selectedSetup,
    setSelectedSetup,
  ] = useState<
    PlaybookSetup | null
  >(
    null,
  );


  const [
    showForm,
    setShowForm,
  ] = useState(
    false,
  );


  const [
    search,
    setSearch,
  ] = useState(
    "",
  );


  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );


  const [
    saving,
    setSaving,
  ] = useState(
    false,
  );


  const [
    deletingId,
    setDeletingId,
  ] = useState<
    string | null
  >(
    null,
  );


  const [
    duplicatingId,
    setDuplicatingId,
  ] = useState<
    string | null
  >(
    null,
  );


  const [
    error,
    setError,
  ] = useState(
    "",
  );


  /* =======================================================
     LOAD PLAYBOOK
  ======================================================= */

  async function loadSetups() {
    try {
      setLoading(
        true,
      );


      setError(
        "",
      );


      const response =
        await api(
          "/playbook",
        );


      if (
        !response.ok
      ) {
        const details =
          await response
            .json()
            .catch(
              () => null,
            );


        throw new Error(
          typeof details?.detail
          === "string"
            ? details.detail
            : "Could not load your playbook.",
        );
      }


      const data:
        PlaybookSetupApi[] =
        await response
          .json();


      setSetups(
        data.map(
          mapApiSetup,
        ),
      );

    } catch (
      err
    ) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );

    } finally {
      setLoading(
        false,
      );
    }
  }


  useEffect(
    () => {
      void loadSetups();
    },
    [],
  );


  /* =======================================================
     SEARCH
  ======================================================= */

  const filteredSetups =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLowerCase();


        if (
          !query
        ) {
          return setups;
        }


        return setups.filter(
          (
            setup,
          ) => {
            const searchable =
              [
                setup.name,
                setup.description,
                setup.marketCondition,
                setup.timeframe,
                ...setup.entryRules,
                ...setup.invalidationRules,
                ...setup.targetRules,
                ...setup.confirmations,
                ...setup.mistakesToAvoid,
              ]
                .join(
                  " ",
                )
                .toLowerCase();


            return searchable.includes(
              query,
            );
          },
        );
      },
      [
        setups,
        search,
      ],
    );


  /* =======================================================
     METRICS
  ======================================================= */

  const playbookMetrics =
    useMemo(
      () => {
        const averageRisk =
          setups.length
          > 0
            ? setups.reduce(
                (
                  total,
                  setup,
                ) =>
                  total
                  + setup.maxRiskPercent,
                0,
              )
              / setups.length
            : null;


        const entryRules =
          setups.reduce(
            (
              total,
              setup,
            ) =>
              total
              + setup.entryRules.length,
            0,
          );


        const confirmations =
          setups.reduce(
            (
              total,
              setup,
            ) =>
              total
              + setup.confirmations.length,
            0,
          );


        const invalidationRules =
          setups.reduce(
            (
              total,
              setup,
            ) =>
              total
              + setup.invalidationRules.length,
            0,
          );


        return {
          averageRisk,
          entryRules,
          confirmations,
          invalidationRules,
        };
      },
      [
        setups,
      ],
    );


  /* =======================================================
     FORM HELPERS
  ======================================================= */

  function updateField(
    field:
      Exclude<
        keyof PlaybookForm,
        RuleField
      >,

    value:
      string,
  ) {
    setForm(
      (
        current,
      ) => ({
        ...current,

        [field]:
          value,
      }),
    );
  }


  function updateListItem(
    field:
      RuleField,

    index:
      number,

    value:
      string,
  ) {
    setForm(
      (
        current,
      ) => ({
        ...current,

        [field]:
          current[
            field
          ].map(
            (
              item,
              itemIndex,
            ) =>
              itemIndex
              === index
                ? value
                : item,
          ),
      }),
    );
  }


  function addListItem(
    field:
      RuleField,
  ) {
    setForm(
      (
        current,
      ) => ({
        ...current,

        [field]: [
          ...current[
            field
          ],

          "",
        ],
      }),
    );
  }


  function removeListItem(
    field:
      RuleField,

    index:
      number,
  ) {
    setForm(
      (
        current,
      ) => {
        const next =
          current[
            field
          ].filter(
            (
              _,
              itemIndex,
            ) =>
              itemIndex
              !== index,
          );


        return {
          ...current,

          [field]:
            next.length
            > 0
              ? next
              : [""],
        };
      },
    );
  }


  function openNewSetup() {
    setEditingId(
      null,
    );


    setForm(
      createEmptyForm(),
    );


    setError(
      "",
    );


    setShowForm(
      true,
    );
  }


  function closeForm() {
    setShowForm(
      false,
    );


    setEditingId(
      null,
    );


    setError(
      "",
    );


    setForm(
      createEmptyForm(),
    );
  }


  function startEditing(
    setup:
      PlaybookSetup,
  ) {
    setEditingId(
      setup.id,
    );


    setForm(
      setupToForm(
        setup,
      ),
    );


    setSelectedSetup(
      null,
    );


    setError(
      "",
    );


    setShowForm(
      true,
    );


    window.scrollTo({
      top:
        0,

      behavior:
        "smooth",
    });
  }


  /* =======================================================
     CREATE / UPDATE
  ======================================================= */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    try {
      setSaving(
        true,
      );


      setError(
        "",
      );


      const name =
        form.name
          .trim();


      if (
        !name
      ) {
        throw new Error(
          "Enter a setup name.",
        );
      }


      const risk =
        Number(
          form.maxRiskPercent,
        );


      if (
        !Number.isFinite(
          risk,
        )
        || risk < 0
      ) {
        throw new Error(
          "Enter a valid maximum risk percentage.",
        );
      }


      const entryRules =
        normalizeRules(
          form.entryRules,
        );


      const invalidationRules =
        normalizeRules(
          form.invalidationRules,
        );


      if (
        entryRules.length
        === 0
      ) {
        throw new Error(
          "Add at least one entry rule.",
        );
      }


      if (
        invalidationRules.length
        === 0
      ) {
        throw new Error(
          "Add at least one invalidation rule.",
        );
      }


      const payload = {
        name,

        description:
          form.description
            .trim(),

        market_condition:
          form.marketCondition,

        timeframe:
          form.timeframe,

        max_risk_percent:
          risk,

        entry_rules:
          entryRules,

        invalidation_rules:
          invalidationRules,

        target_rules:
          normalizeRules(
            form.targetRules,
          ),

        confirmations:
          normalizeRules(
            form.confirmations,
          ),

        mistakes_to_avoid:
          normalizeRules(
            form.mistakesToAvoid,
          ),
      };


      const isEditing =
        editingId
        !== null;


      const response =
        await api(
          isEditing
            ? `/playbook/${editingId}`
            : "/playbook",

          {
            method:
              isEditing
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload,
              ),
          },
        );


      if (
        !response.ok
      ) {
        const details =
          await response
            .json()
            .catch(
              () => null,
            );


        throw new Error(
          typeof details?.detail
          === "string"
            ? details.detail
            : "Could not save setup.",
        );
      }


      const data:
        PlaybookSetupApi =
        await response
          .json();


      const savedSetup =
        mapApiSetup(
          data,
        );


      if (
        isEditing
      ) {
        setSetups(
          (
            current,
          ) =>
            current
              .map(
                (
                  setup,
                ) =>
                  setup.id
                  === savedSetup.id
                    ? savedSetup
                    : setup,
              )
              .sort(
                (
                  a,
                  b,
                ) =>
                  new Date(
                    b.updatedAt,
                  ).getTime()
                  - new Date(
                    a.updatedAt,
                  ).getTime(),
              ),
        );

      } else {
        setSetups(
          (
            current,
          ) => [
            savedSetup,
            ...current,
          ],
        );
      }


      closeForm();

    } catch (
      err
    ) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );

    } finally {
      setSaving(
        false,
      );
    }
  }


  /* =======================================================
     DUPLICATE
  ======================================================= */

  async function duplicateSetup(
    setup:
      PlaybookSetup,
  ) {
    try {
      setDuplicatingId(
        setup.id,
      );


      setError(
        "",
      );


      const response =
        await api(
          `/playbook/${setup.id}/duplicate`,

          {
            method:
              "POST",
          },
        );


      if (
        !response.ok
      ) {
        const details =
          await response
            .json()
            .catch(
              () => null,
            );


        throw new Error(
          typeof details?.detail
          === "string"
            ? details.detail
            : "Could not duplicate setup.",
        );
      }


      const data:
        PlaybookSetupApi =
        await response
          .json();


      const copy =
        mapApiSetup(
          data,
        );


      setSetups(
        (
          current,
        ) => [
          copy,
          ...current,
        ],
      );

    } catch (
      err
    ) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );

    } finally {
      setDuplicatingId(
        null,
      );
    }
  }


  /* =======================================================
     DELETE
  ======================================================= */

  async function deleteSetup(
    setup:
      PlaybookSetup,
  ) {
    const confirmed =
      window.confirm(
        `Delete "${setup.name}" from your playbook?`,
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {
      setDeletingId(
        setup.id,
      );


      setError(
        "",
      );


      const response =
        await api(
          `/playbook/${setup.id}`,

          {
            method:
              "DELETE",
          },
        );


      if (
        !response.ok
      ) {
        const details =
          await response
            .json()
            .catch(
              () => null,
            );


        throw new Error(
          typeof details?.detail
          === "string"
            ? details.detail
            : "Could not delete setup.",
        );
      }


      setSetups(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.id
              !== setup.id,
          ),
      );


      if (
        selectedSetup
          ?.id
        === setup.id
      ) {
        setSelectedSetup(
          null,
        );
      }


      if (
        editingId
        === setup.id
      ) {
        closeForm();
      }

    } catch (
      err
    ) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );

    } finally {
      setDeletingId(
        null,
      );
    }
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="flex min-h-screen bg-black text-white">

      <Sidebar
        active="Planning"
      />


      <main className="min-w-0 flex-1">

        <div className="mx-auto w-full max-w-[1800px] px-6 py-8 lg:px-10 lg:py-10">

          <PageHeader
            eyebrow="Trading system"

            title="Trading Playbook"

            description="Define repeatable setups before entering the market. Build clear entry, invalidation, target, confirmation and risk rules so every trade can be evaluated against a real process."

            actions={
              <button
                type="button"

                onClick={
                  showForm
                    ? closeForm
                    : openNewSetup
                }

                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                  showForm
                    ? "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {
                  showForm
                    ? "Close setup editor"
                    : "+ New setup"
                }
              </button>
            }

            status={
              <>
                <StatusBadge
                  tone="positive"
                  dot
                >
                  Playbook ready
                </StatusBadge>


                <StatusBadge
                  tone="neutral"
                >
                  {
                    setups.length
                  }
                  {" setup"}
                  {
                    setups.length
                    === 1
                      ? ""
                      : "s"
                  }
                </StatusBadge>
              </>
            }
          />


          <PageSectionNav sections={PLAYBOOK_SECTIONS} />


          <div className="space-y-8">

            {/* ===========================================
                ERROR
            =========================================== */}

            {error
            && (
              <div className="rounded-2xl border border-red-900/60 bg-red-950/30 px-5 py-4 text-sm text-red-300">
                {
                  error
                }
              </div>
            )}


            {/* ===========================================
                LOADING
            =========================================== */}

            {loading
            ? (
                <PlaybookLoading />
              )

            : (
                <>

                  {/* =====================================
                      OVERVIEW
                  ===================================== */}

                  <section id="overview" className="scroll-mt-28">

                    <SectionHeading
                      eyebrow="Overview"
                      title="Playbook health"
                      description="A quick view of how much structure you have defined across your trading system."
                    />


                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

                      <MetricCard
                        label="Setups"

                        value={
                          setups.length
                            .toString()
                        }

                        detail="Saved trading setups"
                      />


                      <MetricCard
                        label="Avg max risk"

                        value={
                          playbookMetrics
                            .averageRisk
                          === null
                            ? "—"
                            : (
                                <span
                                  className={
                                    getRiskClass(
                                      playbookMetrics
                                        .averageRisk,
                                    )
                                  }
                                >
                                  {
                                    playbookMetrics
                                      .averageRisk
                                      .toFixed(
                                        2,
                                      )
                                  }
                                  %
                                </span>
                              )
                        }

                        detail="Average allowed risk"
                      />


                      <MetricCard
                        label="Entry rules"

                        value={
                          playbookMetrics
                            .entryRules
                            .toString()
                        }

                        detail="Defined entry conditions"
                      />


                      <MetricCard
                        label="Invalidation rules"

                        value={
                          playbookMetrics
                            .invalidationRules
                            .toString()
                        }

                        detail="Defined failure conditions"
                      />


                      <MetricCard
                        label="Confirmations"

                        value={
                          playbookMetrics
                            .confirmations
                            .toString()
                        }

                        detail="Supporting conditions"
                      />

                    </div>

                  </section>


                  {/* =====================================
                      EDITOR
                  ===================================== */}

                  {showForm
                  && (
                    <section id="editor" className="scroll-mt-28">

                      <SectionHeading
                        eyebrow={
                          editingId
                          !== null
                            ? "Editing setup"
                            : "Setup builder"
                        }

                        title={
                          editingId
                          !== null
                            ? "Refine your trading rules"
                            : "Build a repeatable setup"
                        }

                        description="Make each rule specific enough that after a trade closes, you can objectively determine whether you followed your plan."
                      />


                      <div className="mt-4">

                        <SetupForm
                          form={
                            form
                          }

                          editing={
                            editingId
                            !== null
                          }

                          saving={
                            saving
                          }

                          onSubmit={
                            handleSubmit
                          }

                          onCancel={
                            closeForm
                          }

                          updateField={
                            updateField
                          }

                          updateListItem={
                            updateListItem
                          }

                          addListItem={
                            addListItem
                          }

                          removeListItem={
                            removeListItem
                          }
                        />

                      </div>

                    </section>
                  )}


                  {/* =====================================
                      SETUP LIBRARY
                  ===================================== */}

                  <section id="setups" className="scroll-mt-28">

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                      <SectionHeading
                        eyebrow="Setup library"
                        title="Your repeatable setups"
                        description="These are the strategies you can later compare directly against your journaled trades and performance."
                      />


                      <div className="relative w-full lg:max-w-sm">

                        <input
                          value={
                            search
                          }

                          onChange={(
                            event,
                          ) =>
                            setSearch(
                              event.target.value,
                            )
                          }

                          placeholder="Search setups, rules or conditions..."

                          className="w-full rounded-xl border border-zinc-900 bg-zinc-950 px-4 py-3 pl-10 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-zinc-700"
                        />


                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-700">
                          ⌕
                        </span>

                      </div>

                    </div>


                    {setups.length
                    === 0 ? (
                      <Card
                        className="mt-5"
                      >

                        <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">

                          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-900 bg-black text-xl text-zinc-500">
                            +
                          </div>


                          <p className="mt-5 text-xl font-semibold text-zinc-200">
                            Build your first setup
                          </p>


                          <p className="mt-3 max-w-md text-sm leading-6 text-zinc-600">
                            Define the market conditions, entry rules,
                            invalidation criteria and risk that make a
                            trade valid before you put capital at risk.
                          </p>


                          <button
                            type="button"

                            onClick={
                              openNewSetup
                            }

                            className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                          >
                            Create your first setup
                          </button>

                        </div>

                      </Card>

                    ) : filteredSetups.length
                      === 0 ? (
                        <Card
                          className="mt-5"
                        >

                          <div className="flex min-h-52 flex-col items-center justify-center text-center">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-900 bg-black text-zinc-600">
                              ⌕
                            </div>


                            <p className="mt-4 font-medium text-zinc-300">
                              No setups match your search
                            </p>


                            <p className="mt-2 text-sm text-zinc-600">
                              Try another setup name, market condition,
                              timeframe or rule.
                            </p>

                          </div>

                        </Card>

                      ) : (
                        <div className="mt-5 grid gap-4 xl:grid-cols-2">

                          {filteredSetups.map(
                            (
                              setup,
                            ) => (
                              <SetupCard
                                key={
                                  setup.id
                                }

                                setup={
                                  setup
                                }

                                deleting={
                                  deletingId
                                  === setup.id
                                }

                                duplicating={
                                  duplicatingId
                                  === setup.id
                                }

                                onView={() =>
                                  setSelectedSetup(
                                    setup,
                                  )
                                }

                                onEdit={() =>
                                  startEditing(
                                    setup,
                                  )
                                }

                                onDuplicate={() =>
                                  void duplicateSetup(
                                    setup,
                                  )
                                }

                                onDelete={() =>
                                  void deleteSetup(
                                    setup,
                                  )
                                }
                              />
                            ),
                          )}

                        </div>
                      )}

                  </section>


                  {/* =====================================
                      PLAYBOOK PRINCIPLE
                  ===================================== */}

                  {setups.length
                  > 0
                  && (
                    <Card>

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        <div className="max-w-3xl">

                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-400">
                            Process first
                          </p>


                          <h2 className="mt-2 text-lg font-semibold text-zinc-200">
                            A setup should answer the trade before the market does
                          </h2>


                          <p className="mt-2 text-sm leading-6 text-zinc-600">
                            Before entering a position, you should already
                            know why the trade is valid, what confirms it,
                            where the idea becomes invalid and how much
                            capital you are willing to risk.
                          </p>

                        </div>


                        <StatusBadge
                          tone="info"
                        >
                          Plan → Execute → Review
                        </StatusBadge>

                      </div>

                    </Card>
                  )}

                </>
              )}

          </div>

        </div>

      </main>


      {/* ===============================================
          DETAIL MODAL
      =============================================== */}

      {selectedSetup
      && (
        <SetupModal
          setup={
            selectedSetup
          }

          onClose={() =>
            setSelectedSetup(
              null,
            )
          }

          onEdit={() =>
            startEditing(
              selectedSetup,
            )
          }
        />
      )}

    </div>
  );
}


/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div>

      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-blue-400">
        {
          eyebrow
        }
      </p>


      <h2 className="mt-2 text-xl font-semibold tracking-tight text-white">
        {
          title
        }
      </h2>


      {description
      && (
        <p className="mt-1.5 max-w-3xl text-sm leading-6 text-zinc-600">
          {
            description
          }
        </p>
      )}

    </div>
  );
}


/* =========================================================
   SETUP FORM
========================================================= */

function SetupForm({
  form,
  editing,
  saving,
  onSubmit,
  onCancel,
  updateField,
  updateListItem,
  addListItem,
  removeListItem,
}: {
  form:
    PlaybookForm;

  editing:
    boolean;

  saving:
    boolean;

  onSubmit:
    (
      event:
        FormEvent<HTMLFormElement>,
    ) => void;

  onCancel:
    () => void;

  updateField:
    (
      field:
        Exclude<
          keyof PlaybookForm,
          RuleField
        >,

      value:
        string,
    ) => void;

  updateListItem:
    (
      field:
        RuleField,

      index:
        number,

      value:
        string,
    ) => void;

  addListItem:
    (
      field:
        RuleField,
    ) => void;

  removeListItem:
    (
      field:
        RuleField,

      index:
        number,
    ) => void;
}) {
  return (
    <form
      onSubmit={
        onSubmit
      }
    >

      <Card
        title={
          editing
            ? "Setup details"
            : "Core setup"
        }

        description="Define the environment and risk limits for this strategy."
      >

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

          <Field
            label="Setup name"
            required
          >

            <input
              required

              value={
                form.name
              }

              onChange={(
                event,
              ) =>
                updateField(
                  "name",
                  event.target.value,
                )
              }

              placeholder="Breakout Retest"

              className="playbook-input"
            />

          </Field>


          <Field
            label="Market condition"
          >

            <select
              value={
                form.marketCondition
              }

              onChange={(
                event,
              ) =>
                updateField(
                  "marketCondition",
                  event.target.value,
                )
              }

              className="playbook-input"
            >

              {MARKET_CONDITIONS.map(
                (
                  condition,
                ) => (
                  <option
                    key={
                      condition
                    }

                    value={
                      condition
                    }
                  >
                    {
                      condition
                    }
                  </option>
                ),
              )}

            </select>

          </Field>


          <Field
            label="Preferred timeframe"
          >

            <select
              value={
                form.timeframe
              }

              onChange={(
                event,
              ) =>
                updateField(
                  "timeframe",
                  event.target.value,
                )
              }

              className="playbook-input"
            >

              {TIMEFRAMES.map(
                (
                  timeframe,
                ) => (
                  <option
                    key={
                      timeframe
                    }

                    value={
                      timeframe
                    }
                  >
                    {
                      timeframe
                    }
                  </option>
                ),
              )}

            </select>

          </Field>


          <Field
            label="Maximum risk %"
            required
          >

            <div className="relative">

              <input
                required

                type="number"

                min="0"

                step="0.01"

                value={
                  form.maxRiskPercent
                }

                onChange={(
                  event,
                ) =>
                  updateField(
                    "maxRiskPercent",
                    event.target.value,
                  )
                }

                className="playbook-input pr-10"
              />


              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-600">
                %
              </span>

            </div>

          </Field>

        </div>


        <Field
          label="Description"

          className="mt-5"
        >

          <textarea
            value={
              form.description
            }

            onChange={(
              event,
            ) =>
              updateField(
                "description",
                event.target.value,
              )
            }

            rows={
              3
            }

            placeholder="Describe the market behavior this setup is designed to capture..."

            className="playbook-input resize-none"
          />

        </Field>

      </Card>


      <div className="mt-4 grid gap-4 xl:grid-cols-2">

        <RuleEditor
          title="Entry rules"

          description="Conditions that must be true before entering the trade."

          field="entryRules"

          values={
            form.entryRules
          }

          tone="positive"

          required

          updateListItem={
            updateListItem
          }

          addListItem={
            addListItem
          }

          removeListItem={
            removeListItem
          }
        />


        <RuleEditor
          title="Invalidation rules"

          description="Conditions that prove the trade thesis is no longer valid."

          field="invalidationRules"

          values={
            form.invalidationRules
          }

          tone="negative"

          required

          updateListItem={
            updateListItem
          }

          addListItem={
            addListItem
          }

          removeListItem={
            removeListItem
          }
        />


        <RuleEditor
          title="Target rules"

          description="How profits should be managed or where targets should be placed."

          field="targetRules"

          values={
            form.targetRules
          }

          tone="info"

          updateListItem={
            updateListItem
          }

          addListItem={
            addListItem
          }

          removeListItem={
            removeListItem
          }
        />


        <RuleEditor
          title="Required confirmations"

          description="Supporting evidence that strengthens the setup before entry."

          field="confirmations"

          values={
            form.confirmations
          }

          tone="neutral"

          updateListItem={
            updateListItem
          }

          addListItem={
            addListItem
          }

          removeListItem={
            removeListItem
          }
        />

      </div>


      <div className="mt-4">

        <RuleEditor
          title="Mistakes to avoid"

          description="Behaviors or conditions that reduce the quality of this setup or invalidate execution."

          field="mistakesToAvoid"

          values={
            form.mistakesToAvoid
          }

          tone="warning"

          updateListItem={
            updateListItem
          }

          addListItem={
            addListItem
          }

          removeListItem={
            removeListItem
          }
        />

      </div>


      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

        <button
          type="button"

          onClick={
            onCancel
          }

          disabled={
            saving
          }

          className="rounded-xl border border-zinc-800 bg-zinc-950 px-5 py-3 text-sm font-semibold text-zinc-400 transition hover:border-zinc-700 hover:text-white disabled:opacity-50"
        >
          Cancel
        </button>


        <button
          type="submit"

          disabled={
            saving
          }

          className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {
            saving
              ? "Saving..."
              : editing
                ? "Save changes"
                : "Save setup"
          }
        </button>

      </div>


      <style jsx global>{`
        .playbook-input {
          width: 100%;
          min-height: 46px;
          border-radius: 0.75rem;
          border: 1px solid rgb(39 39 42);
          background: #000;
          padding: 0.75rem 1rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition:
            border-color 150ms ease,
            background-color 150ms ease;
        }

        .playbook-input:hover {
          border-color: rgb(63 63 70);
        }

        .playbook-input:focus {
          border-color: rgb(82 82 91);
          background: rgb(9 9 11);
        }

        .playbook-input::placeholder {
          color: rgb(63 63 70);
        }

        select.playbook-input {
          cursor: pointer;
        }
      `}</style>

    </form>
  );
}


/* =========================================================
   RULE EDITOR
========================================================= */

function RuleEditor({
  title,
  description,
  field,
  values,
  tone,
  required = false,
  updateListItem,
  addListItem,
  removeListItem,
}: {
  title:
    string;

  description:
    string;

  field:
    RuleField;

  values:
    string[];

  tone:
    RuleTone;

  required?:
    boolean;

  updateListItem:
    (
      field:
        RuleField,

      index:
        number,

      value:
        string,
    ) => void;

  addListItem:
    (
      field:
        RuleField,
    ) => void;

  removeListItem:
    (
      field:
        RuleField,

      index:
        number,
    ) => void;
}) {
  const toneClasses:
    Record<
      RuleTone,
      {
        border:
          string;

        badge:
          "neutral"
          | "positive"
          | "negative"
          | "warning"
          | "info";

        dot:
          string;
      }
    > = {
      positive: {
        border:
          "border-emerald-950/80",

        badge:
          "positive",

        dot:
          "bg-emerald-400",
      },

      negative: {
        border:
          "border-red-950/80",

        badge:
          "negative",

        dot:
          "bg-red-400",
      },

      warning: {
        border:
          "border-amber-950/80",

        badge:
          "warning",

        dot:
          "bg-amber-400",
      },

      info: {
        border:
          "border-blue-950/80",

        badge:
          "info",

        dot:
          "bg-blue-400",
      },

      neutral: {
        border:
          "border-zinc-900",

        badge:
          "neutral",

        dot:
          "bg-zinc-500",
      },
    };


  const styles =
    toneClasses[
      tone
    ];


  return (
    <Card
      className={
        styles.border
      }
    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <div className="flex items-center gap-2">

            <span
              className={`h-2 w-2 rounded-full ${styles.dot}`}
            />


            <h3 className="font-semibold text-zinc-200">
              {
                title
              }
            </h3>

          </div>


          <p className="mt-2 text-sm leading-6 text-zinc-600">
            {
              description
            }
          </p>

        </div>


        {required
        && (
          <StatusBadge
            tone={
              styles.badge
            }
          >
            Required
          </StatusBadge>
        )}

      </div>


      <div className="mt-5 space-y-2">

        {values.map(
          (
            value,
            index,
          ) => (
            <div
              key={
                index
              }

              className="group flex gap-2"
            >

              <div className="flex h-11 w-8 shrink-0 items-center justify-center text-xs font-medium text-zinc-700">
                {
                  index
                  + 1
                }
              </div>


              <input
                value={
                  value
                }

                onChange={(
                  event,
                ) =>
                  updateListItem(
                    field,
                    index,
                    event.target.value,
                  )
                }

                placeholder={
                  field
                  === "entryRules"
                    ? "Example: Price closes above resistance"

                    : field
                      === "invalidationRules"
                      ? "Example: Price closes back below breakout level"

                      : field
                        === "targetRules"
                        ? "Example: First target at previous resistance"

                        : field
                          === "confirmations"
                          ? "Example: Relative volume above average"

                          : "Example: Do not chase an extended entry"
                }

                className="min-w-0 flex-1 rounded-xl border border-zinc-900 bg-black px-4 py-3 text-sm text-white outline-none transition placeholder:text-zinc-700 hover:border-zinc-800 focus:border-zinc-700"
              />


              <button
                type="button"

                onClick={() =>
                  removeListItem(
                    field,
                    index,
                  )
                }

                aria-label={`Remove ${title} rule ${index + 1}`}

                className="rounded-xl border border-zinc-900 bg-black px-3 text-zinc-700 transition hover:border-red-900/70 hover:bg-red-950/20 hover:text-red-400"
              >
                ×
              </button>

            </div>
          ),
        )}

      </div>


      <button
        type="button"

        onClick={() =>
          addListItem(
            field,
          )
        }

        className="mt-4 rounded-lg border border-zinc-900 bg-black px-3 py-2 text-xs font-semibold text-zinc-500 transition hover:border-zinc-700 hover:text-white"
      >
        + Add rule
      </button>

    </Card>
  );
}


/* =========================================================
   SETUP CARD
========================================================= */

function SetupCard({
  setup,
  deleting,
  duplicating,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  setup:
    PlaybookSetup;

  deleting:
    boolean;

  duplicating:
    boolean;

  onView:
    () => void;

  onEdit:
    () => void;

  onDuplicate:
    () => void;

  onDelete:
    () => void;
}) {
  const totalRules =
    setup.entryRules.length
    + setup.invalidationRules.length
    + setup.targetRules.length
    + setup.confirmations.length
    + setup.mistakesToAvoid.length;


  return (
    <Card
      className="group transition-all hover:-translate-y-0.5 hover:border-zinc-700"
    >

      <div className="flex items-start justify-between gap-5">

        <div className="min-w-0">

          <div className="flex flex-wrap items-center gap-2">

            <StatusBadge
              tone={
                getConditionTone(
                  setup.marketCondition,
                )
              }
            >
              {
                setup.marketCondition
              }
            </StatusBadge>


            <StatusBadge
              tone="neutral"
            >
              {
                setup.timeframe
              }
            </StatusBadge>

          </div>


          <h3 className="mt-4 truncate text-xl font-semibold tracking-tight text-white">
            {
              setup.name
            }
          </h3>


          <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-6 text-zinc-600">
            {
              setup.description
              || "No description has been added to this setup yet."
            }
          </p>

        </div>


        <div className="shrink-0 rounded-xl border border-zinc-900 bg-black px-4 py-3 text-right">

          <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-zinc-700">
            Max risk
          </p>


          <p
            className={`mt-2 text-lg font-semibold ${getRiskClass(
              setup.maxRiskPercent,
            )}`}
          >
            {
              setup.maxRiskPercent
                .toFixed(
                  2,
                )
            }
            %
          </p>

        </div>

      </div>


      <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">

        <CardMetric
          label="Entry"
          value={
            setup.entryRules
              .length
              .toString()
          }
        />


        <CardMetric
          label="Invalidation"
          value={
            setup.invalidationRules
              .length
              .toString()
          }
        />


        <CardMetric
          label="Confirmations"
          value={
            setup.confirmations
              .length
              .toString()
          }
        />


        <CardMetric
          label="Total rules"
          value={
            totalRules
              .toString()
          }
        />

      </div>


      {setup.entryRules.length
      > 0
      && (
        <div className="mt-4 rounded-xl border border-emerald-950/70 bg-emerald-950/10 p-4">

          <div className="flex items-center gap-2">

            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />


            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600">
              Primary entry condition
            </p>

          </div>


          <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
            {
              setup.entryRules[
                0
              ]
            }
          </p>

        </div>
      )}


      <div className="mt-5 flex flex-wrap items-center gap-2">

        <button
          type="button"

          onClick={
            onView
          }

          className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200"
        >
          View setup
        </button>


        <button
          type="button"

          onClick={
            onEdit
          }

          className="rounded-lg border border-zinc-800 bg-black px-4 py-2 text-sm font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
        >
          Edit
        </button>


        <button
          type="button"

          disabled={
            duplicating
          }

          onClick={
            onDuplicate
          }

          className="rounded-lg border border-zinc-800 bg-black px-4 py-2 text-sm font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {
            duplicating
              ? "Duplicating..."
              : "Duplicate"
          }
        </button>


        <button
          type="button"

          disabled={
            deleting
          }

          onClick={
            onDelete
          }

          className="ml-auto rounded-lg border border-red-950 bg-red-950/10 px-4 py-2 text-sm font-medium text-red-500 transition hover:border-red-900 hover:bg-red-950/30 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {
            deleting
              ? "Deleting..."
              : "Delete"
          }
        </button>

      </div>


      <div className="mt-4 border-t border-zinc-900 pt-4">

        <p className="text-[10px] text-zinc-700">
          Updated{" "}
          {
            formatUpdatedDate(
              setup.updatedAt,
            )
          }
        </p>

      </div>

    </Card>
  );
}


/* =========================================================
   SETUP MODAL
========================================================= */

function SetupModal({
  setup,
  onClose,
  onEdit,
}: {
  setup:
    PlaybookSetup;

  onClose:
    () => void;

  onEdit:
    () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"

      onMouseDown={(
        event,
      ) => {
        if (
          event.target
          === event.currentTarget
        ) {
          onClose();
        }
      }}
    >

      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-zinc-800 bg-zinc-950 shadow-2xl">

        {/* HEADER */}

        <div className="sticky top-0 z-10 border-b border-zinc-900 bg-zinc-950/95 px-6 py-5 backdrop-blur">

          <div className="flex items-start justify-between gap-5">

            <div className="min-w-0">

              <div className="flex flex-wrap gap-2">

                <StatusBadge
                  tone={
                    getConditionTone(
                      setup.marketCondition,
                    )
                  }
                >
                  {
                    setup.marketCondition
                  }
                </StatusBadge>


                <StatusBadge
                  tone="neutral"
                >
                  {
                    setup.timeframe
                  }
                </StatusBadge>


                <StatusBadge
                  tone={
                    setup.maxRiskPercent
                    <= 1
                      ? "positive"
                      : setup.maxRiskPercent
                        <= 2
                        ? "warning"
                        : "negative"
                  }
                >
                  Max risk{" "}
                  {
                    setup.maxRiskPercent
                      .toFixed(
                        2,
                      )
                  }
                  %
                </StatusBadge>

              </div>


              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {
                  setup.name
                }
              </h2>


              <p className="mt-2 text-xs text-zinc-700">
                Updated{" "}
                {
                  formatUpdatedDate(
                    setup.updatedAt,
                  )
                }
              </p>

            </div>


            <button
              type="button"

              onClick={
                onClose
              }

              className="shrink-0 rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-500 transition hover:border-zinc-700 hover:text-white"
            >
              Close
            </button>

          </div>

        </div>


        {/* CONTENT */}

        <div className="space-y-6 p-6">

          {setup.description
          && (
            <Card
              title="Setup thesis"
              description="The market behavior this strategy is designed to capture."
            >

              <p className="text-sm leading-7 text-zinc-400">
                {
                  setup.description
                }
              </p>

            </Card>
          )}


          <div className="grid gap-4 xl:grid-cols-2">

            <RuleList
              title="Entry rules"

              description="Conditions required before entering."

              items={
                setup.entryRules
              }

              tone="positive"
            />


            <RuleList
              title="Invalidation rules"

              description="Conditions that prove the thesis wrong."

              items={
                setup.invalidationRules
              }

              tone="negative"
            />


            <RuleList
              title="Target rules"

              description="Guidelines for managing profitable trades."

              items={
                setup.targetRules
              }

              tone="info"
            />


            <RuleList
              title="Required confirmations"

              description="Supporting evidence expected before entry."

              items={
                setup.confirmations
              }

              tone="neutral"
            />

          </div>


          <RuleList
            title="Mistakes to avoid"

            description="Execution behaviors that weaken the setup."

            items={
              setup.mistakesToAvoid
            }

            tone="warning"
          />


          <div className="flex flex-col-reverse gap-3 border-t border-zinc-900 pt-6 sm:flex-row sm:justify-end">

            <button
              type="button"

              onClick={
                onClose
              }

              className="rounded-xl border border-zinc-800 bg-black px-5 py-3 text-sm font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
            >
              Close
            </button>


            <button
              type="button"

              onClick={
                onEdit
              }

              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
            >
              Edit setup
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   RULE LIST
========================================================= */

function RuleList({
  title,
  description,
  items,
  tone,
}: {
  title:
    string;

  description:
    string;

  items:
    string[];

  tone:
    RuleTone;
}) {
  const styles:
    Record<
      RuleTone,
      {
        dot:
          string;

        border:
          string;

        text:
          string;
      }
    > = {
      positive: {
        dot:
          "bg-emerald-400",

        border:
          "border-emerald-950/70",

        text:
          "text-emerald-500",
      },

      negative: {
        dot:
          "bg-red-400",

        border:
          "border-red-950/70",

        text:
          "text-red-500",
      },

      warning: {
        dot:
          "bg-amber-400",

        border:
          "border-amber-950/70",

        text:
          "text-amber-500",
      },

      info: {
        dot:
          "bg-blue-400",

        border:
          "border-blue-950/70",

        text:
          "text-blue-500",
      },

      neutral: {
        dot:
          "bg-zinc-500",

        border:
          "border-zinc-900",

        text:
          "text-zinc-500",
      },
    };


  const current =
    styles[
      tone
    ];


  return (
    <Card
      className={
        current.border
      }
    >

      <div className="flex items-start justify-between gap-4">

        <div>

          <h3 className="font-semibold text-zinc-200">
            {
              title
            }
          </h3>


          <p className="mt-1 text-xs leading-5 text-zinc-600">
            {
              description
            }
          </p>

        </div>


        <span
          className={`text-xs font-semibold ${current.text}`}
        >
          {
            items.length
          }
        </span>

      </div>


      {items.length
      === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-zinc-900 bg-black/30 px-4 py-6 text-center text-sm text-zinc-700">
          No rules added.
        </div>

      ) : (
        <div className="mt-5 space-y-2">

          {items.map(
            (
              item,
              index,
            ) => (
              <div
                key={
                  `${item}-${index}`
                }

                className="flex gap-3 rounded-xl border border-zinc-900 bg-black px-4 py-3"
              >

                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-zinc-900 bg-zinc-950">

                  <span
                    className={`h-1.5 w-1.5 rounded-full ${current.dot}`}
                  />

                </div>


                <p className="text-sm leading-6 text-zinc-400">
                  {
                    item
                  }
                </p>

              </div>
            ),
          )}

        </div>
      )}

    </Card>
  );
}


/* =========================================================
   FIELD
========================================================= */

function Field({
  label,
  children,
  className = "",
  required = false,
}: {
  label:
    string;

  children:
    ReactNode;

  className?:
    string;

  required?:
    boolean;
}) {
  return (
    <label
      className={`block ${className}`}
    >

      <span className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">

        {
          label
        }


        {required
        && (
          <span className="text-blue-500">
            *
          </span>
        )}

      </span>


      {
        children
      }

    </label>
  );
}


/* =========================================================
   CARD METRIC
========================================================= */

function CardMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-3">

      <p className="text-[9px] font-semibold uppercase tracking-[0.11em] text-zinc-700">
        {
          label
        }
      </p>


      <p className="mt-2 text-sm font-semibold text-zinc-300">
        {
          value
        }
      </p>

    </div>
  );
}


/* =========================================================
   LOADING
========================================================= */

function PlaybookLoading() {
  return (
    <div className="space-y-8">

      <div>

        <div className="h-3 w-24 animate-pulse rounded bg-zinc-900" />


        <div className="mt-3 h-7 w-52 animate-pulse rounded bg-zinc-900" />


        <div className="mt-3 h-4 w-96 max-w-full animate-pulse rounded bg-zinc-900" />

      </div>


      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

        {Array.from({
          length:
            5,
        }).map(
          (
            _,
            index,
          ) => (
            <div
              key={
                index
              }

              className="h-32 animate-pulse rounded-2xl border border-zinc-900 bg-zinc-950"
            />
          ),
        )}

      </div>


      <div className="grid gap-4 xl:grid-cols-2">

        {Array.from({
          length:
            4,
        }).map(
          (
            _,
            index,
          ) => (
            <div
              key={
                index
              }

              className="h-80 animate-pulse rounded-2xl border border-zinc-900 bg-zinc-950"
            />
          ),
        )}

      </div>

    </div>
  );
}