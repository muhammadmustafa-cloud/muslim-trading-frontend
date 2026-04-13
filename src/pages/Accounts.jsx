import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiGet, apiPost, apiPut, apiDelete } from "../config/api.js";
import { downloadAccountsPdf } from "../utils/exportPdf.js";
import { FaWallet, FaSearch, FaEdit, FaPlus, FaSort, FaSortUp, FaSortDown, FaExchangeAlt, FaFilePdf, FaMoneyBillWave } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";

const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));

export default function Accounts() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", type: "Cash", accountNumber: "", openingBalance: "", notes: "", showMirrorInDailyMemo: true });
  const [depositModal, setDepositModal] = useState({ open: false, account: null, amount: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/accounts", search ? { search } : {});
      setList(data.data || []);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchList(); }, [search]);

  const resetForm = () => {
    setForm({ name: "", type: "Cash", accountNumber: "", openingBalance: "", notes: "", showMirrorInDailyMemo: true });
    setEditingId(null);
    setModalOpen(false);
  };
  const openAddModal = () => { resetForm(); setModalOpen(true); };

  const handleEdit = (row) => {
    setForm({
      name: row.name || "",
      type: row.type || "Cash",
      accountNumber: row.accountNumber || "",
      openingBalance: row.openingBalance ?? "",
      notes: row.notes || "",
      showMirrorInDailyMemo: row.showMirrorInDailyMemo !== false,
    });
    setEditingId(row._id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Account ka naam zaroori hai"); return; }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        type: form.type,
        accountNumber: (form.accountNumber || "").trim(),
        openingBalance: Number(form.openingBalance) || 0,
        notes: (form.notes || "").trim(),
        showMirrorInDailyMemo: form.showMirrorInDailyMemo,
      };
      if (editingId) await apiPut(`/accounts/${editingId}`, payload);
      else await apiPost("/accounts", payload);
      resetForm();
      await fetchList();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };


  const openDepositModal = (row) => {
    setDepositModal({ open: true, account: row, amount: "", note: "" });
    setError("");
  };
  const closeDepositModal = () => setDepositModal({ open: false, account: null, amount: "", note: "" });

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositModal.account) return;
    const amt = Number(depositModal.amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Amount zaroori hai aur 0 se zyada hona chahiye");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await apiPost("/transactions", {
        type: "deposit",
        toAccountId: depositModal.account._id,
        amount: amt,
        note: (depositModal.note || "").trim(),
      });
      closeDepositModal();
      await fetchList();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sortedList = useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      if (sortKey === "balance") {
        const va = Number(a.currentBalance ?? a.openingBalance ?? 0);
        const vb = Number(b.currentBalance ?? b.openingBalance ?? 0);
        return sortDir === "asc" ? va - vb : vb - va;
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

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) return <FaSort className="w-3.5 h-3.5 ml-1 opacity-50" />;
    return sortDir === "asc" ? <FaSortUp className="w-3.5 h-3.5 ml-1" /> : <FaSortDown className="w-3.5 h-3.5 ml-1" />;
  };

  const cols = [
    { key: "name", label: "Naam" },
    { key: "type", label: "Type" },
    { key: "accountNumber", label: "Account #" },
    { key: "balance", label: "Current balance" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2"><FaWallet className="w-7 h-7 text-amber-500" /> Accounts (Hisaab)</h1>
          <p className="page-subtitle">Bank aur cash accounts — sab database mein save. Yahan jo add karein wo yahi dikhega; auto-created (e.g. Mill Khata) bhi.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => fetchList()} className="btn-secondary" title="Refresh list from database">Refresh</button>
          <button type="button" onClick={openAddModal} className="btn-primary"><FaPlus className="w-4 h-4" /> Add account</button>
        </div>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title={editingId ? "Edit account" : "Naya account add karein"}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="input-label">Account ka naam *</label><input type="text" placeholder="e.g. MCB Main, Cash" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" required /></div>
          <div><label className="input-label">Type</label><select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input-field"><option value="Cash">Cash</option><option value="Bank">Bank</option></select></div>
          <div><label className="input-label">Account number (optional)</label><input type="text" placeholder="1234-567890" value={form.accountNumber} onChange={(e) => setForm((f) => ({ ...f, accountNumber: e.target.value }))} className="input-field" /></div>
          <div><label className="input-label">Opening balance</label><input type="number" placeholder="0" value={form.openingBalance} onChange={(e) => setForm((f) => ({ ...f, openingBalance: e.target.value }))} className="input-field" min="0" step="1" /></div>
          <div className="sm:col-span-2"><label className="input-label">Notes</label><input type="text" placeholder="Optional" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input-field" /></div>
          <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 transition-all cursor-pointer" 
                checked={form.showMirrorInDailyMemo} 
                onChange={(e) => setForm(f => ({ ...f, showMirrorInDailyMemo: e.target.checked }))} 
              />
              <span className="text-sm font-bold text-slate-700 uppercase tracking-tighter">Show Mirror (Contra) in Daily Memo?</span>
            </label>
            <p className="text-[10px] text-slate-400 mt-1 ml-6 uppercase font-black tracking-widest leading-none">If unchecked, this account will only show single-sided entries in the cash memo.</p>
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (editingId ? "Update" : "Add account")}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary" disabled={submitting}>Cancel</button>
          </div>
        </form>
      </Modal>


      <Modal open={depositModal.open} onClose={closeDepositModal} title="Add money / Deposit">
        {depositModal.account && (
          <form onSubmit={handleDepositSubmit} className="space-y-4">
            <p className="text-sm text-slate-600">Account: <strong>{depositModal.account.name}</strong></p>
            <div>
              <label className="input-label">Amount *</label>
              <input type="number" placeholder="0" value={depositModal.amount} onChange={(e) => setDepositModal((d) => ({ ...d, amount: e.target.value }))} className="input-field" min="0.01" step="any" required />
            </div>
            <div>
              <label className="input-label">Note (optional)</label>
              <input type="text" placeholder="e.g. Cash in" value={depositModal.note} onChange={(e) => setDepositModal((d) => ({ ...d, note: e.target.value }))} className="input-field" />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : <><FaMoneyBillWave className="w-4 h-4" /> Deposit</>}
              </button>
              <button type="button" onClick={closeDepositModal} className="btn-secondary" disabled={submitting}>Cancel</button>
            </div>
          </form>
        )}
      </Modal>

      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input pl-9" />
          </div>
          <p className="text-sm text-slate-500">{list.length} account(s) — sab DB se</p>
          <button type="button" onClick={() => downloadAccountsPdf(sortedList)} className="btn-primary flex items-center gap-1.5" disabled={list.length === 0} title="Download PDF"><FaFilePdf className="w-4 h-4" /> Export PDF</button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="empty-state"><div className="loading-spinner mb-3" /><p>Loading...</p></div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr>
                    {cols.map(({ key, label }) => (
                      <th key={key} className={`table-header px-5 py-3.5 ${key === "balance" ? "text-right" : ""}`}>
                        <button type="button" onClick={() => toggleSort(key)} className={`flex items-center hover:text-slate-800 ${key === "balance" ? "justify-end w-full" : ""}`}>
                          {label}
                          <SortIcon columnKey={key} />
                        </button>
                      </th>
                    ))}
                    <th className="table-header px-5 py-3.5 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      <td className="table-cell font-medium">
                        <span>{row.name}</span>
                        {row.isDailyKhata && <span className="ml-2 inline-flex px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Daily Khata</span>}
                        {row.isMillKhata && <span className="ml-2 inline-flex px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">Mill Khata</span>}
                      </td>
                      <td className="table-cell">
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${row.type === "Bank" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>{row.type || "Cash"}</span>
                        {row.showMirrorInDailyMemo === false && <span className="ml-2 inline-flex px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">Single-Sided</span>}
                      </td>
                      <td className="table-cell">{row.accountNumber || "—"}</td>
                      <td className="table-cell text-right font-semibold text-slate-800">{formatMoney(row.currentBalance ?? row.openingBalance)}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button type="button" onClick={() => openDepositModal(row)} className="btn-ghost-primary flex items-center gap-1"><FaMoneyBillWave className="w-3.5 h-3.5" /> Deposit</button>
                          <button type="button" onClick={() => navigate(`/transactions?accountId=${row._id}`)} className="btn-ghost-primary flex items-center gap-1"><FaExchangeAlt className="w-3.5 h-3.5" /> Transactions</button>
                          <button type="button" onClick={() => handleEdit(row)} className="btn-ghost-primary flex items-center gap-1"><FaEdit className="w-3.5 h-3.5" /> Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} totalItems={sortedList.length} />
            </>
          )}
          {!loading && list.length === 0 && <div className="empty-state"><FaWallet className="w-12 h-12 text-slate-300 mb-2" /><p>Abhi koi account nahi. Add account button se add karein.</p></div>}
        </div>
      </section>
    </div>
  );
}
