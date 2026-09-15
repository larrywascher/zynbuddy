"use client";

import { useEffect, useState } from "react";
import { MapPin, ShieldAlert } from "lucide-react";

const STORAGE_KEY = "zynbuddy_age_verified";
const MIN_AGE = 21;

function calculateAge(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const monthDiff = now.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export default function AgeGate() {
  const [mounted, setMounted] = useState(false);
  const [verified, setVerified] = useState(false);
  const [dob, setDob] = useState("");
  const [error, setError] = useState("");
  const [rejected, setRejected] = useState(false);

  useEffect(() => {
    try {
      setVerified(localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      setVerified(false);
    }
    setMounted(true);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!dob) {
      setError("Please enter your date of birth.");
      return;
    }

    const parsed = new Date(dob);
    if (isNaN(parsed.getTime()) || parsed > new Date()) {
      setError("Please enter a valid date of birth.");
      return;
    }

    if (calculateAge(parsed) < MIN_AGE) {
      setRejected(true);
      return;
    }

    try {
      localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // Session-only verification if storage is unavailable.
    }
    setVerified(true);
  }

  if (!mounted || verified) return null;

  return (
    <div className="fixed inset-0 z-[10000] bg-gray-950/95 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 sm:p-8">
        {rejected ? (
          <div className="text-center">
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              You must be {MIN_AGE} or older
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              ZynBuddy provides pricing information for age-restricted nicotine products
              and is only available to adults {MIN_AGE} years of age or older.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 mb-2">
              <MapPin className="h-7 w-7 text-green-600" />
              <span className="text-2xl font-extrabold text-gray-900 dark:text-white">
                ZynBuddy
              </span>
            </div>
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
              This site contains information about age-restricted nicotine products.
              You must be {MIN_AGE} or older to enter.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="age-gate-dob"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Date of Birth
                </label>
                <input
                  id="age-gate-dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors"
              >
                Enter Site
              </button>
            </form>

            <p className="text-[11px] text-gray-400 text-center mt-5 leading-relaxed">
              By entering, you confirm you are of legal age and agree to our{" "}
              <a href="/terms" className="text-green-600 hover:underline">
                Terms of Service
              </a>
              . ZynBuddy does not sell nicotine products. Nicotine is an addictive
              chemical.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
