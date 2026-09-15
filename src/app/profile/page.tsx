"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  User,
  Mail,
  Phone,
  Lock,
  Award,
  Shield,
  TrendingUp,
  Save,
  CheckCircle,
  ArrowLeft,
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  role: string;
  rewardPoints: number;
  trustScore: number;
  totalUpvotes: number;
  totalSubmissions: number;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/user/profile")
        .then((r) => r.json())
        .then((data) => {
          if (data.error) {
            setMessage(data.error);
            setLoading(false);
            return;
          }
          setProfile(data);
          setName(data.name || "");
          setFirstName(data.firstName || "");
          setLastName(data.lastName || "");
          const rawPhone = data.phone || "";
          setPhone(rawPhone.includes("@") ? "" : rawPhone);
          setLoading(false);
        })
        .catch(() => {
          setMessage("Failed to load profile");
          setLoading(false);
        });
    }
  }, [status, router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      setMessage("Passwords don't match");
      return;
    }
    if (newPassword && newPassword.length < 6) {
      setMessage("New password must be at least 6 characters");
      return;
    }
    if (newPassword && !currentPassword) {
      setMessage("Current password is required to set a new password");
      return;
    }
    setSaving(true);
    setMessage("");

    const body: Record<string, string> = { name, firstName, lastName, phone };
    if (newPassword) {
      body.currentPassword = currentPassword;
      body.newPassword = newPassword;
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Profile updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setProfile((prev) => prev ? { ...prev, ...data } : prev);
        if (data.phone !== undefined) {
          setPhone(data.phone || "");
        }
      } else {
        setMessage(data.error || "Failed to update profile");
      }
    } catch {
      setMessage("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-200 border-t-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-2xl mx-auto w-full px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to map
        </Link>

        <h1 className="text-2xl font-extrabold dark:text-white mb-6 flex items-center gap-2">
          <User className="h-6 w-6 text-green-600" />
          My Profile
        </h1>

        {profile && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            <div className="glass-card p-4 text-center">
              <Award className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-green-600">{profile.rewardPoints}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Points</p>
            </div>
            <div className="glass-card p-4 text-center">
              <TrendingUp className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold text-amber-600">{(profile.trustScore ?? 0).toFixed(0)}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Trust Score</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold dark:text-white">{profile.totalSubmissions}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Reports</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold dark:text-white">{profile.totalUpvotes}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Upvotes</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSave} className="glass-card p-6 space-y-5">
          {message && (
            <div
              className={`p-3 rounded-xl text-sm font-medium flex items-center gap-2 ${
                message.includes("success")
                  ? "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {message.includes("success") && <CheckCircle className="h-4 w-4" />}
              {message}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                First Name
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                Last Name
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Display Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Email <span className="normal-case text-[9px] text-gray-400">(cannot be changed)</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-100 dark:bg-gray-800/50 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9+\-() ]/g, "");
                  setPhone(val);
                }}
                placeholder="(555) 555-5555"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <h3 className="text-sm font-semibold dark:text-white flex items-center gap-1.5 mb-3">
              <Lock className="h-4 w-4 text-gray-400" />
              Change Password
            </h3>
            <div className="space-y-3">
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 characters)"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-6 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Shield className="h-3 w-3" />
              {profile?.role === "ADMIN" ? "Admin" : "Member"} since{" "}
              {profile ? new Date(profile.createdAt).toLocaleDateString() : ""}
            </span>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
