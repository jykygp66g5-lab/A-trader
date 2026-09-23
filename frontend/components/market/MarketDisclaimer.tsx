import Link from "next/link";


export default function MarketDisclaimer() {
  return (
    <div className="border-t border-zinc-900 pt-5">

      <p className="max-w-5xl text-xs leading-6 text-zinc-700">
        Market analysis and technical patterns are provided for
        informational and educational purposes only and do not
        constitute investment or financial advice. Technical
        analysis is based on historical market data and does not
        guarantee future performance. Opportunity scores describe
        setup quality and are not probabilities of profit. Targets,
        invalidation levels, reward-to-risk calculations and detected
        patterns are model-generated technical estimates and may be
        incomplete or incorrect. Market data may also be delayed,
        incomplete or inaccurate. Trading and investing involve risk,
        including possible loss of principal.
      </p>


      <Link
        href="/risk-disclosure"
        className="mt-3 inline-flex text-xs font-medium text-zinc-500 transition hover:text-white"
      >
        Read the Financial Risk Disclosure →
      </Link>

    </div>
  );
}