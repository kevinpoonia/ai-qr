"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Plus,
  Loader2,
  Copy,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Search,
  Pause,
  Play,
  KeyRound,
  LogIn,
  Settings,
} from "lucide-react";
import AdminNavBar from "./components/AdminNavBar";
import type { AdminBusiness } from "@/lib/types";
import type { AuditLogEntry } from "@/lib/auditLog";

export default function AdminPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [activity, setActivity] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [resetTargetId, setResetTargetId] = useState<number | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetResult, setResetResult] = useState<{ id: number; password: string } | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formError, setFormError] = useState("");

  const load = async () => {
    setIsLoading(true);
    try {
      const [bizRes, activityRes] = await Promise.all([
        fetch("/api/admin/businesses"),
        fetch("/api/admin/activity"),
      ]);
      const bizData = await bizRes.json();
      const activityData = await activityRes.json();
      setBusinesses(Array.isArray(bizData.businesses) ? bizData.businesses : []);
      setActivity(Array.isArray(activityData.activity) ? activityData.activity : []);
    } catch (err) {
      console.error("Failed to load admin data", err);
      setError("Could not load clients.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return businesses;
    return businesses.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        (b.owner_email ?? "").toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q)
    );
  }, [businesses, search]);

  const onboardClient = async () => {
    setFormError("");
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/businesses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, location, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to onboard client");
      }
      setBusinessName("");
      setLocation("");
      setEmail("");
      setPassword("");
      setShowAddForm(false);
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to onboard client");
    } finally {
      setIsSaving(false);
    }
  };

  const removeBusiness = async (id: number) => {
    if (!confirm("Remove this client? This deletes their business, customers and feedback permanently.")) {
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to remove client");
      }
      setBusinesses((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove client");
    } finally {
      setBusyId(null);
    }
  };

  const toggleStatus = async (b: AdminBusiness) => {
    const nextStatus = b.status === "active" ? "suspended" : "active";
    setBusyId(b.id);
    try {
      const res = await fetch(`/api/admin/businesses/${b.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      setBusinesses((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: nextStatus } : x)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setBusyId(null);
    }
  };

  const submitReset = async (id: number) => {
    if (resetPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/businesses/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: resetPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }
      setResetResult({ id, password: resetPassword });
      setResetTargetId(null);
      setResetPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setBusyId(null);
    }
  };

  const impersonate = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/businesses/${id}/impersonate`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to log in as client");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log in as client");
      setBusyId(null);
    }
  };

  const copyLink = (slug: string) => {
    const link = `${window.location.origin}/qr/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 p-8 sm:p-12 lg:p-20 font-sans selection:bg-purple-100">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
              Platform Admin
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none italic">
              Clients <span className="text-purple-600">Console.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-lg leading-relaxed">
              Onboard, support, and manage every business on the platform.
            </p>
          </div>
          <AdminNavBar />
        </header>

        {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-black tracking-tight">Onboard a Client</h2>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              {showAddForm ? "Cancel" : "New Client"}
            </button>
          </div>
          {showAddForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Business name"
                  className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all"
                />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Location (city / area)"
                  className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Owner email"
                  className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all"
                />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Temporary password"
                  className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all"
                />
              </div>
              {formError && <p className="text-sm text-red-500 font-bold">{formError}</p>}
              <button
                onClick={onboardClient}
                disabled={isSaving || !businessName || !email || !password}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-950 text-white font-bold hover:bg-black transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Onboard Client
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-black tracking-tight">
              {filtered.length} client{filtered.length === 1 ? "" : "s"}
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search clients..."
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {filtered.map((b) => (
                <div key={b.id} className="rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-sm truncate">{b.name}</p>
                          {b.status === "suspended" && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-600 text-[10px] font-black uppercase tracking-widest">
                              Suspended
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-bold text-slate-400 truncate">
                          {b.owner_email ?? "no owner"} {b.location && `• ${b.location}`}
                        </p>
                        <p className="text-xs font-mono text-purple-600 truncate">/qr/{b.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                      <Link
                        href={`/admin/clients/${b.id}`}
                        className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-500 hover:text-purple-600 transition-colors"
                        title="View / edit"
                      >
                        <Settings className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => copyLink(b.slug)}
                        className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-500 hover:text-purple-600 transition-colors"
                        title="Copy link"
                      >
                        {copiedSlug === b.slug ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <a
                        href={`/qr/${b.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-500 hover:text-purple-600 transition-colors"
                        title="Open QR page"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => impersonate(b.id)}
                        disabled={busyId === b.id}
                        className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-500 hover:text-purple-600 transition-colors disabled:opacity-50"
                        title="Login as this client"
                      >
                        <LogIn className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setResetTargetId(resetTargetId === b.id ? null : b.id)}
                        className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-500 hover:text-purple-600 transition-colors"
                        title="Reset owner password"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleStatus(b)}
                        disabled={busyId === b.id}
                        className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-500 hover:text-amber-600 transition-colors disabled:opacity-50"
                        title={b.status === "active" ? "Suspend" : "Reactivate"}
                      >
                        {b.status === "active" ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => removeBusiness(b.id)}
                        disabled={busyId === b.id}
                        className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                        title="Delete permanently"
                      >
                        {busyId === b.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {resetTargetId === b.id && (
                    <div className="px-5 pb-5 flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={resetPassword}
                        onChange={(e) => setResetPassword(e.target.value)}
                        placeholder="New password (min. 8 characters)"
                        className="flex-1 bg-white border-2 border-slate-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all"
                      />
                      <button
                        onClick={() => submitReset(b.id)}
                        disabled={busyId === b.id}
                        className="px-5 py-2.5 rounded-xl bg-slate-950 text-white text-sm font-bold hover:bg-black transition-all disabled:opacity-60"
                      >
                        Set Password
                      </button>
                    </div>
                  )}

                  {resetResult?.id === b.id && (
                    <div className="mx-5 mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-100 text-sm text-emerald-700 font-medium">
                      New password for {b.owner_email}:{" "}
                      <span className="font-mono font-bold select-all">{resetResult.password}</span>
                    </div>
                  )}
                </div>
              ))}
              {filtered.length === 0 && (
                <p className="text-sm text-slate-400 font-medium text-center py-8">No clients found.</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)]">
          <h2 className="text-xl font-black tracking-tight mb-6">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-slate-400 font-medium">No admin activity yet.</p>
          ) : (
            <div className="space-y-3">
              {activity.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 text-sm py-2 border-b border-slate-50 last:border-0">
                  <p className="text-slate-600 font-medium">
                    <span className="font-bold text-slate-900">{entry.admin_email}</span>{" "}
                    {entry.action.replace(/_/g, " ")}
                    {entry.business_name ? ` — ${entry.business_name}` : entry.detail ? ` — ${entry.detail}` : ""}
                  </p>
                  <span className="text-xs text-slate-400 font-bold shrink-0">
                    {new Date(entry.created_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
