"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";

import {
  API_URL,
  saveToken,
} from "@/lib/api";


export default function LoginPage() {
  const [
    email,
    setEmail,
  ] = useState(
    "",
  );

  const [
    password,
    setPassword,
  ] = useState(
    "",
  );

  const [
    loading,
    setLoading,
  ] = useState(
    false,
  );

  const [
    error,
    setError,
  ] = useState(
    "",
  );


  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setLoading(
        true,
      );

      setError(
        "",
      );


      const body =
        new URLSearchParams();

      body.set(
        "username",
        email
          .trim()
          .toLowerCase(),
      );

      body.set(
        "password",
        password,
      );


      const response =
        await fetch(
          `${API_URL}/auth/token`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },

            body,
          },
        );


      const data =
        await response
          .json()
          .catch(
            () => null,
          );


      if (
        !response.ok
      ) {
        throw new Error(
          data?.detail
          ?? "Could not sign in.",
        );
      }


      if (
        !data?.access_token
      ) {
        throw new Error(
          "The server did not return an access token.",
        );
      }


      saveToken(
        data.access_token,
      );


      /*
       * Use a full browser navigation here.
       *
       * This ensures the access_token cookie
       * is included when Next.js proxy checks
       * the /dashboard request.
       */
      window.location.assign(
        "/dashboard",
      );

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong.",
      );

    } finally {
      setLoading(
        false,
      );
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
            Welcome back
          </h1>


          <p className="mt-2 text-zinc-400">
            Sign in to access your trading workspace.
          </p>

        </div>


        <form
          onSubmit={
            handleSubmit
          }
          className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
        >

          {error && (
            <div className="mb-5 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-300">
              {
                error
              }
            </div>
          )}


          <label className="block">

            <span className="text-sm text-zinc-400">
              Email address
            </span>


            <input
              required

              type="email"

              autoComplete="email"

              value={
                email
              }

              onChange={(
                event,
              ) =>
                setEmail(
                  event.target.value,
                )
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

              autoComplete="current-password"

              value={
                password
              }

              onChange={(
                event,
              ) =>
                setPassword(
                  event.target.value,
                )
              }

              placeholder="Enter your password"

              className="mt-2 w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 outline-none transition focus:border-emerald-400"
            />

          </label>


          <button
            type="submit"

            disabled={
              loading
            }

            className="mt-6 w-full rounded-xl bg-emerald-400 px-5 py-3 font-semibold text-zinc-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {
              loading
                ? "Signing in..."
                : "Sign In"
            }
          </button>


          <p className="mt-6 text-center text-sm text-zinc-500">
            Don&apos;t have an account?{" "}

            <Link
              href="/register"
              className="font-medium text-emerald-400 hover:text-emerald-300"
            >
              Create one
            </Link>
          </p>

        </form>

      </div>

    </main>
  );
}