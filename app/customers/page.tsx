"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Users,
  Star,
  Repeat,
  Loader2,
} from "lucide-react";
import NavBar from "../components/NavBar";
import type { Customer } from "@/lib/types";

interface FormState {
  name: string;
  phone: string;
  email: string;
  notes: string;
}

const emptyForm: FormState = { name: "", phone: "", email: "", notes: "" };

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState<FormState>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<FormState>(emptyForm);

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadCustomers = async (query?: string) => {
    setIsLoading(true);
    try {
      const url = query ? `/api/customers?q=${encodeURIComponent(query)}` : "/api/customers";
      const res = await fetch(url);
      const data = await res.json();
      setCustomers(Array.isArray(data.customers) ? data.customers : []);
    } catch (err) {
      console.error("Failed to load customers", err);
      setError("Could not load customers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      loadCustomers(search.trim() || undefined);
    }, 300);
    return () => clearTimeout(handle);
  }, [search]);

  const stats = useMemo(() => {
    const total = customers.length;
    const totalReviews = customers.reduce((sum, c) => sum + (c.review_count || 0), 0);
    const repeat = customers.filter((c) => (c.review_count || 0) > 1).length;
    return { total, totalReviews, repeat };
  }, [customers]);

  const submitAdd = async () => {
    setError("");
    if (!addForm.name.trim() && !addForm.phone.trim() && !addForm.email.trim()) {
      setError("Provide at least a name, phone, or email.");
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...addForm, logReview: false }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to add customer");
      }
      setAddForm(emptyForm);
      setShowAddForm(false);
      await loadCustomers(search.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add customer");
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (customer: Customer) => {
    setEditingId(customer.id);
    setEditForm({
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      notes: customer.notes ?? "",
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const submitEdit = async (id: number) => {
    setError("");
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update customer");
      }
      cancelEdit();
      await loadCustomers(search.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update customer");
    }
  };

  const deleteCustomer = async (id: number) => {
    setError("");
    setDeletingId(id);
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete customer");
      }
      setCustomers((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete customer");
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (value: string | null) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-[#fcfcfc] text-slate-900 p-8 sm:p-12 lg:p-20 font-sans selection:bg-purple-100">
      <div className="max-w-6xl mx-auto space-y-12">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em]">
              Customer CRM
            </div>
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none italic">
              Customer <span className="text-purple-600">Management.</span>
            </h1>
            <p className="text-xl text-slate-500 font-medium max-w-lg leading-relaxed">
              Everyone who&apos;s scanned your QR code and left a review, in one place.
            </p>
          </div>
          <NavBar />
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.06)] space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-2">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black">{stats.total}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Customers</p>
          </div>
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.06)] space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
              <Star className="w-5 h-5 fill-current" />
            </div>
            <p className="text-3xl font-black">{stats.totalReviews}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Reviews Generated</p>
          </div>
          <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-[0_20px_40px_-16px_rgba(0,0,0,0.06)] space-y-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
              <Repeat className="w-5 h-5" />
            </div>
            <p className="text-3xl font-black">{stats.repeat}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Repeat Customers</p>
          </div>
        </div>

        <div className="bg-white rounded-[3rem] p-8 sm:p-12 border border-slate-100 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] space-y-8">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-300 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone, or email..."
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:bg-white focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all placeholder:text-slate-300"
              />
            </div>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-all active:scale-[0.98]"
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? "Cancel" : "Add Customer"}
            </button>
          </div>

          {error && <p className="text-sm text-red-500 font-bold">{error}</p>}

          {showAddForm && (
            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={addForm.name}
                  onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                  placeholder="Name"
                  className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all"
                />
                <input
                  type="tel"
                  value={addForm.phone}
                  onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                  placeholder="Phone"
                  className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all"
                />
                <input
                  type="email"
                  value={addForm.email}
                  onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                  placeholder="Email"
                  className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all"
                />
                <input
                  type="text"
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  placeholder="Notes"
                  className="bg-white border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-medium focus:border-purple-200 focus:ring-4 focus:ring-purple-50 outline-none transition-all"
                />
              </div>
              <button
                onClick={submitAdd}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-slate-950 text-white font-bold hover:bg-black transition-all active:scale-[0.98] disabled:opacity-60"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Customer
              </button>
            </div>
          )}

          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-16 text-slate-400 font-medium">
                No customers yet. They&apos;ll show up here once someone scans your QR code.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100">
                    <th className="py-4 pr-4">Name</th>
                    <th className="py-4 pr-4">Phone</th>
                    <th className="py-4 pr-4">Email</th>
                    <th className="py-4 pr-4">Reviews</th>
                    <th className="py-4 pr-4">Last Review</th>
                    <th className="py-4 pr-4">Notes</th>
                    <th className="py-4 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((customer) => {
                    const isEditing = editingId === customer.id;
                    return (
                      <tr key={customer.id} className="border-b border-slate-50 last:border-0 align-top">
                        {isEditing ? (
                          <>
                            <td className="py-3 pr-4">
                              <input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-32 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                              />
                            </td>
                            <td className="py-3 pr-4">
                              <input
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                className="w-28 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                              />
                            </td>
                            <td className="py-3 pr-4">
                              <input
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                className="w-40 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                              />
                            </td>
                            <td className="py-3 pr-4 font-bold text-slate-400">{customer.review_count}</td>
                            <td className="py-3 pr-4 text-slate-400">{formatDate(customer.last_review_at)}</td>
                            <td className="py-3 pr-4">
                              <input
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                className="w-40 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm"
                              />
                            </td>
                            <td className="py-3 pr-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => submitEdit(customer.id)}
                                  className="p-2 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                  title="Save"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 transition-colors"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-4 pr-4 font-bold text-slate-900">{customer.name || "—"}</td>
                            <td className="py-4 pr-4 text-slate-600">{customer.phone || "—"}</td>
                            <td className="py-4 pr-4 text-slate-600">{customer.email || "—"}</td>
                            <td className="py-4 pr-4">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-600 font-bold text-xs">
                                <Star className="w-3 h-3 fill-current" />
                                {customer.review_count}
                              </span>
                            </td>
                            <td className="py-4 pr-4 text-slate-400">{formatDate(customer.last_review_at)}</td>
                            <td className="py-4 pr-4 text-slate-500 max-w-[200px] truncate" title={customer.notes ?? ""}>
                              {customer.notes || "—"}
                            </td>
                            <td className="py-4 pr-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => startEdit(customer)}
                                  className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-purple-600 transition-colors"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => deleteCustomer(customer.id)}
                                  disabled={deletingId === customer.id}
                                  className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50"
                                  title="Delete"
                                >
                                  {deletingId === customer.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
