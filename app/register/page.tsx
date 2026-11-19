"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../components/AuthProvider";
import { MAX_EMAIL_LENGTH, MAX_NAME_LENGTH } from "../lib/input-limits";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasError, setHasError] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setHasError(false);

    if (!name.trim() || !email.trim() || !password.trim()) {
      setMessage("Please fill in all fields to create your account.");
      setHasError(true);
      return;
    }

    if (password.length < 12) {
      setMessage("Password must be at least 12 characters long.");
      setHasError(true);
      return;
    }

    if (password.length > 128) {
      setMessage("Password must be no more than 128 characters long.");
      setHasError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register(name, email, password);
      setMessage(result.message);
      setHasError(!result.success);

      if (result.success) {
        router.push("/");
      }
    } catch (error) {
      setHasError(true);
      setMessage(error instanceof Error ? error.message : "Unable to create your account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950/80 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 to-violet-500 font-semibold text-white">
            MD
          </div>
          <h1 className="text-2xl font-semibold text-white">Create account</h1>
          <p className="mt-2 text-sm text-slate-400">
            Join MindDock and organize your ideas in one place.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm text-slate-300">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              maxLength={MAX_NAME_LENGTH}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-sky-400"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              maxLength={MAX_EMAIL_LENGTH}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-sky-400"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              maxLength={128}
              placeholder="Create a password (12 characters minimum)"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-white outline-none transition focus:border-sky-400"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-gradient-to-r from-sky-400 to-violet-500 px-4 py-3 font-semibold text-white transition hover:opacity-90"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>

          {message ? (
            <p role={hasError ? "alert" : "status"} className={`rounded-2xl border px-3 py-2 text-sm ${hasError ? "border-rose-400/20 bg-rose-400/10 text-rose-200" : "border-cyan-400/20 bg-cyan-400/10 text-cyan-200"}`}>
              {message}
            </p>
          ) : null}
        </form>

        <div className="mt-6 text-center text-sm text-slate-400">
          <span>Already have an account?</span>{" "}
          <Link href="/login" className="font-medium text-sky-300 hover:text-white">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
