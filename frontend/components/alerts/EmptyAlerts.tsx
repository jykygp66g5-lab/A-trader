export default function EmptyAlerts() {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 px-6 text-center">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
        <svg
          className="h-5 w-5 text-zinc-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M10 21h4" />
        </svg>
      </div>

      <h3 className="text-sm font-semibold text-zinc-200">
        No alerts yet
      </h3>

      <p className="mt-2 max-w-sm text-xs leading-5 text-zinc-600">
        Create your first market alert and A-Trader will track the
        condition for you.
      </p>
    </div>
  );
}
