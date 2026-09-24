import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | A-Trader",
  description: "Privacy Policy governing personal information processed by A-Trader.",
};

const sections = [
  ["1", "About This Privacy Policy"],
  ["2", "Who Is Responsible for Your Information"],
  ["3", "Information We Collect"],
  ["4", "Account Information"],
  ["5", "Trading and Journal Information"],
  ["6", "Technical, Analytics and Security Information"],
  ["7", "Cookies and Similar Technologies"],
  ["8", "How We Use Personal Information"],
  ["9", "Legal Bases and Consent"],
  ["10", "Service Providers"],
  ["11", "International Processing"],
  ["12", "Sale and Advertising Use of Personal Information"],
  ["13", "Aggregated and De-Identified Information"],
  ["14", "AI and Model Training"],
  ["15", "Future Broker Integrations"],
  ["16", "Screenshot and File Imports"],
  ["17", "Payments"],
  ["18", "Social and Sharing Features"],
  ["19", "Blocking, Reporting and Safety"],
  ["20", "Data Retention"],
  ["21", "Inactive Accounts"],
  ["22", "Account Deletion"],
  ["23", "Security"],
  ["24", "Account Recovery and Security Records"],
  ["25", "Your Privacy Rights"],
  ["26", "Information About Other People"],
  ["27", "Legal Disclosures"],
  ["28", "Privacy Incidents"],
  ["29", "Communications"],
  ["30", "Children and Age Requirement"],
  ["31", "Changes to This Policy"],
  ["32", "Privacy by Design"],
  ["33", "Privacy Questions and Complaints"],
];

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-400">
            This Privacy Policy explains how A-Trader collects, uses, protects,
            retains and shares personal information when you use the Service.
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
                    {number}. {title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className="min-w-0 space-y-12">
            <LegalSection id="1" title="1. About This Privacy Policy">
              <p>
                This Privacy Policy describes how A-Trader collects, uses,
                processes, discloses, retains and protects personal information
                in connection with the A-Trader website, applications, accounts,
                tools and related services (collectively, the
                &quot;Service&quot;).
              </p>

              <p>
                A-Trader is currently an early-stage beta service operated from
                Québec, Canada. This Policy applies to personal information
                processed through A-Trader unless a different privacy notice is
                specifically provided for a particular feature.
              </p>

              <p>
                Our approach is to collect and retain information that is
                reasonably necessary to operate, secure and improve A-Trader
                while avoiding unnecessary collection of personal information.
              </p>
            </LegalSection>

            <LegalSection
              id="2"
              title="2. Who Is Responsible for Your Information"
            >
              <p>
                A-Trader is currently operated by its founder as a sole
                operator. The operator is responsible for the protection of
                personal information handled by A-Trader and currently performs
                the privacy-responsibility function for the Service.
              </p>

              <p>
                As A-Trader develops, responsibility for particular privacy
                functions may be delegated to qualified personnel, while
                accountability will be maintained as required by applicable
                law.
              </p>

              <p>
                A dedicated privacy contact address will be published as
                A-Trader&apos;s business communication infrastructure is
                established.
              </p>
            </LegalSection>

            <LegalSection id="3" title="3. Information We Collect">
              <p>
                The information A-Trader processes depends on the features you
                use. Categories may include account information, trading and
                journal information, information you voluntarily submit,
                technical information, security records and information
                generated through your use of A-Trader.
              </p>

              <p>
                Additional categories may be processed if you choose to use
                future optional features such as brokerage synchronization,
                screenshot importing, social sharing or paid subscriptions.
              </p>

              <p>
                A-Trader seeks to limit collection to information reasonably
                necessary for identified purposes.
              </p>
            </LegalSection>

            <LegalSection id="4" title="4. Account Information">
              <p>
                When you create an A-Trader account, we currently collect
                information such as your name and email address.
              </p>

              <p>
                You also create a password. Passwords should be stored using
                appropriate cryptographic password-protection techniques rather
                than being retained as readable plaintext.
              </p>

              <p>
                Password confirmation entered during registration is used to
                confirm that you entered the intended password and is not
                intended to become a separate stored account field.
              </p>

              <p>
                In the future, you may optionally provide additional account
                security information such as a verified recovery email.
              </p>
            </LegalSection>

            <LegalSection
              id="5"
              title="5. Trading and Journal Information"
            >
              <p>
                When you use A-Trader&apos;s journaling, analytics, playbook,
                replay or related features, you may provide information about
                trades and trading activity.
              </p>

              <p>
                This information may include securities or ticker symbols,
                entry and exit information, quantities, prices, dates,
                performance information, trading notes, tags, strategies,
                playbooks, confidence assessments and other information you
                choose to record.
              </p>

              <p>
                As between you and A-Trader, your original private journal
                content remains yours. Processing that information does not
                transfer ownership of your journal to A-Trader.
              </p>
            </LegalSection>

            <LegalSection
              id="6"
              title="6. Technical, Analytics and Security Information"
            >
              <p>
                A-Trader may process reasonable technical and usage information
                to operate, secure, troubleshoot and improve the Service.
              </p>

              <p>
                Depending on the technologies in use, this may include IP
                addresses, browser or device information, operating-system
                information, timestamps, feature usage, performance
                information, error logs, login activity, failed login attempts
                and similar technical records.
              </p>

              <p>
                Approximate location, such as a country or general region, may
                be inferred from technical information such as an IP address
                for security, fraud prevention, analytics, localization and
                regional or legal requirements.
              </p>

              <p>
                A-Trader does not currently require precise GPS or street-level
                device location for its core functionality. If a future feature
                genuinely requires precise location, appropriate disclosure and
                permission will be provided where required.
              </p>
            </LegalSection>

            <LegalSection
              id="7"
              title="7. Cookies and Similar Technologies"
            >
              <p>
                A-Trader may use cookies, browser storage or similar
                technologies that are necessary for authentication, account
                sessions, security, preferences and operation of the Service.
              </p>

              <p>
                A-Trader may also use analytics technologies to understand
                product usage, diagnose problems and improve the Service.
                Where applicable law requires consent for non-essential
                analytics technologies, an appropriate consent mechanism will
                be used.
              </p>

              <p>
                A-Trader does not currently use advertising or targeting
                technologies as a core part of its business model.
              </p>
            </LegalSection>

            <LegalSection
              id="8"
              title="8. How We Use Personal Information"
            >
              <p>A-Trader may use personal information to:</p>

              <ul>
                <li>create, maintain and authenticate user accounts;</li>
                <li>provide trade journaling and analytical functionality;</li>
                <li>calculate and display user-requested analytics;</li>
                <li>save user preferences and content;</li>
                <li>operate, maintain and improve the Service;</li>
                <li>protect accounts and prevent fraud or abuse;</li>
                <li>diagnose errors and technical problems;</li>
                <li>provide account recovery and customer support;</li>
                <li>communicate important service or legal information;</li>
                <li>comply with applicable legal obligations; and</li>
                <li>
                  support additional purposes disclosed when an optional
                  feature is introduced.
                </li>
              </ul>
            </LegalSection>

            <LegalSection id="9" title="9. Legal Bases and Consent">
              <p>
                A-Trader processes personal information in accordance with
                applicable privacy laws and the purposes communicated when
                information is collected.
              </p>

              <p>
                Where consent is required, A-Trader seeks consent appropriate
                to the nature and sensitivity of the information and the
                intended use.
              </p>

              <p>
                Where applicable law permits processing on another legal basis,
                A-Trader may rely on that basis when appropriate.
              </p>

              <p>
                If a materially different use of personal information requires
                additional consent, A-Trader will seek that consent before
                beginning the new use.
              </p>
            </LegalSection>

            <LegalSection id="10" title="10. Service Providers">
              <p>
                A-Trader may rely on service providers to operate portions of
                the Service.
              </p>

              <p>
                Depending on A-Trader&apos;s infrastructure and features, these
                may include hosting, infrastructure, database, authentication,
                security, email, analytics, payment, customer-support and other
                technology providers.
              </p>

              <p>
                These providers may process information on A-Trader&apos;s
                behalf where reasonably necessary to provide their services.
                A-Trader seeks to use appropriate contractual, technical and
                organizational safeguards as required by applicable law.
              </p>

              <p>
                Using a service provider to operate A-Trader is different from
                selling personal information to a data broker or advertiser.
              </p>
            </LegalSection>

            <LegalSection id="11" title="11. International Processing">
              <p>
                A-Trader is intended to be available in multiple jurisdictions
                where legally permitted, and its technology providers may
                process or store information in jurisdictions different from
                the one in which you live.
              </p>

              <p>
                Personal information processed in another jurisdiction may be
                subject to the laws applicable there.
              </p>

              <p>
                Where required, A-Trader will assess and use appropriate
                safeguards before communicating or otherwise processing
                personal information outside Québec or another relevant
                jurisdiction.
              </p>
            </LegalSection>

            <LegalSection
              id="12"
              title="12. Sale and Advertising Use of Personal Information"
            >
              <p>
                A-Trader does not sell users&apos; personal information as part
                of its business model.
              </p>

              <p>
                This includes personal account information and identifiable
                private trading histories, journals, notes, playbooks and
                uploaded trading information.
              </p>

              <p>
                A-Trader&apos;s use of service providers to operate the Service
                does not mean that A-Trader is selling personal information to
                those providers.
              </p>

              <p>
                A-Trader does not currently build advertising profiles from
                users&apos; private trading information.
              </p>
            </LegalSection>

            <LegalSection
              id="13"
              title="13. Aggregated and De-Identified Information"
            >
              <p>
                A-Trader may create and use aggregated, statistical or
                appropriately de-identified information for purposes such as
                product improvement, research, performance measurement,
                feature development, debugging and understanding how the
                Service is used.
              </p>

              <p>
                Where information is treated as de-identified, A-Trader will
                take measures appropriate to the circumstances to reduce the
                risk that it identifies an individual.
              </p>

              <p>
                Properly anonymized information that no longer constitutes
                personal information under applicable law may be retained and
                used for legitimate business and product-improvement purposes.
              </p>
            </LegalSection>

            <LegalSection id="14" title="14. AI and Model Training">
              <p>
                A-Trader may introduce artificial-intelligence or automated
                processing features in the future, including tools related to
                analysis, coaching or information extraction.
              </p>

              <p>
                Private identifiable user information is not automatically
                designated as training data merely because it is processed by
                A-Trader.
              </p>

              <p>
                A-Trader does not intend to automatically use identifiable
                private journals, notes, trade screenshots, brokerage-imported
                information or identifiable trading histories to train AI
                models without an appropriate legal basis, disclosure and,
                where required, consent.
              </p>

              <p>
                Properly aggregated or de-identified information may be used to
                understand and improve A-Trader as described in this Policy.
              </p>
            </LegalSection>

            <LegalSection
              id="15"
              title="15. Future Broker Integrations"
            >
              <p>
                A-Trader may eventually allow users to connect supported
                brokerage or financial accounts for the purpose of importing
                or synchronizing trading information.
              </p>

              <p>
                A-Trader&apos;s intended initial approach is to request only the
                permissions reasonably necessary for the import or
                synchronization functionality being provided.
              </p>

              <p>
                Import-focused integrations are not intended to authorize
                A-Trader to withdraw funds, transfer money or execute trades
                merely because a brokerage connection exists.
              </p>

              <p>
                Depending on the integration, imported information may include
                transaction history, securities, quantities, prices, dates and
                related trading or portfolio information.
              </p>

              <p>
                Disconnecting an integration will stop future synchronization
                as reasonably applicable. Information already imported into
                your A-Trader journal may remain until you delete that
                information or your account, subject to applicable retention
                requirements.
              </p>
            </LegalSection>

            <LegalSection
              id="16"
              title="16. Screenshot and File Imports"
            >
              <p>
                A-Trader may introduce features allowing trade information to
                be extracted from screenshots, images, CSV files or other
                records.
              </p>

              <p>
                Uploaded materials may unintentionally contain information that
                is not necessary for A-Trader, such as names, balances or
                account identifiers.
              </p>

              <p>
                A-Trader&apos;s intended approach is to process uploaded
                screenshots or similar temporary materials for the requested
                purpose, allow users to review or correct extracted trade
                information, and avoid retaining the original material longer
                than reasonably necessary unless the user selects a feature
                that requires continued storage.
              </p>

              <p>
                Extracted trade information that the user saves may remain as
                part of the user&apos;s journal.
              </p>
            </LegalSection>

            <LegalSection id="17" title="17. Payments">
              <p>
                A-Trader is currently offered without charge, but paid
                subscriptions or features may be introduced in the future.
              </p>

              <p>
                If paid services are introduced, payment and billing
                information may be processed by A-Trader and/or authorized
                payment service providers depending on the payment method and
                infrastructure used at that time.
              </p>

              <p>
                A-Trader&apos;s initial approach to paid services is expected to
                use specialized payment providers rather than unnecessarily
                storing complete payment-card credentials within A-Trader.
              </p>

              <p>
                Privacy disclosures will be updated as appropriate before
                materially different payment-processing practices are
                introduced.
              </p>
            </LegalSection>

            <LegalSection
              id="18"
              title="18. Social and Sharing Features"
            >
              <p>
                Private journals, trades, notes, playbooks, analytics,
                screenshots and imported brokerage information are private by
                default unless the user deliberately uses a feature to share
                particular information.
              </p>

              <p>
                A-Trader will not automatically convert a private trading
                journal into public content merely because social or community
                functionality is introduced.
              </p>

              <p>
                Future sharing functionality may allow a user to send a
                particular trade to another user or grant another user
                continuing access to selected information. A-Trader intends to
                provide clear controls explaining what information will be
                shared before the user confirms the action.
              </p>

              <p>
                Where continuing trade-sharing access is offered, A-Trader may
                require periodic reconfirmation of that permission. The
                intended design is to require reconfirmation at least every six
                months. If permission expires or is revoked, access provided
                through that continuing relationship should end, including
                access to historical information made available solely through
                that relationship.
              </p>

              <p>
                A trade intentionally sent as an individual shared item may be
                treated differently from a continuing sharing relationship, as
                explained to users when the feature is offered.
              </p>

              <p>
                If public usernames or display names are introduced, A-Trader
                may establish reasonable naming and community standards and may
                reject or require changes to names involving impersonation,
                harassment, hate, explicit material, scams, spam, infringement
                or similar misuse.
              </p>
            </LegalSection>

            <LegalSection
              id="19"
              title="19. Blocking, Reporting and Safety"
            >
              <p>
                Future community functionality may allow users to block other
                users and separately report users, content or interactions for
                review.
              </p>

              <p>
                A user may be allowed to provide an optional reason when
                blocking another user, such as harassment, bullying, spam,
                impersonation, suspicious activity or unwanted contact.
                Providing a reason should not be required in order to block
                someone.
              </p>

              <p>
                Reports, repeated safety signals and relevant information may
                be reviewed when reasonably necessary for user safety, abuse
                prevention, enforcement, security or legal compliance.
              </p>

              <p>
                A report or block does not by itself establish that another
                user violated A-Trader&apos;s rules.
              </p>

              <p>
                A-Trader does not intend to represent that all private user
                activity is continuously reviewed by human moderators.
              </p>
            </LegalSection>

            <LegalSection id="20" title="20. Data Retention">
              <p>
                A-Trader retains identifiable personal information only for as
                long as reasonably necessary for the purposes for which it was
                collected, to provide the Service, maintain security, resolve
                disputes, enforce applicable agreements or satisfy legitimate
                legal requirements.
              </p>

              <p>
                Different categories of information may have different
                retention periods depending on their purpose, sensitivity and
                applicable requirements.
              </p>

              <p>
                Information may remain temporarily in backups or security
                systems after deletion from active systems until the applicable
                backup or retention cycle expires.
              </p>

              <p>
                Properly anonymized information may be retained where it no
                longer identifies an individual and its continued use is
                permitted by applicable law.
              </p>
            </LegalSection>

            <LegalSection id="21" title="21. Inactive Accounts">
              <p>
                A-Trader is not required to maintain abandoned or inactive
                accounts indefinitely.
              </p>

              <p>
                A-Trader may establish an inactivity period after which an
                account and associated information may be scheduled for
                deletion.
              </p>

              <p>
                Before permanently deleting an account solely because of
                prolonged inactivity, A-Trader intends to provide reasonable
                advance notice using available account contact information and
                provide a reasonable opportunity to keep the account active.
              </p>
            </LegalSection>

            <LegalSection id="22" title="22. Account Deletion">
              <p>
                A-Trader intends to provide users with a reasonable method to
                permanently delete their accounts and associated information.
              </p>

              <p>
                A clear confirmation may be required to reduce accidental
                deletion. Additional authentication may also be required to
                protect an account from unauthorized deletion.
              </p>

              <p>
                Following a valid deletion request, personal information will
                be deleted or de-identified in accordance with applicable law
                and A-Trader&apos;s retention practices, subject to reasonable
                processing periods, backup cycles, security needs and
                information that must or may lawfully be retained.
              </p>
            </LegalSection>

            <LegalSection id="23" title="23. Security">
              <p>
                A-Trader uses or intends to use reasonable technical,
                organizational and administrative safeguards appropriate to the
                nature of the information and the development of the Service.
              </p>

              <p>
                Safeguards may include password hashing, access controls,
                encrypted network communications, authentication controls,
                security logging, infrastructure protections and other
                reasonable measures.
              </p>

              <p>
                No internet-connected system can guarantee absolute security.
                A-Trader therefore does not represent that unauthorized access,
                loss or security incidents can never occur.
              </p>

              <p>
                Future sensitive integrations, including brokerage
                integrations, should follow minimum-access principles and avoid
                requesting unnecessary permissions.
              </p>
            </LegalSection>

            <LegalSection
              id="24"
              title="24. Account Recovery and Security Records"
            >
              <p>
                A-Trader may maintain reasonable records relating to account
                security, including login timestamps, IP information,
                device/browser information, failed login attempts,
                password-reset events, session information and suspicious
                activity.
              </p>

              <p>
                These records may be used for authentication, fraud prevention,
                troubleshooting, security investigations and protection of
                users and the Service.
              </p>

              <p>
                Future security functionality may include recognized-device
                information, active-session management, remote sign-out,
                security notifications, recovery codes, passkeys, stronger
                authentication methods and an optional verified recovery email.
              </p>

              <p>
                If a recovery email is offered, A-Trader intends to verify that
                address before relying on it and avoid unnecessarily revealing
                the complete recovery address to someone attempting account
                recovery.
              </p>
            </LegalSection>

            <LegalSection id="25" title="25. Your Privacy Rights">
              <p>
                Depending on where you live and the laws applicable to the
                processing of your information, you may have rights concerning
                your personal information.
              </p>

              <p>These may include rights to:</p>

              <ul>
                <li>request access to personal information about you;</li>
                <li>request correction of inaccurate information;</li>
                <li>request deletion where applicable;</li>
                <li>
                  withdraw consent to processing that depends on consent,
                  subject to applicable limitations;
                </li>
                <li>
                  obtain information concerning how personal information is
                  processed;
                </li>
                <li>
                  obtain personal information in a technological or structured
                  format where required by applicable law; and
                </li>
                <li>
                  exercise additional privacy rights provided by applicable
                  legislation.
                </li>
              </ul>

              <p>
                A-Trader may need to verify your identity before completing
                certain privacy requests in order to protect your information
                from unauthorized access.
              </p>

              <p>
                A-Trader may eventually provide self-service privacy controls
                directly through Account Settings. This Policy does not promise
                that every privacy right is currently available through a
                specific automated export tool.
              </p>
            </LegalSection>

            <LegalSection
              id="26"
              title="26. Information About Other People"
            >
              <p>
                You should avoid submitting unnecessary personal information
                about another person through A-Trader.
              </p>

              <p>
                If you provide personal information relating to another person,
                you are responsible for ensuring that you are permitted to do
                so and for complying with applicable legal requirements.
              </p>

              <p>
                A-Trader may design import and extraction functionality to
                reduce unnecessary processing of third-party information where
                reasonably practical.
              </p>
            </LegalSection>

            <LegalSection id="27" title="27. Legal Disclosures">
              <p>
                A-Trader may disclose information where required or permitted
                by applicable law, including in response to valid legal
                process, court orders, regulatory requirements or other
                enforceable legal obligations.
              </p>

              <p>
                A-Trader does not intend to disclose private user information
                merely because an unrelated person informally requests it.
              </p>

              <p>
                Where legally permitted and appropriate, A-Trader may notify an
                affected user of a legal request concerning their information.
              </p>
            </LegalSection>

            <LegalSection id="28" title="28. Privacy Incidents">
              <p>
                If A-Trader becomes aware of a security or confidentiality
                incident involving personal information, A-Trader will assess
                and respond to the incident as reasonably appropriate.
              </p>

              <p>
                This may include investigating the incident, taking reasonable
                steps to contain or reduce harm, maintaining records where
                required and notifying affected individuals or appropriate
                authorities when required by applicable law.
              </p>
            </LegalSection>

            <LegalSection id="29" title="29. Communications">
              <p>
                A-Trader may use your contact information for communications
                necessary to provide and protect your account, including
                password resets, security alerts, important account notices,
                material legal or privacy updates and other necessary service
                communications.
              </p>

              <p>
                Marketing, promotional, newsletter or similar non-essential
                communications will be treated separately. Where offered,
                users should be able to control those communications through
                appropriate preferences or consent mechanisms.
              </p>

              <p>
                Declining optional marketing communications does not prevent
                A-Trader from sending necessary account, security, legal or
                service messages.
              </p>
            </LegalSection>

            <LegalSection
              id="30"
              title="30. Children and Age Requirement"
            >
              <p>
                A-Trader is intended solely for individuals who are at least 18
                years of age.
              </p>

              <p>
                Individuals under 18 are not permitted to create or maintain an
                A-Trader account.
              </p>

              <p>
                If A-Trader reasonably determines that an account is being used
                contrary to this age requirement, appropriate action may be
                taken, including account restriction or deletion, subject to
                applicable legal requirements.
              </p>
            </LegalSection>

            <LegalSection
              id="31"
              title="31. Changes to This Policy"
            >
              <p>
                A-Trader may update this Privacy Policy as the Service,
                technology, business model and applicable legal requirements
                evolve.
              </p>

              <p>
                The effective date and version number at the top of this Policy
                identify the current version.
              </p>

              <p>
                A-Trader intends to notify users of material privacy changes,
                even where direct notification may not otherwise be strictly
                required by law. Notice may be provided through the Service,
                email or another appropriate communication method.
              </p>

              <p>
                Minor corrections or clarifications that do not materially
                change privacy practices may be made without an account-wide
                notification.
              </p>

              <p>
                Where applicable law requires renewed consent before a new
                processing activity begins, A-Trader will seek that consent.
              </p>
            </LegalSection>

            <LegalSection id="32" title="32. Privacy by Design">
              <p>
                A-Trader intends to consider privacy and security during the
                design of new functionality rather than only after a feature
                has been released.
              </p>

              <p>
                Features involving materially new categories or uses of
                personal information should receive an appropriate privacy and
                security review before release.
              </p>

              <p>
                This is particularly important for features involving brokerage
                integrations, financial information, AI processing, payments,
                social sharing or other potentially sensitive functionality.
              </p>

              <p>
                Where applicable law requires a formal privacy impact
                assessment or another specific review, A-Trader will address
                that requirement before implementing the relevant processing.
              </p>
            </LegalSection>

            <LegalSection
              id="33"
              title="33. Privacy Questions and Complaints"
            >
              <p>
                Users may contact the person responsible for privacy at A-Trader
                with questions, requests or complaints concerning personal
                information.
              </p>

              <p>
                Legitimate privacy requests and complaints will be reviewed and
                handled in accordance with applicable legal requirements.
              </p>

              <p>
                Nothing in this Policy is intended to prevent an individual
                from contacting an appropriate privacy regulator or exercising
                rights available under applicable law.
              </p>

              <div className="mt-5 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] p-4 text-sm text-amber-100/80">
                A dedicated A-Trader privacy contact address is being
                established. This section will be updated with the appropriate
                contact information before that address is used as the formal
                privacy contact for the Service.
              </div>
            </LegalSection>

            <div className="border-t border-white/10 pt-8 text-sm leading-6 text-slate-500">
              <p>
                This Privacy Policy should be read together with the{" "}
                <Link
                  href="/terms"
                  className="text-violet-400 hover:text-violet-300"
                >
                  Terms of Service
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