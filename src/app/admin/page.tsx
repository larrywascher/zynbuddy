"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import {
  Shield,
  Users,
  Store,
  DollarSign,
  Database,
  TrendingUp,
  AlertTriangle,
  Clock,
  Plus,
  Trash2,
  UserCheck,
  Award,
  Package,
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Ban,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import Link from "next/link";

interface AdminStats {
  counts: {
    users: number;
    stores: number;
    priceReports: number;
    activePriceReports: number;
    pendingReports: number;
    staleReports: number;
    reviews: number;
    productRequests: number;
  };
  dbSizeBytes: number;
  dbSizeMB: number;
  recentUsers: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    rewardPoints: number;
    trustScore: number;
    createdAt: string;
  }[];
  recentPrices: {
    id: string;
    pricePerCan: number;
    productBrand: string;
    status: string;
    createdAt: string;
    user: { name: string | null };
    store: { name: string };
  }[];
  topReporters: {
    id: string;
    name: string | null;
    email: string;
    totalSubmissions: number;
    totalUpvotes: number;
    trustScore: number;
    rewardPoints: number;
  }[];
}

interface ProductItem {
  id: string;
  type: string;
  label: string;
  category: string;
  isActive: boolean;
  sortOrder: number;
}

interface ProductRequest {
  id: string;
  brandName: string;
  productType: string | null;
  description: string | null;
  status: string;
  voteCount: number;
  adminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  user: { name: string | null; email: string; trustScore: number };
}

interface AuditEntry {
  id: string;
  userId: string | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  user: { name: string | null; email: string } | null;
}

type TabName = "overview" | "products" | "requests" | "users" | "audit";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabName>("overview");
  const [newType, setNewType] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [message, setMessage] = useState("");

  const role = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (status === "authenticated" && role !== "ADMIN") {
      router.push("/");
      return;
    }
    if (status === "authenticated" && role === "ADMIN") {
      Promise.all([
        fetch("/api/admin/stats").then((r) => r.json()),
        fetch("/api/admin/products").then((r) => r.json()),
      ]).then(([s, p]) => {
        setStats(s);
        setProducts(p);
        setLoading(false);
      });
    }
  }, [status, role, router]);

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    const res = await fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: newType, label: newLabel }),
    });
    if (res.ok) {
      const product = await res.json();
      setProducts([...products, product]);
      setNewType("");
      setNewLabel("");
      setMessage("Product added!");
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to add product");
    }
  }

  async function handleDeleteProduct(type: string) {
    setMessage("");
    const res = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts(products.filter((p) => p.type !== type));
      setMessage(`Product removed. ${data.deletedPriceReports} associated price reports deleted.`);
    }
  }

  async function handleToggleRole(userId: string, currentRole: string) {
    const newRole = currentRole === "ADMIN" ? "USER" : "ADMIN";
    await fetch("/api/admin/users", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role: newRole }),
    });
    const res = await fetch("/api/admin/stats");
    setStats(await res.json());
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

  if (!stats) return null;

  const tabs: { key: TabName; label: string; count?: number }[] = [
    { key: "overview", label: "Overview" },
    { key: "products", label: "Products" },
    { key: "requests", label: "Requests", count: stats.counts.productRequests },
    { key: "users", label: "Users", count: stats.counts.users },
    { key: "audit", label: "Audit Log" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-950">
      <Header />
      <div className="max-w-6xl mx-auto w-full px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to map
        </Link>

        <h1 className="text-2xl font-extrabold dark:text-white mb-6 flex items-center gap-2">
          <Shield className="h-6 w-6 text-yellow-500" />
          Admin Dashboard
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
          {[
            { icon: Users, label: "Users", value: stats.counts.users, color: "text-blue-600" },
            { icon: Store, label: "Stores", value: stats.counts.stores, color: "text-green-600" },
            { icon: DollarSign, label: "Prices", value: stats.counts.priceReports, color: "text-emerald-600" },
            { icon: TrendingUp, label: "Active", value: stats.counts.activePriceReports, color: "text-green-500" },
            { icon: Clock, label: "Pending", value: stats.counts.pendingReports, color: "text-yellow-500" },
            { icon: AlertTriangle, label: "Stale", value: stats.counts.staleReports, color: "text-red-500" },
            { icon: Package, label: "Reviews", value: stats.counts.reviews, color: "text-purple-500" },
            { icon: Database, label: "DB Size", value: `${stats.dbSizeMB}MB`, color: "text-gray-500" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="glass-card p-3 text-center">
              <Icon className={`h-4 w-4 ${color} mx-auto mb-1`} />
              <p className="text-lg font-bold dark:text-white">{value}</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider font-medium">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === tab.key
                  ? "bg-green-600 text-white shadow-md shadow-green-600/20"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:border-green-400"
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.key ? "bg-white/20" : "bg-gray-100 dark:bg-gray-700"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-xl text-sm font-medium ${
            message.includes("Failed") || message.includes("error") || message.includes("Cannot")
              ? "bg-red-50 text-red-600 dark:bg-red-900/30"
              : "bg-green-50 text-green-600 dark:bg-green-900/30"
          }`}>
            {message}
          </div>
        )}

        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="glass-card p-5">
              <h3 className="font-bold text-sm mb-3 dark:text-white flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-blue-500" /> Recent Price Reports
              </h3>
              <div className="space-y-2">
                {stats.recentPrices.map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <span className="font-semibold text-green-600">${p.pricePerCan.toFixed(2)}</span>
                      <span className="text-gray-400 text-xs ml-2">{p.productBrand}</span>
                      <p className="text-xs text-gray-400 truncate">{p.store.name} &middot; {p.user.name || "Anonymous"}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      p.status === "ACTIVE" ? "bg-green-100 text-green-700" :
                      p.status === "PENDING_VERIFICATION" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {p.status === "PENDING_VERIFICATION" ? "Pending" : p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5">
              <h3 className="font-bold text-sm mb-3 dark:text-white flex items-center gap-1.5">
                <Award className="h-4 w-4 text-amber-500" /> Top Reporters
              </h3>
              <div className="space-y-2">
                {stats.topReporters.map((u, i) => (
                  <div key={u.id} className="flex items-center gap-3 text-sm p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <span className="text-xs font-bold text-gray-300 w-5">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium dark:text-white truncate">{u.name || u.email}</p>
                      <p className="text-xs text-gray-400">
                        {u.totalSubmissions} reports &middot; {u.totalUpvotes} upvotes &middot; Trust: {u.trustScore.toFixed(0)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-green-600">{u.rewardPoints} pts</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-5 lg:col-span-2">
              <h3 className="font-bold text-sm mb-3 dark:text-white flex items-center gap-1.5">
                <Users className="h-4 w-4 text-blue-500" /> Recent Users
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700">
                      <th className="text-left py-2 text-xs text-gray-400 font-medium">User</th>
                      <th className="text-left py-2 text-xs text-gray-400 font-medium">Role</th>
                      <th className="text-left py-2 text-xs text-gray-400 font-medium">Points</th>
                      <th className="text-left py-2 text-xs text-gray-400 font-medium">Trust</th>
                      <th className="text-left py-2 text-xs text-gray-400 font-medium">Joined</th>
                      <th className="text-left py-2 text-xs text-gray-400 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((u) => (
                      <tr key={u.id} className="border-b border-gray-50 dark:border-gray-800">
                        <td className="py-2">
                          <p className="font-medium dark:text-white">{u.name || "—"}</p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </td>
                        <td className="py-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            u.role === "ADMIN" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-2 text-green-600 font-medium">{u.rewardPoints}</td>
                        <td className="py-2">{u.trustScore.toFixed(0)}</td>
                        <td className="py-2 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                        <td className="py-2">
                          <button
                            onClick={() => handleToggleRole(u.id, u.role)}
                            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          >
                            <UserCheck className="h-3 w-3" />
                            {u.role === "ADMIN" ? "Demote" : "Promote"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="glass-card p-5">
            <h3 className="font-bold text-sm mb-4 dark:text-white flex items-center gap-1.5">
              <Package className="h-4 w-4 text-green-500" /> Product Management
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Add or remove products. Removing a product deletes ALL associated price reports.
            </p>

            <form onSubmit={handleAddProduct} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="Type (e.g. NORDIC_SPIRIT)"
                required
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white"
              />
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Display label"
                required
                className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white"
              />
              <button type="submit" className="btn-primary px-4 py-2 text-sm flex items-center gap-1">
                <Plus className="h-4 w-4" /> Add
              </button>
            </form>

            <div className="space-y-2">
              {products.map((p) => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                  <div>
                    <span className="font-medium text-sm dark:text-white">{p.label}</span>
                    <span className="text-xs text-gray-400 ml-2">({p.type})</span>
                    <span className="text-[10px] text-gray-400 ml-2">{p.category}</span>
                  </div>
                  <button
                    onClick={() => handleDeleteProduct(p.type)}
                    className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-3 py-1.5 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" /> Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "requests" && (
          <RequestsPanel setMessage={setMessage} />
        )}

        {activeTab === "users" && (
          <div className="glass-card p-5">
            <h3 className="font-bold text-sm mb-4 dark:text-white flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-500" /> User Management
            </h3>
            <UserList onToggleRole={handleToggleRole} setMessage={setMessage} />
          </div>
        )}

        {activeTab === "audit" && (
          <AuditPanel />
        )}
      </div>
    </div>
  );
}

function RequestsPanel({ setMessage }: { setMessage: (m: string) => void }) {
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "PENDING" | "APPROVED" | "REJECTED">("all");
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const loadRequests = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/product-requests")
      .then((r) => r.json())
      .then((data) => {
        setRequests(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  async function handleAction(requestId: string, action: "APPROVED" | "REJECTED") {
    setProcessing(requestId);
    const res = await fetch("/api/admin/product-requests", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action, adminNote: noteInputs[requestId] || "" }),
    });
    if (res.ok) {
      setMessage(`Request ${action.toLowerCase()} successfully`);
      loadRequests();
    } else {
      const data = await res.json();
      setMessage(data.error || "Failed to process request");
    }
    setProcessing(null);
  }

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "PENDING").length;

  if (loading) {
    return (
      <div className="glass-card p-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-200 border-t-green-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["all", "PENDING", "APPROVED", "REJECTED"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === f
                  ? "bg-green-600 text-white"
                  : "bg-white dark:bg-gray-800 text-gray-500 border border-gray-200 dark:border-gray-600"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0) + f.slice(1).toLowerCase()}
              {f === "PENDING" && pendingCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </button>
          ))}
        </div>
        <button
          onClick={loadRequests}
          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card p-8 text-center text-gray-400 text-sm">
          No {filter === "all" ? "" : filter.toLowerCase()} product requests
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req) => (
            <div key={req.id} className="glass-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold dark:text-white text-sm">{req.brandName}</h4>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                      req.status === "PENDING" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                      req.status === "APPROVED" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                      "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {req.status}
                    </span>
                    {req.voteCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                        {req.voteCount} vote{req.voteCount !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {req.productType && (
                    <p className="text-xs text-gray-400 mb-1">Category: {req.productType}</p>
                  )}
                  {req.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{req.description}</p>
                  )}
                  <p className="text-[10px] text-gray-400">
                    by {req.user.name || req.user.email} &middot; Trust: {req.user.trustScore.toFixed(0)} &middot; {new Date(req.createdAt).toLocaleDateString()}
                  </p>
                  {req.adminNote && (
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 italic">Admin: {req.adminNote}</p>
                  )}
                </div>

                {req.status === "PENDING" && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <input
                      type="text"
                      placeholder="Note (optional)"
                      value={noteInputs[req.id] || ""}
                      onChange={(e) => setNoteInputs({ ...noteInputs, [req.id]: e.target.value })}
                      className="px-2 py-1 border border-gray-200 dark:border-gray-600 rounded-lg text-xs bg-white dark:bg-gray-800 dark:text-white w-40"
                    />
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleAction(req.id, "APPROVED")}
                        disabled={processing === req.id}
                        className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        <CheckCircle className="h-3 w-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "REJECTED")}
                        disabled={processing === req.id}
                        className="flex-1 flex items-center justify-center gap-1 px-2.5 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                      >
                        <XCircle className="h-3 w-3" /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserList({ onToggleRole, setMessage }: { onToggleRole: (id: string, role: string) => void; setMessage: (m: string) => void }) {
  const [users, setUsers] = useState<{
    id: string;
    email: string;
    name: string | null;
    role: string;
    rewardPoints: number;
    trustScore: number;
    totalSubmissions: number;
    totalUpvotes: number;
    isSuspended: boolean;
    suspendedReason: string | null;
    suspendedUntil: string | null;
    createdAt: string;
    _count: { priceReports: number; reviews: number };
  }[]>([]);
  const [suspendTarget, setSuspendTarget] = useState<string | null>(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspendHours, setSuspendHours] = useState("24");

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then(setUsers);
  }, []);

  async function handleSuspend(userId: string) {
    if (!suspendReason.trim()) {
      setMessage("Please enter a suspension reason");
      return;
    }
    const res = await fetch("/api/admin/suspend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, reason: suspendReason, durationHours: parseInt(suspendHours) }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage(data.message);
      setUsers(users.map((u) => u.id === userId ? { ...u, isSuspended: true, suspendedReason: suspendReason } : u));
      setSuspendTarget(null);
      setSuspendReason("");
    } else {
      setMessage(data.error || "Failed to suspend user");
    }
  }

  async function handleUnsuspend(userId: string) {
    const res = await fetch("/api/admin/suspend", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    if (res.ok) {
      setMessage("User unsuspended");
      setUsers(users.map((u) => u.id === userId ? { ...u, isSuspended: false, suspendedReason: null, suspendedUntil: null } : u));
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-700">
            <th className="text-left py-2 text-xs text-gray-400 font-medium">User</th>
            <th className="text-left py-2 text-xs text-gray-400 font-medium">Status</th>
            <th className="text-right py-2 text-xs text-gray-400 font-medium">Prices</th>
            <th className="text-right py-2 text-xs text-gray-400 font-medium">Reviews</th>
            <th className="text-right py-2 text-xs text-gray-400 font-medium">Trust</th>
            <th className="text-right py-2 text-xs text-gray-400 font-medium">Points</th>
            <th className="text-left py-2 text-xs text-gray-400 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className={`border-b border-gray-50 dark:border-gray-800 ${u.isSuspended ? "bg-red-50/50 dark:bg-red-900/10" : ""}`}>
              <td className="py-2.5">
                <p className="font-medium dark:text-white">{u.name || "—"}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </td>
              <td className="py-2.5">
                <div className="flex flex-col gap-0.5">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium w-fit ${
                    u.role === "ADMIN" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {u.role}
                  </span>
                  {u.isSuspended && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 w-fit">
                      SUSPENDED
                    </span>
                  )}
                </div>
              </td>
              <td className="py-2.5 text-right">{u._count.priceReports}</td>
              <td className="py-2.5 text-right">{u._count.reviews}</td>
              <td className="py-2.5 text-right">{u.trustScore.toFixed(0)}</td>
              <td className="py-2.5 text-right text-green-600 font-medium">{u.rewardPoints}</td>
              <td className="py-2.5">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => {
                      onToggleRole(u.id, u.role);
                      setUsers(users.map(usr => usr.id === u.id ? { ...usr, role: u.role === "ADMIN" ? "USER" : "ADMIN" } : usr));
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <UserCheck className="h-3 w-3" />
                    {u.role === "ADMIN" ? "Demote" : "Promote"}
                  </button>
                  {u.role !== "ADMIN" && (
                    u.isSuspended ? (
                      <button
                        onClick={() => handleUnsuspend(u.id)}
                        className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1"
                      >
                        <RefreshCw className="h-3 w-3" /> Unsuspend
                      </button>
                    ) : (
                      <button
                        onClick={() => setSuspendTarget(suspendTarget === u.id ? null : u.id)}
                        className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1"
                      >
                        <Ban className="h-3 w-3" /> Suspend
                      </button>
                    )
                  )}
                </div>
                {suspendTarget === u.id && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 space-y-2">
                    <input
                      type="text"
                      placeholder="Reason for suspension"
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-red-200 dark:border-red-700 rounded bg-white dark:bg-gray-800 dark:text-white"
                    />
                    <div className="flex gap-2 items-center">
                      <select
                        value={suspendHours}
                        onChange={(e) => setSuspendHours(e.target.value)}
                        className="px-2 py-1 text-xs border border-red-200 dark:border-red-700 rounded bg-white dark:bg-gray-800 dark:text-white"
                      >
                        <option value="1">1 hour</option>
                        <option value="6">6 hours</option>
                        <option value="24">24 hours</option>
                        <option value="72">3 days</option>
                        <option value="168">7 days</option>
                        <option value="720">30 days</option>
                      </select>
                      <button
                        onClick={() => handleSuspend(u.id)}
                        className="px-2.5 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => { setSuspendTarget(null); setSuspendReason(""); }}
                        className="px-2.5 py-1 text-gray-500 text-xs hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AuditPanel() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [searchUser, setSearchUser] = useState("");

  const loadLogs = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: page.toString(), limit: "30" });
    if (actionFilter) params.set("action", actionFilter);
    if (searchUser) params.set("userId", searchUser);

    fetch(`/api/admin/audit?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setLoading(false);
      });
  }, [page, actionFilter, searchUser]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const actionColors: Record<string, string> = {
    USER_REGISTERED: "bg-blue-100 text-blue-700",
    PRICE_REPORTED: "bg-green-100 text-green-700",
    HARMFUL_CONTENT_BLOCKED: "bg-red-100 text-red-700",
    USER_SUSPENDED: "bg-red-100 text-red-700",
    USER_UNSUSPENDED: "bg-green-100 text-green-700",
    PRODUCT_REQUEST_APPROVED: "bg-green-100 text-green-700",
    PRODUCT_REQUEST_REJECTED: "bg-orange-100 text-orange-700",
    AUTO_SUSPENDED: "bg-red-100 text-red-700",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-xs bg-white dark:bg-gray-800 dark:text-white"
          >
            <option value="">All Actions</option>
            <option value="USER_REGISTERED">User Registered</option>
            <option value="PRICE_REPORTED">Price Reported</option>
            <option value="HARMFUL_CONTENT_BLOCKED">Content Blocked</option>
            <option value="USER_SUSPENDED">User Suspended</option>
            <option value="USER_UNSUSPENDED">User Unsuspended</option>
            <option value="AUTO_SUSPENDED">Auto Suspended</option>
            <option value="PRODUCT_REQUEST_APPROVED">Request Approved</option>
            <option value="PRODUCT_REQUEST_REJECTED">Request Rejected</option>
          </select>
        </div>
        <button
          onClick={loadLogs}
          className="p-2 text-gray-400 hover:text-green-600 transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {loading ? (
        <div className="glass-card p-8 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-200 border-t-green-600" />
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card p-8 text-center text-gray-400 text-sm">
          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
          No audit logs found
        </div>
      ) : (
        <>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-800/50">
                    <th className="text-left py-2.5 px-4 text-xs text-gray-400 font-medium">Time</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-400 font-medium">Action</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-400 font-medium">User</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-400 font-medium">Target</th>
                    <th className="text-left py-2.5 px-4 text-xs text-gray-400 font-medium">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="py-2 px-4 text-xs text-gray-400 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 px-4">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          actionColors[log.action] || "bg-gray-100 text-gray-600"
                        }`}>
                          {log.action.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-2 px-4 text-xs">
                        {log.user ? (
                          <span className="dark:text-gray-300">{log.user.name || log.user.email}</span>
                        ) : (
                          <span className="text-gray-400">System</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-xs text-gray-400">
                        {log.targetType && (
                          <span>{log.targetType}{log.targetId ? ` #${log.targetId.slice(0, 8)}` : ""}</span>
                        )}
                      </td>
                      <td className="py-2 px-4 text-xs text-gray-500 dark:text-gray-400 max-w-64 truncate">
                        {log.details}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
            <div className="flex gap-1">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="p-1.5 text-gray-400 hover:text-green-600 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
