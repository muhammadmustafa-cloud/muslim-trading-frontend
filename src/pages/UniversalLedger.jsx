import { useState, useEffect, useMemo } from "react";
import { apiGet } from "../config/api.js";
import {
  FaBook,
  FaArrowDown,
  FaArrowUp,
  FaFilePdf,
  FaFilter,
} from "react-icons/fa";
import SearchableSelect from "../components/SearchableSelect.jsx";
import { downloadUniversalLedgerPdf } from "../utils/universalLedgerPdf.js";

const formatMoney = (n) => (n == null || n === 0 ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const getToday = () => new Date().toISOString().slice(0, 10);

export default function UniversalLedger() {
  const today = getToday();
  const [list, setList] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [summary, setSummary] = useState({ openingBalance: 0, totalIn: 0, totalOut: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ dateFrom: today, dateTo: today, accountId: "" });

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
      setSummary(data.summary || { openingBalance: 0, totalIn: 0, totalOut: 0, net: 0 });
    } catch (e) {
      setError(e.message);
      setList([]);
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
        <button
          type="button"
          onClick={() => downloadUniversalLedgerPdf(list, summary, filters)}
          className="btn-primary flex items-center gap-1.5 shadow-indigo-200"
          disabled={list.length === 0}
        >
          <FaFilePdf className="w-4 h-4" /> Export Report
        </button>
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
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Kul Wasooli (Total Debit)</p>
          <p className="text-xl font-black text-emerald-700">
            {formatMoney(Number(summary.totalIn || 0) + (summary.openingBalance > 0 ? Number(summary.openingBalance) : 0))}
          </p>
          <p className="text-[9px] text-emerald-500 font-bold">Today: +{formatMoney(summary.totalIn)}</p>
        </div>
        <div className="card p-4 border-l-4 border-l-rose-500 bg-rose-50/20">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Kul Kharch (Total Credit)</p>
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
                  <th colSpan="3" className="py-3 px-4 text-center border-r border-slate-700">CREDIT (Kharch / Payments Made)</th>
                  <th colSpan="3" className="py-3 px-4 text-center">DEBIT (Aamad / Receipts)</th>
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
                {/* Opening Balance Row */}
                <tr className="bg-slate-50/80 font-bold border-b border-slate-200">
                  <td className="py-2 px-3 text-[11px] text-slate-400">—</td>
                  <td className="py-2 px-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 leading-tight">PREVIOUS BALANCE</span>
                      <span className="text-[10px] text-slate-400 uppercase">Opening Balance</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-black text-rose-700 border-r border-slate-200 bg-rose-50/20">
                    {summary.openingBalance < 0 ? formatMoney(Math.abs(summary.openingBalance)) : ""}
                  </td>
                  <td className="py-2 px-3 text-[11px] text-slate-400">—</td>
                  <td className="py-2 px-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-700 leading-tight">PREVIOUS BALANCE</span>
                      <span className="text-[10px] text-slate-400 uppercase">Opening Balance</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-right font-black text-emerald-700 bg-emerald-50/20">
                    {summary.openingBalance > 0 ? formatMoney(summary.openingBalance) : ""}
                  </td>
                </tr>

                {[...Array(maxRows)].map((_, i) => {
                  const cr = credits[i];
                  const dr = debits[i];
                  return (
                    <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                      {/* Debit Side */}
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
                      <td className="py-2 px-3 text-right font-black text-rose-600 border-r border-slate-200 bg-rose-50/10">
                        {dr ? formatMoney(dr.amount) : ""}
                      </td>

                      {/* Credit Side */}
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
                      <td className="py-2 px-3 text-right font-black text-emerald-600 bg-emerald-50/10">
                        {cr ? formatMoney(cr.amount) : ""}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 font-black border-t-2 border-slate-300">
                <tr>
                   <td colSpan="2" className="py-4 px-4 text-right text-slate-500 uppercase text-[10px] border-r border-slate-200">GRAND TOTAL CREDITS (Kharch):</td>
                   <td className="py-4 px-4 text-right text-rose-700 border-r border-slate-200 text-lg">
                      {formatMoney(Number(summary.totalOut || 0) + (summary.openingBalance < 0 ? Math.abs(Number(summary.openingBalance)) : 0))}
                   </td>
                   <td colSpan="2" className="py-4 px-4 text-right text-slate-500 uppercase text-[10px]">GRAND TOTAL DEBITS (Aamad):</td>
                   <td className="py-4 px-4 text-right text-emerald-700 text-lg">
                      {formatMoney(Number(summary.totalIn || 0) + (summary.openingBalance > 0 ? Number(summary.openingBalance) : 0))}
                   </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
