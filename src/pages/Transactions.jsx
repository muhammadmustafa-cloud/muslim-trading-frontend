import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { API_BASE_URL, apiPost, apiDelete } from "../config/api.js";
import { buildCsv, downloadCsv } from "../utils/exportToCsv.js";
import { downloadTransactionsPdf } from "../utils/exportPdf.js";
import { FaExchangeAlt, FaTrash, FaPlus, FaSort, FaSortUp, FaSortDown, FaFileExport, FaFilePdf } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import TablePagination from "../components/TablePagination.jsx";

const today = new Date().toISOString().slice(0, 10);
const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const accountIdFromUrl = searchParams.get("accountId") || "";

  const [list, setList] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [mazdoor, setMazdoor] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: today,
    type: "deposit",
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    category: "",
    note: "",
    supplierId: "",
    mazdoorId: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [filters, setFilters] = useState({ accountId: accountIdFromUrl, dateFrom: "", dateTo: "" });
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    if (accountIdFromUrl && filters.accountId !== accountIdFromUrl) {
      setFilters((f) => ({ ...f, accountId: accountIdFromUrl }));
    }
  }, [accountIdFromUrl]);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/accounts`);
      const data = await res.json();
      if (res.ok) setAccounts(data.data || []);
    } catch (_) {}
  };
  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/suppliers`);
      const data = await res.json();
      if (res.ok) setSuppliers(data.data || []);
    } catch (_) {}
  };
  const fetchMazdoor = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/mazdoor`);
      const data = await res.json();
      if (res.ok) setMazdoor(data.data || []);
    } catch (_) {}
  };

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("unified", "true");
      if (filters.accountId) params.set("accountId", filters.accountId);
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      const res = await fetch(`${API_BASE_URL}/transactions?${params}`);
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
    fetchAccounts();
    fetchSuppliers();
    fetchMazdoor();
  }, []);
  useEffect(() => {
    fetchList();
  }, [filters.accountId, filters.dateFrom, filters.dateTo]);

  const resetForm = () => {
    setForm({
      date: today,
      type: "deposit",
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      category: "",
      note: "",
      supplierId: "",
      mazdoorId: "",
    });
    setModalOpen(false);
  };
  const openAddModal = () => {
    resetForm();
    setForm((f) => ({ ...f, date: today }));
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = Number(form.amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Valid amount enter karein.");
      return;
    }
    if (form.type === "deposit" && !form.toAccountId) {
      setError("Deposit ke liye account select karein.");
      return;
    }
    if (form.type === "withdraw" && !form.fromAccountId) {
      setError("Withdraw ke liye account select karein.");
      return;
    }
    if (form.type === "transfer" && (!form.fromAccountId || !form.toAccountId)) {
      setError("Transfer ke liye dono accounts select karein.");
      return;
    }
    if (form.type === "transfer" && form.fromAccountId === form.toAccountId) {
      setError("Same account pe transfer nahi kar sakte.");
      return;
    }
    setError("");
    try {
      const payload = {
        date: form.date,
        type: form.type,
        fromAccountId: form.fromAccountId || undefined,
        toAccountId: form.toAccountId || undefined,
        amount: amt,
        category: (form.category || "").trim(),
        note: (form.note || "").trim(),
        supplierId: form.supplierId || undefined,
        mazdoorId: form.mazdoorId || undefined,
      };
      await apiPost("/transactions", payload);
      resetForm();
      fetchList();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;
    setError("");
    try {
      await apiDelete(`/transactions/${deleteConfirm.id}`);
      fetchList();
    } catch (e) {
      setError(e.message);
    }
    setDeleteConfirm({ open: false, id: null });
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const sortedList = useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      if (sortKey === "date") {
        const va = new Date(a.date).getTime();
        const vb = new Date(b.date).getTime();
        return sortDir === "asc" ? va - vb : vb - va;
      }
      if (sortKey === "amount") {
        const va = Number(a.amount) || 0;
        const vb = Number(b.amount) || 0;
        return sortDir === "asc" ? va - vb : vb - va;
      }
      if (sortKey === "type") {
        const va = (a.type || "").toLowerCase();
        const vb = (b.type || "").toLowerCase();
        return sortDir === "asc" ? va.localeCompare(vb) : -va.localeCompare(vb);
      }
      return 0;
    });
    return arr;
  }, [list, sortKey, sortDir]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, page, pageSize]);

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) return <FaSort className="w-3.5 h-3.5 ml-1 opacity-50" />;
    return sortDir === "asc" ? <FaSortUp className="w-3.5 h-3.5 ml-1" /> : <FaSortDown className="w-3.5 h-3.5 ml-1" />;
  };

  const typeLabel = (t) => (t === "deposit" ? "Deposit" : t === "withdraw" ? "Withdraw" : t === "transfer" ? "Transfer" : t === "sale" ? "Sale" : t === "purchase" ? "Purchase" : t);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaExchangeAlt className="w-7 h-7 text-amber-500" />
            Transactions (Lena-dena)
          </h1>
          <p className="page-subtitle">Saari account movement: manual deposit/withdraw/transfer plus Sales aur Stock entries jahan account select kiya ho.</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary">
          <FaPlus className="w-4 h-4" /> Add transaction
        </button>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title="Naya transaction add karein">
        {accounts.length === 0 && (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm mb-4">
            Pehle <strong>Accounts</strong> page se kam az kam ek account (e.g. Cash ya Bank) add karein, phir yahan transaction add kar sakte hain.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Tarikh *</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Type *</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input-field" required>
                <option value="deposit">Deposit</option>
                <option value="withdraw">Withdraw</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            {(form.type === "withdraw" || form.type === "transfer") && (
              <div>
                <label className="input-label">From account *</label>
                <select value={form.fromAccountId} onChange={(e) => setForm((f) => ({ ...f, fromAccountId: e.target.value }))} className="input-field" required={form.type !== "deposit"}>
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
            {(form.type === "deposit" || form.type === "transfer") && (
              <div>
                <label className="input-label">To account *</label>
                <select value={form.toAccountId} onChange={(e) => setForm((f) => ({ ...f, toAccountId: e.target.value }))} className="input-field" required={form.type !== "withdraw"}>
                  <option value="">Select account</option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="input-label">Amount *</label>
              <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input-field" min="0" step="1" required />
            </div>
            <div>
              <label className="input-label">Category (optional)</label>
              <input type="text" placeholder="e.g. Salary, Rent" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="input-label">Supplier (optional)</label>
              <select value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))} className="input-field">
                <option value="">—</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Mazdoor (optional)</label>
              <select value={form.mazdoorId} onChange={(e) => setForm((f) => ({ ...f, mazdoorId: e.target.value }))} className="input-field">
                <option value="">—</option>
                {mazdoor.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="input-label">Note</label>
              <input type="text" placeholder="Optional" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="input-field" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">Add transaction</button>
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })} onConfirm={handleDeleteConfirm} title="Transaction delete karein?" message="Is transaction ko delete karne se balance change ho jayega. Continue?" confirmLabel="Haan, delete karein" />

      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <select value={filters.accountId} onChange={(e) => setFilters((f) => ({ ...f, accountId: e.target.value }))} className="input-field w-48">
            <option value="">All accounts</option>
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>{a.name}</option>
            ))}
          </select>
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} className="input-field w-40" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} className="input-field w-40" />
          <p className="text-sm text-slate-500">{list.length} transaction(s)</p>
          <button type="button" onClick={() => downloadTransactionsPdf(sortedList, filters)} className="btn-primary flex items-center gap-1.5" disabled={list.length === 0} title="Download PDF"><FaFilePdf className="w-4 h-4" /> Export PDF</button>
          <button type="button" onClick={() => { const csv = buildCsv(list, [{ key: "date", label: "Date" }, { key: "type", label: "Type" }, { key: "fromAccountId.name", label: "From Account" }, { key: "toAccountId.name", label: "To Account" }, { key: "amount", label: "Amount" }, { key: "category", label: "Category" }, { key: "note", label: "Note" }]); downloadCsv(csv, "transactions.csv"); }} className="btn-secondary flex items-center gap-1.5" disabled={list.length === 0}><FaFileExport className="w-4 h-4" /> Export CSV</button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="empty-state"><div className="loading-spinner mb-3" /><p>Loading...</p></div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("date")} className="flex items-center hover:text-slate-800">Date<SortIcon columnKey="date" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("type")} className="flex items-center hover:text-slate-800">Type<SortIcon columnKey="type" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">From account</th>
                    <th className="table-header px-5 py-3.5">To account</th>
                    <th className="table-header px-5 py-3.5 text-right">
                      <button type="button" onClick={() => toggleSort("amount")} className="flex items-center justify-end w-full hover:text-slate-800">Amount<SortIcon columnKey="amount" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">Category</th>
                    <th className="table-header px-5 py-3.5">Note</th>
                    <th className="table-header px-5 py-3.5 w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      <td className="table-cell">{formatDate(row.date)}</td>
                      <td className="table-cell">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                          row.type === "deposit" ? "bg-green-100 text-green-700" : row.type === "sale" ? "bg-emerald-100 text-emerald-700" : row.type === "withdraw" ? "bg-red-100 text-red-700" : row.type === "purchase" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                        }`}>{typeLabel(row.type)}</span>
                      </td>
                      <td className="table-cell">{row.fromAccountId?.name ?? "—"}</td>
                      <td className="table-cell">{row.toAccountId?.name ?? "—"}</td>
                      <td className="table-cell text-right font-medium">{formatMoney(row.amount)}</td>
                      <td className="table-cell">{row.category || "—"}</td>
                      <td className="table-cell max-w-[180px] truncate" title={row.note}>{row.note || "—"}</td>
                      <td className="table-cell">
                        {row.source === "transaction" ? (
                          <button type="button" onClick={() => setDeleteConfirm({ open: true, id: row._id })} className="btn-ghost-danger flex items-center gap-1"><FaTrash className="w-3.5 h-3.5" /> Delete</button>
                        ) : (
                          <span className="text-xs text-slate-500">{row.source === "sale" ? "From Sale" : "From Stock"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} totalItems={sortedList.length} />
            </>
          )}
          {!loading && list.length === 0 && (
            <div className="empty-state">
              <FaExchangeAlt className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-medium text-slate-700">Abhi koi transaction nahi.</p>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                Yahan manual transactions (deposit/withdraw/transfer) plus <strong>Sales</strong> aur <strong>Stock entries</strong> jahan aap ne account select kiya ho — sab ek saath dikhti hain. Manual entry ke liye pehle Accounts banaen, phir Add transaction use karein.
              </p>
              <button type="button" onClick={openAddModal} className="btn-primary mt-4">
                <FaPlus className="w-4 h-4 inline mr-1.5" /> Add first transaction
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
