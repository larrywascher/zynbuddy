"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Award, TrendingUp, ThumbsUp, Star, Zap, Shield, Clock } from "lucide-react";

interface RewardsData {
  rewardPoints: number;
  totalSubmissions: number;
  totalUpvotes: number;
  trustScore: number;
  activePrices: number;
  recentActivity: {
    id: string;
    points: number;
    reason: string;
    createdAt: string;
  }[];
}

const TIERS = [
  { name: "Newcomer", min: 0, color: "text-gray-500", bg: "bg-gray-100 dark:bg-gray-700" },
  { name: "Scout", min: 100, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  { name: "Hunter", min: 500, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/30" },
  { name: "Expert", min: 2000, color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30" },
  { name: "Legend", min: 10000, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
];

function getTier(points: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (points >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
}

function getNextTier(points: number) {
  for (const tier of TIERS) {
    if (points < tier.min) return tier;
  }
  return null;
}

export default function RewardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<RewardsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    async function fetchRewards() {
      const res = await fetch("/api/user/rewards");
      if (res.ok) {
        setData(await res.json());
      }
      setLoading(false);
    }
    if (session) fetchRewards();
  }, [session]);

  if (status === "loading" || loading) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-200 border-t-green-600" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const tier = getTier(data.rewardPoints);
  const nextTier = getNextTier(data.rewardPoints);
  const progress = nextTier
    ? ((data.rewardPoints - tier.min) / (nextTier.min - tier.min)) * 100
    : 100;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-2xl mx-auto w-full px-4 py-8 flex-1">
        <h1 className="text-2xl font-extrabold mb-6 dark:text-white flex items-center gap-2">
          <Award className="h-6 w-6 text-green-600" />
          Rewards
        </h1>

        <div className="glass-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-4xl font-extrabold text-green-600">{data.rewardPoints.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Points</p>
            </div>
            <div className={`${tier.bg} ${tier.color} px-4 py-2 rounded-xl text-center`}>
              <Star className="h-5 w-5 mx-auto mb-1" />
              <p className="text-xs font-bold">{tier.name}</p>
            </div>
          </div>

          {nextTier && (
            <div>
              <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                <span>{tier.name}</span>
                <span>{nextTier.name} ({nextTier.min.toLocaleString()} pts)</span>
              </div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {(nextTier.min - data.rewardPoints).toLocaleString()} points to next tier
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: TrendingUp, label: "Submissions", value: data.totalSubmissions, color: "text-green-600" },
            { icon: ThumbsUp, label: "Upvotes", value: data.totalUpvotes, color: "text-blue-600" },
            { icon: Zap, label: "Active Prices", value: data.activePrices, color: "text-amber-500" },
            { icon: Shield, label: "Trust Score", value: data.trustScore.toFixed(0), color: "text-purple-600" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card p-3 text-center">
              <Icon className={`h-4 w-4 ${color} mx-auto mb-1`} />
              <p className="text-lg font-bold dark:text-white">{value}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <div className="glass-card p-4">
            <h3 className="font-bold text-sm dark:text-white mb-3">How to Earn Points</h3>
            <div className="space-y-2">
              {[
                { action: "Report a price", points: "+20", desc: "Submit a price at any store" },
                { action: "Confirm a price", points: "+5", desc: "Verify someone else's report" },
                { action: "Upvote received", points: "+3", desc: "When others upvote your reports" },
              ].map(({ action, points, desc }) => (
                <div key={action} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div>
                    <p className="font-medium dark:text-white text-xs">{action}</p>
                    <p className="text-[10px] text-gray-400">{desc}</p>
                  </div>
                  <span className="text-green-600 font-bold text-sm">{points}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card p-4">
            <h3 className="font-bold text-sm dark:text-white mb-3">Tiers</h3>
            <div className="space-y-2">
              {TIERS.map((t) => (
                <div key={t.name} className={`flex items-center justify-between text-sm p-2 rounded-lg ${
                  tier.name === t.name ? t.bg : "bg-gray-50 dark:bg-gray-800/50"
                }`}>
                  <span className={`font-medium text-xs ${tier.name === t.name ? t.color : "dark:text-gray-300"}`}>
                    {t.name} {tier.name === t.name && "(You)"}
                  </span>
                  <span className="text-xs text-gray-400">{t.min.toLocaleString()}+ pts</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {data.recentActivity.length > 0 && (
          <div className="glass-card p-4">
            <h3 className="font-bold text-sm dark:text-white mb-3 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-gray-400" />
              Recent Activity
            </h3>
            <div className="space-y-1.5">
              {data.recentActivity.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs dark:text-gray-300 truncate">{entry.reason}</p>
                    <p className="text-[10px] text-gray-400">{new Date(entry.createdAt).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-sm font-bold ${entry.points > 0 ? "text-green-600" : "text-red-500"}`}>
                    {entry.points > 0 ? "+" : ""}{entry.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
