
"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const supabase = useMemo(() => createClient(), []);

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "success">("error");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setMessage("");

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        window.location.replace("/studio");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/studio`,
          },
        });

        if (error) throw error;

        if (data.session) {
          window.location.replace("/studio");
          return;
        }

        setMessageType("success");
        setMessage(
          "Account created successfully! Please check your email and confirm your account. Then sign in to access Creator Studio."
        );
      }
    } catch (error) {
      setMessageType("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#faf8f5] px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-[#eee7df] bg-white p-8 shadow-sm sm:p-10">
        <a href="/" className="text-3xl font-black tracking-tight">
          viora<span className="text-[#df8272]">.</span>
        </a>

        <div className="mt-10 text-center">
          <p className="text-sm font-semibold tracking-[0.2em] text-[#df8272]">
            YOUR WORLD OF INSPIRATION
          </p>

          <h1 className="mt-4 text-3xl font-bold text-[#242424]">
            {isLogin ? "Welcome back!" : "Join Viora"}
          </h1>

          <p className="mt-3 leading-6 text-gray-500">
            {isLogin
              ? "Sign in to discover and save your favourite ideas."
              : "Create an account and start sharing your inspiration."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-semibold">
              Email address
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-[#df8272] focus:ring-2 focus:ring-[#df8272]/10"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-semibold">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none transition focus:border-[#df8272] focus:ring-2 focus:ring-[#df8272]/10"
            />
            <p className="mt-2 text-xs text-gray-400">
              Password must contain at least 6 characters.
            </p>
          </div>

          {message && (
            <div
              role="alert"
              className={`rounded-xl p-3 text-sm ${
                messageType === "success"
                  ? "bg-green-50 text-green-700"
                  : "bg-[#fff3ef] text-[#a94f40]"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#242424] py-4 font-semibold text-white transition hover:bg-[#df8272] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Sign In"
                : "Create Account"}
          </button>
        </form>

        <div className="mt-7 text-center text-sm text-gray-600">
          {isLogin
            ? "Don't have an account?"
            : "Already have an account?"}

          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setMessage("");
              setPassword("");
            }}
            className="ml-2 font-bold text-[#df8272] hover:underline"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </div>

        <a
          href="/"
          className="mt-8 block text-center text-sm text-gray-400 transition hover:text-black"
        >
          ← Back to Discover
        </a>
      </div>
    </main>
  );
}





