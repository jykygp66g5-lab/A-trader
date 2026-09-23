"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, saveToken } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [legalAccepted, setLegalAccepted] = useState(false);

  const [termsOpened, setTermsOpened] = useState(false);
  const [privacyOpened, setPrivacyOpened] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const legalDocumentsOpened = termsOpened && privacyOpened;

  const canCreateAccount =
    ageConfirmed &&
    legalAccepted &&
    legalDocumentsOpened &&
    !loading;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    if (!ageConfirmed) {
      setError(
        "You must confirm that you are at least 18 years old to create an A-Trader account.",
      );
      return;
    }

    if (!termsOpened) {
      setError(
        "Please open and review the Terms of Service before creating your account.",
      );
      return;
    }

    if (!privacyOpened) {
      setError(
        "Please open and review the Privacy Policy before creating your account.",
      );
      return;
    }

    if (!legalAccepted) {
      setError(
        "You must agree to the Terms of Service and Privacy Policy to create an account.",
      );
      return;
    }

    try {
      setLoading(true);
      setError("");

      const registerResponse = await fetch(
        `${API_URL}/auth/register`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },body: JSON.stringify({
  name: name.trim(),
  email: email.trim().toLowerCase(),
  password,

  age_confirmed: ageConfirmed,

  terms_accepted: legalAccepted,
  privacy_accepted: legalAccepted,

  terms_version: "2026-09-15",
  privacy_version: "2026-09-15",
}),
        },
      );

      const registerData = await registerResponse.json();

      if (!registerResponse.ok) {
        throw new Error(
          registerData.detail ?? "Could not create account.",
        );
      }

      const loginBody = new URLSearchParams();

      loginBody.set(
        "username",
        email.trim().toLowerCase(),
      );

      loginBody.set("password", password);

      const loginResponse = await fetch(
        `${API_URL}/auth/token`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: loginBody,
        },
      );

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        throw new Error(
          loginData.detail ??
            "Account created, but automatic sign-in failed.",
        );
      }

      saveToken(loginData.access_token);

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 py-12 text-white">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-2xl font-semibold"
          >
            A Trader
          </Link>

          <p className="mt-2 text-sm text-emerald-400">
            Where a Trader is Built
          </p>

          <h1 className="mt-8 text-3xl font-semibold tracking-tight">
            Create your account
          </h1>

          <p className="mt-2 text-zinc-400">
            Start building your trading record.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
        >
          {error && (
            <div className="mb-5 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <label className="block">
            <span className="text-sm text-zinc-400">
              Name
            </span>

            <input
              required
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Your name"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none transition focus:border-emerald-400"
            />
          </label>

          <label className="mt-5 block">
            <span className="text-sm text-zinc-400">
              Email address
            </span>

            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="you@example.com"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none transition focus:border-emerald-400"
            />
          </label>

          <label className="mt-5 block">
            <span className="text-sm text-zinc-400">
              Password
            </span>

            <input
              required
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="At least 8 characters"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none transition focus:border-emerald-400"
            />
          </label>

          <label className="mt-5 block">
            <span className="text-sm text-zinc-400">
              Confirm password
            </span>

            <input
              required
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(event.target.value)
              }
              placeholder="Repeat your password"
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none transition focus:border-emerald-400"
            />
          </label>

          <div className="mt-6 space-y-5 border-t border-zinc-800 pt-6">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(event) =>
                  setAgeConfirmed(event.target.checked)
                }
                className="mt-1 h-4 w-4 shrink-0 accent-emerald-400"
              />

              <span className="text-sm leading-6 text-zinc-300">
                I confirm that I am 18 years of age or
                older.
              </span>
            </label>

            <div>
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={legalAccepted}
                  disabled={!legalDocumentsOpened}
                  onChange={(event) =>
                    setLegalAccepted(
                      event.target.checked,
                    )
                  }
                  className="mt-1 h-4 w-4 shrink-0 accent-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                />

                <span className="text-sm leading-6 text-zinc-300">
                  I have read and agree to the{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-400 hover:text-emerald-300"
                    onClick={() => {
                      setTermsOpened(true);
                      setError("");
                    }}
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-emerald-400 hover:text-emerald-300"
                    onClick={() => {
                      setPrivacyOpened(true);
                      setError("");
                    }}
                  >
                    Privacy Policy
                  </Link>
                  .
                </span>
              </div>

              {!legalDocumentsOpened && (
                <div className="ml-7 mt-3 space-y-1 text-xs">
                  <p
                    className={
                      termsOpened
                        ? "text-emerald-400"
                        : "text-zinc-500"
                    }
                  >
                    {termsOpened ? "✓" : "○"} Terms of
                    Service opened
                  </p>

                  <p
                    className={
                      privacyOpened
                        ? "text-emerald-400"
                        : "text-zinc-500"
                    }
                  >
                    {privacyOpened ? "✓" : "○"} Privacy
                    Policy opened
                  </p>
                </div>
              )}

              {legalDocumentsOpened && (
                <p className="ml-7 mt-3 text-xs text-emerald-400">
                  ✓ Legal documents opened — you may now
                  confirm your agreement.
                </p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={!canCreateAccount}
            className="mt-6 w-full rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500 disabled:opacity-70"
          >
            {loading
              ? "Creating account..."
              : "Create Account"}
          </button>

          {!canCreateAccount && !loading && (
            <p className="mt-3 text-center text-xs leading-5 text-zinc-600">
              Confirm your age, open both legal documents,
              and accept them to create an account.
            </p>
          )}

          <p className="mt-6 text-center text-sm text-zinc-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-400 hover:text-emerald-300"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}