import Link from "next/link";

export const metadata = {
  title: "Financial Risk Disclosure | A-Trader",
  description:
    "Important financial and trading risk information for users of A-Trader.",
};

const sections = [
  ["1", "Purpose of This Disclosure"],
  ["2", "Trading and Investing Involve Risk"],
  ["3", "A-Trader Is Not an Investment Adviser or Broker"],
  ["4", "You Make Your Own Decisions"],
  ["5", "Market Analyzer and Market Scanner"],
  ["6", "Opportunity Scores and Other Ratings"],
  ["7", "Automated and Algorithmic Analysis"],
  ["8", "Market Data Limitations"],
  ["9", "Historical Performance"],
  ["10", "Trade Replay, Backtesting and Simulated Results"],
  ["11", "Risk and Reward Calculations"],
  ["12", "Market Conditions and Execution"],
  ["13", "Educational Content"],
  ["14", "No Guarantee of Profit"],
  ["15", "Technical and Service Risks"],
  ["16", "Future Integrations"],
  ["17", "Independent Verification"],
  ["18", "Changes to This Disclosure"],
];

export default function RiskDisclosurePage() {
  return (
    <main className="min-h-screen bg-[#070b14] text-slate-200">
      <div className="mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
        <Link
          href="/"
          className="mb-10 inline-flex text-sm text-slate-400 transition hover:text-white"
        >
          ← Back to A-Trader
        </Link>

        <header className="border-b border-white/10 pb-10">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            A-Trader Legal
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Financial Risk Disclosure
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
            Trading and investing involve risk. This disclosure explains
            important limitations of A-Trader&apos;s market-analysis,
            educational, analytical and simulation tools.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-500">
            <span>Effective: September 15, 2026</span>
            <span>Version: 1.0</span>
          </div>
        </header>

        <div className="my-10 rounded-2xl border border-amber-400/20 bg-amber-400/[0.05] p-6">
          <h2 className="text-lg font-semibold text-amber-100">
            Important
          </h2>

          <p className="mt-3 text-sm leading-7 text-amber-100/75">
            A-Trader provides informational, analytical, educational and
            decision-support tools. A-Trader does not guarantee trading
            results or profitability. Trading and investing can result in
            partial or complete loss of capital. You are responsible for your
            own financial decisions.
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[240px_1fr]">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">
                Contents
              </h2>

              <nav className="space-y-2">
                {sections.map(([number, title]) => (
                  <a
                    key={number}
                    href={`#section-${number}`}
                    className="block text-xs leading-5 text-slate-500 transition hover:text-emerald-400"
                  >
                    {number}. {title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className="min-w-0 space-y-12">
            <LegalSection id="1" title="1. Purpose of This Disclosure">
              <p>
                This Financial Risk Disclosure provides important information
                concerning the risks and limitations associated with using
                A-Trader&apos;s market-analysis, scanning, journaling,
                analytics, replay, educational and related tools.
              </p>

              <p>
                You should read this disclosure before relying on information
                generated or displayed by A-Trader in connection with a
                trading or investment decision.
              </p>
            </LegalSection>

            <LegalSection
              id="2"
              title="2. Trading and Investing Involve Risk"
            >
              <p>
                Trading and investing in securities involve substantial risk.
                Prices can move rapidly and unpredictably, and you may lose
                some or all of the money you invest.
              </p>

              <p>
                Different securities, strategies and market conditions involve
                different levels and types of risk. A strategy that was
                successful in one market environment may perform very
                differently in another.
              </p>

              <p>
                You should consider your own financial circumstances, knowledge,
                objectives and ability to bear loss before participating in
                financial markets.
              </p>
            </LegalSection>

            <LegalSection
              id="3"
              title="3. A-Trader Is Not an Investment Adviser or Broker"
            >
              <p>
                A-Trader is a software and analytical platform. A-Trader is not
                currently a brokerage, securities dealer, portfolio manager,
                investment adviser, financial planner or trade-execution
                service.
              </p>

              <p>
                A-Trader does not currently hold customer funds or securities
                and does not execute trades on behalf of users.
              </p>

              <p>
                Nothing provided through the Service creates an adviser-client,
                broker-client, fiduciary or similar professional relationship.
              </p>
            </LegalSection>

            <LegalSection id="4" title="4. You Make Your Own Decisions">
              <p>
                A-Trader is intended to assist users in organizing information,
                analyzing market conditions, reviewing trading activity and
                developing their own decision-making processes.
              </p>

              <p>
                A-Trader does not make trading decisions for you. You decide
                whether to buy, sell, hold or avoid a security and remain
                responsible for those decisions.
              </p>

              <p>
                You should not treat any A-Trader output as a substitute for
                your own judgment or, where appropriate, advice from a
                qualified and properly registered professional.
              </p>
            </LegalSection>

            <LegalSection
              id="5"
              title="5. Market Analyzer and Market Scanner"
            >
              <p>
                The Market Analyzer and Market Scanner may identify,
                categorize, rank or compare market setups using available
                market information and A-Trader&apos;s analytical methodology.
              </p>

              <p>
                Labels such as &quot;bullish&quot;, &quot;bearish&quot;,
                &quot;strong setup&quot;, &quot;watch&quot;,
                &quot;potential entry&quot;, &quot;wait&quot;,
                &quot;extended&quot; or similar terminology describe
                analytical conditions. They are not personalized instructions
                to enter or exit a trade.
              </p>

              <p>
                A setup identified by A-Trader can fail. A security ranked
                highly by A-Trader can decline in value, while a security
                ranked poorly can increase in value.
              </p>
            </LegalSection>

            <LegalSection
              id="6"
              title="6. Opportunity Scores and Other Ratings"
            >
              <p>
                A-Trader may display Opportunity Scores and other numerical,
                categorical or comparative ratings.
              </p>

              <p>
                These scores are intended to represent characteristics or
                relative strength of a setup according to A-Trader&apos;s
                analytical methodology. They are not probabilities of profit
                unless A-Trader expressly identifies a particular metric as a
                probability and explains how it was calculated.
              </p>

              <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-sm text-amber-100/80">
                An Opportunity Score of 90 does not mean that a trade has a 90%
                chance of being profitable.
              </div>

              <p>
                Scores may change as market data, market conditions,
                calculations or A-Trader&apos;s methodology change.
              </p>
            </LegalSection>

            <LegalSection
              id="7"
              title="7. Automated and Algorithmic Analysis"
            >
              <p>
                Some A-Trader outputs may be generated automatically using
                software rules, algorithms, mathematical calculations,
                technical indicators or other automated systems.
              </p>

              <p>
                Automated analysis can contain errors, fail to account for
                relevant information, misinterpret unusual market conditions or
                produce results that are not appropriate for a particular
                user&apos;s circumstances.
              </p>

              <p>
                Future artificial-intelligence functionality may introduce
                additional limitations, including incorrect, incomplete or
                misleading outputs.
              </p>

              <p>
                Automated output should therefore be independently evaluated
                before being used in connection with a financial decision.
              </p>
            </LegalSection>

            <LegalSection id="8" title="8. Market Data Limitations">
              <p>
                A-Trader may rely on information obtained from third-party
                market-data sources and other external providers.
              </p>

              <p>
                Market information may be delayed, incomplete, unavailable,
                inaccurate, adjusted or inconsistent with information displayed
                by an exchange, broker or another provider.
              </p>

              <p>
                A-Trader does not guarantee that displayed prices, volumes,
                indicators or other market information are real-time,
                exchange-grade, complete or error-free.
              </p>

              <p>
                Important market information should be verified through an
                appropriate independent source before placing a trade.
              </p>
            </LegalSection>

            <LegalSection id="9" title="9. Historical Performance">
              <p>
                Historical market performance does not guarantee future
                performance.
              </p>

              <p>
                Market relationships, volatility, liquidity, participants,
                economic conditions and other factors can change over time.
              </p>

              <p>
                A strategy, pattern, security or setup that performed well
                historically may perform poorly in the future.
              </p>
            </LegalSection>

            <LegalSection
              id="10"
              title="10. Trade Replay, Backtesting and Simulated Results"
            >
              <p>
                A-Trader may provide Trade Replay, historical analysis,
                backtesting, simulated trading or similar functionality.
              </p>

              <p>
                Simulated or historical results have important limitations.
                They do not represent actual future trading and may benefit
                from information, conditions or hindsight that would not have
                been available in the same way during live decision-making.
              </p>

              <p>
                Simulated results may also fail to fully reproduce real-world
                factors such as order execution, liquidity, slippage, bid-ask
                spreads, commissions, fees, market impact, delays and rapidly
                changing market conditions.
              </p>

              <p>
                Real trading also involves behavioural and emotional factors
                that may not be reproduced by replay or simulation.
              </p>

              <p>
                Accordingly, strong performance in Trade Replay, a backtest or
                another simulation does not guarantee similar results in live
                trading.
              </p>
            </LegalSection>

            <LegalSection
              id="11"
              title="11. Risk and Reward Calculations"
            >
              <p>
                A-Trader may calculate or display potential risk, reward,
                reward-to-risk ratios, stop levels, targets or related
                analytical values.
              </p>

              <p>
                These calculations depend on inputs, assumptions and market
                information. Actual losses or gains can differ materially from
                calculated values.
              </p>

              <p>
                A stop price does not guarantee execution at that exact price.
                During rapid market movements, gaps, low liquidity or other
                conditions, an order may execute at a materially different
                price or may not execute as expected.
              </p>
            </LegalSection>

            <LegalSection
              id="12"
              title="12. Market Conditions and Execution"
            >
              <p>
                Financial markets can experience volatility, trading halts,
                price gaps, liquidity shortages, exchange interruptions,
                unusual spreads and other conditions that affect execution and
                risk.
              </p>

              <p>
                Information displayed by A-Trader cannot account perfectly for
                every event or market condition.
              </p>

              <p>
                Execution of any transaction occurs through the user&apos;s
                chosen brokerage or other trading provider, not through
                A-Trader&apos;s current Service.
              </p>
            </LegalSection>

            <LegalSection id="13" title="13. Educational Content">
              <p>
                Educational material available through A-Trader is provided for
                general informational and educational purposes.
              </p>

              <p>
                Examples, strategies and explanations are intended to help
                users learn concepts and should not be interpreted as a
                recommendation that a particular strategy, security or
                transaction is suitable for an individual user.
              </p>
            </LegalSection>

            <LegalSection id="14" title="14. No Guarantee of Profit">
              <p>
                A-Trader does not guarantee that using the Service will make a
                user profitable, improve investment returns, prevent losses or
                produce any particular financial result.
              </p>

              <p>
                No score, scanner result, analytical output, replay result,
                indicator, educational resource or other A-Trader feature
                eliminates trading risk.
              </p>

              <p>
                You should never interpret marketing language, product
                descriptions or analytical terminology as a guarantee of
                financial performance.
              </p>
            </LegalSection>

            <LegalSection
              id="15"
              title="15. Technical and Service Risks"
            >
              <p>
                Software and online services can experience errors, outages,
                delays, calculation issues, unavailable data or other technical
                problems.
              </p>

              <p>
                A-Trader is currently in beta and is under active development.
                Features and analytical methodologies may change, and errors
                may occur.
              </p>

              <p>
                Users should not depend on uninterrupted access to A-Trader as
                their only source of information necessary to manage financial
                risk.
              </p>
            </LegalSection>

            <LegalSection id="16" title="16. Future Integrations">
              <p>
                A-Trader may eventually offer integrations that allow users to
                import or synchronize information from brokerage accounts or
                other financial services.
              </p>

              <p>
                The initial intended purpose of such integrations is data
                import and synchronization, not trade execution or control of
                user funds.
              </p>

              <p>
                If A-Trader later introduces materially different financial
                functionality, including trade execution, the applicable legal,
                regulatory, risk and contractual framework will need to be
                reviewed and updated before that functionality is offered.
              </p>
            </LegalSection>

            <LegalSection id="17" title="17. Independent Verification">
              <p>
                Users are responsible for reviewing and independently
                evaluating information before relying on it.
              </p>

              <p>
                This is particularly important for prices, trade quantities,
                imported information, automatically extracted information,
                market-data values, risk calculations and other information
                that could materially affect a financial decision.
              </p>

              <p>
                Where appropriate, users should consider obtaining independent
                advice from a qualified professional.
              </p>
            </LegalSection>

            <LegalSection
              id="18"
              title="18. Changes to This Disclosure"
            >
              <p>
                A-Trader may update this Financial Risk Disclosure as the
                Service, analytical methodologies, available features or
                applicable requirements evolve.
              </p>

              <p>
                The effective date and version displayed at the top identify
                the current version.
              </p>

              <p>
                Material changes may be communicated to users through
                appropriate account, in-app or email notices.
              </p>
            </LegalSection>

            <div className="border-t border-white/10 pt-8 text-sm leading-6 text-slate-500">
              <p>
                This Financial Risk Disclosure should be read together with
                the{" "}
                <Link
                  href="/terms"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  href="/privacy"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}

function LegalSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={`section-${id}`} className="scroll-mt-8">
      <h2 className="mb-5 text-2xl font-semibold tracking-tight text-white">
        {title}
      </h2>

      <div className="space-y-4 text-[15px] leading-7 text-slate-400">
        {children}
      </div>
    </section>
  );
}