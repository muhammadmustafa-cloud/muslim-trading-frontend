import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { apiGet } from "../config/api.js";
import { FaArrowLeft, FaSitemap, FaFilePdf, FaShoppingCart } from "react-icons/fa";
import { downloadSubItemLedgerPdf } from "../utils/historyPdf.js";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const formatMoney = (n) => (n != null ? Number(n).toLocaleString("en-PK") : "—");

export default function SubItemLedger() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ name: "", sales: [], totalBagsSold: 0, totalMunSold: 0, totalRevenue: 0 });
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
    async function fetchLedger() {
      setLoading(true);
      setError("");
      try {
        const res = await apiGet(`/items/${id}/sub-khata`, {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
        setData(res.data || { name: "", sales: [], totalBagsSold: 0, totalMunSold: 0, totalRevenue: 0 });
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchLedger();
  }, [id, dateFrom, dateTo]);

  const handlePdf = () => {
    downloadSubItemLedgerPdf(data, { dateFrom, dateTo });
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate("/items")} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors">
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FaSitemap className="w-7 h-7 text-amber-500" />
              {data.name || "Sub-Item"} History
            </h1>
            <p className="page-subtitle italic font-medium">Sub-item specific sales tracking and stock movement.</p>
          </div>
        </div>
        <button type="button" onClick={handlePdf} className="btn-primary flex items-center gap-2" disabled={loading}>
          <FaFilePdf className="w-5 h-5" /> Export PDF
        </button>
      </header>

      {error && <div className="card p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

      <section className="card p-4 border-l-4 border-l-amber-400">
        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-tighter text-xs">
           <FaShoppingCart className="w-3 h-3" /> Filters & Controls
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="input-label text-xs">From Date</label>
            <input type="date" value={dateFrom} onChange={(e) => setFilters({ dateFrom: e.target.value })} className="input-field w-40" />
          </div>
          <div>
            <label className="input-label text-xs">To Date</label>
            <input type="date" value={dateTo} onChange={(e) => setFilters({ dateTo: e.target.value })} className="input-field w-40" />
          </div>
          <button type="button" onClick={() => setSearchParams({})} className="btn-secondary mt-6 h-[42px]">Clear Filters</button>
        </div>
      </section>

      {loading ? (
        <div className="card p-12 flex justify-center"><div className="loading-spinner" /></div>
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-6 bg-white border-b-4 border-b-amber-500 shadow-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Sales Revenue</p>
              <p className="text-3xl font-black text-slate-900 mt-2">Rs. {formatMoney(data.totalRevenue)}</p>
              <p className="text-[10px] text-amber-600 font-bold mt-1">Based on this sub-item selection only.</p>
            </div>
            <div className="card p-6 bg-white border-b-4 border-b-indigo-500 shadow-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Quantity Sold (MUN)</p>
              <p className="text-3xl font-black text-indigo-700 mt-2">{(data.totalMunSold || 0).toFixed(3)}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Total weight moved from stock.</p>
            </div>
            <div className="card p-6 bg-white border-b-4 border-b-slate-900 shadow-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Bags Out</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{data.totalBagsSold || 0}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 tracking-tighter italic">Total count of kattay sold.</p>
            </div>
          </section>

          <section className="card overflow-hidden border-t border-slate-200 shadow-xl">
             <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                <h2 className="font-black uppercase tracking-widest text-sm">Sub-Item Ledger History</h2>
                <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded">Sales Records</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-tighter">
                         <th className="py-4 px-5 text-left border-r border-slate-200">Date</th>
                         <th className="py-4 px-5 text-left border-r border-slate-200">Customer / Party</th>
                         <th className="py-4 px-5 text-center border-r border-slate-200">Bags</th>
                         <th className="py-4 px-5 text-center border-r border-slate-200">Weight (MUN)</th>
                         <th className="py-4 px-5 text-right font-bold text-indigo-600">Total Amount (Rs.)</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {data.sales.length === 0 ? (
                         <tr>
                            <td colSpan="5" className="py-20 text-center text-slate-400 font-medium">
                               Koi sale record nahi mila is sub-item ke liye.
                            </td>
                         </tr>
                      ) : (
                         data.sales.map((row, idx) => {
                            const mun = (row.quantity / 40).toFixed(3);
                            return (
                               <tr key={idx} className="hover:bg-amber-50/30 transition-colors group">
                                  <td className="py-4 px-5 font-bold text-slate-500 text-xs border-r border-slate-100 italic">
                                     {formatDate(row.date)}
                                  </td>
                                  <td className="py-4 px-5 border-r border-slate-100">
                                     <div className="flex flex-col">
                                        <span className="font-black text-slate-800 text-sm tracking-tight uppercase">{row.customerId?.name || "Customer"}</span>
                                        <span className="text-[10px] text-slate-400 font-medium">Invoice Reference: {row._id.slice(-6).toUpperCase()}</span>
                                     </div>
                                  </td>
                                  <td className="py-4 px-5 text-center font-black text-slate-700 bg-slate-50/50 border-r border-slate-100">
                                     {row.kattay || "—"}
                                  </td>
                                  <td className="py-4 px-5 text-center font-black text-indigo-700 bg-indigo-50/10 border-r border-slate-100">
                                     {mun}
                                  </td>
                                  <td className="py-4 px-5 text-right font-black text-slate-900 bg-emerald-50/5 text-lg">
                                     {formatMoney(row.totalAmount)}
                                  </td>
                               </tr>
                            );
                         })
                      )}
                   </tbody>
                   <tfoot className="bg-slate-900 text-white font-black text-xs uppercase">
                      <tr>
                         <td colSpan="2" className="py-4 px-5 text-right border-r border-slate-800">Total Movement Summary:</td>
                         <td className="py-4 px-5 text-center border-r border-slate-800 text-amber-400">{data.totalBagsSold}</td>
                         <td className="py-4 px-5 text-center border-r border-slate-800 text-amber-400">{(data.totalMunSold || 0).toFixed(3)}</td>
                         <td className="py-4 px-5 text-right text-emerald-400 text-xl tracking-tighter">Rs. {formatMoney(data.totalRevenue)}</td>
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
