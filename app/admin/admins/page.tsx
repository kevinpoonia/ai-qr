"use client";

import { useEffect, useState } from "react";
import { UserPlus, Trash2, Loader2, ShieldCheck } from "lucide-react";
import AdminNavBar from "../components/AdminNavBar";
import type { PlatformAdminUser } from "@/lib/types";

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<PlatformAdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/admins");
      const data = await res.json();
      setAdmins(Array.isArray(data.admins) ? data.admins : []);
    } catch (err) {
      console.error("Failed to load admins", err);
      setError("Could not load admins.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addAdmin = async () => {
    setError("");
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to add admin");
      }
      setEmail("");
      setPassword("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add admin");
    } finally {
      setIsSaving(false);
    }
  };

  const removeAdmin = async (id: number) => {
    if (!confirm("Remove this admin's access?")) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/admins/${id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Failed to remove admin");
      }
      setAdmins((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove admin");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 p-8 sm:p-12 lg:p-20 font-sans selection:bg-purple-100">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
              Platform Admin
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none italic">
              Admin <span className="text-purple-600">Accounts.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-lg leading-relaxed">
              Everyone who can manage the whole platform.
            </p>
          </div>
          <AdminNavBar />
        </header>

        {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] space-y-6">
          <h2 className="text-xl font-black tracking-tight">Add Admin</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
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
          <button
            onClick={addAdmin}
            disabled={isSaving || !email || !password}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Add Admin
          </button>
        </div>

        <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {admins.map((admin) => (
                <div key={admin.id} className="flex items-center justify-between gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{admin.email}</p>
                      <p className="text-xs font-bold text-slate-400">
                        Added {new Date(admin.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeAdmin(admin.id)}
                    disabled={busyId === admin.id}
                    className="p-2.5 rounded-xl bg-white text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                    title="Remove"
                  >
                    {busyId === admin.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
