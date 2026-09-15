"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Eye, EyeOff, CheckCircle, Mail } from "lucide-react";

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (!pw) return { label: "", color: "", width: "0%" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: "Weak", color: "bg-red-500", width: "20%" };
  if (score === 2) return { label: "Fair", color: "bg-orange-500", width: "40%" };
  if (score === 3) return { label: "Good", color: "bg-yellow-500", width: "60%" };
  if (score === 4) return { label: "Strong", color: "bg-green-500", width: "80%" };
  return { label: "Very Strong", color: "bg-green-600", width: "100%" };
}

export default function Register() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [verificationToken, setVerificationToken] = useState("");

  const strength = getPasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email.includes("@") || !email.includes(".")) {
      setError("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      if (data.verificationToken) {
        setVerificationToken(data.verificationToken);
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setRegistered(true);
      } else {
        setRegistered(true);
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <MapPin className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ZynBuddy</h1>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Account Created!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              Welcome to ZynBuddy! Please verify your email to unlock all features.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-700 dark:text-blue-300 text-sm">Verify Your Email</span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                In a production environment, we would send a verification email. For now, click below to verify:
              </p>
              <a
                href={`/auth/verify-email?token=${verificationToken}`}
                className="inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                Verify Email Now
              </a>
            </div>
            <button
              onClick={() => { router.push("/"); router.refresh(); }}
              className="w-full py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
            >
              Go to ZynBuddy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <MapPin className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ZynBuddy</h1>
          </div>
          <p className="text-gray-500 dark:text-gray-400">
            Create an account to start reporting prices
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="ZynHunter42"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Min 6 characters"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div className={`h-full ${strength.color} transition-all`} style={{ width: strength.width }} />
                </div>
                <p className="text-[10px] mt-1 text-gray-400">{strength.label}</p>
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            Already have an account?{" "}
            <Link
              href="/auth/signin"
              className="text-green-600 hover:underline font-medium"
            >
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
