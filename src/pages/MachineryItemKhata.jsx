import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { apiGet } from "../config/api.js";
import { downloadMachineryItemKhataPdf } from "../utils/exportPdf.js";
import { FaArrowLeft, FaCogs, FaFilePdf } from "react-icons/fa";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const formatMoney = (n) => (n != null ? Number(n).toLocaleString("en-PK") : "—");

export default function MachineryItemKhata() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ name: "", purchases: [], totalCost: 0 });
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
    async function fetchKhata() {
      setLoading(true);
      setError("");
      try {
        const data = await apiGet(`/machinery-items/${id}/khata`, {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
        if (!cancelled) setData(data.data || { name: "", purchases: [], totalCost: 0 });
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchKhata();
    return () => { cancelled = true; };
  }, [id, dateFrom, dateTo]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate("/machinery-items")} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600">
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FaCogs className="w-7 h-7 text-amber-500" />
              {data.name || "Machinery Item"} Khata (History)
            </h1>
            <p className="page-subtitle">Is machinery part ki saari khareed-o-farokht ki history.</p>
          </div>
        </div>
        <button type="button" onClick={() => downloadMachineryItemKhataPdf(data, { dateFrom, dateTo })} className="btn-primary flex items-center gap-1.5" disabled={!data.name || data.purchases.length === 0} title="Download PDF Ledger"><FaFilePdf className="w-4 h-4" /> Export PDF</button>
      </header>

      {error && <div className="card p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

      <section className="card p-4">
        <h3 className="font-semibold text-slate-800 mb-3">Filter History</h3>
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
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="card p-6 border-l-4 border-l-amber-500">
              <p className="text-sm text-slate-500 font-medium lowercase">Total Kharcha (Purchase Cost)</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{formatMoney(data.totalCost)}</p>
            </div>
            <div className="card p-6 border-l-4 border-l-slate-800">
              <p className="text-sm text-slate-500 font-medium">Last Purchase</p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {data.purchases?.[0] ? formatDate(data.purchases[0].date) : "N/A"}
              </p>
            </div>
          </section>

          <section className="card overflow-hidden">
            <h2 className="p-4 border-b border-slate-100 font-bold text-slate-900 uppercase tracking-wider text-sm">Machinery Item Ledger</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead className="bg-slate-800 text-white font-bold text-xs uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4 text-left border-r border-slate-700">Date</th>
                    <th className="py-3 px-4 text-left border-r border-slate-700">Description</th>
                    <th className="py-3 px-4 text-right border-r border-slate-700">Credit (In)</th>
                    <th className="py-3 px-4 text-right">Debit (Out)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.purchases.length === 0 ? (
                    <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-medium italic">Abhi koi khareed-o-farokht nahi hoi.</td></tr>
                  ) : (
                    data.purchases.map((row) => (
                      <tr key={row._id} className="table-row-hover text-sm">
                        <td className="py-3 px-4 text-slate-500 italic text-xs border-r border-slate-100">{formatDate(row.date)}</td>
                        <td className="py-3 px-4 border-r border-slate-100">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-900 uppercase text-[11px] tracking-tight">{row.supplierId?.name || "Supplier"}</span>
                            {row.note && <span className="text-[10px] text-slate-500 font-normal truncate max-w-[300px]">"{row.note}"</span>}
                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">VIA: {row.accountId?.name || "CASH"}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600 border-r border-slate-100 bg-emerald-50/10">—</td>
                        <td className="py-3 px-4 text-right font-black text-rose-700 bg-rose-50/10">{formatMoney(row.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black text-sm border-t-2 border-slate-300">
                  <tr>
                    <td colSpan="2" className="px-5 py-5 text-right uppercase tracking-widest text-xs border-r border-slate-800">Grand Total Expense:</td>
                    <td className="px-5 py-5 text-right border-r border-slate-800">—</td>
                    <td className="px-5 py-5 text-right">{formatMoney(data.totalCost)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
