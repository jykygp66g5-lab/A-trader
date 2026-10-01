import { api } from "@/lib/api";

import type {
  WatchlistItem,
} from "./types";


export async function getWatchlist():
  Promise<WatchlistItem[]> {
  const response =
    await api(
      "/watchlist",
    );


  if (!response.ok) {
    throw new Error(
      "Could not load your watchlist.",
    );
  }


  return (
    await response.json()
  ) as WatchlistItem[];
}


export async function addWatchlistSymbol(
  symbol: string,
): Promise<WatchlistItem> {
  const ticker =
    symbol
      .trim()
      .toUpperCase();


  const response =
    await api(
      `/watchlist/${encodeURIComponent(
        ticker,
      )}`,
      {
        method: "POST",
      },
    );


  const result =
    await response
      .json()
      .catch(
        () => null,
      );


  if (!response.ok) {
    throw new Error(
      result?.detail
      || "Could not add this symbol to your watchlist.",
    );
  }


  return result as WatchlistItem;
}


export async function removeWatchlistSymbol(
  symbol: string,
): Promise<void> {
  const ticker =
    symbol
      .trim()
      .toUpperCase();


  const response =
    await api(
      `/watchlist/${encodeURIComponent(
        ticker,
      )}`,
      {
        method: "DELETE",
      },
    );


  if (!response.ok) {
    const result =
      await response
        .json()
        .catch(
          () => null,
        );


    throw new Error(
      result?.detail
      || "Could not remove this symbol from your watchlist.",
    );
  }
}
