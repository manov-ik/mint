"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function SignInClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Pre-fill username if redirected from sign-up
  useEffect(() => {
    const signupUsername = searchParams.get("username");
    if (signupUsername) {
      setUsername(signupUsername);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      let redirectPath = "/";
      if (callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")) {
        redirectPath = callbackUrl;
      } else {
        try {
          const urlObj = new URL(callbackUrl);
          redirectPath = urlObj.pathname + urlObj.search;
        } catch (e) {
          redirectPath = "/";
        }
      }

      const res = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl: redirectPath,
      });

      if (res?.error) {
        setError("Invalid username or password");
        setLoading(false);
      } else {
        window.location.href = redirectPath;
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-on-background relative">
      {/* Logo */}
      <div className="mb-10 text-center flex flex-col items-center z-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-2xl font-semibold tracking-[0.2em] uppercase text-primary mb-2 transition-opacity hover:opacity-95"
        >
          <Logo className="w-5 h-5 text-primary" />
          mint
        </Link>
        <div className="text-[10px] font-semibold text-outline-variant tracking-[0.25em] uppercase">
          Minimal Habit and Task Tracker
        </div>
      </div>

      {/* Sign In Card */}
      <div className="w-full max-w-sm bg-surface-container/60 backdrop-blur-md border border-outline-variant/20 rounded-3xl p-8 shadow-2xl z-10 transition-all duration-300 hover:border-outline-variant/40">
        <h2 className="text-xl font-light text-primary mb-6 text-center tracking-wide">
          Sign In
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold tracking-[0.15em] uppercase text-outline px-1">
              Username
            </label>
            <input
              type="text"
              required
              disabled={loading}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g., your_username"
              className="w-full py-3 px-4 bg-background/50 text-primary border border-outline-variant/30 rounded-xl text-sm placeholder:text-outline-variant/40 focus:outline-none focus:border-secondary transition-colors disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold tracking-[0.15em] uppercase text-outline px-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-3 pl-4 pr-12 bg-background/50 text-primary border border-outline-variant/30 rounded-xl text-sm placeholder:text-outline-variant/40 focus:outline-none focus:border-secondary transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-2 bg-secondary text-on-secondary rounded-xl font-bold text-xs tracking-[0.2em] uppercase hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-outline">
            New to Mint?{" "}
            <Link
              href="/sign-up"
              className="text-secondary hover:underline font-semibold ml-1"
            >
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
