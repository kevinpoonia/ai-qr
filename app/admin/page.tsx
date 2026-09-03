"use client";

import { useEffect, useState } from "react";
import { Building2, Plus, Loader2, Copy, ExternalLink, Trash2, LogOut, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { AdminBusiness } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const [businesses, setBusinesses] = useState<AdminBusiness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [createdSlug, setCreatedSlug] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/businesses");
      const data = await res.json();
      setBusinesses(Array.isArray(data.businesses) ? data.businesses : []);
    } catch (err) {
      console.error("Failed to load businesses", err);
      setError("Could not load clients.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const onboardClient = async () => {
    setFormError("");
    setCreatedSlug(null);
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
      setCreatedSlug(data.slug);
      setBusinessName("");
      setLocation("");
      setEmail("");
      setPassword("");
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

  const copyLink = (slug: string) => {
    const link = `${window.location.origin}/qr/${slug}`;
    navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 p-8 sm:p-12 lg:p-20 font-sans selection:bg-purple-100">
      <div className="max-w-5xl mx-auto space-y-12">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
              Platform Admin
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none italic">
              Clients <span className="text-purple-600">Console.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-lg leading-relaxed">
              Onboard businesses and hand them their QR code and link.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-sm font-bold text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all h-fit"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </header>

        {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] space-y-6">
          <h2 className="text-xl font-black tracking-tight">Onboard a Client</h2>
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
          {createdSlug && (
            <p className="text-sm text-emerald-600 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Client created — link ready below.
            </p>
          )}
          <button
            onClick={onboardClient}
            disabled={isSaving || !businessName || !email || !password}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Onboard Client
          </button>
        </div>

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)]">
          <h2 className="text-xl font-black tracking-tight mb-6">
            {businesses.length} client{businesses.length === 1 ? "" : "s"}
          </h2>
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {businesses.map((b) => (
                <div
                  key={b.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{b.name}</p>
                      <p className="text-xs font-bold text-slate-400 truncate">
                        {b.owner_email ?? "no owner"} {b.location && `• ${b.location}`}
                      </p>
                      <p className="text-xs font-mono text-purple-600 truncate">/qr/{b.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
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
                      title="Open"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => removeBusiness(b.id)}
                      disabled={busyId === b.id}
                      className="p-2.5 rounded-xl bg-white border border-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Remove"
                    >
                      {busyId === b.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
              {businesses.length === 0 && (
                <p className="text-sm text-slate-400 font-medium text-center py-8">No clients yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
