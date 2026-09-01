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
import Card from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import StatusBadge from "@/components/ui/StatusBadge";

import { api } from "@/lib/api";


/* =========================================================
   TYPES
========================================================= */

type Trade = {
  id: number;

  symbol: string;
  direction: string;

  entry_price: number;
  exit_price: number;

  stop_loss: number | null;
  target_price: number | null;

  position_size: number;
  risk_percent: number;

  strategy: string;
  custom_strategy: string;

  playbook_setup_id: string;
  playbook_setup_name: string;

  tags: string[];

  confidence: number;

  psychology_notes: string;
  lesson_learned: string;

  trade_time: string | null;
  created_at: string;
};


type PlaybookSetup = {
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


type TradeForm = {
  symbol: string;
  direction: string;

  entry_price: string;
  exit_price: string;

  stop_loss: string;
  target_price: string;

  position_size: string;
  risk_percent: string;

  strategy: string;
  custom_strategy: string;

  playbook_setup_id: string;

  tags: string[];

  confidence: string;

  trade_time: string;

  psychology_notes: string;
  lesson_learned: string;
};


type Tone =
  | "neutral"
  | "positive"
  | "negative"
  | "warning"
  | "info";


/* =========================================================
   CONSTANTS
========================================================= */

const emptyForm: TradeForm = {
  symbol: "",
  direction: "Long",

  entry_price: "",
  exit_price: "",

  stop_loss: "",
  target_price: "",

  position_size: "",
  risk_percent: "1",

  strategy: "",
  custom_strategy: "",

  playbook_setup_id: "",

  tags: [],

  confidence: "5",

  trade_time: "",

  psychology_notes: "",
  lesson_learned: "",
};


const STRATEGY_GROUPS = [
  {
    label: "Price Action",

    options: [
      "Breakout",
      "Breakdown",
      "Pullback",
      "Reversal",
      "Retest",
      "Fakeout",
    ],
  },

  {
    label: "Trend",

    options: [
      "Momentum",
      "Trend",
      "Continuation",
    ],
  },

  {
    label: "Mean Reversion",

    options: [
      "Range",
      "VWAP Reversion",
      "EMA Bounce",
    ],
  },

  {
    label: "Catalyst",

    options: [
      "News",
      "Gap & Go",
      "Earnings",
    ],
  },

  {
    label: "Execution",

    options: [
      "Scalp",
      "Swing",
      "Position",
    ],
  },

  {
    label: "Other",

    options: [
      "Custom",
    ],
  },
];


const AVAILABLE_TAGS = [
  "A+ Setup",
  "High Volume",
  "Low Volume",
  "VWAP",
  "EMA",
  "Opening Range",
  "News",
  "Earnings",
  "FOMO",
  "Revenge Trade",
  "Patient Entry",
  "Early Entry",
  "Late Entry",
  "Good Risk",
  "Poor Risk",
];


/* =========================================================
   HELPERS
========================================================= */

function normalizeTrade(
  trade: Trade,
): Trade {
  return {
    ...trade,

    stop_loss:
      trade.stop_loss
      ?? null,

    target_price:
      trade.target_price
      ?? null,

    custom_strategy:
      trade.custom_strategy
      ?? "",

    playbook_setup_id:
      trade.playbook_setup_id
      ?? "",

    playbook_setup_name:
      trade.playbook_setup_name
      ?? "",

    tags:
      trade.tags
      ?? [],

    psychology_notes:
      trade.psychology_notes
      ?? "",

    lesson_learned:
      trade.lesson_learned
      ?? "",

    trade_time:
      trade.trade_time
      ?? null,
  };
}


function calculatePnl(
  trade: Trade,
) {
  const difference =
    trade.direction
      .toLowerCase()
    === "short"
      ? trade.entry_price
        - trade.exit_price
      : trade.exit_price
        - trade.entry_price;


  return difference
    * trade.position_size;
}


function calculateRiskDollars(
  trade: Trade,
) {
  if (
    trade.stop_loss
    === null
  ) {
    return null;
  }


  const riskPerShare =
    Math.abs(
      trade.entry_price
      - trade.stop_loss,
    );


  if (
    riskPerShare
    <= 0
  ) {
    return null;
  }


  return riskPerShare
    * trade.position_size;
}


function calculateRMultiple(
  trade: Trade,
) {
  const riskDollars =
    calculateRiskDollars(
      trade,
    );


  if (
    riskDollars
    === null
    || riskDollars <= 0
  ) {
    return null;
  }


  return calculatePnl(
    trade,
  ) / riskDollars;
}


function calculatePlannedRewardRisk(
  trade: Trade,
) {
  if (
    trade.stop_loss
    === null
    || trade.target_price
    === null
  ) {
    return null;
  }


  const risk =
    Math.abs(
      trade.entry_price
      - trade.stop_loss,
    );


  const reward =
    Math.abs(
      trade.target_price
      - trade.entry_price,
    );


  if (
    risk <= 0
  ) {
    return null;
  }


  return reward / risk;
}


function formatMoney(
  value: number,
) {
  const prefix =
    value > 0
      ? "+"
      : value < 0
        ? "-"
        : "";


  return `${prefix}$${Math.abs(
    value,
  ).toFixed(
    2,
  )}`;
}


function formatPlainMoney(
  value: number,
) {
  return `$${Math.abs(
    value,
  ).toFixed(
    2,
  )}`;
}


function getStrategyName(
  trade: Trade,
) {
  if (
    trade.strategy
    === "Custom"
    && trade.custom_strategy
      .trim()
  ) {
    return trade
      .custom_strategy
      .trim();
  }


  return trade.strategy
    || "Unspecified";
}


function toDateTimeLocal(
  value:
    string
    | null,
) {
  if (
    !value
  ) {
    return "";
  }


  const date =
    new Date(
      value,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "";
  }


  const local =
    new Date(
      date.getTime()
      - date
        .getTimezoneOffset()
        * 60000,
    );


  return local
    .toISOString()
    .slice(
      0,
      16,
    );
}


function tradeToForm(
  trade: Trade,
): TradeForm {
  return {
    symbol:
      trade.symbol,

    direction:
      trade.direction,

    entry_price:
      String(
        trade.entry_price,
      ),

    exit_price:
      String(
        trade.exit_price,
      ),

    stop_loss:
      trade.stop_loss
      === null
        ? ""
        : String(
            trade.stop_loss,
          ),

    target_price:
      trade.target_price
      === null
        ? ""
        : String(
            trade.target_price,
          ),

    position_size:
      String(
        trade.position_size,
      ),

    risk_percent:
      String(
        trade.risk_percent,
      ),

    strategy:
      trade.strategy,

    custom_strategy:
      trade.custom_strategy
      ?? "",

    playbook_setup_id:
      trade.playbook_setup_id
      ?? "",

    tags:
      trade.tags
      ?? [],

    confidence:
      String(
        trade.confidence,
      ),

    trade_time:
      toDateTimeLocal(
        trade.trade_time,
      ),

    psychology_notes:
      trade.psychology_notes
      ?? "",

    lesson_learned:
      trade.lesson_learned
      ?? "",
  };
}


function getPnlTone(
  value: number,
): Tone {
  if (
    value > 0
  ) {
    return "positive";
  }


  if (
    value < 0
  ) {
    return "negative";
  }


  return "neutral";
}


function getPnlClass(
  value: number,
) {
  if (
    value > 0
  ) {
    return "text-emerald-400";
  }


  if (
    value < 0
  ) {
    return "text-red-400";
  }


  return "text-zinc-300";
}


function getDirectionTone(
  direction: string,
): Tone {
  return direction
    .toLowerCase()
  === "long"
    ? "positive"
    : "negative";
}


/* =========================================================
   PAGE
========================================================= */

export default function JournalPage() {
  const [
    trades,
    setTrades,
  ] = useState<
    Trade[]
  >(
    [],
  );


  const [
    playbookSetups,
    setPlaybookSetups,
  ] = useState<
    PlaybookSetup[]
  >(
    [],
  );


  const [
    form,
    setForm,
  ] = useState<
    TradeForm
  >(
    emptyForm,
  );


  const [
    editingTradeId,
    setEditingTradeId,
  ] = useState<
    number | null
  >(
    null,
  );


  const [
    selectedTrade,
    setSelectedTrade,
  ] = useState<
    Trade | null
  >(
    null,
  );


  const [
    search,
    setSearch,
  ] = useState(
    "",
  );


  const [
    strategyFilter,
    setStrategyFilter,
  ] = useState(
    "All",
  );


  const [
    playbookFilter,
    setPlaybookFilter,
  ] = useState(
    "All",
  );


  const [
    showForm,
    setShowForm,
  ] = useState(
    false,
  );


  const [
    loading,
    setLoading,
  ] = useState(
    true,
  );


  const [
    playbookLoading,
    setPlaybookLoading,
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
    number | null
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
     LOAD DATA
  ======================================================= */

  async function loadTrades() {
    try {
      setLoading(
        true,
      );


      const response =
        await api(
          "/trades",
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
            : "Could not load trades.",
        );
      }


      const data:
        Trade[] =
        await response
          .json();


      setTrades(
        data.map(
          normalizeTrade,
        ),
      );

    } catch (
      err
    ) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load trades.",
      );

    } finally {
      setLoading(
        false,
      );
    }
  }


  async function loadPlaybook() {
    try {
      setPlaybookLoading(
        true,
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
            : "Could not load Playbook setups.",
        );
      }


      const data:
        PlaybookSetup[] =
        await response
          .json();


      setPlaybookSetups(
        data,
      );

    } catch (
      err
    ) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load Playbook setups.",
      );

    } finally {
      setPlaybookLoading(
        false,
      );
    }
  }


  useEffect(
    () => {
      setError(
        "",
      );


      void Promise.all([
        loadTrades(),
        loadPlaybook(),
      ]);
    },
    [],
  );


  /* =======================================================
     LIVE PLAN METRICS
  ======================================================= */

  const livePlanMetrics =
    useMemo(
      () => {
        const entry =
          Number(
            form.entry_price,
          );


        const exit =
          Number(
            form.exit_price,
          );


        const stop =
          Number(
            form.stop_loss,
          );


        const target =
          Number(
            form.target_price,
          );


        const size =
          Number(
            form.position_size,
          );


        const hasEntry =
          Number.isFinite(
            entry,
          )
          && entry > 0;


        const hasExit =
          Number.isFinite(
            exit,
          )
          && exit > 0;


        const hasStop =
          form.stop_loss
            .trim()
          !== ""
          && Number.isFinite(
            stop,
          )
          && stop > 0;


        const hasTarget =
          form.target_price
            .trim()
          !== ""
          && Number.isFinite(
            target,
          )
          && target > 0;


        const hasSize =
          Number.isFinite(
            size,
          )
          && size > 0;


        const riskPerShare =
          hasEntry
          && hasStop
            ? Math.abs(
                entry
                - stop,
              )
            : null;


        const riskDollars =
          riskPerShare
          !== null
          && hasSize
            ? riskPerShare
              * size
            : null;


        const plannedRewardRisk =
          riskPerShare
          !== null
          && riskPerShare > 0
          && hasTarget
            ? Math.abs(
                target
                - entry,
              )
              / riskPerShare
            : null;


        let pnl:
          number
          | null = null;


        if (
          hasEntry
          && hasExit
          && hasSize
        ) {
          const difference =
            form.direction
              .toLowerCase()
            === "short"
              ? entry
                - exit
              : exit
                - entry;


          pnl =
            difference
            * size;
        }


        const rMultiple =
          pnl !== null
          && riskDollars
          !== null
          && riskDollars > 0
            ? pnl
              / riskDollars
            : null;


        return {
          riskPerShare,
          riskDollars,
          plannedRewardRisk,
          pnl,
          rMultiple,
        };
      },
      [
        form.entry_price,
        form.exit_price,
        form.stop_loss,
        form.target_price,
        form.position_size,
        form.direction,
      ],
    );


  /* =======================================================
     JOURNAL STATS
  ======================================================= */

  const journalStats =
    useMemo(
      () => {
        const results =
          trades.map(
            (
              trade,
            ) => ({
              trade,

              pnl:
                calculatePnl(
                  trade,
                ),
            }),
          );


        const totalPnl =
          results.reduce(
            (
              total,
              result,
            ) =>
              total
              + result.pnl,
            0,
          );


        const wins =
          results.filter(
            (
              result,
            ) =>
              result.pnl > 0,
          ).length;


        const losses =
          results.filter(
            (
              result,
            ) =>
              result.pnl < 0,
          ).length;


        const winRate =
          results.length > 0
            ? (
                wins
                / results.length
              ) * 100
            : 0;


        const rTrades =
          trades
            .map(
              (
                trade,
              ) =>
                calculateRMultiple(
                  trade,
                ),
            )
            .filter(
              (
                value,
              ): value is number =>
                value !== null,
            );


        const averageR =
          rTrades.length > 0
            ? rTrades.reduce(
                (
                  total,
                  value,
                ) =>
                  total
                  + value,
                0,
              )
              / rTrades.length
            : null;


        return {
          totalPnl,
          wins,
          losses,
          winRate,
          averageR,
        };
      },
      [
        trades,
      ],
    );


  /* =======================================================
     FILTER OPTIONS
  ======================================================= */

  const strategies =
    useMemo(
      () =>
        Array.from(
          new Set(
            trades
              .map(
                getStrategyName,
              )
              .filter(
                Boolean,
              ),
          ),
        )
          .sort(),
      [
        trades,
      ],
    );


  const journalPlaybooks =
    useMemo(
      () =>
        Array.from(
          new Set(
            trades
              .map(
                (
                  trade,
                ) =>
                  trade
                    .playbook_setup_name
                    .trim(),
              )
              .filter(
                Boolean,
              ),
          ),
        )
          .sort(),
      [
        trades,
      ],
    );


  const filteredTrades =
    useMemo(
      () => {
        const searchValue =
          search
            .trim()
            .toLowerCase();


        return trades.filter(
          (
            trade,
          ) => {
            const strategyName =
              getStrategyName(
                trade,
              );


            const matchesSearch =
              !searchValue
              || trade.symbol
                .toLowerCase()
                .includes(
                  searchValue,
                )
              || strategyName
                .toLowerCase()
                .includes(
                  searchValue,
                )
              || trade
                .playbook_setup_name
                .toLowerCase()
                .includes(
                  searchValue,
                )
              || trade.tags.some(
                (
                  tag,
                ) =>
                  tag
                    .toLowerCase()
                    .includes(
                      searchValue,
                    ),
              );


            const matchesStrategy =
              strategyFilter
              === "All"
              || strategyName
              === strategyFilter;


            const matchesPlaybook =
              playbookFilter
              === "All"
              || (
                playbookFilter
                === "None"
                && !trade
                  .playbook_setup_name
              )
              || trade
                .playbook_setup_name
              === playbookFilter;


            return (
              matchesSearch
              && matchesStrategy
              && matchesPlaybook
            );
          },
        );
      },
      [
        trades,
        search,
        strategyFilter,
        playbookFilter,
      ],
    );


  /* =======================================================
     FORM HELPERS
  ======================================================= */

  function updateForm(
    field:
      Exclude<
        keyof TradeForm,
        "tags"
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


  function toggleTag(
    tag: string,
  ) {
    setForm(
      (
        current,
      ) => ({
        ...current,

        tags:
          current.tags.includes(
            tag,
          )
            ? current.tags.filter(
                (
                  item,
                ) =>
                  item !== tag,
              )
            : [
                ...current.tags,
                tag,
              ],
      }),
    );
  }


  function openNewTradeForm() {
    setEditingTradeId(
      null,
    );


    setForm({
      ...emptyForm,

      tags: [],

      trade_time:
        toDateTimeLocal(
          new Date()
            .toISOString(),
        ),
    });


    setShowForm(
      true,
    );


    setError(
      "",
    );
  }


  function startEditing(
    trade: Trade,
  ) {
    setEditingTradeId(
      trade.id,
    );


    setForm(
      tradeToForm(
        trade,
      ),
    );


    setShowForm(
      true,
    );


    setError(
      "",
    );


    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }


  function closeForm() {
    setShowForm(
      false,
    );


    setEditingTradeId(
      null,
    );


    setForm({
      ...emptyForm,
      tags: [],
    });
  }


  /* =======================================================
     SAVE TRADE
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


      if (
        form.strategy
        === "Custom"
        && !form
          .custom_strategy
          .trim()
      ) {
        throw new Error(
          "Enter a custom strategy name.",
        );
      }


      const entryPrice =
        Number(
          form.entry_price,
        );


      const exitPrice =
        Number(
          form.exit_price,
        );


      const positionSize =
        Number(
          form.position_size,
        );


      const riskPercent =
        Number(
          form.risk_percent,
        );


      const confidence =
        Number(
          form.confidence,
        );


      const stopLoss =
        form.stop_loss
          .trim()
        === ""
          ? null
          : Number(
              form.stop_loss,
            );


      const targetPrice =
        form.target_price
          .trim()
        === ""
          ? null
          : Number(
              form.target_price,
            );


      if (
        !form.symbol
          .trim()
      ) {
        throw new Error(
          "Enter a symbol.",
        );
      }


      if (
        !Number.isFinite(
          entryPrice,
        )
        || entryPrice <= 0
      ) {
        throw new Error(
          "Enter a valid entry price.",
        );
      }


      if (
        !Number.isFinite(
          exitPrice,
        )
        || exitPrice <= 0
      ) {
        throw new Error(
          "Enter a valid exit price.",
        );
      }


      if (
        !Number.isFinite(
          positionSize,
        )
        || positionSize <= 0
      ) {
        throw new Error(
          "Enter a valid position size.",
        );
      }


      if (
        !Number.isFinite(
          riskPercent,
        )
        || riskPercent < 0
      ) {
        throw new Error(
          "Enter a valid risk percentage.",
        );
      }


      if (
        !Number.isFinite(
          confidence,
        )
        || confidence < 1
        || confidence > 10
      ) {
        throw new Error(
          "Confidence must be between 1 and 10.",
        );
      }


      if (
        stopLoss !== null
        && (
          !Number.isFinite(
            stopLoss,
          )
          || stopLoss <= 0
        )
      ) {
        throw new Error(
          "Enter a valid stop loss.",
        );
      }


      if (
        targetPrice !== null
        && (
          !Number.isFinite(
            targetPrice,
          )
          || targetPrice <= 0
        )
      ) {
        throw new Error(
          "Enter a valid target price.",
        );
      }


      if (
        form.direction
        === "Long"
      ) {
        if (
          stopLoss !== null
          && stopLoss
          >= entryPrice
        ) {
          throw new Error(
            "For a Long trade, the stop loss must be below the entry.",
          );
        }


        if (
          targetPrice !== null
          && targetPrice
          <= entryPrice
        ) {
          throw new Error(
            "For a Long trade, the target must be above the entry.",
          );
        }
      }


      if (
        form.direction
        === "Short"
      ) {
        if (
          stopLoss !== null
          && stopLoss
          <= entryPrice
        ) {
          throw new Error(
            "For a Short trade, the stop loss must be above the entry.",
          );
        }


        if (
          targetPrice !== null
          && targetPrice
          >= entryPrice
        ) {
          throw new Error(
            "For a Short trade, the target must be below the entry.",
          );
        }
      }


      let tradeTime:
        string
        | null = null;


      if (
        form.trade_time
      ) {
        const date =
          new Date(
            form.trade_time,
          );


        if (
          Number.isNaN(
            date.getTime(),
          )
        ) {
          throw new Error(
            "Enter a valid trade date and time.",
          );
        }


        tradeTime =
          date.toISOString();
      }


      const payload = {
        symbol:
          form.symbol
            .trim()
            .toUpperCase(),

        direction:
          form.direction,

        entry_price:
          entryPrice,

        exit_price:
          exitPrice,

        stop_loss:
          stopLoss,

        target_price:
          targetPrice,

        position_size:
          positionSize,

        risk_percent:
          riskPercent,

        strategy:
          form.strategy,

        custom_strategy:
          form.strategy
          === "Custom"
            ? form
                .custom_strategy
                .trim()
            : "",

        playbook_setup_id:
          form
            .playbook_setup_id
            .trim(),

        tags:
          form.tags,

        confidence,

        psychology_notes:
          form
            .psychology_notes
            .trim(),

        lesson_learned:
          form
            .lesson_learned
            .trim(),

        trade_time:
          tradeTime,
      };


      const isEditing =
        editingTradeId
        !== null;


      const response =
        await api(
          isEditing
            ? `/trades/${editingTradeId}`
            : "/trades",

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
            : "Could not save trade.",
        );
      }


      const savedTrade =
        normalizeTrade(
          await response
            .json(),
        );


      if (
        isEditing
      ) {
        setTrades(
          (
            current,
          ) =>
            current.map(
              (
                trade,
              ) =>
                trade.id
                === savedTrade.id
                  ? savedTrade
                  : trade,
            ),
        );

      } else {
        setTrades(
          (
            current,
          ) => [
            savedTrade,
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
     DELETE
  ======================================================= */

  async function deleteTrade(
    trade: Trade,
  ) {
    const confirmed =
      window.confirm(
        `Delete ${trade.symbol} from your journal?`,
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {
      setDeletingId(
        trade.id,
      );


      setError(
        "",
      );


      const response =
        await api(
          `/trades/${trade.id}`,

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
            : "Could not delete trade.",
        );
      }


      setTrades(
        (
          current,
        ) =>
          current.filter(
            (
              item,
            ) =>
              item.id
              !== trade.id,
          ),
      );


      if (
        editingTradeId
        === trade.id
      ) {
        closeForm();
      }


      if (
        selectedTrade
          ?.id
        === trade.id
      ) {
        setSelectedTrade(
          null,
        );
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
        active="Journal"
      />


      <main className="min-w-0 flex-1">

        <div className="mx-auto w-full max-w-[1800px] px-6 py-8 lg:px-10 lg:py-10">

          <PageHeader
            eyebrow="Execution review"

            title="Trade Journal"

            description="Record the complete trade from plan to execution. Connect trades to your Playbook, measure actual performance, capture psychology and turn every result into something you can review."

            actions={
              <button
                type="button"

                onClick={
                  showForm
                    ? closeForm
                    : openNewTradeForm
                }

                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                  showForm
                    ? "border border-zinc-800 bg-zinc-950 text-zinc-300 hover:border-zinc-700 hover:bg-zinc-900"
                    : "bg-white text-black hover:bg-zinc-200"
                }`}
              >
                {
                  showForm
                    ? "Close trade editor"
                    : "+ Log trade"
                }
              </button>
            }

            status={
              <>
                <StatusBadge
                  tone="positive"
                  dot
                >
                  Journal ready
                </StatusBadge>


                <StatusBadge
                  tone="neutral"
                >
                  {
                    trades.length
                  }
                  {" trade"}
                  {
                    trades.length
                    === 1
                      ? ""
                      : "s"
                  }
                </StatusBadge>
              </>
            }
          />


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
                STATS
            =========================================== */}

            <section>

              <SectionHeading
                eyebrow="Performance"
                title="Journal snapshot"
                description="A quick view of the performance currently recorded in your journal."
              />


              <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">

                <MetricCard
                  label="Recorded trades"

                  value={
                    trades.length
                      .toString()
                  }

                  detail="Total journal entries"
                />


                <MetricCard
                  label="Net P&L"

                  value={
                    <span
                      className={
                        getPnlClass(
                          journalStats.totalPnl,
                        )
                      }
                    >
                      {
                        formatMoney(
                          journalStats.totalPnl,
                        )
                      }
                    </span>
                  }

                  detail="Across all recorded trades"
                />


                <MetricCard
                  label="Win rate"

                  value={`${journalStats.winRate.toFixed(
                    1,
                  )}%`}

                  detail={`${journalStats.wins} wins · ${journalStats.losses} losses`}
                />


                <MetricCard
                  label="Average R"

                  value={
                    journalStats
                      .averageR
                    === null
                      ? "—"
                      : (
                          <span
                            className={
                              journalStats.averageR
                              > 0
                                ? "text-emerald-400"
                                : journalStats.averageR
                                  < 0
                                  ? "text-red-400"
                                  : "text-zinc-300"
                            }
                          >
                            {
                              journalStats.averageR
                              >= 0
                                ? "+"
                                : ""
                            }
                            {
                              journalStats.averageR
                                .toFixed(
                                  2,
                                )
                            }
                            R
                          </span>
                        )
                  }

                  detail="Average realized R-multiple"
                />


                <MetricCard
                  label="Playbook setups"

                  value={
                    playbookSetups.length
                      .toString()
                  }

                  detail="Available for trade tagging"
                />

              </div>

            </section>


            {/* ===========================================
                TRADE FORM
            =========================================== */}

            {showForm
            && (
              <section>

                <SectionHeading
                  eyebrow={
                    editingTradeId
                    === null
                      ? "New journal entry"
                      : "Editing journal entry"
                  }

                  title={
                    editingTradeId
                    === null
                      ? "Log a completed trade"
                      : "Update trade details"
                  }

                  description="Capture the plan, execution, risk, Playbook setup and post-trade review while the details are still fresh."
                />


                <form
                  onSubmit={
                    handleSubmit
                  }

                  className="mt-4 space-y-4"
                >

                  {/* =====================================
                      EXECUTION DETAILS
                  ===================================== */}

                  <Card
                    title="Execution details"
                    description="Identify the trade, strategy, position and context."
                  >

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

                      <FieldLabel
                        label="Symbol"
                        required
                      >

                        <input
                          required

                          value={
                            form.symbol
                          }

                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              "symbol",
                              event.target.value,
                            )
                          }

                          placeholder="AAPL"

                          className="journal-input uppercase"
                        />

                      </FieldLabel>


                      <FieldLabel
                        label="Direction"
                        required
                      >

                        <select
                          value={
                            form.direction
                          }

                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              "direction",
                              event.target.value,
                            )
                          }

                          className="journal-input"
                        >
                          <option value="Long">
                            Long
                          </option>

                          <option value="Short">
                            Short
                          </option>
                        </select>

                      </FieldLabel>


                      <FieldLabel
                        label="Trade date & time"
                      >

                        <input
                          type="datetime-local"

                          value={
                            form.trade_time
                          }

                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              "trade_time",
                              event.target.value,
                            )
                          }

                          className="journal-input"
                        />

                      </FieldLabel>


                      <FieldLabel
                        label="Confidence"
                        description="1–10"
                        required
                      >

                        <input
                          required

                          type="number"

                          min="1"

                          max="10"

                          value={
                            form.confidence
                          }

                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              "confidence",
                              event.target.value,
                            )
                          }

                          className="journal-input"
                        />

                      </FieldLabel>


                      <FieldLabel
                        label="Strategy"
                        required
                      >

                        <select
                          required

                          value={
                            form.strategy
                          }

                          onChange={(
                            event,
                          ) => {
                            const value =
                              event.target.value;


                            setForm(
                              (
                                current,
                              ) => ({
                                ...current,

                                strategy:
                                  value,

                                custom_strategy:
                                  value
                                  === "Custom"
                                    ? current
                                        .custom_strategy
                                    : "",
                              }),
                            );
                          }}

                          className="journal-input"
                        >

                          <option
                            value=""
                            disabled
                          >
                            Select a strategy
                          </option>


                          {STRATEGY_GROUPS.map(
                            (
                              group,
                            ) => (
                              <optgroup
                                key={
                                  group.label
                                }

                                label={
                                  group.label
                                }
                              >

                                {group.options.map(
                                  (
                                    option,
                                  ) => (
                                    <option
                                      key={
                                        option
                                      }

                                      value={
                                        option
                                      }
                                    >
                                      {
                                        option
                                      }
                                    </option>
                                  ),
                                )}

                              </optgroup>
                            ),
                          )}

                        </select>

                      </FieldLabel>


                      <FieldLabel
                        label="Playbook setup"

                        description={
                          playbookLoading
                            ? "Loading setups..."
                            : playbookSetups.length
                              === 0
                              ? "No setups available"
                              : "Optional"
                        }
                      >

                        <select
                          value={
                            form.playbook_setup_id
                          }

                          disabled={
                            playbookLoading
                          }

                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              "playbook_setup_id",
                              event.target.value,
                            )
                          }

                          className="journal-input disabled:cursor-not-allowed disabled:opacity-50"
                        >

                          <option value="">
                            No Playbook setup
                          </option>


                          {playbookSetups.map(
                            (
                              setup,
                            ) => (
                              <option
                                key={
                                  setup.id
                                }

                                value={
                                  setup.id
                                }
                              >
                                {
                                  setup.name
                                }
                                {" · "}
                                {
                                  setup.market_condition
                                }
                                {" · "}
                                {
                                  setup.timeframe
                                }
                              </option>
                            ),
                          )}

                        </select>

                      </FieldLabel>


                      <FieldLabel
                        label="Risk percent"
                        required
                      >

                        <div className="relative">

                          <input
                            required

                            type="number"

                            min="0"

                            step="any"

                            value={
                              form.risk_percent
                            }

                            onChange={(
                              event,
                            ) =>
                              updateForm(
                                "risk_percent",
                                event.target.value,
                              )
                            }

                            className="journal-input pr-10"
                          />


                          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-600">
                            %
                          </span>

                        </div>

                      </FieldLabel>


                      <FieldLabel
                        label="Position size"
                        required
                      >

                        <input
                          required

                          type="number"

                          min="0.000001"

                          step="any"

                          value={
                            form.position_size
                          }

                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              "position_size",
                              event.target.value,
                            )
                          }

                          className="journal-input"
                        />

                      </FieldLabel>


                      {form.strategy
                      === "Custom"
                      && (
                        <div className="md:col-span-2 xl:col-span-4">

                          <FieldLabel
                            label="Custom strategy"
                            required
                          >

                            <input
                              required

                              value={
                                form.custom_strategy
                              }

                              onChange={(
                                event,
                              ) =>
                                updateForm(
                                  "custom_strategy",
                                  event.target.value,
                                )
                              }

                              placeholder="Enter your strategy name"

                              className="journal-input"
                            />

                          </FieldLabel>

                        </div>
                      )}

                    </div>


                    {form.playbook_setup_id
                    && (
                      <SelectedPlaybookSummary
                        setup={
                          playbookSetups.find(
                            (
                              setup,
                            ) =>
                              setup.id
                              === form.playbook_setup_id,
                          )
                          ?? null
                        }
                      />
                    )}

                  </Card>


                  {/* =====================================
                      TRADE PLAN
                  ===================================== */}

                  <Card
                    title="Plan vs actual"
                    description="Stop and target are optional, but adding them unlocks planned reward-to-risk and realized R analysis."
                  >

                    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">

                      <FieldLabel
                        label="Entry price"
                        required
                      >

                        <input
                          required

                          type="number"

                          min="0"

                          step="any"

                          value={
                            form.entry_price
                          }

                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              "entry_price",
                              event.target.value,
                            )
                          }

                          className="journal-input"
                        />

                      </FieldLabel>


                      <FieldLabel
                        label="Stop loss"
                        description="Optional"
                      >

                        <input
                          type="number"

                          min="0"

                          step="any"

                          value={
                            form.stop_loss
                          }

                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              "stop_loss",
                              event.target.value,
                            )
                          }

                          className="journal-input"
                        />

                      </FieldLabel>


                      <FieldLabel
                        label="Target price"
                        description="Optional"
                      >

                        <input
                          type="number"

                          min="0"

                          step="any"

                          value={
                            form.target_price
                          }

                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              "target_price",
                              event.target.value,
                            )
                          }

                          className="journal-input"
                        />

                      </FieldLabel>


                      <FieldLabel
                        label="Exit price"
                        required
                      >

                        <input
                          required

                          type="number"

                          min="0"

                          step="any"

                          value={
                            form.exit_price
                          }

                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              "exit_price",
                              event.target.value,
                            )
                          }

                          className="journal-input"
                        />

                      </FieldLabel>

                    </div>


                    <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">

                      <PlanMetric
                        label="Risk / share"

                        value={
                          livePlanMetrics
                            .riskPerShare
                          === null
                            ? "—"
                            : formatPlainMoney(
                                livePlanMetrics
                                  .riskPerShare,
                              )
                        }
                      />


                      <PlanMetric
                        label="Risk dollars"

                        value={
                          livePlanMetrics
                            .riskDollars
                          === null
                            ? "—"
                            : formatPlainMoney(
                                livePlanMetrics
                                  .riskDollars,
                              )
                        }
                      />


                      <PlanMetric
                        label="Planned R:R"

                        value={
                          livePlanMetrics
                            .plannedRewardRisk
                          === null
                            ? "—"
                            : `${livePlanMetrics.plannedRewardRisk.toFixed(
                                2,
                              )}:1`
                        }

                        tone={
                          livePlanMetrics
                            .plannedRewardRisk
                          === null
                            ? "neutral"
                            : livePlanMetrics
                                .plannedRewardRisk
                                >= 2
                              ? "positive"
                              : livePlanMetrics
                                  .plannedRewardRisk
                                  >= 1
                                ? "warning"
                                : "negative"
                        }
                      />


                      <PlanMetric
                        label="Actual P&L"

                        value={
                          livePlanMetrics
                            .pnl
                          === null
                            ? "—"
                            : formatMoney(
                                livePlanMetrics
                                  .pnl,
                              )
                        }

                        tone={
                          livePlanMetrics
                            .pnl
                          === null
                            ? "neutral"
                            : getPnlTone(
                                livePlanMetrics
                                  .pnl,
                              )
                        }
                      />


                      <PlanMetric
                        label="Actual result"

                        value={
                          livePlanMetrics
                            .rMultiple
                          === null
                            ? "—"
                            : `${
                                livePlanMetrics
                                  .rMultiple
                                >= 0
                                  ? "+"
                                  : ""
                              }${livePlanMetrics.rMultiple.toFixed(
                                2,
                              )}R`
                        }

                        tone={
                          livePlanMetrics
                            .rMultiple
                          === null
                            ? "neutral"
                            : getPnlTone(
                                livePlanMetrics
                                  .rMultiple,
                              )
                        }
                      />

                    </div>

                  </Card>


                  {/* =====================================
                      TAGS
                  ===================================== */}

                  <Card
                    title="Trade context"
                    description="Tags make recurring execution patterns easier to find later in Analytics."
                  >

                    <div className="flex items-center justify-between gap-4">

                      <p className="text-xs text-zinc-600">
                        Select every tag that meaningfully describes this trade.
                      </p>


                      <StatusBadge
                        tone="neutral"
                      >
                        {
                          form.tags.length
                        }
                        {" selected"}
                      </StatusBadge>

                    </div>


                    <div className="mt-5 flex flex-wrap gap-2">

                      {AVAILABLE_TAGS.map(
                        (
                          tag,
                        ) => {
                          const selected =
                            form.tags.includes(
                              tag,
                            );


                          return (
                            <button
                              key={
                                tag
                              }

                              type="button"

                              onClick={() =>
                                toggleTag(
                                  tag,
                                )
                              }

                              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                                selected
                                  ? "border-blue-800 bg-blue-950/40 text-blue-300"
                                  : "border-zinc-900 bg-black text-zinc-500 hover:border-zinc-700 hover:text-white"
                              }`}
                            >
                              {
                                tag
                              }
                            </button>
                          );
                        },
                      )}

                    </div>

                  </Card>


                  {/* =====================================
                      REVIEW
                  ===================================== */}

                  <Card
                    title="Post-trade review"
                    description="Separate emotional state from the objective lesson you want to carry into the next trade."
                  >

                    <div className="grid gap-5 md:grid-cols-2">

                      <FieldLabel
                        label="Psychology notes"
                        description="What were you thinking or feeling?"
                      >

                        <textarea
                          value={
                            form.psychology_notes
                          }

                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              "psychology_notes",
                              event.target.value,
                            )
                          }

                          rows={
                            5
                          }

                          placeholder="Example: I felt rushed after missing the first entry..."

                          className="journal-input resize-none"
                        />

                      </FieldLabel>


                      <FieldLabel
                        label="Lesson learned"
                        description="What would you repeat or change?"
                      >

                        <textarea
                          value={
                            form.lesson_learned
                          }

                          onChange={(
                            event,
                          ) =>
                            updateForm(
                              "lesson_learned",
                              event.target.value,
                            )
                          }

                          rows={
                            5
                          }

                          placeholder="Example: Wait for confirmation instead of chasing..."

                          className="journal-input resize-none"
                        />

                      </FieldLabel>

                    </div>

                  </Card>


                  {/* =====================================
                      ACTIONS
                  ===================================== */}

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                    <button
                      type="button"

                      onClick={
                        closeForm
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
                          : editingTradeId
                            === null
                            ? "Save trade"
                            : "Save changes"
                      }
                    </button>

                  </div>

                </form>

              </section>
            )}


            {/* ===========================================
                JOURNAL HISTORY
            =========================================== */}

            <section>

              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                <SectionHeading
                  eyebrow="Journal history"
                  title="Recorded trades"
                  description="Search, filter and review your trading history by symbol, strategy, Playbook setup or tag."
                />


                <StatusBadge
                  tone="neutral"
                >
                  {
                    filteredTrades.length
                  }
                  {" of "}
                  {
                    trades.length
                  }
                </StatusBadge>

              </div>


              <Card
                className="mt-4"
                padding="none"
              >

                <div className="border-b border-zinc-900 p-5">

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">

                    <div className="relative">

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

                        placeholder="Search symbol, strategy, playbook or tag..."

                        className="journal-input pl-10"
                      />


                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-700">
                        ⌕
                      </span>

                    </div>


                    <select
                      value={
                        strategyFilter
                      }

                      onChange={(
                        event,
                      ) =>
                        setStrategyFilter(
                          event.target.value,
                        )
                      }

                      className="journal-input"
                    >

                      <option value="All">
                        All strategies
                      </option>


                      {strategies.map(
                        (
                          strategy,
                        ) => (
                          <option
                            key={
                              strategy
                            }

                            value={
                              strategy
                            }
                          >
                            {
                              strategy
                            }
                          </option>
                        ),
                      )}

                    </select>


                    <select
                      value={
                        playbookFilter
                      }

                      onChange={(
                        event,
                      ) =>
                        setPlaybookFilter(
                          event.target.value,
                        )
                      }

                      className="journal-input"
                    >

                      <option value="All">
                        All Playbook setups
                      </option>

                      <option value="None">
                        No Playbook setup
                      </option>


                      {journalPlaybooks.map(
                        (
                          playbook,
                        ) => (
                          <option
                            key={
                              playbook
                            }

                            value={
                              playbook
                            }
                          >
                            {
                              playbook
                            }
                          </option>
                        ),
                      )}

                    </select>

                  </div>

                </div>


                {loading
                ? (
                    <JournalLoading />
                  )

                : filteredTrades.length
                  === 0
                  ? (
                      <div className="flex min-h-64 flex-col items-center justify-center px-6 text-center">

                        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-900 bg-black text-zinc-600">
                          ↗
                        </div>


                        <p className="mt-4 font-medium text-zinc-300">
                          {
                            trades.length
                            === 0
                              ? "No trades recorded yet"
                              : "No matching trades"
                          }
                        </p>


                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-600">
                          {
                            trades.length
                            === 0
                              ? "Log your first completed trade to begin building a reviewable performance history."

                              : "Try changing your search, strategy filter or Playbook filter."
                          }
                        </p>


                        {trades.length
                        === 0
                        && (
                          <button
                            type="button"

                            onClick={
                              openNewTradeForm
                            }

                            className="mt-5 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-zinc-200"
                          >
                            Log first trade
                          </button>
                        )}

                      </div>

                    )

                  : (
                      <div className="overflow-x-auto">

                        <table className="w-full min-w-[1380px] text-left">

                          <thead className="border-b border-zinc-900 bg-black/40 text-[10px] font-semibold uppercase tracking-[0.13em] text-zinc-700">

                            <tr>

                              <th className="px-5 py-4">
                                Date
                              </th>

                              <th className="px-5 py-4">
                                Symbol
                              </th>

                              <th className="px-5 py-4">
                                Direction
                              </th>

                              <th className="px-5 py-4">
                                Strategy
                              </th>

                              <th className="px-5 py-4">
                                Playbook
                              </th>

                              <th className="px-5 py-4">
                                Confidence
                              </th>

                              <th className="px-5 py-4">
                                Entry
                              </th>

                              <th className="px-5 py-4">
                                Exit
                              </th>

                              <th className="px-5 py-4">
                                R
                              </th>

                              <th className="px-5 py-4">
                                P&L
                              </th>

                              <th className="px-5 py-4 text-right">
                                Actions
                              </th>

                            </tr>

                          </thead>


                          <tbody className="divide-y divide-zinc-900">

                            {filteredTrades.map(
                              (
                                trade,
                              ) => {
                                const pnl =
                                  calculatePnl(
                                    trade,
                                  );


                                const rMultiple =
                                  calculateRMultiple(
                                    trade,
                                  );


                                const displayDate =
                                  trade.trade_time
                                  ?? trade.created_at;


                                return (
                                  <tr
                                    key={
                                      trade.id
                                    }

                                    className="transition hover:bg-zinc-900/30"
                                  >

                                    <td className="px-5 py-4">

                                      <p className="text-sm text-zinc-400">
                                        {
                                          new Date(
                                            displayDate,
                                          )
                                            .toLocaleDateString(
                                              "en-CA",
                                            )
                                        }
                                      </p>


                                      <p className="mt-1 text-[11px] text-zinc-700">
                                        {
                                          new Date(
                                            displayDate,
                                          )
                                            .toLocaleTimeString(
                                              "en-CA",
                                              {
                                                hour:
                                                  "2-digit",

                                                minute:
                                                  "2-digit",
                                              },
                                            )
                                        }
                                      </p>

                                    </td>


                                    <td className="px-5 py-4">

                                      <button
                                        type="button"

                                        onClick={() =>
                                          setSelectedTrade(
                                            trade,
                                          )
                                        }

                                        className="font-semibold text-white transition hover:text-blue-400"
                                      >
                                        {
                                          trade.symbol
                                        }
                                      </button>

                                    </td>


                                    <td className="px-5 py-4">

                                      <StatusBadge
                                        tone={
                                          getDirectionTone(
                                            trade.direction,
                                          )
                                        }
                                      >
                                        {
                                          trade.direction
                                        }
                                      </StatusBadge>

                                    </td>


                                    <td className="px-5 py-4 text-sm text-zinc-300">
                                      {
                                        getStrategyName(
                                          trade,
                                        )
                                      }
                                    </td>


                                    <td className="px-5 py-4 text-sm">

                                      {trade.playbook_setup_name
                                      ? (
                                          <StatusBadge
                                            tone="info"
                                          >
                                            {
                                              trade.playbook_setup_name
                                            }
                                          </StatusBadge>
                                        )

                                      : (
                                          <span className="text-zinc-700">
                                            —
                                          </span>
                                        )}

                                    </td>


                                    <td className="px-5 py-4">

                                      <ConfidenceDisplay
                                        value={
                                          trade.confidence
                                        }
                                      />

                                    </td>


                                    <td className="px-5 py-4 text-sm text-zinc-300">
                                      $
                                      {
                                        trade.entry_price
                                          .toFixed(
                                            2,
                                          )
                                      }
                                    </td>


                                    <td className="px-5 py-4 text-sm text-zinc-300">
                                      $
                                      {
                                        trade.exit_price
                                          .toFixed(
                                            2,
                                          )
                                      }
                                    </td>


                                    <td
                                      className={`px-5 py-4 font-semibold ${
                                        rMultiple
                                        === null
                                          ? "text-zinc-700"
                                          : getPnlClass(
                                              rMultiple,
                                            )
                                      }`}
                                    >
                                      {
                                        rMultiple
                                        === null
                                          ? "—"
                                          : `${
                                              rMultiple
                                              >= 0
                                                ? "+"
                                                : ""
                                            }${rMultiple.toFixed(
                                              2,
                                            )}R`
                                      }
                                    </td>


                                    <td
                                      className={`px-5 py-4 font-semibold ${getPnlClass(
                                        pnl,
                                      )}`}
                                    >
                                      {
                                        formatMoney(
                                          pnl,
                                        )
                                      }
                                    </td>


                                    <td className="px-5 py-4">

                                      <div className="flex justify-end gap-2">

                                        <button
                                          type="button"

                                          onClick={() =>
                                            setSelectedTrade(
                                              trade,
                                            )
                                          }

                                          className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                                        >
                                          View
                                        </button>


                                        <button
                                          type="button"

                                          onClick={() =>
                                            startEditing(
                                              trade,
                                            )
                                          }

                                          className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-700 hover:text-white"
                                        >
                                          Edit
                                        </button>


                                        <button
                                          type="button"

                                          disabled={
                                            deletingId
                                            === trade.id
                                          }

                                          onClick={() =>
                                            void deleteTrade(
                                              trade,
                                            )
                                          }

                                          className="rounded-lg border border-red-950 bg-red-950/10 px-3 py-2 text-xs font-medium text-red-500 transition hover:border-red-900 hover:bg-red-950/30 disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                          {
                                            deletingId
                                            === trade.id
                                              ? "Deleting..."
                                              : "Delete"
                                          }
                                        </button>

                                      </div>

                                    </td>

                                  </tr>
                                );
                              },
                            )}

                          </tbody>

                        </table>

                      </div>
                    )}

              </Card>

            </section>

          </div>

        </div>

      </main>


      {/* ===============================================
          TRADE DETAILS MODAL
      =============================================== */}

      {selectedTrade
      && (
        <TradeDetailsModal
          trade={
            selectedTrade
          }

          onClose={() =>
            setSelectedTrade(
              null,
            )
          }

          onEdit={() => {
            const trade =
              selectedTrade;


            setSelectedTrade(
              null,
            );


            startEditing(
              trade,
            );
          }}
        />
      )}


      <style jsx global>{`
        .journal-input {
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

        .journal-input:hover {
          border-color: rgb(63 63 70);
        }

        .journal-input:focus {
          border-color: rgb(82 82 91);
          background: rgb(9 9 11);
        }

        .journal-input::placeholder {
          color: rgb(63 63 70);
        }

        select.journal-input {
          cursor: pointer;
        }
      `}</style>

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
   SELECTED PLAYBOOK
========================================================= */

function SelectedPlaybookSummary({
  setup,
}: {
  setup:
    PlaybookSetup
    | null;
}) {
  if (
    !setup
  ) {
    return null;
  }


  return (
    <div className="mt-5 rounded-xl border border-blue-950/80 bg-blue-950/15 p-4">

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <div className="flex flex-wrap items-center gap-2">

            <StatusBadge
              tone="info"
            >
              Selected Playbook
            </StatusBadge>


            <StatusBadge
              tone="neutral"
            >
              {
                setup.timeframe
              }
            </StatusBadge>

          </div>


          <p className="mt-3 font-semibold text-zinc-200">
            {
              setup.name
            }
          </p>


          <p className="mt-1 text-sm text-zinc-600">
            {
              setup.market_condition
            }
            {" · Max risk "}
            {
              setup.max_risk_percent
                .toFixed(
                  2,
                )
            }
            %
          </p>

        </div>


        <div className="grid grid-cols-2 gap-2">

          <MiniMetric
            label="Entry rules"
            value={
              setup.entry_rules
                .length
                .toString()
            }
          />


          <MiniMetric
            label="Confirmations"
            value={
              setup.confirmations
                .length
                .toString()
            }
          />

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   FIELD LABEL
========================================================= */

function FieldLabel({
  label,
  description,
  children,
  required = false,
}: {
  label: string;

  description?:
    string;

  children:
    ReactNode;

  required?:
    boolean;
}) {
  return (
    <label className="block">

      <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">

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


      {description
      && (
        <span className="mt-1 block text-xs text-zinc-700">
          {
            description
          }
        </span>
      )}


      <div className="mt-2">
        {
          children
        }
      </div>

    </label>
  );
}


/* =========================================================
   PLAN METRIC
========================================================= */

function PlanMetric({
  label,
  value,
  tone = "neutral",
}: {
  label: string;

  value: string;

  tone?:
    Tone;
}) {
  const valueClass =
    tone === "positive"
      ? "text-emerald-400"
      : tone === "negative"
        ? "text-red-400"
        : tone === "warning"
          ? "text-amber-400"
          : tone === "info"
            ? "text-blue-400"
            : "text-zinc-300";


  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-4">

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
        {
          label
        }
      </p>


      <p
        className={`mt-2 text-lg font-semibold ${valueClass}`}
      >
        {
          value
        }
      </p>

    </div>
  );
}


/* =========================================================
   MINI METRIC
========================================================= */

function MiniMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-lg border border-zinc-900 bg-black px-3 py-2">

      <p className="text-[9px] font-semibold uppercase tracking-[0.11em] text-zinc-700">
        {
          label
        }
      </p>


      <p className="mt-1 text-sm font-semibold text-zinc-300">
        {
          value
        }
      </p>

    </div>
  );
}


/* =========================================================
   CONFIDENCE
========================================================= */

function ConfidenceDisplay({
  value,
}: {
  value:
    number;
}) {
  const clamped =
    Math.max(
      1,
      Math.min(
        10,
        value,
      ),
    );


  const width =
    clamped
    * 10;


  return (
    <div className="w-24">

      <div className="flex items-center justify-between gap-2">

        <span className="text-xs font-semibold text-zinc-300">
          {
            value
          }
          /10
        </span>

      </div>


      <div className="mt-2 h-1 overflow-hidden rounded-full bg-zinc-900">

        <div
          className="h-full rounded-full bg-white"

          style={{
            width:
              `${width}%`,
          }}
        />

      </div>

    </div>
  );
}


/* =========================================================
   TRADE DETAILS MODAL
========================================================= */

function TradeDetailsModal({
  trade,
  onClose,
  onEdit,
}: {
  trade: Trade;

  onClose:
    () => void;

  onEdit:
    () => void;
}) {
  const pnl =
    calculatePnl(
      trade,
    );


  const riskDollars =
    calculateRiskDollars(
      trade,
    );


  const rMultiple =
    calculateRMultiple(
      trade,
    );


  const plannedRewardRisk =
    calculatePlannedRewardRisk(
      trade,
    );


  const displayDate =
    trade.trade_time
    ?? trade.created_at;


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

            <div>

              <div className="flex flex-wrap items-center gap-2">

                <StatusBadge
                  tone={
                    getDirectionTone(
                      trade.direction,
                    )
                  }
                >
                  {
                    trade.direction
                  }
                </StatusBadge>


                <StatusBadge
                  tone="neutral"
                >
                  {
                    getStrategyName(
                      trade,
                    )
                  }
                </StatusBadge>


                {trade.playbook_setup_name
                && (
                  <StatusBadge
                    tone="info"
                  >
                    {
                      trade.playbook_setup_name
                    }
                  </StatusBadge>
                )}

              </div>


              <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white">
                {
                  trade.symbol
                }
              </h2>


              <p className="mt-2 text-xs text-zinc-700">
                {
                  new Date(
                    displayDate,
                  )
                    .toLocaleString(
                      "en-CA",
                    )
                }
              </p>

            </div>


            <button
              type="button"

              onClick={
                onClose
              }

              className="rounded-lg border border-zinc-800 bg-black px-3 py-2 text-sm text-zinc-500 transition hover:border-zinc-700 hover:text-white"
            >
              Close
            </button>

          </div>

        </div>


        {/* CONTENT */}

        <div className="space-y-6 p-6">

          {/* RESULT HERO */}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <ModalMetric
              label="P&L"

              value={
                formatMoney(
                  pnl,
                )
              }

              valueClass={
                getPnlClass(
                  pnl,
                )
              }
            />


            <ModalMetric
              label="Actual R"

              value={
                rMultiple
                === null
                  ? "—"
                  : `${
                      rMultiple
                      >= 0
                        ? "+"
                        : ""
                    }${rMultiple.toFixed(
                      2,
                    )}R`
              }

              valueClass={
                rMultiple
                === null
                  ? "text-zinc-300"
                  : getPnlClass(
                      rMultiple,
                    )
              }
            />


            <ModalMetric
              label="Planned R:R"

              value={
                plannedRewardRisk
                === null
                  ? "—"
                  : `${plannedRewardRisk.toFixed(
                      2,
                    )}:1`
              }
            />


            <ModalMetric
              label="Confidence"

              value={`${trade.confidence}/10`}
            />

          </div>


          {/* EXECUTION */}

          <Card
            title="Execution"
            description="Recorded prices, size and risk."
          >

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

              <DetailMetric
                label="Entry"
                value={`$${trade.entry_price.toFixed(
                  2,
                )}`}
              />


              <DetailMetric
                label="Exit"
                value={`$${trade.exit_price.toFixed(
                  2,
                )}`}
              />


              <DetailMetric
                label="Stop"
                value={
                  trade.stop_loss
                  === null
                    ? "—"
                    : `$${trade.stop_loss.toFixed(
                        2,
                      )}`
                }
              />


              <DetailMetric
                label="Target"
                value={
                  trade.target_price
                  === null
                    ? "—"
                    : `$${trade.target_price.toFixed(
                        2,
                      )}`
                }
              />


              <DetailMetric
                label="Position size"
                value={
                  trade.position_size
                    .toString()
                }
              />


              <DetailMetric
                label="Risk %"
                value={`${trade.risk_percent}%`}
              />


              <DetailMetric
                label="Risk dollars"
                value={
                  riskDollars
                  === null
                    ? "—"
                    : formatPlainMoney(
                        riskDollars,
                      )
                }
              />


              <DetailMetric
                label="Strategy"
                value={
                  getStrategyName(
                    trade,
                  )
                }
              />

            </div>

          </Card>


          {/* PLAYBOOK */}

          <Card
            title="Playbook context"
          >

            {trade.playbook_setup_name
            ? (
                <div className="rounded-xl border border-blue-950/70 bg-blue-950/15 p-4">

                  <StatusBadge
                    tone="info"
                  >
                    Linked setup
                  </StatusBadge>


                  <p className="mt-3 font-semibold text-zinc-200">
                    {
                      trade.playbook_setup_name
                    }
                  </p>

                </div>

              )

            : (
                <div className="rounded-xl border border-dashed border-zinc-900 bg-black/30 p-5 text-sm text-zinc-600">
                  No Playbook setup was recorded for this trade.
                </div>
              )}

          </Card>


          {/* TAGS */}

          <Card
            title="Trade tags"
          >

            {trade.tags.length
            > 0 ? (
                <div className="flex flex-wrap gap-2">

                  {trade.tags.map(
                    (
                      tag,
                    ) => (
                      <StatusBadge
                        key={
                          tag
                        }

                        tone="info"
                      >
                        {
                          tag
                        }
                      </StatusBadge>
                    ),
                  )}

                </div>

              ) : (
                <p className="text-sm text-zinc-600">
                  No tags added.
                </p>
              )}

          </Card>


          {/* REVIEW */}

          <div className="grid gap-4 md:grid-cols-2">

            <TradeNote
              label="Psychology notes"

              value={
                trade.psychology_notes
              }

              fallback="No psychology notes added."
            />


            <TradeNote
              label="Lesson learned"

              value={
                trade.lesson_learned
              }

              fallback="No lesson added."
            />

          </div>


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
              Edit trade
            </button>

          </div>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   MODAL METRIC
========================================================= */

function ModalMetric({
  label,
  value,
  valueClass,
}: {
  label:
    string;

  value:
    string;

  valueClass?:
    string;
}) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-4">

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
        {
          label
        }
      </p>


      <p
        className={`mt-2 text-xl font-semibold ${
          valueClass
          ?? "text-white"
        }`}
      >
        {
          value
        }
      </p>

    </div>
  );
}


/* =========================================================
   DETAIL METRIC
========================================================= */

function DetailMetric({
  label,
  value,
}: {
  label:
    string;

  value:
    string;
}) {
  return (
    <div className="rounded-xl border border-zinc-900 bg-black p-4">

      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700">
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
   TRADE NOTE
========================================================= */

function TradeNote({
  label,
  value,
  fallback,
}: {
  label: string;

  value: string;

  fallback: string;
}) {
  return (
    <Card
      title={
        label
      }
    >

      <p className="whitespace-pre-wrap text-sm leading-7 text-zinc-400">
        {
          value
          || fallback
        }
      </p>

    </Card>
  );
}


/* =========================================================
   LOADING
========================================================= */

function JournalLoading() {
  return (
    <div>

      {Array.from({
        length:
          6,
      }).map(
        (
          _,
          index,
        ) => (
          <div
            key={
              index
            }

            className="h-20 animate-pulse border-b border-zinc-900 bg-black/20 last:border-b-0"
          />
        ),
      )}

    </div>
  );
}