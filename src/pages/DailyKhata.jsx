import { useState, useEffect, useMemo } from "react";
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
};
const TYPE_COLORS = {
  sale: "bg-emerald-100 text-emerald-800",
  purchase: "bg-orange-100 text-orange-800",
  deposit: "bg-green-100 text-green-700",
  withdraw: "bg-red-100 text-red-700",
  transfer: "bg-blue-100 text-blue-700",
  mill_expense: "bg-purple-100 text-purple-800",
  mazdoor_expense: "bg-amber-100 text-amber-800",
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

      {/* Unified Table with Daily Grouping */}
      <section className="card overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-500"><div className="loading-spinner mb-3" /><p>Loading...</p></div>
        ) : list.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            <FaFileInvoiceDollar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-medium text-slate-700">Is date range mein koi record nahi.</p>
            <p className="text-sm mt-1">Sales, Purchases, Transactions, Mill Expenses, ya Mazdoor expenses add karein — sab yahan dikhenge.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-emerald-700">
                    <span className="flex items-center justify-end gap-1"><FaArrowDown className="w-3 h-3" /> Credit (In)</span>
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-rose-700">
                    <span className="flex items-center justify-end gap-1"><FaArrowUp className="w-3 h-3" /> Debit (Out)</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {groupedData.map((group) => (
                  <>
                    {/* Day Header (only show if range spans multiple days) */}
                    {isRange && (
                      <tr key={`header-${group.date}`} className="bg-slate-100/80">
                        <td colSpan="3" className="py-2.5 px-4 font-bold text-slate-700">
                          📅 {formatDate(group.date)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-emerald-700">{formatMoney(group.dayIn)}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-rose-700">{formatMoney(group.dayOut)}</td>
                      </tr>
                    )}
                    {group.rows.map((row, i) => (
                      <tr key={`${group.date}-${i}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-2.5 px-4 text-slate-600">{formatDate(row.date)}</td>
                        <td className="py-2.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${TYPE_COLORS[row.type] || "bg-slate-100 text-slate-700"}`}>
                            {TYPE_LABELS[row.type] || row.type}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700 max-w-[280px] truncate" title={row.description}>{row.description || "—"}</td>
                        <td className="py-2.5 px-4 text-right font-medium text-emerald-700">
                          {row.amountType === "in" ? formatMoney(row.amount) : ""}
                        </td>
                        <td className="py-2.5 px-4 text-right font-medium text-rose-700">
                          {row.amountType === "out" ? formatMoney(row.amount) : ""}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
