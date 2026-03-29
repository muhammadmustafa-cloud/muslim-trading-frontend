import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../config/api.js";
import { FaWallet, FaArrowLeft, FaFilePdf, FaCalendarAlt, FaHistory } from "react-icons/fa";
import { downloadExpenseLedgerPdf } from "../utils/exportPdf.js";

const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function ExpenseLedger() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "" });

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      
      const res = await apiGet(`/expense-types/${id}/ledger?${params}`);
      setData(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [id, filters.dateFrom, filters.dateTo]);

  if (loading && !data) {
    return <div className="p-10 text-center text-slate-500"><div className="loading-spinner mx-auto mb-3" /><p>Loading Ledger...</p></div>;
  }

  if (error) {
    return <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl m-10">{error}</div>;
  }

  const { expenseType, ledger, totalSpent } = data;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/expense-types" className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:text-rose-600 transition-all">
            <FaArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 uppercase">{expenseType.name} — Khata</h1>
            <p className="text-slate-500 text-sm">Individual history and payments for this expense category.</p>
          </div>
        </div>
        <button 
          onClick={() => downloadExpenseLedgerPdf(expenseType, ledger, totalSpent, filters)} 
          className="btn-primary flex items-center gap-2 border-b-4 border-b-blue-700"
          disabled={ledger.length === 0}
        >
          <FaFilePdf className="w-4 h-4" /> Export Khata PDF
        </button>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 bg-rose-50 border-rose-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-200">
            <FaWallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">Expense Type</p>
            <p className="text-xl font-black text-slate-800 uppercase">{expenseType.name}</p>
          </div>
        </div>
        <div className="card p-5 bg-emerald-50 border-emerald-100 flex items-center gap-4 col-span-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
            <FaHistory className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Spent till date</p>
            <p className="text-2xl font-black text-slate-800">Rs. {formatMoney(totalSpent)}</p>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4 bg-slate-50/50">
           <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><FaCalendarAlt className="opacity-50" /> From</label>
            <input type="date" value={filters.dateFrom} onChange={e => setFilters({...filters, dateFrom: e.target.value})} className="input-field w-36 py-1 text-sm font-bold" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1.5"><FaCalendarAlt className="opacity-50" /> To</label>
            <input type="date" value={filters.dateTo} onChange={e => setFilters({...filters, dateTo: e.target.value})} className="input-field w-36 py-1 text-sm font-bold" />
          </div>
          <button onClick={() => setFilters({dateFrom: "", dateTo: ""})} className="btn-secondary py-1.5 px-3 text-xs">Clear</button>
          <div className="ml-auto text-slate-400 text-xs font-bold italic">
            Found {ledger.length} record(s)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] tracking-wider text-slate-500 font-bold">
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Description / Account</th>
                <th className="px-5 py-3 text-right text-rose-600">Debit (Kharch)</th>
                <th className="px-5 py-3 text-right text-emerald-600">Credit (Aamad)</th>
                <th className="px-5 py-3 text-right text-slate-800">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-5 py-12 text-center text-slate-400 italic">No expense records found.</td>
                </tr>
              ) : (
                (() => {
                  let runningBalance = 0;
                  return ledger.map((t) => {
                    const debit = t.amount || 0;
                    const credit = 0; 
                    runningBalance += debit - credit;
                    
                    return (
                      <tr key={t._id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-5 py-4 text-xs text-slate-500 font-medium">{formatDate(t.date)}</td>
                        <td className="px-5 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-700 leading-tight">
                              {t.fromAccountId?.name || "Manual Account"}
                            </span>
                            <span className="text-[10px] text-slate-400 italic truncate max-w-[200px] mt-0.5">
                              {t.note || "Expense payment"}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-right font-black text-rose-600 group-hover:scale-110 transition-transform origin-right tracking-tight">{formatMoney(debit)}</td>
                        <td className="px-5 py-4 text-right font-bold text-emerald-600/30">—</td>
                        <td className="px-5 py-4 text-right font-black text-slate-800 bg-slate-50/50">{formatMoney(runningBalance)}</td>
                      </tr>
                    );
                  });
                })()
              )}
            </tbody>
            <tfoot className="bg-slate-50 font-black border-t-2 border-slate-200">
              <tr>
                <td colSpan="2" className="px-5 py-4 text-right text-slate-400 uppercase text-[10px] tracking-widest">Grand Totals:</td>
                <td className="px-5 py-4 text-right text-rose-600 font-black">{formatMoney(totalSpent)}</td>
                <td className="px-5 py-4 text-right text-emerald-600">—</td>
                <td className="px-5 py-4 text-right text-slate-900 bg-slate-100 border-l-2 border-slate-300">Rs. {formatMoney(totalSpent)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </div>
  );
}
