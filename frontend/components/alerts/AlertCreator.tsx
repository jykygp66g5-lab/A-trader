"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";

import {
  ALERT_TYPE_OPTIONS,
  getAlertTypeOption,
} from "@/lib/alerts/constants";

import type {
  AlertFrequency,
  AlertType,
  CreateAlertInput,
} from "@/lib/alerts/types";


type AlertCreatorProps = {
  saving: boolean;

  initialSymbol?: string;

  lockSymbol?: boolean;

  onCreate: (
    input: CreateAlertInput,
  ) => Promise<unknown>;
};


export default function AlertCreator({
  saving,
  initialSymbol = "AAPL",
  lockSymbol = false,
  onCreate,
}: AlertCreatorProps) {
  const [
    symbol,
    setSymbol,
  ] = useState(
    initialSymbol
      .trim()
      .toUpperCase()
    || "AAPL",
  );

  const [
    alertType,
    setAlertType,
  ] = useState<AlertType>(
    "price_above",
  );

  const [
    threshold,
    setThreshold,
  ] = useState(
    "",
  );

  const [
    frequency,
    setFrequency,
  ] = useState<AlertFrequency>(
    "once",
  );

  const [
    localError,
    setLocalError,
  ] = useState<string | null>(
    null,
  );

  const [
    successMessage,
    setSuccessMessage,
  ] = useState<string | null>(
    null,
  );


  const selectedType =
    useMemo(
      () =>
        getAlertTypeOption(
          alertType,
        ),
      [
        alertType,
      ],
    );


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLocalError(
      null,
    );

    setSuccessMessage(
      null,
    );

    const normalizedSymbol =
      symbol
        .trim()
        .toUpperCase();

    const numericThreshold =
      Number(
        threshold,
      );

    if (
      !normalizedSymbol
    ) {
      setLocalError(
        "Enter a market symbol.",
      );

      return;
    }

    if (
      !threshold.trim()
      || !Number.isFinite(
        numericThreshold,
      )
    ) {
      setLocalError(
        "Enter a valid threshold.",
      );

      return;
    }

    try {
      await onCreate({
        symbol:
          normalizedSymbol,

        alert_type:
          alertType,

        threshold:
          numericThreshold,

        frequency,
      });

      setThreshold(
        "",
      );

      setSuccessMessage(
        `${normalizedSymbol} alert created.`,
      );
    } catch (
      caughtError
    ) {
      setLocalError(
        caughtError
          instanceof Error
          ? caughtError.message
          : "Unable to create alert.",
      );
    }
  }


  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="space-y-6"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <label
            htmlFor="alert-symbol"
            className="mb-2 block text-xs font-medium text-zinc-400"
          >
            Symbol
          </label>

          <input
            id="alert-symbol"
            value={
              symbol
            }
            onChange={
              (event) =>
                setSymbol(
                  event.target.value
                    .toUpperCase(),
                )
            }
            readOnly={
              lockSymbol
            }
            placeholder="AAPL"
            autoComplete="off"
            className={`h-11 w-full rounded-xl border border-zinc-800 bg-black px-4 text-sm font-medium uppercase text-white outline-none transition placeholder:text-zinc-700 focus:border-blue-500/70 ${
              lockSymbol
                ? "cursor-default text-zinc-300"
                : ""
            }`}
          />
        </div>


        <div>
          <label
            htmlFor="alert-threshold"
            className="mb-2 block text-xs font-medium text-zinc-400"
          >
            {
              selectedType
                ?.thresholdLabel
              ?? "Threshold"
            }
          </label>

          <div className="relative">
            {
              selectedType
                ?.thresholdPrefix
              && (
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                  {
                    selectedType
                      .thresholdPrefix
                  }
                </span>
              )
            }

            <input
              id="alert-threshold"
              type="number"
              step="any"
              value={
                threshold
              }
              onChange={
                (event) =>
                  setThreshold(
                    event.target.value,
                  )
              }
              placeholder={
                alertType.startsWith(
                  "price",
                )
                  ? "200.00"
                  : "3.00"
              }
              className={`h-11 w-full rounded-xl border border-zinc-800 bg-black text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-blue-500/70 ${
                selectedType
                  ?.thresholdPrefix
                  ? "pl-8 pr-4"
                  : selectedType
                      ?.thresholdSuffix
                    ? "pl-4 pr-9"
                    : "px-4"
              }`}
            />

            {
              selectedType
                ?.thresholdSuffix
              && (
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                  {
                    selectedType
                      .thresholdSuffix
                  }
                </span>
              )
            }
          </div>
        </div>
      </div>


      <div>
        <p className="mb-3 text-xs font-medium text-zinc-400">
          Alert condition
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          {
            ALERT_TYPE_OPTIONS.map(
              (option) => {
                const selected =
                  alertType
                  === option.value;

                return (
                  <button
                    key={
                      option.value
                    }
                    type="button"
                    onClick={
                      () => {
                        setAlertType(
                          option.value,
                        );

                        setLocalError(
                          null,
                        );

                        setSuccessMessage(
                          null,
                        );
                      }
                    }
                    className={`rounded-xl border p-4 text-left transition ${
                      selected
                        ? "border-blue-500/60 bg-blue-500/10"
                        : "border-zinc-800 bg-black hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className={`text-sm font-medium ${
                        selected
                          ? "text-blue-300"
                          : "text-zinc-200"
                      }`}
                    >
                      {
                        option.label
                      }
                    </div>

                    <p className="mt-1.5 text-xs leading-5 text-zinc-600">
                      {
                        option.description
                      }
                    </p>
                  </button>
                );
              },
            )
          }
        </div>
      </div>


      <div>
        <p className="mb-3 text-xs font-medium text-zinc-400">
          Notification frequency
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={
              () =>
                setFrequency(
                  "once",
                )
            }
            className={`rounded-xl border p-4 text-left transition ${
              frequency
                === "once"
                ? "border-blue-500/60 bg-blue-500/10"
                : "border-zinc-800 bg-black hover:border-zinc-700"
            }`}
          >
            <div className="text-sm font-medium text-zinc-200">
              Once
            </div>

            <p className="mt-1.5 text-xs leading-5 text-zinc-600">
              Trigger once, then automatically deactivate the alert.
            </p>
          </button>


          <button
            type="button"
            onClick={
              () =>
                setFrequency(
                  "every_occurrence",
                )
            }
            className={`rounded-xl border p-4 text-left transition ${
              frequency
                === "every_occurrence"
                ? "border-blue-500/60 bg-blue-500/10"
                : "border-zinc-800 bg-black hover:border-zinc-700"
            }`}
          >
            <div className="text-sm font-medium text-zinc-200">
              Every occurrence
            </div>

            <p className="mt-1.5 text-xs leading-5 text-zinc-600">
              Trigger again after the condition resets and crosses again.
            </p>
          </button>
        </div>
      </div>


      {
        localError
        && (
          <div className="rounded-xl border border-red-950 bg-red-950/20 px-4 py-3 text-xs text-red-300">
            {
              localError
            }
          </div>
        )
      }


      {
        successMessage
        && (
          <div className="rounded-xl border border-emerald-950 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-300">
            {
              successMessage
            }
          </div>
        )
      }


      <div className="flex flex-col gap-3 border-t border-zinc-900 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-xs leading-5 text-zinc-600">
          Crossing alerts establish a baseline first and trigger when the
          selected level is crossed afterward.
        </p>

        <button
          type="submit"
          disabled={
            saving
          }
          className="h-10 shrink-0 rounded-xl bg-white px-5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {
            saving
              ? "Creating…"
              : "Create alert"
          }
        </button>
      </div>
    </form>
  );
}
