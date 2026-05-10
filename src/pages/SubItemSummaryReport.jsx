import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { apiGet } from "../config/api.js";
import { FaArrowLeft, FaSitemap, FaFilePdf, FaShoppingCart, FaBox } from "react-icons/fa";
import { downloadSubItemsSummaryPdf } from "../utils/historyPdf.js";

const formatMoney = (n) => (n != null ? Number(n).toLocaleString("en-PK") : "—");

export default function SubItemSummaryReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [list, setList] = useState([]);
  const [mainItem, setMainItem] = useState(null);
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
    fetchMainItem();
  }, [id]);

  useEffect(() => {
    fetchSummary();
  }, [id, dateFrom, dateTo]);

  const fetchMainItem = async () => {
    try {
      const res = await apiGet(`/items/${id}`);
      setMainItem(res.data);
    } catch (e) { console.error(e); }
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet(`/items/${id}/sub-items-summary`, {
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setList(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePdf = () => {
    downloadSubItemsSummaryPdf(mainItem?.name || "Item", list, { dateFrom, dateTo });
  };

  const totals = {
    bags: list.reduce((sum, r) => sum + (r.totalBags || 0), 0),
    mun: list.reduce((sum, r) => sum + (r.totalMun || 0), 0),
    revenue: list.reduce((sum, r) => sum + (r.totalRevenue || 0), 0),
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
              {mainItem?.name || "Item"} - Sub-Items Sales Summary
            </h1>
            <p className="page-subtitle italic font-medium">Aggregated sales performance across all linked warehouses/batches.</p>
          </div>
        </div>
        <button type="button" onClick={handlePdf} className="btn-primary flex items-center gap-2" disabled={loading || list.length === 0}>
          <FaFilePdf className="w-5 h-5" /> Download Report PDF
        </button>
      </header>

      {error && <div className="card p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

      <section className="card p-4 border-l-4 border-l-amber-400">
        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-tighter text-xs">
           <FaShoppingCart className="w-3 h-3" /> Filter by Sale Date
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
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Combined Revenue</p>
              <p className="text-3xl font-black text-slate-900 mt-2">Rs. {formatMoney(totals.revenue)}</p>
              <p className="text-[10px] text-amber-600 font-bold mt-1">Sum of all sub-item sales in this period.</p>
            </div>
            <div className="card p-6 bg-white border-b-4 border-b-indigo-500 shadow-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Combined Weight (MUN)</p>
              <p className="text-3xl font-black text-indigo-700 mt-2">{totals.mun.toFixed(3)}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Total weight sold across all warehouses.</p>
            </div>
            <div className="card p-6 bg-white border-b-4 border-b-slate-900 shadow-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Total Combined Bags</p>
              <p className="text-3xl font-black text-slate-900 mt-2">{totals.bags}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 italic tracking-tighter">Total bag count out of mill.</p>
            </div>
          </section>

          <section className="card overflow-hidden border-t border-slate-200 shadow-xl">
             <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                <h2 className="font-black uppercase tracking-widest text-sm">Aggregated Performance Table</h2>
                <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded">By Warehouse / Batch</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest border-b border-slate-200">
                         <th className="py-4 px-5 text-left">Sub-Item Name</th>
                         <th className="py-4 px-5 text-left">Quality</th>
                         <th className="py-4 px-5 text-center">Sales</th>
                         <th className="py-4 px-5 text-center">Bags</th>
                         <th className="py-4 px-5 text-center">Weight (KG)</th>
                         <th className="py-4 px-5 text-center">MUN (40kg)</th>
                         <th className="py-4 px-5 text-right font-bold text-indigo-600">Total Revenue</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {list.length === 0 ? (
                         <tr>
                            <td colSpan="7" className="py-20 text-center text-slate-400 font-medium">
                               Koi record nahi mila is period mein.
                            </td>
                         </tr>
                      ) : (
                         list.map((row) => (
                            <tr key={row._id} className="hover:bg-slate-50 transition-colors group">
                               <td className="py-4 px-5 font-black text-slate-800 text-sm flex items-center gap-2">
                                  <FaBox className="text-amber-500/50 w-3 h-3" /> {row.name}
                               </td>
                               <td className="py-4 px-5 text-slate-500 font-medium">{row.quality || "—"}</td>
                               <td className="py-4 px-5 text-center font-bold text-slate-600 italic text-[10px]">{row.saleCount} sales</td>
                               <td className="py-4 px-5 text-center font-black text-slate-900 bg-slate-50/50">{row.totalBags}</td>
                               <td className="py-4 px-5 text-center font-black text-slate-900">{formatMoney(row.totalWeight)} kg</td>
                               <td className="py-4 px-5 text-center font-black text-indigo-700 bg-indigo-50/10">{row.totalMun.toFixed(3)}</td>
                               <td className="py-4 px-5 text-right font-black text-slate-900 bg-emerald-50/5">
                                  {formatMoney(row.totalRevenue)}
                               </td>
                            </tr>
                         ))
                      )}
                   </tbody>
                   <tfoot className="bg-slate-900 text-white font-black text-xs uppercase">
                      <tr>
                         <td colSpan="3" className="py-4 px-5 text-right border-r border-slate-800">Totals:</td>
                         <td className="py-4 px-5 text-center border-r border-slate-800 text-amber-400">{totals.bags}</td>
                         <td className="py-4 px-5 text-center border-r border-slate-800 text-amber-400">{formatMoney(list.reduce((sum, r) => sum + (r.totalWeight || 0), 0))} kg</td>
                         <td className="py-4 px-5 text-center border-r border-slate-800 text-amber-400">{totals.mun.toFixed(3)}</td>
                         <td className="py-4 px-5 text-right text-emerald-400 text-lg tracking-tighter">Rs. {formatMoney(totals.revenue)}</td>
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
