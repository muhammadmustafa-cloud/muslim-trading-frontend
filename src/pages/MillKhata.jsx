import { useState, useEffect } from "react";
import { API_BASE_URL, apiPost } from "../config/api.js";
import { FaIndustry, FaPlus, FaTrash } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const getToday = () => new Date().toISOString().slice(0, 10);

export default function MillKhata() {
  const today = getToday();
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({ total: 0, accountBalance: 0 });
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ date: today, amount: "", category: "", note: "" });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "" });

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      const res = await fetch(`${API_BASE_URL}/mill-expenses?${new URLSearchParams(params)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch");
      setList(data.data || []);
      setSummary(data.summary || { total: 0, accountBalance: 0 });
      setAccount(data.account || null);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [filters.dateFrom, filters.dateTo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const amt = Number(form.amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Valid amount daalein.");
      return;
    }
    try {
      await apiPost("/mill-expenses", {
        date: form.date,
        amount: amt,
        category: (form.category || "").trim(),
        note: (form.note || "").trim(),
      });
      setForm({ date: today, amount: "", category: "", note: "" });
      setModalOpen(false);
      fetchList();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.id) return;
    setError("");
    try {
      await fetch(`${API_BASE_URL}/mill-expenses/${deleteConfirm.id}`, { method: "DELETE" });
      setDeleteConfirm({ open: false, id: null });
      fetchList();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
            <FaIndustry className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Mill Khata</h1>
            <p className="text-slate-500 text-sm">Mill ke daily expenses — rent, bijli, maintenance, misc. Auto-created account se manage.</p>
          </div>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
          <FaPlus className="w-4 h-4 mr-1.5" /> Add expense
        </button>
      </header>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

      {account && (
        <div className="card p-4 bg-violet-50 border border-violet-100">
          <p className="text-sm text-slate-600">Account: <strong>{account.name}</strong></p>
          <p className="text-lg font-bold text-violet-700 mt-1">Balance: {formatMoney(summary.accountBalance)}</p>
        </div>
      )}

      <div className="card p-4 flex flex-wrap items-center gap-3">
        <label className="text-sm text-slate-600">Date range</label>
        <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} className="input-field w-40" />
        <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} className="input-field w-40" />
        <p className="text-sm text-slate-500">Total in list: {formatMoney(summary.total)}</p>
      </div>

      <section className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Mill expenses</h2>
        </div>
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-500">Abhi koi mill expense nahi. Add expense se daalein.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="table-header px-4 py-3 text-left">Date</th><th className="table-header px-4 py-3 text-left">Category</th><th className="table-header px-4 py-3 text-left">Note</th><th className="table-header px-4 py-3 text-right">Amount</th><th className="table-header px-4 py-3 w-24">Actions</th></tr></thead>
              <tbody>
                {list.map((row) => (
                  <tr key={row._id} className="table-row-hover border-b border-slate-100">
                    <td className="table-cell py-3 px-4">{formatDate(row.date)}</td>
                    <td className="table-cell py-3 px-4">{row.category || "—"}</td>
                    <td className="table-cell py-3 px-4">{row.note || "—"}</td>
                    <td className="table-cell py-3 px-4 text-right font-medium">{formatMoney(row.amount)}</td>
                    <td className="table-cell py-3 px-4"><button type="button" onClick={() => setDeleteConfirm({ open: true, id: row._id })} className="btn-ghost-danger text-sm"><FaTrash className="w-3.5 h-3.5" /> Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Mill expense add karein">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="input-label">Date *</label><input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input-field" required /></div>
          <div><label className="input-label">Amount *</label><input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input-field" required min="0" step="1" placeholder="0" /></div>
          <div><label className="input-label">Category</label><input type="text" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field" placeholder="e.g. Rent, Bijli, Maintenance" /></div>
          <div><label className="input-label">Note</label><input type="text" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="input-field" /></div>
          <div className="flex gap-2"><button type="submit" className="btn-primary">Add</button><button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button></div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })} onConfirm={handleDelete} title="Mill expense delete karein?" message="Is expense ko delete karne se account mein wapas amount add ho jayega. Continue?" confirmLabel="Haan, delete" />
    </div>
  );
}
