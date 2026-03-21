import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiPost, apiPut, apiDelete } from "../config/api.js";
import { FaUser, FaSearch, FaEdit, FaPlus, FaSort, FaSortUp, FaSortDown, FaMoneyBillWave, FaHistory, FaHandHoldingUsd } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";

const today = new Date().toISOString().slice(0, 10);

export default function Mazdoor() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", role: "", notes: "", monthlySalary: "" });
  const [paymentModal, setPaymentModal] = useState({ open: false, mazdoor: null });
  const [paymentForm, setPaymentForm] = useState({ date: today, accountId: "", amount: "", category: "salary", note: "" });
  const [salaryModal, setSalaryModal] = useState({ open: false, mazdoor: null });
  const [salaryForm, setSalaryForm] = useState({ date: today, amount: "", note: "Monthly Salary Posted" });
  const [receiveModal, setReceiveModal] = useState({ open: false, mazdoor: null });
  const [receiveForm, setReceiveForm] = useState({ date: today, accountId: "", amount: "", note: "" });
  const [submitting, setSubmitting] = useState(false);
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params = search ? { search } : {};
      const res = await fetch(`${API_BASE_URL}/mazdoor?${new URLSearchParams(params)}`);
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

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/accounts`);
      const data = await res.json();
      if (res.ok) setAccounts(data.data || []);
    } catch (_) { }
  };

  useEffect(() => { fetchList(); }, [search]);
  useEffect(() => { fetchAccounts(); }, []);

  const resetForm = () => { setForm({ name: "", phone: "", role: "", notes: "", monthlySalary: "" }); setEditingId(null); setModalOpen(false); };
  const openAddModal = () => { resetForm(); setModalOpen(true); };

  const openPaymentModal = (row) => {
    fetchAccounts();
    setPaymentModal({ open: true, mazdoor: row });
    setPaymentForm({ date: today, accountId: "", amount: "", category: "salary", note: "" });
    setError("");
  };
  const closePaymentModal = () => {
    setPaymentModal({ open: false, mazdoor: null });
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentModal.mazdoor) return;
    const amt = Number(paymentForm.amount);
    if (isNaN(amt) || amt <= 0) { setError("Valid amount enter karein"); return; }
    if (!paymentForm.accountId) { setError("Account select karein — kis account se de rahe hain"); return; }
    setError("");
    setSubmitting(true);
    try {
      await apiPost("/transactions", {
        type: paymentForm.category === "salary" ? "salary" : "withdraw",
        fromAccountId: paymentForm.accountId,
        amount: amt,
        category: paymentForm.category,
        note: paymentForm.note || undefined,
        mazdoorId: paymentModal.mazdoor._id,
        date: paymentForm.date,
      });
      closePaymentModal();
      fetchList();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const openReceiveModal = (row) => {
    fetchAccounts();
    setReceiveModal({ open: true, mazdoor: row });
    setReceiveForm({ date: today, accountId: "", amount: "", note: "" });
    setError("");
  };
  const closeReceiveModal = () => setReceiveModal({ open: false, mazdoor: null });

  const handleReceiveSubmit = async (e) => {
    e.preventDefault();
    if (!receiveModal.mazdoor) return;
    const amt = Number(receiveForm.amount);
    if (isNaN(amt) || amt <= 0) { setError("Valid amount enter karein"); return; }
    if (!receiveForm.accountId) { setError("Account select karein — kis account mein receive kar rahe hain"); return; }
    setError("");
    setSubmitting(true);
    try {
      await apiPost("/transactions", {
        type: "deposit",
        toAccountId: receiveForm.accountId,
        amount: amt,
        category: "udhaar_received",
        note: receiveForm.note || undefined,
        mazdoorId: receiveModal.mazdoor._id,
        date: receiveForm.date,
      });
      closeReceiveModal();
      fetchList();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const openSalaryModal = (row) => {
    setSalaryModal({ open: true, mazdoor: row });
    setSalaryForm({ date: today, amount: row.monthlySalary || "", note: "Monthly Salary Posted" });
    setError("");
  };
  const closeSalaryModal = () => setSalaryModal({ open: false, mazdoor: null });

  const handleSalarySubmit = async (e) => {
    e.preventDefault();
    if (!salaryModal.mazdoor) return;
    const amt = Number(salaryForm.amount);
    if (isNaN(amt) || amt <= 0) { setError("Valid amount enter karein"); return; }
    setError("");
    setSubmitting(true);
    try {
      await apiPost("/transactions", {
        type: "accrual",
        amount: amt,
        category: "salary_accrual",
        note: salaryForm.note || undefined,
        mazdoorId: salaryModal.mazdoor._id,
        date: salaryForm.date,
      });
      closeSalaryModal();
      fetchList();
    } catch (e) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const handleEdit = (row) => {
    setForm({ name: row.name || "", phone: row.phone || "", role: row.role || "", notes: row.notes || "", monthlySalary: row.monthlySalary || "" });
    setEditingId(row._id);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Name zaroori hai"); return; }
    setError("");
    setSubmitting(true);
    try {
      if (editingId) await apiPut(`/mazdoor/${editingId}`, form);
      else await apiPost("/mazdoor", form);
      resetForm();
      fetchList();
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
    { key: "phone", label: "Phone" },
    { key: "role", label: "Kaam" },
    { key: "notes", label: "Notes" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2"><FaUser className="w-7 h-7 text-amber-500" /> Mazdoor</h1>
          <p className="page-subtitle">Workers ko manage karein.</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary"><FaPlus className="w-4 h-4" /> Add mazdoor</button>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title={editingId ? "Edit mazdoor" : "Naya mazdoor add karein"}>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="input-label">Naam *</label><input type="text" placeholder="Mazdoor ka naam" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" required /></div>
          <div><label className="input-label">Phone</label><input type="text" placeholder="0333-1112233" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="input-field" /></div>
          <div><label className="input-label">Kaam / Role</label><input type="text" placeholder="e.g. Peesaai" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} className="input-field" /></div>
          <div><label className="input-label">Notes</label><input type="text" placeholder="Optional" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input-field" /></div>
          <div><label className="input-label">Monthly Salary (Optional)</label><input type="number" placeholder="e.g. 100000" value={form.monthlySalary} onChange={(e) => setForm((f) => ({ ...f, monthlySalary: e.target.value }))} className="input-field" /></div>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (editingId ? "Update" : "Add mazdoor")}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary" disabled={submitting}>Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={salaryModal.open} onClose={closeSalaryModal} title={`Salary Post Karein — ${salaryModal.mazdoor?.name || ""}`}>
        <p className="text-sm text-slate-600 mb-3">Isse mazdoor ke khate mein amount credit hogi. Ye Cash Memo mein nahi jayega (kyunke paisa abhi nahi diya), lekin history mein balance barh jayega.</p>
        <form onSubmit={handleSalarySubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="input-label">Amount (Salary) *</label><input type="number" placeholder="0" value={salaryForm.amount} onChange={(e) => setSalaryForm((f) => ({ ...f, amount: e.target.value }))} className="input-field" required /></div>
            <div><label className="input-label">Tarikh</label><input type="date" value={salaryForm.date} onChange={(e) => setSalaryForm((f) => ({ ...f, date: e.target.value }))} className="input-field" /></div>
          </div>
          <div><label className="input-label">Note</label><input type="text" value={salaryForm.note} onChange={(e) => setSalaryForm((f) => ({ ...f, note: e.target.value }))} className="input-field" /></div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                 <span className="flex items-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Posting...
                 </span>
              ) : "Post Salary"}
            </button>
            <button type="button" onClick={closeSalaryModal} className="btn-secondary" disabled={submitting}>Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={paymentModal.open} onClose={closePaymentModal} title={`Salary / Udhaar do — ${paymentModal.mazdoor?.name || ""}`}>
        <p className="text-sm text-slate-600 mb-3">Salary ya udhaar kis account se de rahe hain — ye Transaction mein save hoga aur Mazdoor History mein dikhega.</p>
        <form onSubmit={handlePaymentSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Kis account se de rahe hain? *</label>
            <select value={paymentForm.accountId} onChange={(e) => setPaymentForm((f) => ({ ...f, accountId: e.target.value }))} className="input-field" required>
              <option value="">— Account select karein —</option>
              {accounts.length === 0 && <option value="" disabled>Pehle Accounts page se account add karein</option>}
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Tarikh</label>
            <input type="date" value={paymentForm.date} onChange={(e) => setPaymentForm((f) => ({ ...f, date: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="input-label">Amount *</label>
            <input type="number" placeholder="0" value={paymentForm.amount} onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))} className="input-field" min="1" step="1" required />
          </div>
          <div>
            <label className="input-label">Type</label>
            <select value={paymentForm.category} onChange={(e) => setPaymentForm((f) => ({ ...f, category: e.target.value }))} className="input-field">
              <option value="salary">Salary</option>
              <option value="udhaar">Udhaar</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="input-label">Note (optional)</label>
            <input type="text" placeholder="Optional" value={paymentForm.note} onChange={(e) => setPaymentForm((f) => ({ ...f, note: e.target.value }))} className="input-field" />
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : "Payment save karein"}
            </button>
            <button type="button" onClick={closePaymentModal} className="btn-secondary" disabled={submitting}>Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={receiveModal.open} onClose={closeReceiveModal} title={`Udhaar wapas lo — ${receiveModal.mazdoor?.name || ""}`}>
        <p className="text-sm text-slate-600 mb-3">Mazdoor se udhaar wapas mila — kis account mein receive kar rahe hain. Ye Transaction + Mazdoor History mein dikhega.</p>
        <form onSubmit={handleReceiveSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="input-label">Kis account mein receive kar rahe hain? *</label>
            <select value={receiveForm.accountId} onChange={(e) => setReceiveForm((f) => ({ ...f, accountId: e.target.value }))} className="input-field" required>
              <option value="">— Account select karein —</option>
              {accounts.length === 0 && <option value="" disabled>Pehle Accounts page se account add karein</option>}
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Tarikh</label>
            <input type="date" value={receiveForm.date} onChange={(e) => setReceiveForm((f) => ({ ...f, date: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="input-label">Amount *</label>
            <input type="number" placeholder="0" value={receiveForm.amount} onChange={(e) => setReceiveForm((f) => ({ ...f, amount: e.target.value }))} className="input-field" min="1" step="1" required />
          </div>
          <div className="sm:col-span-2">
            <label className="input-label">Note (optional)</label>
            <input type="text" placeholder="Optional" value={receiveForm.note} onChange={(e) => setReceiveForm((f) => ({ ...f, note: e.target.value }))} className="input-field" />
          </div>
          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : "Udhaar receive save karein"}
            </button>
            <button type="button" onClick={closeReceiveModal} className="btn-secondary" disabled={submitting}>Cancel</button>
          </div>
        </form>
      </Modal>


      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input pl-9" />
          </div>
          <p className="text-sm text-slate-500">{list.length} mazdoor</p>
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
                      <th key={key} className="table-header px-5 py-3.5">
                        <button type="button" onClick={() => toggleSort(key)} className="flex items-center hover:text-slate-800">{label}<SortIcon columnKey={key} /></button>
                      </th>
                    ))}
                    <th className="table-header px-5 py-3.5 w-48">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      {cols.map(({ key }) => <td key={key} className="table-cell">{key === "name" ? <span className="font-medium">{row[key]}</span> : (row[key] || "—")}</td>)}
                      <td className="table-cell">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button type="button" onClick={() => openSalaryModal(row)} className="btn-ghost-primary flex items-center gap-1 text-emerald-600 border-emerald-100 hover:bg-emerald-50"><FaPlus className="w-3 h-3" /> Post Salary</button>
                          <button type="button" onClick={() => openPaymentModal(row)} className="btn-ghost-primary flex items-center gap-1"><FaMoneyBillWave className="w-3.5 h-3.5" /> Advance / Salary de</button>
                          <button type="button" onClick={() => openReceiveModal(row)} className="btn-ghost-primary flex items-center gap-1"><FaHandHoldingUsd className="w-3.5 h-3.5" /> Udhaar wapas lo</button>
                          <button type="button" onClick={() => navigate(`/mazdoor/${row._id}/history`)} className="btn-ghost-primary flex items-center gap-1"><FaHistory className="w-3.5 h-3.5" /> History / Khata</button>
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
          {!loading && list.length === 0 && <div className="empty-state"><FaUser className="w-12 h-12 text-slate-300 mb-2" /><p>Abhi koi mazdoor nahi. Add mazdoor button se add karein.</p></div>}
        </div>
      </section>
    </div>
  );
}
