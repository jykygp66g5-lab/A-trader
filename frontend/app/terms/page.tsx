import Link from "next/link";

export const metadata = {
  title: "Terms of Service | A-Trader",
  description: "Terms governing the use of A-Trader.",
};

const sections = [
  ["1", "Acceptance of These Terms"],
  ["2", "About A-Trader"],
  ["3", "Eligibility and Age Requirement"],
  ["4", "Beta Service"],
  ["5", "No Investment Advice"],
  ["6", "Trading and Investment Risk"],
  ["7", "Market Analysis, Scores and Automated Outputs"],
  ["8", "Market Data and Third-Party Information"],
  ["9", "User Accounts"],
  ["10", "User Content and Ownership"],
  ["11", "Trade Journals and Imported Data"],
  ["12", "Privacy"],
  ["13", "Aggregated and De-Identified Information"],
  ["14", "Acceptable Use"],
  ["15", "Intellectual Property"],
  ["16", "Third-Party Services"],
  ["17", "Availability, Changes and Data Preservation"],
  ["18", "Free Service and Future Paid Features"],
  ["19", "Communications"],
  ["20", "Account Suspension and Termination"],
  ["21", "Account and Data Deletion"],
  ["22", "Disclaimers"],
  ["23", "Limitation of Liability"],
  ["24", "Governing Law"],
  ["25", "Changes to These Terms"],
  ["26", "Contact"],
];

export default function TermsPage() {
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
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-violet-400">
            A-Trader Legal
          </p>

          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-5xl">
            Terms of Service
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
            These Terms of Service govern your access to and use of A-Trader.
            Please read them carefully before creating an account or using the
            Service.
          </p>

          <div className="mt-6 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-500">
            <span>Effective: September 15, 2026</span>
            <span>Version: 1.0</span>
          </div>
        </header>

        <div className="grid gap-12 pt-10 lg:grid-cols-[240px_1fr]">
          <aside className="lg:sticky lg:top-8 lg:self-start">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <h2 className="mb-4 text-sm font-semibold text-white">
                Contents
              </h2>

              <nav className="max-h-[70vh] space-y-2 overflow-y-auto pr-2">
                {sections.map(([number, title]) => (
                  <a
                    key={number}
                    href={`#section-${number}`}
                    className="block text-xs leading-5 text-slate-500 transition hover:text-violet-400"
                  >
                    {number}. {title.replace(/^\d+\.\s*/, "")}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className="min-w-0 space-y-12">
            <LegalSection id="1" title="1. Acceptance of These Terms">
              <p>
                These Terms of Service (&quot;Terms&quot;) form an agreement
                between you and the operator of A-Trader concerning your access
                to and use of the A-Trader website, applications, tools,
                features and related services (collectively, the
                &quot;Service&quot;).
              </p>

              <p>
                By creating an account, accessing or using the Service, you
                acknowledge that you have read and understood these Terms and
                agree to be bound by them and by our Privacy Policy.
              </p>

              <p>
                If you do not agree with these Terms, you must not create an
                account or use the Service.
              </p>
            </LegalSection>

            <LegalSection id="2" title="2. About A-Trader">
              <p>
                A-Trader is a software platform designed to provide tools for
                trade journaling, market analysis, market scanning, trading
                analytics, playbook development, trade replay, education and
                related decision-support functionality.
              </p>

              <p>
                A-Trader is currently operated from Québec, Canada and is in an
                early-stage beta period. The Service may be made available to
                users in multiple countries where legally permitted.
              </p>

              <p>
                A-Trader is not currently a brokerage, securities dealer,
                investment adviser, portfolio manager, financial institution or
                trade execution platform. A-Trader does not hold customer funds
                or securities and does not currently place trades on behalf of
                users.
              </p>
            </LegalSection>

            <LegalSection id="3" title="3. Eligibility and Age Requirement">
              <p>
                The Service is intended exclusively for individuals who are at
                least 18 years of age.
              </p>

              <p>
                By creating an account or using A-Trader, you represent and
                warrant that you are 18 years of age or older and that you have
                the legal capacity to enter into these Terms.
              </p>

              <p>
                Individuals under 18 are not permitted to create or maintain an
                A-Trader account. We may suspend or terminate an account if we
                reasonably believe that the account holder does not satisfy
                this requirement.
              </p>

              <p>
                You are also responsible for ensuring that your use of the
                Service is permitted under the laws applicable to you.
              </p>
            </LegalSection>

            <LegalSection id="4" title="4. Beta Service">
              <p>
                A-Trader is currently under active development. All or portions
                of the Service may be identified or treated as beta,
                experimental, preview or pre-release functionality.
              </p>

              <p>
                Beta functionality may contain bugs, incomplete features,
                calculation errors, interruptions or other issues. Features,
                interfaces, calculations, scoring methodologies and available
                functionality may change as the Service develops.
              </p>

              <p>
                We may add, modify, test, restrict or discontinue beta features
                as reasonably necessary to develop and improve A-Trader.
              </p>
            </LegalSection>

            <LegalSection id="5" title="5. No Investment Advice">
              <p>
                A-Trader provides informational, analytical, educational and
                decision-support tools. Nothing available through A-Trader
                constitutes individualized investment, financial, legal, tax or
                accounting advice.
              </p>

              <p>
                Information, scores, labels, rankings, indicators, market
                analysis, educational material and other outputs provided by
                A-Trader are not instructions to purchase, sell, hold or
                otherwise transact in any security.
              </p>

              <p>
                References such as &quot;bullish&quot;, &quot;bearish&quot;,
                &quot;strong setup&quot;, &quot;watch&quot;,
                &quot;potential entry&quot; or similar terminology describe
                analytical conditions generated by the Service. They do not
                represent a determination that a particular transaction is
                appropriate for you.
              </p>

              <p>
                A-Trader does not know your complete financial circumstances,
                investment objectives, tax situation, risk tolerance or other
                information that may be necessary to evaluate an investment
                decision.
              </p>

              <p>
                You remain solely responsible for evaluating information and
                making your own trading and investment decisions.
              </p>
            </LegalSection>

            <LegalSection id="6" title="6. Trading and Investment Risk">
              <p>
                Trading and investing involve substantial risk. Securities can
                increase or decrease in value, market conditions can change
                rapidly, and you may lose some or all of the money you invest.
              </p>

              <p>
                Past performance, historical market behaviour, simulated
                results, backtests, replay results, analytical scores and
                historical patterns do not guarantee future results.
              </p>

              <p>
                You should never trade money that you cannot afford to lose.
                Where appropriate, you should consider obtaining advice from a
                qualified and properly registered professional before making
                financial decisions.
              </p>

              <p>
                A-Trader does not guarantee profitability, investment
                performance, successful trades or any particular financial
                outcome.
              </p>
            </LegalSection>

            <LegalSection
              id="7"
              title="7. Market Analysis, Scores and Automated Outputs"
            >
              <p>
                A-Trader may calculate or display opportunity scores, trend
                scores, risk classifications, reward-to-risk estimates,
                technical indicators, setup classifications, market conditions
                and other automated or algorithmic outputs.
              </p>

              <p>
                These outputs are analytical tools. They may be based on
                mathematical rules, historical data, third-party information,
                assumptions and software calculations and may be inaccurate,
                incomplete or inappropriate for a particular situation.
              </p>

              <p>
                Unless expressly stated otherwise, a numerical score is not a
                statistical probability of profitability. For example, an
                Opportunity Score of 90 does not mean that a trade has a 90%
                probability of being profitable.
              </p>

              <p>
                Automated outputs should not be used as the sole basis for a
                financial decision. You are responsible for independently
                reviewing and evaluating any information before acting on it.
              </p>
            </LegalSection>

            <LegalSection
              id="8"
              title="8. Market Data and Third-Party Information"
            >
              <p>
                Certain information available through A-Trader may originate
                from third-party market-data providers, public sources or other
                external services.
              </p>

              <p>
                Market data may be delayed, inaccurate, incomplete,
                unavailable, adjusted or inconsistent with information
                available from an exchange, broker or other source. A-Trader
                does not guarantee that market information is real-time,
                exchange-grade, complete or error-free.
              </p>

              <p>
                You should verify important market information through an
                appropriate independent source before making a trading or
                investment decision.
              </p>

              <p>
                Availability of third-party information may change without
                notice if a provider modifies, restricts or discontinues its
                service.
              </p>
            </LegalSection>

            <LegalSection id="9" title="9. User Accounts">
              <p>
                Certain features require an A-Trader account. You agree to
                provide accurate information when creating and maintaining your
                account.
              </p>

              <p>
                You are responsible for maintaining the confidentiality and
                security of your login credentials and for activity occurring
                through your account.
              </p>

              <p>
                You must notify us if you reasonably believe your account has
                been compromised or accessed without authorization.
              </p>

              <p>
                A-Trader may provide password-reset or account-recovery
                mechanisms. For security reasons, we may require reasonable
                verification before allowing access to or modification of an
                account.
              </p>
            </LegalSection>

            <LegalSection id="10" title="10. User Content and Ownership">
              <p>
                As between you and A-Trader, you retain ownership of the
                original content and information you submit to the Service,
                including your trade journal entries, trading notes, playbooks,
                lessons, tags and other user-provided content.
              </p>

              <p>
                You grant A-Trader a limited, non-exclusive licence to host,
                store, process, reproduce, display and otherwise use your
                content only as reasonably necessary to operate, secure,
                maintain, improve and provide the Service, subject to our
                Privacy Policy and applicable law.
              </p>

              <p>
                This licence does not transfer ownership of your trading journal
                or other original user content to A-Trader.
              </p>

              <p>
                You are responsible for ensuring that you have the right to
                submit content to the Service and that doing so does not violate
                applicable law or the rights of another person.
              </p>
            </LegalSection>

            <LegalSection
              id="11"
              title="11. Trade Journals and Imported Data"
            >
              <p>
                A-Trader may allow users to manually enter trade information
                and may in the future provide tools for importing information
                from screenshots, images, files, CSV records, brokerage
                connections or other sources.
              </p>

              <p>
                Automated extraction and importing systems can make mistakes.
                Information such as ticker symbols, prices, quantities,
                transaction direction, dates or other trade details may be
                interpreted incorrectly.
              </p>

              <p>
                You are responsible for reviewing imported or automatically
                extracted information and correcting errors before relying on
                it.
              </p>

              <p>
                The availability of an import or integration feature does not
                mean that A-Trader is affiliated with, endorsed by or acting on
                behalf of the relevant brokerage or third-party service unless
                expressly stated.
              </p>
            </LegalSection>

            <LegalSection id="12" title="12. Privacy">
              <p>
                Our collection, use, disclosure, retention and protection of
                personal information are described in the A-Trader Privacy
                Policy.
              </p>

              <p>
                By using the Service, you acknowledge that personal information
                will be processed as necessary to operate the Service and as
                otherwise described in the Privacy Policy.
              </p>

              <p>
                A-Trader does not sell users&apos; personal information as part
                of its business model.
              </p>

              <p>
                Please review the Privacy Policy for additional information
                concerning your privacy rights and choices.
              </p>
            </LegalSection>

            <LegalSection
              id="13"
              title="13. Aggregated and De-Identified Information"
            >
              <p>
                A-Trader may generate and use aggregated, statistical or
                appropriately de-identified information derived from use of the
                Service for legitimate purposes such as improving features,
                evaluating performance, understanding usage, identifying
                technical issues, conducting research and developing new
                functionality.
              </p>

              <p>
                We do not claim ownership of your private trading journal
                merely because information is processed by the Service.
              </p>

              <p>
                Materially different uses of identifiable personal information,
                including uses requiring additional consent under applicable
                law, will be addressed through appropriate disclosure or
                consent before such use.
              </p>
            </LegalSection>

            <LegalSection id="14" title="14. Acceptable Use">
              <p>You agree not to misuse A-Trader. In particular, you must not:</p>

              <ul>
                <li>use the Service in violation of applicable law;</li>
                <li>
                  attempt to gain unauthorized access to accounts, systems,
                  databases or infrastructure;
                </li>
                <li>
                  interfere with, damage, overload or disrupt the Service;
                </li>
                <li>
                  upload malware, malicious code or intentionally harmful
                  material;
                </li>
                <li>impersonate another person or misrepresent your identity;</li>
                <li>
                  use automated systems to scrape, overwhelm or abuse the
                  Service contrary to our reasonable technical restrictions;
                </li>
                <li>
                  attempt to bypass security, rate limits or access controls;
                </li>
                <li>
                  use A-Trader to facilitate fraud, market manipulation or
                  unlawful activity; or
                </li>
                <li>
                  reverse engineer or exploit protected portions of the Service
                  except to the extent such restriction is prohibited by
                  applicable law.
                </li>
              </ul>
            </LegalSection>

            <LegalSection id="15" title="15. Intellectual Property">
              <p>
                Except for user-owned content and third-party materials,
                A-Trader and its software, interfaces, branding, designs,
                original content, algorithms, organization and other protected
                elements are owned by or licensed to the operator of A-Trader
                and may be protected by intellectual-property laws.
              </p>

              <p>
                These Terms provide you with a limited right to access and use
                the Service for its intended purposes. They do not transfer
                ownership of A-Trader or its intellectual property to you.
              </p>
            </LegalSection>

            <LegalSection id="16" title="16. Third-Party Services">
              <p>
                A-Trader relies on third-party infrastructure, hosting,
                databases, market-data sources and other technology providers
                to operate portions of the Service.
              </p>

              <p>
                A-Trader may also provide links to or integrations with
                third-party services. Third parties may have their own terms,
                privacy policies and practices.
              </p>

              <p>
                To the extent permitted by applicable law, A-Trader is not
                responsible for independent third-party services that are not
                controlled by A-Trader.
              </p>
            </LegalSection>

            <LegalSection
              id="17"
              title="17. Availability, Changes and Data Preservation"
            >
              <p>
                We aim to provide a reliable Service, but we do not guarantee
                uninterrupted availability, 100% uptime, error-free operation
                or permanent availability of any particular feature.
              </p>

              <p>
                Maintenance, technical problems, security incidents, provider
                outages, development changes or circumstances outside our
                reasonable control may interrupt the Service.
              </p>

              <p>
                We may modify, replace or discontinue functionality as A-Trader
                develops. Where a change materially affects users, we will
                provide notice where reasonably appropriate or legally
                required.
              </p>

              <p>
                Although reasonable measures may be used to protect and preserve
                information, no storage system is infallible. You should
                maintain independent copies of information that is particularly
                important to you.
              </p>
            </LegalSection>

            <LegalSection
              id="18"
              title="18. Free Service and Future Paid Features"
            >
              <p>
                A-Trader is currently available without charge. Free access is
                not a promise or guarantee that the Service, any particular
                feature or any level of usage will remain free indefinitely.
              </p>

              <p>
                In the future, A-Trader may introduce subscriptions, paid
                plans, premium features, usage limits, trials or other forms of
                paid access.
              </p>

              <p>
                Creating an account or using A-Trader while it is free does not
                create a perpetual right to receive the Service or any feature
                without charge.
              </p>

              <p>
                A-Trader will not charge you merely because you previously used
                the free Service. Before a new charge applies to you, applicable
                pricing and payment terms will be presented and any
                authorization or consent required by law will be obtained.
              </p>

              <p>
                Additional terms concerning billing, renewals, cancellation and
                refunds may apply if paid services are introduced.
              </p>
            </LegalSection>

            <LegalSection id="19" title="19. Communications">
              <p>
                We may send communications reasonably necessary to operate your
                account or the Service, including security alerts,
                authentication or password-reset messages, important service
                notices and legally required communications.
              </p>

              <p>
                Marketing, promotional or non-essential email communications
                will be handled separately and, where applicable, made
                available on an optional basis. Choosing not to receive
                marketing communications will not prevent necessary account,
                security or legal notices.
              </p>
            </LegalSection>

            <LegalSection
              id="20"
              title="20. Account Suspension and Termination"
            >
              <p>
                We may suspend, restrict or terminate access when reasonably
                necessary to address fraud, security threats, unlawful conduct,
                serious abuse, material violations of these Terms, an
                underage account or risks to A-Trader, its users or third
                parties.
              </p>

              <p>
                Where circumstances reasonably permit, we may provide notice or
                an opportunity to address an issue before termination. Immediate
                action may be taken where necessary for security, legal,
                fraud-prevention or serious-abuse reasons.
              </p>
            </LegalSection>

            <LegalSection id="21" title="21. Account and Data Deletion">
              <p>
                Users may request or, where functionality is available,
                initiate permanent deletion of their A-Trader account.
              </p>

              <p>
                Before deletion, A-Trader may display a clear confirmation
                explaining that deletion will remove the account and associated
                information and cannot be undone.
              </p>

              <p>
                Following a valid deletion request, associated personal
                information will be deleted or de-identified in accordance with
                our Privacy Policy and applicable law, subject to reasonable
                technical processing periods, backup cycles and information
                that must or may lawfully be retained.
              </p>
            </LegalSection>

            <LegalSection id="22" title="22. Disclaimers">
              <p>
                To the extent permitted by applicable law, the Service is
                provided on an &quot;as is&quot; and &quot;as
                available&quot; basis.
              </p>

              <p>
                A-Trader does not warrant that the Service will always be
                available, uninterrupted, secure, accurate, complete or free
                from errors.
              </p>

              <p>
                Nothing in these Terms excludes warranties, guarantees,
                protections or other rights that cannot legally be excluded or
                limited.
              </p>
            </LegalSection>

            <LegalSection id="23" title="23. Limitation of Liability">
              <p>
                To the maximum extent permitted by applicable law, A-Trader and
                its operator will not be liable for trading losses, investment
                losses, lost profits or other losses resulting solely from a
                user&apos;s decision to rely on market analysis, automated
                outputs, third-party market data or other informational
                material provided through the Service.
              </p>

              <p>
                Users remain responsible for their own trading and investment
                decisions and for independently verifying information on which
                they choose to rely.
              </p>

              <p>
                To the maximum extent permitted by applicable law, A-Trader
                will not be liable for indirect, incidental, special,
                consequential or punitive damages arising from use of or
                inability to use the Service.
              </p>

              <p>
                Nothing in these Terms is intended to exclude or limit
                liability where doing so would be prohibited by applicable law,
                including mandatory consumer-protection rights.
              </p>
            </LegalSection>

            <LegalSection id="24" title="24. Governing Law">
              <p>
                Subject to any mandatory rights or protections that apply to
                you, these Terms are governed by the applicable laws of Québec
                and the federal laws of Canada applicable in Québec.
              </p>

              <p>
                Nothing in these Terms deprives a consumer of mandatory rights
                or remedies that cannot legally be waived under the laws
                applicable to that consumer.
              </p>
            </LegalSection>

            <LegalSection id="25" title="25. Changes to These Terms">
              <p>
                A-Trader will evolve over time, and these Terms may need to be
                updated to reflect new functionality, business models, legal
                requirements or operating practices.
              </p>

              <p>
                When changes are material, we will provide reasonable notice as
                required by applicable law. The effective date and version
                displayed at the top of this page identify the current version.
              </p>

              <p>
                Where applicable law requires renewed consent for a change, we
                will request that consent before applying the relevant change.
              </p>
            </LegalSection>

            <LegalSection id="26" title="26. Contact">
              <p>
                Questions concerning these Terms may be directed to the operator
                of A-Trader.
              </p>

              <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-sm text-amber-100/80">
                A dedicated A-Trader legal and privacy contact address is being
                established. This section will be updated with the appropriate
                contact information.
              </div>
            </LegalSection>

            <div className="border-t border-white/10 pt-8 text-sm text-slate-500">
              <p>
                These Terms should be read together with the{" "}
                <Link
                  href="/privacy"
                  className="text-violet-400 hover:text-violet-300"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href="/risk-disclosure"
                  className="text-violet-400 hover:text-violet-300"
                >
                  Financial Risk Disclosure
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

      <div className="space-y-4 text-[15px] leading-7 text-slate-400 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1">
        {children}
      </div>
    </section>
  );
}