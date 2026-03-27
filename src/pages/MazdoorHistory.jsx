import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL, apiGet } from "../config/api.js";
import { FaArrowLeft, FaFilePdf, FaUser } from "react-icons/fa";
import { downloadMazdoorHistoryPdf } from "../utils/historyPdf.js";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const formatMoney = (n) => (n != null ? Number(n).toLocaleString("en-PK") : "—");

function getRowType(t) {
  if (t.type === "salary" || (t.type === "withdraw" && t.category === "salary")) return "Salary Paid";
  if (t.type === "withdraw" && t.category === "udhaar") return "Udhaar (Advance)";
  if (t.type === "accrual") return "Salary Posted (Earned)";
  if (t.category === "mazdoor_expense") return "Work Earned (Wage)";
  if (t.type === "deposit" && t.category === "udhaar_received") return "Udhaar wapas liya";
  if (t.category === "daily_wage") return "Work Earned (Wage)";
  return t.type === "deposit" ? "Deposit" : "Withdraw";
}
function getRowAccount(t) {
  if (t.type === "deposit" && t.toAccountId) return t.toAccountId.name || "—";
  return (t.fromAccountId && t.fromAccountId.name) || "—";
}

export default function MazdoorHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ name: "", transactions: [], totalPaid: 0, totalReceived: 0, totalEarned: 0, balance: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";

  const setFilters = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v == null || v === "") next.delete(k);
      else next.set(k, v);
    });
    setSearchParams(next);
  };

  useEffect(() => {
    let cancelled = false;
    async function fetchHistory() {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet(`/mazdoor/${id}/history`, {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
        if (!cancelled) setData(data.data || { name: "", transactions: [], totalPaid: 0, totalReceived: 0, totalEarned: 0, balance: 0 });
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchHistory();
    return () => { cancelled = true; };
  }, [id, dateFrom, dateTo]);

  const handlePdf = () => {
    downloadMazdoorHistoryPdf(
      data.name,
      data.transactions,
      data.totalPaid ?? 0,
      data.totalReceived ?? 0,
      data.totalEarned ?? 0,
      data.balance ?? 0,
      { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }
    );
  };

  const getDrCr = (t) => {
    const isReceive = t.type === "deposit" && t.category === "udhaar_received";
    const cr = (t.type === "accrual" || t.category === "mazdoor_expense" || isReceive) ? (Number(t.amount) || 0) : 0;
    const dr = (t.type === "salary" || t.type === "withdraw") ? (Number(t.amount) || 0) : 0;
    return { dr, cr };
  };

  const transactionsWithBalance = useMemo(() => {
    if (!data.transactions) return [];
    // Calculate running balance from oldest to newest
    const list = [...data.transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
    let current = 0;
    const withDetails = list.map((t) => {
      const { dr, cr } = getDrCr(t);
      current += (cr - dr);
      return { ...t, dr, cr, runningBalance: current };
    });
    // Return newest first for display
    return withDetails.reverse();
  }, [data.transactions]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate("/mazdoor")} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600">
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FaUser className="w-7 h-7 text-amber-500" />
              History — {data.name || "Mazdoor"}
            </h1>
            <p className="page-subtitle">Professional Ledger: Money Earned (Credit) vs Money Paid (Debit).</p>
          </div>
        </div>
        <button type="button" onClick={handlePdf} className="btn-primary flex items-center gap-2" disabled={loading}>
          <FaFilePdf className="w-5 h-5" /> Download PDF
        </button>
      </header>

      {error && <div className="card p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

      <section className="card p-4">
        <h3 className="font-semibold text-slate-800 mb-3">Audit Filter</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="input-label text-xs">Date from</label>
            <input type="date" value={dateFrom} onChange={(e) => setFilters({ dateFrom: e.target.value })} className="input-field w-40" />
          </div>
          <div>
            <label className="input-label text-xs">Date to</label>
            <input type="date" value={dateTo} onChange={(e) => setFilters({ dateTo: e.target.value })} className="input-field w-40" />
          </div>
          <button type="button" onClick={() => setSearchParams({})} className="btn-secondary mt-6">Clear filters</button>
        </div>
      </section>

      {loading ? (
        <div className="card p-12 flex justify-center"><div className="loading-spinner" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border-l-4 border-l-slate-800">
              <p className="text-sm text-slate-500 font-medium">Total Earned (Credit)</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatMoney(data.totalEarned + data.totalReceived)}</p>
              <p className="text-[10px] text-slate-400 uppercase mt-1 text-black">Work + Udhaar Returns</p>
            </div>
            <div className="card p-5 border-l-4 border-l-slate-800">
              <p className="text-sm text-slate-500 font-medium">Total Paid (Debit)</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{formatMoney(data.totalPaid)}</p>
              <p className="text-[10px] text-slate-400 uppercase mt-1 text-black">Advances + Salaries</p>
            </div>
            <div className="card p-5 border-l-4 border-l-slate-800 bg-slate-50">
              <p className="text-sm text-slate-500 font-medium">Net Financial Position</p>
              <p className="text-2xl font-bold mt-1 text-slate-900">
                {formatMoney(Math.abs(data.balance))} {data.balance >= 0 ? "Cr" : "Dr"}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-slate-600 mt-1 font-semibold">
                {data.balance < 0 ? "Worker Owes Mill" : data.balance > 0 ? "Mill Owes Worker" : "Settled"}
              </p>
            </div>
            <div className="card p-5 border-l-4 border-l-slate-800">
              <p className="text-sm text-slate-500 font-medium">Last Updated</p>
              <p className="text-xl font-bold text-slate-900 mt-1">{formatDate(new Date())}</p>
            </div>
          </div>

          <section className="card overflow-hidden">
            <header className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
               <h2 className="font-bold text-slate-900 uppercase tracking-wider text-sm text-black">Account Ledger (Audit View)</h2>
               <span className="text-xs text-slate-600 italic">Showing {transactionsWithBalance.length} entries</span>
            </header>
            <div className="overflow-x-auto">
              {transactionsWithBalance.length === 0 ? (
                <p className="p-6 text-slate-500">No transactions found for the selected period.</p>
              ) : (
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="table-header px-4 py-3 text-left w-32 text-black border border-slate-200">Date</th>
                      <th className="table-header px-4 py-3 text-left text-black border border-slate-200">Description / Account</th>
                      <th className="table-header px-4 py-3 text-right text-black border border-slate-200">Credit (+)</th>
                      <th className="table-header px-4 py-3 text-right text-black border border-slate-200">Debit (-)</th>
                      <th className="table-header px-4 py-3 text-right text-black border border-slate-200 bg-slate-50">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionsWithBalance.map((t) => {
                      const rowType = getRowType(t);
                      return (
                        <tr key={t._id} className="hover:bg-slate-50 border-b border-slate-200 group">
                          <td className="px-4 py-3 align-top text-black border-r border-slate-200">{formatDate(t.date)}</td>
                          <td className="px-4 py-3 align-top border-r border-slate-200">
                            <div className="font-medium text-black">{rowType}</div>
                            <div className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                              Via: {getRowAccount(t)}
                            </div>
                            {t.note && <div className="text-[11px] text-slate-500 italic mt-1 line-clamp-1 group-hover:line-clamp-none transition-all">"{t.note}"</div>}
                          </td>
                          <td className="px-4 py-3 text-right align-top font-semibold text-black border-r border-slate-200">
                            {t.cr > 0 ? formatMoney(t.cr) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right align-top font-semibold text-black border-r border-slate-200">
                            {t.dr > 0 ? formatMoney(t.dr) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right align-top font-bold text-black bg-slate-50/50">
                            {formatMoney(Math.abs(t.runningBalance))} {t.runningBalance >= 0 ? "Cr" : "Dr"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-800 text-white font-bold text-sm">
                       <td colSpan="2" className="px-4 py-3 text-right uppercase tracking-widest border border-slate-700">Total Period Movement</td>
                       <td className="px-4 py-3 text-right border border-slate-700">{formatMoney(data.totalEarned + data.totalReceived)}</td>
                       <td className="px-4 py-3 text-right border border-slate-700">{formatMoney(data.totalPaid)}</td>
                       <td className="px-4 py-3 text-right bg-slate-700 border border-slate-700">
                         {formatMoney(Math.abs(data.balance))} {data.balance >= 0 ? "Cr" : "Dr"}
                       </td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
