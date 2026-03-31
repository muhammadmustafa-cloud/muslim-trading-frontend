import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL, apiGet } from "../config/api.js";
import { FaArrowLeft, FaFilePdf, FaTruck } from "react-icons/fa";
import { downloadSupplierHistoryPdf } from "../utils/historyPdf.js";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "—");
const formatMoney = (n) => (n != null ? Number(n).toLocaleString("en-PK") : "—");

export default function SupplierHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ name: "", ledger: [], summary: { totalDebit: 0, totalCredit: 0, finalBalance: 0 } });
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
        const data = await apiGet(`/suppliers/${id}/history`, {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
        if (!cancelled) setData(data.data || { name: "", ledger: [], summary: {} });
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
    downloadSupplierHistoryPdf(
      data.name,
      data.ledger,
      data.summary,
      { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }
    );
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate("/suppliers")} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600">
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FaTruck className="w-7 h-7 text-amber-500" />
              Khatta (History) — {data.name || "Supplier"}
            </h1>
            <p className="page-subtitle">Unified Debit/Credit ledger with running balance.</p>
          </div>
        </div>
        <button type="button" onClick={handlePdf} className="btn-primary flex items-center gap-2" disabled={loading}>
          <FaFilePdf className="w-5 h-5" /> Download Ledger PDF
        </button>
      </header>

      {error && <div className="card p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

      <section className="card p-5 bg-white shadow-soft border-l-4 border-l-amber-500">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-2">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Filter by Date Range</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 italic">Shuruat (From)</label>
                <input type="date" value={dateFrom} onChange={(e) => setFilters({ dateFrom: e.target.value })} className="input-field border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 italic">Ikhtatam (To)</label>
                <input type="date" value={dateTo} onChange={(e) => setFilters({ dateTo: e.target.value })} className="input-field border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
              </div>
              <button type="button" onClick={() => setSearchParams({})} className="btn border border-rose-200 text-rose-600 hover:bg-rose-50 px-4 py-2 mt-4 rounded-lg text-xs font-black uppercase transition-colors">Clear</button>
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col justify-center">
            <h3 className="text-[10px] font-black text-slate-400 uppercase mb-1 tracking-tighter">Pichli Wasooli (Opening)</h3>
            <div className={`text-xl font-black ${data.summary?.openingBalance >= 0 ? 'text-slate-700' : 'text-slate-700'}`}>
              Rs. {formatMoney(Math.abs(data.summary?.openingBalance || data.ledger.find(l=>l.type==='opening')?.balance || 0))}
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 italic">Balance brought forward</p>
          </div>

          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-center transform hover:scale-[1.02] transition-transform">
            <h3 className="text-[10px] font-black text-amber-500 uppercase mb-1 tracking-widest">NET PAYABLE (Closing)</h3>
            <div className={`text-2xl font-black ${data.summary?.finalBalance <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              Rs. {formatMoney(Math.abs(data.summary?.finalBalance || 0))}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
               {data.summary?.finalBalance < 0 ? 'Mill Khata (Payable)' : data.summary?.finalBalance > 0 ? 'Customer Khata (Receivable)' : 'Pura Hisaab (Settled)'}
            </p>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="card p-12 flex justify-center bg-white border border-slate-200 rounded-2xl shadow-soft">
           <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <section className="card bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-soft">
          <div className="overflow-x-auto">
            {!data.ledger?.length ? (
              <div className="p-20 text-center text-slate-400">
                 <FaTruck className="w-16 h-16 mx-auto mb-4 opacity-10" />
                 <p className="font-bold tracking-widest uppercase text-xs">No entries found for this supplier.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-800 text-white border-b border-slate-700">
                    <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest">Date</th>
                    <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest">Description</th>
                    <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest">Bags</th>
                    <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest bg-emerald-900/30">Credit (Aamne)</th>
                    <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest bg-rose-900/30">Debit (Payments)</th>
                    <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest bg-slate-700 font-black">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 italic font-medium">
                  {data.ledger.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors border-b border-slate-100">
                      <td className="py-4 px-4 whitespace-nowrap text-[11px] font-bold text-slate-400">{formatDate(item.date)}</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{item.description}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{item.type || 'entry'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`px-2 py-1 rounded-md text-xs font-black ${item.bags > 0 ? 'bg-amber-100 text-amber-700' : 'text-slate-300'}`}>
                           {item.bags > 0 ? item.bags : '—'}
                        </span>
                      </td>
                      {/* Swapped layout values */}
                      <td className="py-4 px-4 text-right font-black text-emerald-700 bg-emerald-50/10 text-base">
                        {item.credit > 0 ? formatMoney(item.credit) : '—'}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-rose-700 bg-rose-50/10 text-base">
                        {item.debit > 0 ? formatMoney(item.debit) : '—'}
                      </td>
                      <td className={`py-4 px-4 text-right font-black text-base shadow-inner ${item.balance <= 0 ? 'text-emerald-800 bg-emerald-50/30' : 'text-rose-800 bg-rose-50/30'}`}>
                        {formatMoney(Math.abs(item.balance))}
                        <span className="text-[10px] ml-1 uppercase">{item.balance <= 0 ? 'Cr' : 'Dr'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800 text-white font-black">
                  <tr>
                    <td colSpan="3" className="py-6 px-4 text-right text-[10px] uppercase tracking-[0.2em] text-slate-400">Grand Ledger Totals:</td>
                    {/* Swapped Footers */}
                    <td className="py-6 px-4 text-right text-emerald-400 border-t-4 border-emerald-500/50 text-lg decoration-double underline underline-offset-8">
                       {formatMoney(Number(data.summary?.totalCredit || 0))}
                    </td>
                    <td className="py-6 px-4 text-right text-rose-400 border-t-4 border-rose-500/50 text-lg decoration-double underline underline-offset-8">
                       {formatMoney(Number(data.summary?.totalDebit || 0))}
                    </td>
                    <td className="py-6 px-4 text-right bg-slate-900 border-t-4 border-amber-500 text-xl font-black">
                      {formatMoney(Math.abs(data.summary?.finalBalance || 0))} 
                      <span className="text-[11px] ml-2 text-slate-400 uppercase tracking-widest">{data.summary?.finalBalance <= 0 ? 'Payable (Cr)' : 'Receivable (Dr)'}</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
