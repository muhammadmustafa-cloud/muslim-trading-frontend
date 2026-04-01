import { useState, useEffect, useMemo } from "react";
import { apiGet, apiPost, apiDelete } from "../config/api.js";
import {
  FaBook,
  FaArrowDown,
  FaArrowUp,
  FaFilePdf,
  FaFilter,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import SearchableSelect from "../components/SearchableSelect.jsx";
import { downloadUniversalLedgerPdf } from "../utils/universalLedgerPdf.js";

const formatMoney = (n) => (n == null || n === 0 ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Karachi",
      })
    : "—";
const getToday = () => {
  const d = new Date();
  return d.toLocaleString("en-CA", { timeZone: "Asia/Karachi" }).slice(0, 10);
};

export default function UniversalLedger() {
  const today = getToday();
  const [list, setList] = useState([]);
  const [dastiList, setDastiList] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({ openingBalance: 0, totalIn: 0, totalOut: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ dateFrom: today, dateTo: today, accountId: "" });

  const [showDastiModal, setShowDastiModal] = useState(false);
  const [newDasti, setNewDasti] = useState({ name: "", type: "credit", amount: "", note: "" });

  const fetchAccounts = async () => {
    try {
      const data = await apiGet("/accounts");
      setAccounts(data.data || []);
    } catch (_) {}
  };

  const fetchLedger = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { dateFrom: filters.dateFrom, dateTo: filters.dateTo };
      if (filters.accountId) params.accountId = filters.accountId;
      
      const data = await apiGet("/daily-memo", params);
      setList(data.data || []);
      setDastiList(data.dastiEntries || []);
      setSummary(data.summary || { openingBalance: 0, totalIn: 0, totalOut: 0, net: 0 });
    } catch (e) {
      setError(e.message);
      setList([]);
      setDastiList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  useEffect(() => {
    fetchLedger();
  }, [filters.dateFrom, filters.dateTo, filters.accountId]);

  const dastiSummary = useMemo(() => {
    const totalIn = dastiList.filter(d => d.type === 'credit').reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const totalOut = dastiList.filter(d => d.type === 'debit').reduce((s, d) => s + (Number(d.amount) || 0), 0);
    return { totalIn, totalOut, net: totalIn - totalOut };
  }, [dastiList]);

  const handleAddDasti = async (e) => {
    e.preventDefault();
    try {
      await apiPost("/daily-dasti", { ...newDasti, date: filters.dateFrom });
      setShowDastiModal(false);
      setNewDasti({ name: "", type: "credit", amount: "", note: "" });
      fetchLedger();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleDeleteDasti = async (id) => {
    if (!window.confirm("Are you sure you want to delete this Dasti entry?")) return;
    try {
      await apiDelete(`/daily-dasti/${id}`);
      fetchLedger();
    } catch (e) {
      alert(e.message);
    }
  };

  // Separate credits and debits for T-Account layout
  const credits = useMemo(() => list.filter(r => r.amountType === "in"), [list]);
  const debits = useMemo(() => list.filter(r => r.amountType === "out"), [list]);
  const maxRows = Math.max(credits.length, debits.length);

  const getFullDesc = (row) => {
    const acc = row.accountName || "Manual";
    const part = row.name || "General";
    if (row.type === "transfer") return row.description; // Transfers already have good descriptions
    return `${acc} ➔ ${part}`;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center">
            <FaBook className="w-6 h-6 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Daily Cash Memo</h1>
            <p className="text-slate-500 text-sm">Mukammal Hisaab Kitab — Full Account & Participant Traceability</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowDastiModal(true)}
            className="btn-secondary flex items-center gap-1.5"
          >
            <FaPlus className="w-3 h-3" /> Add Dasti
          </button>
          <button
            type="button"
            onClick={() => downloadUniversalLedgerPdf(list, summary, filters, dastiList, dastiSummary)}
            className="btn-primary flex items-center gap-1.5 shadow-indigo-200"
            disabled={list.length === 0 && dastiList.length === 0}
          >
            <FaFilePdf className="w-4 h-4" /> Export Report
          </button>
        </div>
      </header>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

      {/* Filters */}
      <section className="card p-4 border-l-4 border-l-indigo-500">
        <div className="flex flex-wrap items-end gap-4">
          <div className="w-full sm:w-64">
            <label className="input-label text-xs">Filter by Account</label>
            <SearchableSelect
              options={accounts}
              value={filters.accountId}
              onChange={(val) => setFilters(f => ({ ...f, accountId: val }))}
              placeholder="All Accounts"
            />
          </div>
          <div>
            <label className="input-label text-xs">From</label>
            <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} className="input-field w-40" />
          </div>
          <div>
            <label className="input-label text-xs">To</label>
            <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} className="input-field w-40" />
          </div>
          <button type="button" onClick={() => setFilters({ dateFrom: today, dateTo: today, accountId: "" })} className="btn-secondary text-sm">Reset</button>
        </div>
      </section>

      {/* Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-slate-400 bg-slate-50/50">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pichli Wasooli (Prev)</p>
          <p className="text-xl font-black text-slate-700">{formatMoney(summary.openingBalance)}</p>
          <p className="text-[9px] text-slate-400 italic">Yesterday's closing cash</p>
        </div>
        <div className="card p-4 border-l-4 border-l-emerald-500 bg-emerald-50/20">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Kul Wasooli (Total Credit)</p>
          <p className="text-xl font-black text-emerald-700">
            {formatMoney(Number(summary.totalIn || 0) + (summary.openingBalance > 0 ? Number(summary.openingBalance) : 0))}
          </p>
          <p className="text-[9px] text-emerald-500 font-bold">Today: +{formatMoney(summary.totalIn)}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-rose-500 bg-rose-50/20">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Kul Kharch (Total Debit)</p>
          <p className="text-xl font-black text-rose-700">
            {formatMoney(Number(summary.totalOut || 0) + (summary.openingBalance < 0 ? Math.abs(Number(summary.openingBalance)) : 0))}
          </p>
          <p className="text-[9px] text-rose-500 font-bold">Today: -{formatMoney(summary.totalOut)}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-amber-500 bg-amber-50/30">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Net Baqaya (Closing)</p>
          <p className="text-xl font-black text-amber-700">{formatMoney(summary.closingBalance || (Number(summary.openingBalance || 0) + Number(summary.totalIn || 0) - Number(summary.totalOut || 0)))}</p>
          <p className="text-[9px] text-amber-600 font-bold">Current cash in box</p>
        </div>
      </div>

      {/* T-Account Table */}
      <section className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center"><div className="loading-spinner mb-3" /></div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FaBook className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>Is range mein koi transactions nahi hain.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-800 text-white font-bold text-xs uppercase tracking-wider">
                  <th colSpan="3" className="py-3 px-4 text-center border-r border-slate-700">CREDIT (Aamad / Receipts)</th>
                  <th colSpan="3" className="py-3 px-4 text-center">DEBIT (Kharch / Payments Made)</th>
                </tr>
                <tr className="bg-slate-100 border-b border-slate-200 text-[10px] text-slate-500 uppercase font-bold">
                  <th className="py-2 px-3 text-left w-20">Date</th>
                  <th className="py-2 px-3 text-left">Account ➔ Participant</th>
                  <th className="py-2 px-3 text-right border-r border-slate-200 w-28">Amount</th>
                  <th className="py-2 px-3 text-left w-20">Date</th>
                  <th className="py-2 px-3 text-left">Account ➔ Participant</th>
                  <th className="py-2 px-3 text-right w-28">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Opening Balance Row: Now Dynamic Based on Value Nature */}
                <tr className="bg-slate-50 border-b-2 border-slate-200 shadow-sm">
                  {/* LEFT: CREDIT (Aamad) SIDE */}
                  <td className="py-2 px-3 text-[11px] text-slate-400">—</td>
                  <td className="py-2 px-3 border-r border-slate-100">
                    {summary.openingBalance > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-emerald-800 leading-tight uppercase tracking-tight">PREVIOUS BALANCE (BAQAYA)</span>
                        <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest italic opacity-70">Cash Surplus from yesterday</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">Balance moved to Kharch side</span>
                    )}
                  </td>
                  <td className={`py-2 px-3 text-right font-black border-r border-slate-200 ${summary.openingBalance > 0 ? "text-emerald-700 bg-emerald-100/30" : "text-slate-300"}`}>
                    {summary.openingBalance > 0 ? formatMoney(summary.openingBalance) : "—"}
                  </td>

                  {/* RIGHT: DEBIT (Kharch) SIDE */}
                  <td className="py-2 px-3 text-[11px] text-slate-400">—</td>
                  <td className="py-2 px-3">
                    {summary.openingBalance < 0 ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-rose-800 leading-tight uppercase tracking-tight">PREVIOUS DEFICIT (UDHAAR)</span>
                        <span className="text-[9px] text-rose-600 font-black uppercase tracking-widest italic opacity-70">Deficit from yesterday</span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">No opening deficit</span>
                    )}
                  </td>
                  <td className={`py-2 px-3 text-right font-black ${summary.openingBalance < 0 ? "text-rose-700 bg-rose-100/30" : "text-slate-300"}`}>
                    {summary.openingBalance < 0 ? formatMoney(Math.abs(summary.openingBalance)) : "—"}
                  </td>
                </tr>

                {[...Array(maxRows)].map((_, i) => {
                  const cr = credits[i];
                  const dr = debits[i];
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      {/* Credit Side (Aamad) */}
                      <td className="py-2 px-3 text-[11px] text-slate-400">{cr ? formatDate(cr.date) : ""}</td>
                      <td className="py-2 px-3">
                        {cr && (
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 leading-tight">
                                {cr.accountName} <span className="text-emerald-500">➔</span> {cr.name}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{cr.description}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-emerald-600 border-r border-slate-200 bg-emerald-50/10">
                        {cr ? formatMoney(cr.amount) : ""}
                      </td>

                      {/* Debit Side (Kharch) */}
                      <td className="py-2 px-3 text-[11px] text-slate-400">{dr ? formatDate(dr.date) : ""}</td>
                      <td className="py-2 px-3">
                        {dr && (
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 leading-tight">
                                {dr.accountName} <span className="text-rose-500">➔</span> {dr.name}
                            </span>
                            <span className="text-[10px] text-slate-400 truncate max-w-[200px]">{dr.description}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-black text-rose-600 bg-rose-50/10">
                        {dr ? formatMoney(dr.amount) : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-black border-t-2 border-slate-300">
                <tr>
                   <td colSpan="2" className="py-4 px-4 text-right text-slate-500 uppercase text-[10px] border-r border-slate-200">GRAND TOTAL CREDITS (Aamad):</td>
                   <td className="py-4 px-4 text-right text-emerald-700 border-r border-slate-200 text-lg">
                      {formatMoney(Number(summary.totalIn || 0) + (summary.openingBalance > 0 ? Number(summary.openingBalance) : 0))}
                   </td>
                   <td colSpan="2" className="py-4 px-4 text-right text-slate-500 uppercase text-[10px]">GRAND TOTAL DEBITS (Kharch):</td>
                   <td className="py-4 px-4 text-right text-rose-700 text-lg">
                      {formatMoney(Number(summary.totalOut || 0) + (summary.openingBalance < 0 ? Math.abs(Number(summary.openingBalance)) : 0))}
                   </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Dasti Entries Section */}
      {(dastiList.length > 0 || showDastiModal) && (
        <section className="card overflow-hidden border-t-4 border-t-amber-600 mt-8">
          <div className="bg-amber-600 text-white px-4 py-3 flex justify-between items-center">
            <h2 className="font-bold uppercase tracking-widest text-sm">Dasti Hisaab (Manual Entries)</h2>
            <div className="text-xs font-medium space-x-6">
              <span>Credit Total: {formatMoney(dastiSummary.totalIn || 0)}</span>
              <span>Debit Total: {formatMoney(dastiSummary.totalOut || 0)}</span>
              <span className="bg-white/20 px-2 py-0.5 rounded">Baqaya: {formatMoney(dastiSummary.net || 0)}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-widest font-black">
                <tr>
                  <th className="py-3 px-4 text-left">Date</th>
                  <th className="py-3 px-4 text-left">Person Name</th>
                  <th className="py-3 px-4 text-left">Note</th>
                  <th className="py-3 px-4 text-right">Credit (In)</th>
                  <th className="py-3 px-4 text-right">Debit (Out)</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dastiList.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-400 italic font-medium uppercase tracking-widest text-[11px]">No Dasti entries found for this range.</td>
                  </tr>
                ) : (
                  dastiList.map((d) => (
                    <tr key={d._id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="py-2 px-4 text-slate-400 text-xs">{formatDate(d.date)}</td>
                      <td className="py-2 px-4 font-bold text-slate-700">{d.name}</td>
                      <td className="py-2 px-4 text-slate-500 text-xs opacity-80">{d.note || "—"}</td>
                      <td className="py-2 px-4 text-right font-black text-emerald-600 bg-emerald-50/10">
                        {d.type === "credit" ? formatMoney(d.amount) : "—"}
                      </td>
                      <td className="py-2 px-4 text-right font-black text-rose-600 bg-rose-50/10">
                        {d.type === "debit" ? formatMoney(d.amount) : "—"}
                      </td>
                      <td className="py-2 px-4 text-center">
                        <button onClick={() => handleDeleteDasti(d._id)} className="text-slate-300 hover:text-rose-600 transition-colors">
                          <FaTrash className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Add Dasti Modal */}
      {showDastiModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in zoom-in duration-200">
            <div className="bg-amber-600 px-6 py-4 flex justify-between items-center text-white shadow-lg">
              <h3 className="text-lg font-black uppercase tracking-tighter">Add Dasti Entry</h3>
              <button onClick={() => setShowDastiModal(false)} className="text-white/80 hover:text-white text-2xl font-bold">&times;</button>
            </div>
            <form onSubmit={handleAddDasti} className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Person Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Aslam Hand-to-Hand"
                  className="input-field w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700"
                  value={newDasti.name}
                  onChange={(e) => setNewDasti(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Type</label>
                  <select
                    className="input-field w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 transition-all font-bold text-slate-700 appearance-none"
                    value={newDasti.type}
                    onChange={(e) => setNewDasti(prev => ({ ...prev, type: e.target.value }))}
                  >
                    <option value="credit">Credit (Aamad)</option>
                    <option value="debit">Debit (Kharch)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Amount (Rs.)</label>
                  <input
                    required
                    type="number"
                    placeholder="0"
                    className="input-field w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-amber-500 transition-all font-black text-slate-800"
                    value={newDasti.amount}
                    onChange={(e) => setNewDasti(prev => ({ ...prev, amount: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Note (Informal Details)</label>
                <textarea
                  className="input-field w-full border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 transition-all h-24 resize-none text-sm text-slate-600 font-medium italic"
                  placeholder="Write a small note about this hand-to-hand transaction..."
                  value={newDasti.note}
                  onChange={(e) => setNewDasti(prev => ({ ...prev, note: e.target.value }))}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDastiModal(false)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-500 font-black rounded-xl uppercase text-xs transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-xl uppercase text-xs shadow-lg shadow-amber-500/20 transition-all">Save Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
