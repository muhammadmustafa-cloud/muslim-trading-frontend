import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, apiPost, apiDelete } from "../config/api.js";
import { downloadMachineryPurchasesPdf } from "../utils/exportPdf.js";
import { FaTools, FaSearch, FaEdit, FaPlus, FaSort, FaSortUp, FaSortDown, FaTrash, FaFilePdf } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";
import SearchableSelect from "../components/SearchableSelect.jsx";

const today = new Date().toISOString().slice(0, 10);

export default function MachineryPurchases() {
  const [list, setList] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: today,
    machineryItemId: "",
    supplierId: "",
    amount: "",
    quantity: "1",
    accountId: "",
    note: "",
  });
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", machineryItemId: "", supplierId: "" });
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = async () => {
    try {
      const [it, su, ac] = await Promise.all([
        fetch(`${API_BASE_URL}/machinery-items`).then(r => r.json()),
        fetch(`${API_BASE_URL}/suppliers`).then(r => r.json()),
        fetch(`${API_BASE_URL}/accounts`).then(r => r.json())
      ]);
      setItems(it.data || []);
      setSuppliers(su.data || []);
      setAccounts(ac.data || []);
    } catch (_) { }
  };

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.machineryItemId) params.set("machineryItemId", filters.machineryItemId);
      if (filters.supplierId) params.set("supplierId", filters.supplierId);
      const res = await fetch(`${API_BASE_URL}/machinery-purchases?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch");
      setList(data.data || []);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchList();
  }, [filters.dateFrom, filters.dateTo, filters.machineryItemId, filters.supplierId]);

  const resetForm = () => {
    setForm({
      date: today,
      machineryItemId: "",
      supplierId: "",
      amount: "",
      quantity: "1",
      accountId: "",
      note: "",
    });
    setModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.machineryItemId || !form.supplierId || !form.accountId || !form.amount) {
      setError("Please fill all required fields.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await apiPost("/machinery-purchases", {
        ...form,
        amount: Number(form.amount),
        quantity: Number(form.quantity) || 1
      });
      resetForm();
      fetchList();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? Financial records will also be corrected.")) return;
    try {
      await apiDelete(`/machinery-purchases/${id}`);
      fetchList();
    } catch (e) {
      alert(e.message);
    }
  };

  const sortedList = useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      if (sortKey === "date") {
        return sortDir === "asc" ? new Date(a.date) - new Date(b.date) : new Date(b.date) - new Date(a.date);
      }
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : -va.localeCompare(vb);
    });
    return arr;
  }, [list, sortKey, sortDir]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, page, pageSize]);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaTools className="w-7 h-7 text-amber-500" /> Machinery Purchase
          </h1>
          <p className="page-subtitle">Machinery ka naya saman record karein.</p>
        </div>
        <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
          <FaPlus className="w-4 h-4" /> Record Purchase
        </button>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title="Record Machinery Purchase">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Date *</label>
              <input type="date" value={form.date} onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Machinery Item *</label>
              <SearchableSelect options={items} value={form.machineryItemId} onChange={(val) => setForm(f => ({ ...f, machineryItemId: val }))} placeholder="Select item" />
            </div>
            <div>
              <label className="input-label">Supplier *</label>
              <SearchableSelect options={suppliers} value={form.supplierId} onChange={(val) => setForm(f => ({ ...f, supplierId: val }))} placeholder="Select supplier" />
            </div>
            <div>
              <label className="input-label">Account (Paid via) *</label>
              <select value={form.accountId} onChange={(e) => setForm(f => ({ ...f, accountId: e.target.value }))} className="input-field" required>
                <option value="">— Select Account —</option>
                {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Amount (Total Price) *</label>
              <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))} className="input-field font-bold" required />
            </div>
            <div>
              <label className="input-label">Quantity</label>
              <input type="number" value={form.quantity} onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))} className="input-field" min="1" />
            </div>
          </div>
          <div>
            <label className="input-label">Note / Reference</label>
            <input type="text" placeholder="e.g. Bill #123" value={form.note} onChange={(e) => setForm(f => ({ ...f, note: e.target.value }))} className="input-field" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end mt-4">
            <button type="button" onClick={resetForm} className="btn-secondary" disabled={submitting}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={submitting}>{submitting ? "Saving..." : "Add Entry"}</button>
          </div>
        </form>
      </Modal>

      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="input-field w-40" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="input-field w-40" />
          <SearchableSelect options={items} value={filters.machineryItemId} onChange={(val) => setFilters(f => ({ ...f, machineryItemId: val }))} placeholder="All items" className="w-56" />
          <p className="text-sm text-slate-500">{list.length} entry(ies)</p>
          <button type="button" onClick={() => downloadMachineryPurchasesPdf(sortedList, filters)} className="btn-primary flex items-center gap-1.5" disabled={list.length === 0} title="Download PDF"><FaFilePdf className="w-4 h-4" /> Export PDF</button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-slate-400">Loading...</div>
          ) : (
            <>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase">Date</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase">Item</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase">Supplier</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase">Paid Via</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase text-right">Amount</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.length === 0 ? (
                    <tr><td colSpan="6" className="p-10 text-center text-slate-400">No entries found.</td></tr>
                  ) : (
                    paginatedList.map((row) => (
                      <tr key={row._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4 text-sm">{formatDate(row.date)}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-900">{row.machineryItemId?.name || "—"}</td>
                        <td className="px-5 py-4 text-sm text-slate-600">{row.supplierId?.name || "—"}</td>
                        <td className="px-5 py-4 text-sm text-slate-500">{row.accountId?.name || "—"}</td>
                        <td className="px-5 py-4 text-sm text-right font-bold text-slate-900">{Number(row.amount).toLocaleString()}</td>
                        <td className="px-5 py-4 text-sm">
                          <button onClick={() => handleDelete(row._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" title="Delete Entry">
                            <FaTrash className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <TablePagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} totalItems={sortedList.length} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
