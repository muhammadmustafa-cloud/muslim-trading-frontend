import { useState, useEffect } from "react";
import { API_BASE_URL, apiGet, apiPost, apiPut } from "../config/api.js";
import {
  FaFileInvoiceDollar,
  FaCalendarDay,
  FaPlus,
  FaArrowDown,
  FaArrowUp,
  FaWallet,
} from "react-icons/fa";
import Modal from "../components/Modal.jsx";

const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatTime = (d) => (d ? new Date(d).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }) : "—");
const getToday = () => new Date().toISOString().slice(0, 10);

const TYPE_LABELS = {
  sale: "Sale",
  stock_entry: "Purchase",
  deposit: "Deposit",
  withdraw: "Withdraw",
  transfer: "Transfer",
};

export default function DailyKhata() {
  const today = getToday();
  const [dailyKhataAccount, setDailyKhataAccount] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, net: 0 });
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ dateFrom: today, dateTo: today });
  const [addModal, setAddModal] = useState(null);
  const [form, setForm] = useState({});
  const [submitError, setSubmitError] = useState("");

  const fetchDailyKhataAccount = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/accounts/daily-khata`);
      const data = await res.json();
      if (data.success) setDailyKhataAccount(data.data);
    } catch (_) {}
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/accounts`);
      const data = await res.json();
      if (data.data) setAccounts(data.data);
    } catch (_) {}
  };

  const setAsDailyKhata = async (accountId) => {
    setError("");
    try {
      await apiPut("/accounts/daily-khata", { accountId });
      await fetchDailyKhataAccount();
    } catch (e) {
      setError(e.message);
    }
  };

  const fetchList = async () => {
    if (!dailyKhataAccount?._id) return setList([]);
    setLoading(true);
    setError("");
    try {
      const params = { dateFrom: filters.dateFrom, dateTo: filters.dateTo, accountId: dailyKhataAccount._id };
      const data = await apiGet("/daily-memo", params);
      setList(data.data || []);
      setSummary(data.summary || { totalIn: 0, totalOut: 0, net: 0 });
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [cust, sup, it] = await Promise.all([
        fetch(`${API_BASE_URL}/customers`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/suppliers`).then((r) => r.json()),
        fetch(`${API_BASE_URL}/items`).then((r) => r.json()),
      ]);
      if (cust.data) setCustomers(cust.data);
      if (sup.data) setSuppliers(sup.data);
      if (it.data) setItems(it.data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchDailyKhataAccount();
    fetchAccounts();
  }, []);
  useEffect(() => {
    fetchList();
  }, [dailyKhataAccount?._id, filters.dateFrom, filters.dateTo]);
  useEffect(() => {
    fetchOptions();
  }, []);

  const creditRows = list.filter((r) => r.amountType === "in");
  const debitRows = list.filter((r) => r.amountType === "out");

  const openAdd = (type) => {
    setSubmitError("");
    setAddModal(type);
    const d = filters.dateFrom || today;
    if (type === "sale") setForm({ date: d, customerId: "", itemId: "", quantity: "", rate: "", totalAmount: "", amountReceived: "", notes: "" });
    else if (type === "deposit") setForm({ date: d, amount: "", note: "" });
    else if (type === "purchase") setForm({ date: d, itemId: "", supplierId: "", kattay: "", kgPerKata: "", ratePerKata: "", amount: "", amountPaid: "", notes: "" });
    else if (type === "salary" || type === "expense" || type === "withdraw") setForm({ date: d, amount: "", category: type === "salary" ? "Salary" : type === "expense" ? "Expense" : "", note: "" });
  };

  const handleSubmitAdd = async (e) => {
    e.preventDefault();
    setSubmitError("");
    const accId = dailyKhataAccount?._id;
    if (!accId) return setSubmitError("Pehle Daily Khata account set karein.");
    try {
      if (addModal === "sale") {
        const qty = Number(form.quantity) || 0;
        const rate = Number(form.rate) || 0;
        const total = qty && rate ? Math.round(qty * rate) : Number(form.totalAmount) || 0;
        await apiPost("/sales", {
          date: form.date,
          customerId: form.customerId,
          itemId: form.itemId,
          quantity: qty,
          rate,
          totalAmount: total,
          amountReceived: Number(form.amountReceived) || total,
          accountId: accId,
          notes: form.notes || "",
        });
      } else if (addModal === "deposit") {
        await apiPost("/transactions", {
          date: form.date,
          type: "deposit",
          toAccountId: accId,
          amount: Number(form.amount) || 0,
          note: form.note || "",
        });
      } else if (addModal === "purchase") {
        const k = Number(form.kattay) || 0;
        const kg = Number(form.kgPerKata) || 0;
        const amt = Number(form.amount) || (k && Number(form.ratePerKata) ? Math.round(k * Number(form.ratePerKata)) : 0);
        await apiPost("/stock-entries", {
          date: form.date,
          itemId: form.itemId,
          supplierId: form.supplierId,
          kattay: k,
          kgPerKata: kg,
          receivedWeight: k && kg ? k * kg : 0,
          amount: amt,
          amountPaid: Number(form.amountPaid) || amt,
          accountId: accId,
          notes: form.notes || "",
        });
      } else if (addModal === "salary" || addModal === "expense" || addModal === "withdraw") {
        await apiPost("/transactions", {
          date: form.date,
          type: "withdraw",
          fromAccountId: accId,
          amount: Number(form.amount) || 0,
          category: form.category || (addModal === "salary" ? "Salary" : addModal === "expense" ? "Expense" : ""),
          note: form.note || "",
        });
      }
      setAddModal(null);
      fetchList();
      fetchDailyKhataAccount();
    } catch (err) {
      setSubmitError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <FaFileInvoiceDollar className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Daily Khata</h1>
            <p className="text-slate-500 text-sm">Credit (add) aur Debit (cut) — sab isi account se. Payment aaya/ gaya, salary, expense sab yahan.</p>
          </div>
        </div>
      </header>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

      {/* Daily Khata Account */}
      <section className="card p-4">
        <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
          <FaWallet className="text-amber-500" />
          Daily Khata Account
        </h3>
        {!dailyKhataAccount ? (
          <div className="flex flex-wrap items-center gap-3">
            <select
              className="input-field w-56"
              value={form.selectedAccountId || ""}
              onChange={(e) => setForm((f) => ({ ...f, selectedAccountId: e.target.value }))}
            >
              <option value="">Select account</option>
              {accounts.map((a) => (
                <option key={a._id} value={a._id}>{a.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => form.selectedAccountId && setAsDailyKhata(form.selectedAccountId)}
              className="btn-primary"
              disabled={!form.selectedAccountId}
            >
              Is account ko Daily Khata banaen
            </button>
            <p className="text-sm text-slate-500">Yahi account se sab add/debit hoga. Pehle Accounts se account banaen.</p>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-slate-800">{dailyKhataAccount.name}</p>
              <p className="text-lg font-bold text-emerald-600">Balance: {formatMoney(dailyKhataAccount.currentBalance)}</p>
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value, dateTo: e.target.value }))} className="input-field w-40" />
              <button type="button" onClick={() => setFilters((f) => ({ ...f, dateFrom: today, dateTo: today }))} className="btn-secondary text-sm">Aaj</button>
            </div>
          </div>
        )}
      </section>

      {dailyKhataAccount && (
        <>
          {/* Quick Add */}
          <section className="card p-4">
            <h3 className="font-semibold text-slate-800 mb-3">Quick add</h3>
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-500 mr-2">Credit (paise aaye):</span>
              <button type="button" onClick={() => openAdd("sale")} className="btn-primary text-sm">Sale</button>
              <button type="button" onClick={() => openAdd("deposit")} className="btn-primary text-sm">Deposit</button>
              <span className="text-xs text-slate-500 mx-2">Debit (paise nikle):</span>
              <button type="button" onClick={() => openAdd("purchase")} className="btn-secondary text-sm">Purchase</button>
              <button type="button" onClick={() => openAdd("salary")} className="btn-secondary text-sm">Salary</button>
              <button type="button" onClick={() => openAdd("expense")} className="btn-secondary text-sm">Expense</button>
              <button type="button" onClick={() => openAdd("withdraw")} className="btn-secondary text-sm">Withdraw</button>
            </div>
          </section>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 border-l-4 border-l-emerald-500">
              <p className="text-sm text-slate-500">Total In (Credit)</p>
              <p className="text-xl font-bold text-emerald-700">{formatMoney(summary.totalIn)}</p>
            </div>
            <div className="card p-4 border-l-4 border-l-rose-500">
              <p className="text-sm text-slate-500">Total Out (Debit)</p>
              <p className="text-xl font-bold text-rose-700">{formatMoney(summary.totalOut)}</p>
            </div>
            <div className="card p-4 border-l-4 border-l-amber-500">
              <p className="text-sm text-slate-500">Net (In − Out)</p>
              <p className={`text-xl font-bold ${summary.net >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{formatMoney(summary.net)}</p>
            </div>
          </div>

          {/* Credit (Add) */}
          <section className="card overflow-hidden">
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center gap-2">
              <FaArrowDown className="text-emerald-600" />
              <h3 className="font-semibold text-emerald-800">Credit — paise aaye (Sale, Deposit, Transfer in)</h3>
            </div>
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : creditRows.length === 0 ? (
              <div className="p-6 text-center text-slate-500">Is date mein koi credit nahi.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="text-left py-2 px-4">Date</th><th className="text-left py-2 px-4">Type</th><th className="text-left py-2 px-4">Description</th><th className="text-right py-2 px-4">Amount</th></tr></thead>
                  <tbody>
                    {creditRows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100"><td className="py-2 px-4">{formatDate(row.date)} {formatTime(row.date)}</td><td className="py-2 px-4"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs">{TYPE_LABELS[row.type] || row.type}</span></td><td className="py-2 px-4">{row.description || "—"}</td><td className="py-2 px-4 text-right font-medium text-emerald-700">{formatMoney(row.amount)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Debit (Cut) */}
          <section className="card overflow-hidden">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center gap-2">
              <FaArrowUp className="text-rose-600" />
              <h3 className="font-semibold text-rose-800">Debit — paise nikle (Purchase, Salary, Expense, Withdraw)</h3>
            </div>
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : debitRows.length === 0 ? (
              <div className="p-6 text-center text-slate-500">Is date mein koi debit nahi.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="text-left py-2 px-4">Date</th><th className="text-left py-2 px-4">Type</th><th className="text-left py-2 px-4">Description</th><th className="text-right py-2 px-4">Amount</th></tr></thead>
                  <tbody>
                    {debitRows.map((row, i) => (
                      <tr key={i} className="border-b border-slate-100"><td className="py-2 px-4">{formatDate(row.date)} {formatTime(row.date)}</td><td className="py-2 px-4"><span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs">{TYPE_LABELS[row.type] || row.type}</span></td><td className="py-2 px-4">{row.description || "—"}</td><td className="py-2 px-4 text-right font-medium text-rose-700">{formatMoney(row.amount)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {/* Add Modal */}
      <Modal open={!!addModal} onClose={() => setAddModal(null)} title={addModal === "sale" ? "Add Sale" : addModal === "deposit" ? "Add Deposit" : addModal === "purchase" ? "Add Purchase" : addModal === "salary" ? "Pay Salary" : addModal === "expense" ? "Add Expense" : "Withdraw"}>
        <form onSubmit={handleSubmitAdd} className="space-y-4">
          {addModal === "sale" && (
            <>
              <div><label className="input-label">Date</label><input type="date" value={form.date || ""} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input-field" required /></div>
              <div><label className="input-label">Customer *</label><select value={form.customerId || ""} onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))} className="input-field" required><option value="">Select</option>{customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</select></div>
              <div><label className="input-label">Item *</label><select value={form.itemId || ""} onChange={(e) => setForm((f) => ({ ...f, itemId: e.target.value }))} className="input-field" required><option value="">Select</option>{items.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="input-label">Qty (kg) *</label><input type="number" value={form.quantity || ""} onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))} className="input-field" required min="0" step="any" /></div><div><label className="input-label">Rate (Rs/kg)</label><input type="number" value={form.rate || ""} onChange={(e) => setForm((f) => ({ ...f, rate: e.target.value }))} className="input-field" min="0" step="any" /></div></div>
              <div><label className="input-label">Amount received</label><input type="number" value={form.amountReceived || ""} className="input-field" min="0" onChange={(e) => setForm((f) => ({ ...f, amountReceived: e.target.value }))} /></div>
              <div><label className="input-label">Notes</label><input type="text" value={form.notes || ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input-field" /></div>
            </>
          )}
          {(addModal === "deposit" || addModal === "salary" || addModal === "expense" || addModal === "withdraw") && (
            <>
              <div><label className="input-label">Date</label><input type="date" value={form.date || ""} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input-field" required /></div>
              <div><label className="input-label">Amount *</label><input type="number" value={form.amount || ""} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input-field" required min="0" step="1" /></div>
              {(addModal === "salary" || addModal === "expense" || addModal === "withdraw") && <div><label className="input-label">Category</label><input type="text" value={form.category || ""} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field" placeholder={addModal === "salary" ? "Salary" : addModal === "expense" ? "Expense" : "Optional"} /></div>}
              <div><label className="input-label">Note</label><input type="text" value={form.note || ""} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="input-field" /></div>
            </>
          )}
          {addModal === "purchase" && (
            <>
              <div><label className="input-label">Date</label><input type="date" value={form.date || ""} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input-field" required /></div>
              <div><label className="input-label">Item *</label><select value={form.itemId || ""} onChange={(e) => setForm((f) => ({ ...f, itemId: e.target.value }))} className="input-field" required><option value="">Select</option>{items.map((i) => <option key={i._id} value={i._id}>{i.name}</option>)}</select></div>
              <div><label className="input-label">Supplier *</label><select value={form.supplierId || ""} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))} className="input-field" required><option value="">Select</option>{suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="input-label">Kattay</label><input type="number" value={form.kattay || ""} onChange={(e) => setForm((f) => ({ ...f, kattay: e.target.value }))} className="input-field" min="0" /></div><div><label className="input-label">Kg/katta</label><input type="number" value={form.kgPerKata || ""} onChange={(e) => setForm((f) => ({ ...f, kgPerKata: e.target.value }))} className="input-field" min="0" step="any" /></div></div>
              <div className="grid grid-cols-2 gap-2"><div><label className="input-label">Rate/katta (Rs)</label><input type="number" value={form.ratePerKata || ""} onChange={(e) => setForm((f) => ({ ...f, ratePerKata: e.target.value }))} className="input-field" min="0" /></div><div><label className="input-label">Amount / Amount paid</label><input type="number" value={form.amount || form.amountPaid || ""} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value, amountPaid: e.target.value }))} className="input-field" min="0" /></div></div>
              <div><label className="input-label">Notes</label><input type="text" value={form.notes || ""} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input-field" /></div>
            </>
          )}
          {submitError && <p className="text-sm text-red-600">{submitError}</p>}
          <div className="flex gap-2"><button type="submit" className="btn-primary">Add</button><button type="button" onClick={() => setAddModal(null)} className="btn-secondary">Cancel</button></div>
        </form>
      </Modal>
    </div>
  );
}
