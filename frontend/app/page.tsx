import Link from "next/link";

const features = [
  {
    number: "01",
    title: "Smart Trade Journal",
    description:
      "Record your trades, strategies, emotions, mistakes, and lessons in one organized workspace.",
  },
  {
    number: "02",
    title: "Performance Analytics",
    description:
      "Understand your win rate, expectancy, consistency, risk management, and strongest trading setups.",
  },
  {
    number: "03",
    title: "Market Replay",
    description:
      "Replay historical sessions candle by candle, practice long and short trades, and review your decisions without seeing future price action.",
  },
  {
    number: "04",
    title: "Personal AI Coach",
    description:
      "Receive feedback based on your real trading history instead of generic advice or signals.",
  },
  {
    number: "05",
    title: "Learning Center",
    description:
      "Build stronger trading foundations with structured lessons, examples, and practical exercises.",
  },
];
const steps = [
  "Log or import your trades",
  "Discover patterns in your performance",
  "Build better trading habits",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          A Trader
        </Link>

        <div className="hidden items-center gap-8 text-sm text-zinc-400 md:flex">
          <a href="#features" className="transition hover:text-white">
            Features
          </a>

          <a href="#process" className="transition hover:text-white">
            How it works
          </a>

          <a href="#mission" className="transition hover:text-white">
            Mission
          </a>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden rounded-full px-4 py-2 text-sm text-zinc-300 transition hover:text-white sm:block"
          >
            Log In
          </Link>

          <Link
            href="/register"
            className="rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
          >
            Start Free
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden px-6 pb-28 pt-24 text-center lg:px-8 lg:pb-40 lg:pt-32">
        <div className="absolute left-1/2 top-20 h-96 w-96 -translate-x-1/2 rounded-full bg-blue-600/20 blur-[120px]" />

        <div className="relative mx-auto max-w-5xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Built for traders committed to improving
          </div>

          <h1 className="text-5xl font-semibold leading-tight tracking-tight sm:text-7xl lg:text-8xl">
            Become the trader
            <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              you want to be.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-8 text-zinc-400 sm:text-xl">
            Journal every trade, understand your performance, and improve your
            decision-making with personalized AI coaching.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/register"
              className="w-full rounded-full bg-white px-7 py-3.5 text-center font-medium text-black transition hover:bg-zinc-200 sm:w-auto"
            >
              Start Building for Free
            </Link>

            <Link
              href="/login"
              className="w-full rounded-full border border-zinc-700 px-7 py-3.5 text-center font-medium text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-900 sm:w-auto"
            >
              Log In
            </Link>
          </div>

          <p className="mt-5 text-sm text-zinc-600">
            No signals. No shortcuts. Just better trading habits.
          </p>
        </div>
      </section>

      <section
        id="features"
        className="border-y border-zinc-900 bg-zinc-950/60 px-6 py-24 lg:px-8"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
              The platform
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Your trading data should teach you something.
            </h2>

            <p className="mt-5 text-lg leading-8 text-zinc-400">
              A Trader turns your trading history into clear, useful insights
              that help you improve over time.
            </p>
          </div>

          <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-5">
            {features.map((feature) => (
              <article
                key={feature.number}
                className="group rounded-3xl border border-zinc-800 bg-black p-7 transition hover:-translate-y-1 hover:border-zinc-600"
              >
                <p className="text-sm font-medium text-blue-400">
                  {feature.number}
                </p>

                <h3 className="mt-10 text-xl font-semibold">
                  {feature.title}
                </h3>

                <p className="mt-4 leading-7 text-zinc-400">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="process" className="px-6 py-24 lg:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl gap-16 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-400">
              How it works
            </p>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Improvement starts with understanding yourself.
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-400">
              Your results are only part of the story. A Trader helps connect
              your decisions, habits, emotions, and execution.
            </p>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="flex items-center gap-5 rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white font-semibold text-black">
                  {index + 1}
                </div>

                <p className="text-lg font-medium">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="mission" className="px-6 pb-24 lg:px-8 lg:pb-32">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-zinc-800 bg-gradient-to-br from-zinc-900 to-black px-7 py-16 text-center sm:px-12 lg:py-24">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-blue-400">
            Where a Trader is Built
          </p>

          <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Stop searching for the perfect signal. Start building the right
            process.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-zinc-400">
            A Trader is designed to help traders become more disciplined,
            self-aware, and consistent.
          </p>

          <Link
            href="/register"
            className="mt-9 inline-block rounded-full bg-white px-7 py-3.5 font-medium text-black transition hover:bg-zinc-200"
          >
            Start Your Journey
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-zinc-300">A Trader</p>
          <p>Practice. Journal. Improve. Repeat.</p>
          <p>© 2026 A Trader</p>
        </div>
      </footer>
    </main>
  );
}