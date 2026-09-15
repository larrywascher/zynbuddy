"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { MapPin, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("no-token");
      return;
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (res.ok) {
          setStatus("success");
          setMessage(`Email ${data.email} verified successfully!`);
        } else {
          setStatus(data.alreadyVerified ? "success" : "error");
          setMessage(data.error || "Verification failed");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Network error. Please try again.");
      });
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex items-center justify-center gap-2 mb-6">
          <MapPin className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">ZynBuddy</h1>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
          {status === "loading" && (
            <div className="space-y-4">
              <Loader2 className="h-12 w-12 text-green-600 animate-spin mx-auto" />
              <p className="text-gray-500 dark:text-gray-400">Verifying your email...</p>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-4">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Email Verified!</h2>
              <p className="text-gray-500 dark:text-gray-400">{message}</p>
              <Link
                href="/auth/signin"
                className="inline-block mt-4 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                Sign In
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 text-red-500 mx-auto" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verification Failed</h2>
              <p className="text-gray-500 dark:text-gray-400">{message}</p>
              <Link
                href="/auth/register"
                className="inline-block mt-4 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
              >
                Register Again
              </Link>
            </div>
          )}

          {status === "no-token" && (
            <div className="space-y-4">
              <XCircle className="h-12 w-12 text-gray-400 mx-auto" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Token</h2>
              <p className="text-gray-500 dark:text-gray-400">
                Missing verification token. Check your email for the verification link.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
