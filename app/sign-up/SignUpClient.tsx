"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function SignUpClient() {
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to register account");
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/sign-in?username=${encodeURIComponent(username)}`);
        }, 1500);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-on-background">
      {/* Logo */}
      <div className="mb-10 text-center flex flex-col items-center z-10">
        <Link
          href="/"
          className="flex items-center gap-2.5 text-2xl font-semibold tracking-[0.2em] uppercase text-primary mb-2 transition-opacity hover:opacity-95"
        >
          <Logo className="w-5 h-5  text-primary" />
          mint
        </Link>
        <div className="text-[10px] font-semibold text-outline-variant tracking-[0.25em] uppercase">
          Minimal Habit and Task Tracker
        </div>
      </div>

      {/* Sign Up Card */}
      <div className="w-full max-w-sm bg-surface-container/60 backdrop-blur-md border border-outline-variant/20 rounded-3xl p-8 shadow-2xl z-10 transition-all duration-300 hover:border-outline-variant/40">
        <h2 className="text-xl font-light text-primary mb-6 text-center tracking-wide">
          Create Account
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-error/10 border border-error/20 text-error text-xs rounded-xl text-center font-medium">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-secondary/10 border border-secondary/20 text-secondary text-xs rounded-xl text-center font-medium">
            Account created successfully! Redirecting...
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold tracking-[0.15em] uppercase text-outline px-1">
              Username *
            </label>
            <input
              type="text"
              required
              disabled={loading || success}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. yourusername"
              className="w-full py-3 px-4 bg-background/50 text-primary border border-outline-variant/30 rounded-xl text-sm placeholder:text-outline-variant/40 focus:outline-none focus:border-secondary transition-colors disabled:opacity-50"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold tracking-[0.15em] uppercase text-outline px-1">
              Password *
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                disabled={loading || success}
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

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold tracking-[0.15em] uppercase text-outline px-1">
              Confirm Password *
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                disabled={loading || success}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full py-3 pl-4 pr-12 bg-background/50 text-primary border border-outline-variant/30 rounded-xl text-sm placeholder:text-outline-variant/40 focus:outline-none focus:border-secondary transition-colors disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors focus:outline-none"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="w-full py-4 mt-2 bg-secondary text-on-secondary rounded-xl font-bold text-xs tracking-[0.2em] uppercase hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? "Registering..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-[11px] text-outline">
            Already have an account?{" "}
            <Link
              href="/sign-in"
              className="text-secondary hover:underline font-semibold ml-1"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
