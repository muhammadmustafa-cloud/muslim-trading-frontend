import { useState, useEffect, useMemo, Fragment } from "react";
import { apiGet } from "../config/api.js";
import {
  FaFileInvoiceDollar,
  FaArrowDown,
  FaArrowUp,
  FaFilePdf,
} from "react-icons/fa";
import { downloadDailyKhataPdf } from "../utils/dailyKhataPdf.js";

const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const getToday = () => new Date().toISOString().slice(0, 10);

const TYPE_LABELS = {
  sale: "Sale",
  purchase: "Purchase",
  deposit: "Deposit",
  withdraw: "Withdraw",
  transfer: "Transfer",
  mill_expense: "Mill Expense",
  mazdoor_expense: "Mazdoor",
  salary: "Salary Paid",
  tax_payment: "Tax Paid",
};
const TYPE_COLORS = {
  sale: "bg-emerald-100 text-emerald-800",
  purchase: "bg-orange-100 text-orange-800",
  deposit: "bg-green-100 text-green-700",
  withdraw: "bg-red-100 text-red-700",
  transfer: "bg-blue-100 text-blue-700",
  mill_expense: "bg-purple-100 text-purple-800",
  mazdoor_expense: "bg-amber-100 text-amber-800",
  salary: "bg-rose-100 text-rose-700 font-bold border border-rose-200",
  tax_payment: "bg-orange-100 text-orange-700 font-bold border border-orange-200",
};

export default function DailyKhata() {
  const today = getToday();
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({ totalIn: 0, totalOut: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ dateFrom: today, dateTo: today });

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/daily-memo", { dateFrom: filters.dateFrom, dateTo: filters.dateTo });
      setList(data.data || []);
      setSummary(data.summary || { totalIn: 0, totalOut: 0, net: 0 });
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

  // Group rows by date for daily sub-headers
  const groupedData = useMemo(() => {
    const groups = {};
    list.forEach((row) => {
      const key = new Date(row.date).toISOString().slice(0, 10);
      if (!groups[key]) groups[key] = { date: key, rows: [], dayIn: 0, dayOut: 0 };
      groups[key].rows.push(row);
      if (row.amountType === "in") groups[key].dayIn += Number(row.amount) || 0;
      else groups[key].dayOut += Number(row.amount) || 0;
    });
    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  }, [list]);

  const isRange = filters.dateFrom !== filters.dateTo;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <FaFileInvoiceDollar className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Daily Khata</h1>
            <p className="text-slate-500 text-sm">Roz ka hisaab — sab credit/debit ek jagah dikhta hai.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => downloadDailyKhataPdf(list, summary, filters)}
          className="btn-primary flex items-center gap-1.5"
          disabled={list.length === 0}
        >
          <FaFilePdf className="w-4 h-4" /> Export PDF
        </button>
      </header>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">{error}</div>}

      {/* Filters */}
      <section className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="input-label text-xs">Start Date</label>
            <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} className="input-field w-44" />
          </div>
          <div>
            <label className="input-label text-xs">End Date</label>
            <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} className="input-field w-44" />
          </div>
          <button type="button" onClick={() => setFilters({ dateFrom: today, dateTo: today })} className="btn-secondary text-sm mt-5">Aaj</button>
          <p className="text-sm text-slate-500 mt-5">{list.length} record(s)</p>
        </div>
      </section>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 border-l-4 border-l-slate-400 bg-slate-50 transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pichli Wasooli (Opening)</p>
          <p className="text-xl font-black text-slate-700">{formatMoney(summary.openingBalance)}</p>
          <p className="text-[10px] text-slate-400 italic font-medium">Yesterday's closing balance</p>
        </div>
        <div className="card p-4 border-l-4 border-l-emerald-500 bg-emerald-50/10 transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Kul Wasooli (Total Credit)</p>
          <p className="text-xl font-black text-emerald-700">
            {formatMoney(Number(summary.openingBalance || 0) + Number(summary.totalIn || 0))}
          </p>
          <p className="text-[10px] text-emerald-500 font-bold bg-white/50 px-1 py-0.5 rounded border border-emerald-100 mt-1 inline-block">
            {formatMoney(Number(summary.openingBalance || 0))} (Pichli) + {formatMoney(Number(summary.totalIn || 0))} (Today)
          </p>
        </div>
        <div className="card p-4 border-l-4 border-l-rose-500 bg-rose-50/10 transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Kul Kharch (Total Debit)</p>
          <p className="text-xl font-black text-rose-700">
            {formatMoney(Number(summary.totalOut || 0))}
          </p>
          <p className="text-[10px] text-rose-500 font-bold bg-white/50 px-1 py-0.5 rounded border border-rose-100 mt-1 inline-block italic">
            Total of all payments today
          </p>
        </div>
        <div className="card p-4 border-l-4 border-l-amber-500 bg-amber-50/30 transition-all hover:shadow-md">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Current Baqaya (Closing)</p>
          <p className="text-xl font-black text-amber-700">{formatMoney(Number(summary.closingBalance || 0))}</p>
          <p className="text-[10px] text-amber-400 font-bold">Total net cash in box</p>
        </div>
      </div>

      {/* Unified Table with Daily Grouping */}
      <section className="card overflow-hidden border-t-4 border-t-slate-800">
        {loading ? (
          <div className="p-10 text-center text-slate-500"><div className="loading-spinner mb-3" /><p>Loading...</p></div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <FaFileInvoiceDollar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">Is date range mein koi record nahi.</p>
            <p className="text-sm mt-1">Transactions, Sales, ya Purchases add karein — sab yahan dikhenge.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800 text-white uppercase text-[10px] tracking-widest">
                <tr>
                  <th className="text-left py-4 px-4 font-black">Date</th>
                  <th className="text-left py-4 px-4 font-black">Account → Participant</th>
                  <th className="text-left py-4 px-4 font-black">Description</th>
                  <th className="text-right py-4 px-4 font-black bg-slate-700/50">Credit (Payments Received)</th>
                  <th className="text-right py-4 px-4 font-black bg-slate-900/50">Debit (Payments Made)</th>
                </tr>
              </thead>
              <tbody>
                {/* Previous Balance Row */}
                <tr className="bg-slate-50 border-b border-slate-200">
                  <td className="py-3 px-4 text-slate-400">—</td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">Previous Balance</div>
                    <div className="text-[9px] text-slate-400 uppercase">Opening Balance</div>
                  </td>
                  <td className="py-3 px-4 text-slate-400">—</td>
                  <td className="py-3 px-4 text-right font-black text-emerald-700 bg-emerald-50/20 text-base">
                    {Number(summary.openingBalance || 0) > 0 ? formatMoney(summary.openingBalance) : ""}
                  </td>
                  <td className="py-3 px-4 text-right font-black text-rose-700 bg-rose-50/20 text-base">
                    {Number(summary.openingBalance || 0) < 0 ? formatMoney(Math.abs(summary.openingBalance)) : ""}
                  </td>
                </tr>
                {groupedData.map((group) => (
                  <Fragment key={group.date}>
                    {isRange && (
                      <tr key={`header-${group.date}`} className="bg-slate-200/50">
                        <td colSpan="3" className="py-2.5 px-4 font-black text-slate-600 text-xs uppercase">
                          📅 {formatDate(group.date)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-800 bg-emerald-100/30">{formatMoney(group.dayIn)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-rose-800 bg-rose-100/30">{formatMoney(group.dayOut)}</td>
                      </tr>
                    )}
                    {group.rows.map((row, i) => (
                      <tr key={`${group.date}-${i}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 text-slate-400 whitespace-nowrap text-xs">{formatDate(row.date)}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-700 leading-tight">
                            {row.accountName} <span className="text-rose-500 mx-1">➜</span> {row.name || "—"}
                          </div>
                          <div className="text-[10px] text-slate-400 uppercase tracking-tighter mt-0.5">{row.type.replace('_', ' ')}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs italic lowercase">
                          {row.description || "—"}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600 bg-emerald-50/10 text-base">
                          {row.amountType === "in" ? formatMoney(row.amount) : ""}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-rose-600 bg-rose-50/10 text-base">
                          {row.amountType === "out" ? formatMoney(row.amount) : ""}
                        </td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 text-slate-800 font-black border-t-2 border-slate-800">
                <tr>
                  <td colSpan="3" className="py-5 px-4 text-right text-[10px] uppercase tracking-widest text-slate-500">
                    Grand Total Activity:
                  </td>
                  <td className="py-5 px-4 text-right text-xl text-emerald-700 bg-emerald-50/30">
                    <div className="text-[10px] text-emerald-600 uppercase mb-1 font-black">Total Credits</div>
                    {formatMoney(Number(summary.openingBalance || 0) + Number(summary.totalIn || 0))}
                  </td>
                  <td className="py-5 px-4 text-right text-xl text-rose-700 bg-rose-50/30">
                    <div className="text-[10px] text-rose-600 uppercase mb-1 font-black">Total Debits</div>
                    {formatMoney(Number(summary.totalOut || 0))}
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
