"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  TrendingUp,
  Zap,
  ThumbsUp,
  Tag,
  Award,
  Clock,
  DollarSign,
  Trophy,
} from "lucide-react";

interface TrendingData {
  recentReports: {
    id: string;
    pricePerCan: number;
    productBrand: string;
    productVariant: string | null;
    nicStrength: string | null;
    createdAt: string;
    store: { name: string; city: string };
    user: { name: string | null; trustScore: number };
  }[];
  topConfirmed: {
    id: string;
    pricePerCan: number;
    productBrand: string;
    confirmedCount: number;
    store: { name: string; city: string };
    user: { name: string | null };
  }[];
  bestDeals: {
    id: string;
    pricePerCan: number;
    productBrand: string;
    dealDescription: string | null;
    store: { name: string; city: string };
  }[];
  topContributors: {
    id: string;
    name: string | null;
    rewardPoints: number;
    trustScore: number;
    totalSubmissions: number;
  }[];
}

export default function TrendingPage() {
  const [data, setData] = useState<TrendingData | null>(null);

  useEffect(() => {
    fetch("/api/trending")
      .then((r) => r.json())
      .then(setData);
  }, []);

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-5xl mx-auto w-full px-4 py-8">
        <h1 className="text-2xl font-extrabold dark:text-white mb-2 flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-green-600" />
          Trending
        </h1>
        <p className="text-sm text-gray-400 mb-8">Live activity and top prices in your area</p>

        {!data ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-200 border-t-green-600 mx-auto" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <h3 className="font-bold text-sm mb-4 dark:text-white flex items-center gap-1.5">
                <Zap className="h-4 w-4 text-green-500 fill-green-500" /> Fresh Reports (24h)
              </h3>
              <div className="space-y-2">
                {data.recentReports.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">No reports in the last 24 hours</p>
                ) : (
                  data.recentReports.slice(0, 10).map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-green-600">${r.pricePerCan.toFixed(2)}</span>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full dark:text-white">
                            {r.productBrand}
                          </span>
                          {r.nicStrength && (
                            <span className="text-[10px] text-blue-500">{r.nicStrength}mg</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {r.store.name} &middot; {r.user.name || "Anonymous"}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 flex-shrink-0">
                        <Clock className="h-2.5 w-2.5" />
                        {timeAgo(r.createdAt)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-bold text-sm mb-4 dark:text-white flex items-center gap-1.5">
                <ThumbsUp className="h-4 w-4 text-blue-500" /> Most Confirmed (7d)
              </h3>
              <div className="space-y-2">
                {data.topConfirmed.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-green-600">${r.pricePerCan.toFixed(2)}</span>
                        <span className="text-xs text-gray-500">{r.productBrand}</span>
                      </div>
                      <p className="text-xs text-gray-400 truncate">{r.store.name}</p>
                    </div>
                    <span className="text-xs text-blue-500 flex items-center gap-1 font-medium">
                      <ThumbsUp className="h-3 w-3" />
                      {r.confirmedCount}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-bold text-sm mb-4 dark:text-white flex items-center gap-1.5">
                <Tag className="h-4 w-4 text-orange-500" /> Best Deals
              </h3>
              <div className="space-y-2">
                {data.bestDeals.map((r, i) => (
                  <div key={r.id} className="p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-300">{i + 1}</span>
                      <span className="font-bold text-green-600">${r.pricePerCan.toFixed(2)}</span>
                      <span className="text-xs text-gray-500">{r.productBrand}</span>
                      <DollarSign className="h-3 w-3 text-green-400" />
                    </div>
                    {r.dealDescription && (
                      <p className="text-xs text-green-600 mt-1 font-medium">{r.dealDescription}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">{r.store.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-bold text-sm mb-4 dark:text-white flex items-center gap-1.5">
                <Trophy className="h-4 w-4 text-amber-500" /> Top Contributors
              </h3>
              <div className="space-y-2">
                {data.topContributors.map((u, i) => (
                  <div key={u.id} className="flex items-center gap-3 p-2.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                    <span className={`text-xs font-bold w-5 ${
                      i === 0 ? "text-amber-500" : i === 1 ? "text-gray-400" : i === 2 ? "text-amber-700" : "text-gray-300"
                    }`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium dark:text-white text-sm truncate">{u.name || "Anonymous"}</p>
                      <p className="text-xs text-gray-400">
                        {u.totalSubmissions} reports &middot; Trust: {u.trustScore.toFixed(0)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-green-600 flex items-center gap-1">
                      <Award className="h-3.5 w-3.5" />
                      {u.rewardPoints}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
