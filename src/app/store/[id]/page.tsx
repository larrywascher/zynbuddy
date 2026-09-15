"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import { PRODUCT_OPTIONS, STRENGTH_OPTIONS, useToastStore } from "@/lib/store";
import {
  MapPin,
  Phone,
  ArrowLeft,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  Star,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle,
  Plus,
  ShieldCheck,
  Zap,
  Award,
} from "lucide-react";

interface PriceReport {
  id: string;
  productType: string;
  productBrand: string;
  productVariant: string | null;
  nicStrength: string | null;
  pricePerCan: number;
  pricePerRoll: number | null;
  dealDescription: string | null;
  confirmedCount: number;
  inaccurateCount: number;
  isStale: boolean;
  status: string;
  lastConfirmedAt: string | null;
  createdAt: string;
  user: { name: string | null; id: string; trustScore?: number };
}

interface StoreDetail {
  id: string;
  name: string;
  brand: string | null;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  storeType: string;
  prices: PriceReport[];
  amenities: { id: string; name: string }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { name: string | null };
  }[];
}

function getFreshness(dateStr: string) {
  const ageMs = Date.now() - new Date(dateStr).getTime();
  const hours = ageMs / (1000 * 60 * 60);

  if (hours < 2) {
    return {
      class: "text-green-600 font-black text-xl",
      wrapperClass: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 border",
      label: "Just reported!",
      icon: "fresh" as const,
    };
  }
  if (hours > 72) {
    return {
      class: "text-gray-400 font-normal text-base",
      wrapperClass: "bg-gray-50 dark:bg-gray-800/50 opacity-60",
      label: "Over 3 days old",
      icon: "stale" as const,
    };
  }
  return {
    class: "text-lg font-bold text-green-600",
    wrapperClass: "bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm",
    label: "",
    icon: "normal" as const,
  };
}

export default function StoreDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const addToast = useToastStore((s) => s.addToast);
  const [store, setStore] = useState<StoreDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [pricePerCan, setPricePerCan] = useState("");
  const [pricePerRoll, setPricePerRoll] = useState("");
  const [dealDescription, setDealDescription] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("ZYN");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedStrength, setSelectedStrength] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestBrand, setRequestBrand] = useState("");
  const [requestDesc, setRequestDesc] = useState("");
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});

  const productFilter = searchParams.get("productTypes");

  useEffect(() => {
    async function fetchStore() {
      setLoading(true);
      const url = productFilter
        ? `/api/stores/${params.id}?productTypes=${productFilter}`
        : `/api/stores/${params.id}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStore(data);

        if (data.prices?.length > 0) {
          const priceIds = data.prices.map((p: PriceReport) => p.id).join(",");
          const votesRes = await fetch(`/api/prices/votes?priceIds=${priceIds}`);
          if (votesRes.ok) {
            const votesData = await votesRes.json();
            setUserVotes(votesData.votes || {});
          }
        }
      }
      setLoading(false);
    }
    if (params.id) fetchStore();
  }, [params.id, productFilter]);

  async function refreshStore() {
    const url = productFilter
      ? `/api/stores/${params.id}?productTypes=${productFilter}`
      : `/api/stores/${params.id}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setStore(data);
      if (data.prices?.length > 0) {
        const priceIds = data.prices.map((p: PriceReport) => p.id).join(",");
        const votesRes = await fetch(`/api/prices/votes?priceIds=${priceIds}`);
        if (votesRes.ok) {
          const votesData = await votesRes.json();
          setUserVotes(votesData.votes || {});
        }
      }
    }
  }

  async function handlePriceSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSubmitting(true);
    setSubmitMessage("");

    const product = PRODUCT_OPTIONS.find((p) => p.value === selectedProduct);

    const res = await fetch("/api/prices/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeId: store!.id,
        productType: selectedProduct,
        productBrand: product?.label || selectedProduct,
        productVariant: selectedVariant || undefined,
        nicStrength: selectedStrength || undefined,
        pricePerCan: parseFloat(pricePerCan),
        pricePerRoll: pricePerRoll ? parseFloat(pricePerRoll) : undefined,
        dealDescription: dealDescription || undefined,
      }),
    });

    setSubmitting(false);
    const data = await res.json();

    if (res.ok) {
      if (data.pendingVerification) {
        addToast("Price flagged for verification (unusual deviation). +20 pts", "info");
      } else {
        addToast("Price reported! +20 reward points", "success");
      }
      setSubmitMessage("");
      setPricePerCan("");
      setPricePerRoll("");
      setDealDescription("");
      setSelectedVariant("");
      setShowPriceForm(false);
      await refreshStore();
    } else {
      addToast(data.error || "Failed to submit price", "error");
      setSubmitMessage(data.error || "Failed to submit price");
    }
  }

  async function handleConfirm(priceReportId: string) {
    if (!session) return;
    const res = await fetch("/api/prices/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceReportId }),
    });
    const data = await res.json();
    if (data.alreadyVoted) {
      setSubmitMessage("You already voted on this price");
    }
    await refreshStore();
  }

  async function handleInaccurate(priceReportId: string) {
    if (!session) return;
    const res = await fetch("/api/prices/inaccurate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceReportId }),
    });
    const data = await res.json();
    if (data.alreadyVoted) {
      setSubmitMessage("You already voted on this price");
    }
    await refreshStore();
  }

  async function handleVerify(priceReportId: string) {
    if (!session) return;
    const res = await fetch("/api/prices/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceReportId }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubmitMessage("Price verified! +10 pts");
    } else {
      setSubmitMessage(data.error || "Failed to verify");
    }
    await refreshStore();
  }

  async function handleProductRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !requestBrand) return;

    await fetch("/api/products/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brandName: requestBrand,
        description: requestDesc || undefined,
      }),
    });

    setRequestBrand("");
    setRequestDesc("");
    setShowRequestForm(false);
    setSubmitMessage("Product request submitted!");
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  function freshnessClockLabel(dateStr: string) {
    const ageMs = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(ageMs / (1000 * 60 * 60));
    const mins = Math.floor(ageMs / (1000 * 60));
    if (mins < 60) return `${mins}m fresh`;
    if (hours < 24) return `${hours}h old`;
    const days = Math.floor(hours / 24);
    return `${days}d old`;
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

  if (!store) {
    return (
      <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-950">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Store not found</p>
        </div>
      </div>
    );
  }

  const activePrices = store.prices.filter(
    (p) => !p.isStale && p.status === "ACTIVE"
  );
  const pendingPrices = store.prices.filter(
    (p) => p.status === "PENDING_VERIFICATION"
  );
  const stalePrices = store.prices.filter((p) => p.isStale);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-4xl mx-auto w-full px-4 py-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to map
        </button>

        {productFilter && (
          <div className="mb-4 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
            <span>Filtered by: <strong>{productFilter.split(",").map(t => {
              const opt = PRODUCT_OPTIONS.find(o => o.value === t);
              return opt?.label || t;
            }).join(", ")}</strong></span>
            <button
              onClick={() => router.push(`/store/${store.id}`)}
              className="ml-auto text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Show all products
            </button>
          </div>
        )}

        <div className="glass-card overflow-hidden">
          <div className="bg-gradient-to-br from-green-700 via-green-600 to-emerald-600 text-white p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.1)_0%,transparent_60%)]" />
            <div className="relative">
              <h1 className="text-2xl font-extrabold tracking-tight">{store.name}</h1>
              {store.brand && (
                <p className="text-green-200 text-sm font-medium">{store.brand}</p>
              )}
              <p className="flex items-center gap-1.5 mt-2 text-sm text-green-100">
                <MapPin className="h-4 w-4" />
                {store.address}, {store.city}, {store.state} {store.zipCode}
              </p>
              {store.phone && (
                <p className="flex items-center gap-1.5 mt-1 text-sm text-green-100">
                  <Phone className="h-4 w-4" />
                  {store.phone}
                </p>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
              <h2 className="text-lg font-bold dark:text-white flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                {productFilter ? "Filtered Prices" : "Recent Prices"}
              </h2>
              <div className="flex gap-2">
                {session && (
                  <>
                    <button
                      onClick={() => {
                        setShowPriceForm(!showPriceForm);
                        setShowRequestForm(false);
                      }}
                      className="btn-primary px-4 py-2 text-sm flex items-center gap-1.5"
                    >
                      <Send className="h-4 w-4" /> Report Price
                    </button>
                    <button
                      onClick={() => {
                        setShowRequestForm(!showRequestForm);
                        setShowPriceForm(false);
                      }}
                      className="px-3 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
                    >
                      <Plus className="h-4 w-4" /> Request Product
                    </button>
                  </>
                )}
                {!session && (
                  <p className="text-sm text-gray-400">
                    Sign in to report prices
                  </p>
                )}
              </div>
            </div>

            {submitMessage && (
              <div
                className={`mb-4 p-3 rounded-xl text-sm font-medium ${
                  submitMessage.includes("Failed") || submitMessage.includes("cannot") || submitMessage.includes("already")
                    ? "bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    : submitMessage.includes("flagged")
                    ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : "bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                }`}
              >
                {submitMessage}
              </div>
            )}

            {showRequestForm && (
              <form
                onSubmit={handleProductRequest}
                className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl space-y-3"
              >
                <h3 className="text-sm font-semibold text-purple-800 dark:text-purple-300">
                  Request a New Product
                </h3>
                <p className="text-xs text-purple-600 dark:text-purple-400">
                  Don&apos;t see your nicotine product? Request it to be added.
                </p>
                <input
                  type="text"
                  value={requestBrand}
                  onChange={(e) => setRequestBrand(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Brand / Product Name"
                />
                <input
                  type="text"
                  value={requestDesc}
                  onChange={(e) => setRequestDesc(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Description (optional)"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 transition-colors"
                >
                  Submit Request
                </button>
              </form>
            )}

            {showPriceForm && (
              <form
                onSubmit={handlePriceSubmit}
                className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl space-y-3 border border-gray-100 dark:border-gray-600"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                      Product
                    </label>
                    <select
                      value={selectedProduct}
                      onChange={(e) => setSelectedProduct(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {PRODUCT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                      Strength
                    </label>
                    <select
                      value={selectedStrength}
                      onChange={(e) => setSelectedStrength(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {STRENGTH_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                    Flavor / Variant (optional)
                  </label>
                  <input
                    type="text"
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="e.g. Cool Mint, Wintergreen"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                      Price per Can ($) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricePerCan}
                      onChange={(e) => setPricePerCan(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="4.99"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                      Price per Roll ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pricePerRoll}
                      onChange={(e) => setPricePerRoll(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="39.99"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wider">
                    Deal / Special (optional)
                  </label>
                  <input
                    type="text"
                    value={dealDescription}
                    onChange={(e) => setDealDescription(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Buy 2 get 1 free"
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Price (+20 pts)"}
                </button>
              </form>
            )}

            {pendingPrices.length > 0 && (
              <div className="mb-5">
                <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5 mb-3">
                  <ShieldCheck className="h-4 w-4" /> Awaiting Verification
                </h3>
                <div className="space-y-2">
                  {pendingPrices.map((price) => (
                    <div
                      key={price.id}
                      className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-lg font-bold text-yellow-600">
                              ${price.pricePerCan.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500">/can</span>
                            <span className="text-[10px] bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded-full font-medium">
                              Pending
                            </span>
                            <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded-full dark:text-white font-medium">
                              {price.productBrand}
                            </span>
                          </div>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            Needs a second user to verify this price.
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {price.user.name || "Anonymous"} &middot; {timeAgo(price.createdAt)}
                          </p>
                        </div>
                        {session && session.user?.id !== price.user.id && (
                          <button
                            onClick={() => handleVerify(price.id)}
                            className="px-3 py-1.5 text-xs bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-1 flex-shrink-0 font-medium"
                          >
                            <ShieldCheck className="h-3 w-3" />
                            Verify (+10 pts)
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activePrices.length > 0 ? (
              <div className="space-y-3">
                {activePrices.map((price) => {
                  const freshness = getFreshness(price.createdAt);
                  const myVote = userVotes[price.id];
                  return (
                    <div
                      key={price.id}
                      className={`p-4 rounded-xl ${freshness.wrapperClass}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {freshness.icon === "fresh" && (
                              <Zap className="h-4 w-4 text-green-500 fill-green-500" />
                            )}
                            <span className={freshness.class}>
                              ${price.pricePerCan.toFixed(2)}
                            </span>
                            <span className="text-xs text-gray-500">/can</span>
                            {price.pricePerRoll && (
                              <span className="text-xs text-gray-500">
                                (${price.pricePerRoll.toFixed(2)}/roll)
                              </span>
                            )}
                            <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded-full dark:text-white font-medium">
                              {price.productBrand}
                            </span>
                            {price.productVariant && (
                              <span className="text-xs bg-gray-100 dark:bg-gray-600 px-2 py-0.5 rounded-full dark:text-white">
                                {price.productVariant}
                              </span>
                            )}
                            {price.nicStrength && (
                              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">
                                {price.nicStrength}mg
                              </span>
                            )}
                          </div>
                          {price.dealDescription && (
                            <p className="text-xs text-green-600 mt-1.5 font-medium">
                              {price.dealDescription}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {freshnessClockLabel(price.createdAt)} &middot;{" "}
                              {new Date(price.createdAt).toLocaleDateString()}{" "}
                              by {price.user.name || "Anonymous"}
                            </p>
                            {price.user.trustScore != null && price.user.trustScore > 0 && (
                              <span className="text-[10px] bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                                <Award className="h-2.5 w-2.5" />
                                Trust: {price.user.trustScore.toFixed(0)}
                              </span>
                            )}
                            {freshness.label && (
                              <span
                                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                  freshness.icon === "fresh"
                                    ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                                    : "bg-gray-200 dark:bg-gray-600 text-gray-500 italic"
                                }`}
                              >
                                {freshness.label}
                              </span>
                            )}
                            {price.lastConfirmedAt && (
                              <p className="text-xs text-green-500 flex items-center gap-1">
                                <CheckCircle className="h-3 w-3" />
                                Confirmed {timeAgo(price.lastConfirmedAt)}
                              </p>
                            )}
                            {price.inaccurateCount > 0 && (
                              <p className="text-xs text-orange-500 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                {price.inaccurateCount} flagged
                              </p>
                            )}
                          </div>
                        </div>
                        {session && (
                          <div className="flex flex-col gap-1.5 flex-shrink-0">
                            <button
                              onClick={() => handleConfirm(price.id)}
                              disabled={myVote === "CONFIRM"}
                              className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-all font-medium ${
                                myVote === "CONFIRM"
                                  ? "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400 border border-green-300 dark:border-green-700 cursor-default"
                                  : "border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30"
                              }`}
                              title={myVote === "CONFIRM" ? "Already confirmed" : "Confirm this price"}
                            >
                              <ThumbsUp className={`h-3 w-3 ${myVote === "CONFIRM" ? "fill-green-500" : ""}`} />
                              {price.confirmedCount}
                            </button>
                            <button
                              onClick={() => handleInaccurate(price.id)}
                              disabled={myVote === "INACCURATE"}
                              className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg transition-all font-medium ${
                                myVote === "INACCURATE"
                                  ? "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 cursor-default"
                                  : "border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                              }`}
                              title={myVote === "INACCURATE" ? "Already flagged" : "Flag as inaccurate"}
                            >
                              <ThumbsDown className={`h-3 w-3 ${myVote === "INACCURATE" ? "fill-red-500" : ""}`} />
                              {price.inaccurateCount}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <DollarSign className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm mb-3">
                  {productFilter ? "No prices for this product filter." : "No prices reported yet. Be the first!"}
                </p>
                {session && (
                  <button
                    onClick={() => setShowPriceForm(true)}
                    className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add First Price
                  </button>
                )}
              </div>
            )}

            {stalePrices.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-400 dark:text-gray-500 flex items-center gap-1.5 mb-3">
                  <AlertTriangle className="h-4 w-4" /> Stale / Flagged
                </h3>
                <div className="space-y-2 opacity-50">
                  {stalePrices.map((price) => (
                    <div
                      key={price.id}
                      className="p-3 bg-gray-50 dark:bg-gray-700/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-400 line-through">
                          ${price.pricePerCan.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400">/can</span>
                        <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-medium">
                          Stale
                        </span>
                        <span className="text-xs text-gray-400">{price.productBrand}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {store.amenities.length > 0 && (
            <div className="px-6 pb-6">
              <h3 className="font-bold text-sm mb-2 dark:text-white">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {store.amenities.map((a) => (
                  <span
                    key={a.id}
                    className="text-xs bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-full dark:text-white font-medium"
                  >
                    {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {store.reviews.length > 0 && (
            <div className="px-6 pb-6">
              <h3 className="font-bold text-sm mb-3 dark:text-white flex items-center gap-1.5">
                <Star className="h-4 w-4 text-yellow-500" /> Reviews
              </h3>
              <div className="space-y-3">
                {store.reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-3 bg-gray-50 dark:bg-gray-700/30 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < review.rating
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500">
                        {review.user.name || "Anonymous"} &middot;{" "}
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
