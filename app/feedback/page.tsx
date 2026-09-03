"use client";

import { useEffect, useState } from "react";
import { Star, Check, Trash2, Loader2, Inbox } from "lucide-react";
import NavBar from "../components/NavBar";
import type { FeedbackEntry } from "@/lib/types";

export default function FeedbackPage() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "new" | "resolved">("new");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async (status: "all" | "new" | "resolved") => {
    setIsLoading(true);
    try {
      const url = status === "all" ? "/api/feedback" : `/api/feedback?status=${status}`;
      const res = await fetch(url);
      const data = await res.json();
      setEntries(Array.isArray(data.feedback) ? data.feedback : []);
    } catch (err) {
      console.error("Failed to load feedback", err);
      setError("Could not load feedback.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  const markResolved = async (id: number) => {
    setBusyId(id);
    try {
      await fetch(`/api/feedback/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      if (filter === "new") {
        setEntries((prev) => prev.filter((e) => e.id !== id));
      } else {
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? { ...e, status: "resolved" as const } : e))
        );
      }
    } catch (err) {
      console.error("Failed to update feedback", err);
      setError("Could not update feedback.");
    } finally {
      setBusyId(null);
    }
  };

  const remove = async (id: number) => {
    setBusyId(id);
    try {
      await fetch(`/api/feedback/${id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error("Failed to delete feedback", err);
      setError("Could not delete feedback.");
    } finally {
      setBusyId(null);
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 p-8 sm:p-12 lg:p-20 font-sans selection:bg-purple-100">
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
              Private Inbox
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none italic">
              Customer <span className="text-purple-600">Feedback.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-lg leading-relaxed">
              Low-rating feedback sent privately, before it ever reaches Google.
            </p>
          </div>
          <NavBar />
        </header>

        <div className="inline-flex items-center gap-1 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
          {(["new", "resolved", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
                filter === f ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-24 space-y-4 text-slate-400">
            <Inbox className="w-10 h-10 mx-auto" />
            <p className="font-medium">No {filter !== "all" ? filter : ""} feedback yet.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.06)] space-y-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < entry.rating ? "text-amber-400 fill-current" : "text-slate-200"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                      {formatDate(entry.created_at)}
                    </span>
                  </div>
                  {entry.status === "resolved" ? (
                    <span className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-600 text-xs font-black uppercase tracking-widest">
                      Resolved
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-lg bg-rose-50 text-rose-600 text-xs font-black uppercase tracking-widest">
                      New
                    </span>
                  )}
                </div>

                {entry.comment && (
                  <p className="text-slate-800 font-medium leading-relaxed">{entry.comment}</p>
                )}

                <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-50">
                  <p className="text-sm text-slate-500 font-bold">
                    {entry.customer_name || entry.customer_phone
                      ? [entry.customer_name, entry.customer_phone].filter(Boolean).join(" · ")
                      : "Anonymous"}
                  </p>
                  <div className="flex gap-2">
                    {entry.status !== "resolved" && (
                      <button
                        onClick={() => markResolved(entry.id)}
                        disabled={busyId === entry.id}
                        className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        title="Mark resolved"
                      >
                        {busyId === entry.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Check className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    <button
                      onClick={() => remove(entry.id)}
                      disabled={busyId === entry.id}
                      className="p-2.5 rounded-xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
