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
    inBags: list.reduce((sum, r) => sum + (r.inBags || 0), 0),
    inWeight: list.reduce((sum, r) => sum + (r.inWeight || 0), 0),
    inMun: list.reduce((sum, r) => sum + (r.inMun || 0), 0),
    outBags: list.reduce((sum, r) => sum + (r.outBags || 0), 0),
    outWeight: list.reduce((sum, r) => sum + (r.outWeight || 0), 0),
    outMun: list.reduce((sum, r) => sum + (r.outMun || 0), 0),
    balanceBags: list.reduce((sum, r) => sum + (r.balanceBags || 0), 0),
    balanceWeight: list.reduce((sum, r) => sum + (r.balanceWeight || 0), 0),
    balanceMun: list.reduce((sum, r) => sum + (r.balanceMun || 0), 0),
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
              {mainItem?.name || "Item"} - Warehouse Stock & Sales Summary
            </h1>
            <p className="page-subtitle italic font-medium">Tracking stock movements (In/Out) via internal transfers and sales.</p>
          </div>
        </div>
        <button type="button" onClick={handlePdf} className="btn-primary flex items-center gap-2" disabled={loading || list.length === 0}>
          <FaFilePdf className="w-5 h-5" /> Download Report PDF
        </button>
      </header>

      {error && <div className="card p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

      <section className="card p-4 border-l-4 border-l-amber-400">
        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-tighter text-xs">
           <FaShoppingCart className="w-3 h-3" /> Filter by Movement Date
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
          <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card p-6 bg-white border-b-4 border-b-amber-500 shadow-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center">Total In (Transfer In)</p>
              <p className="text-3xl font-black text-slate-900 mt-2 text-center">{totals.inMun.toFixed(3)} <span className="text-sm font-bold text-slate-400">MUN</span></p>
              <p className="text-[10px] text-amber-600 font-bold mt-1 text-center">{totals.inBags} Bags | {totals.inWeight.toLocaleString()} Kg</p>
            </div>
            <div className="card p-6 bg-white border-b-4 border-b-indigo-500 shadow-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center">Total Out (Sales)</p>
              <p className="text-3xl font-black text-indigo-700 mt-2 text-center">{totals.outMun.toFixed(3)} <span className="text-sm font-bold text-slate-400">MUN</span></p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 text-center italic tracking-tighter">{totals.outBags} Bags | {totals.outWeight.toLocaleString()} Kg</p>
            </div>
            <div className="card p-6 bg-white border-b-4 border-b-emerald-600 shadow-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center">Current Balance</p>
              <p className="text-3xl font-black text-emerald-700 mt-2 text-center">{totals.balanceMun.toFixed(3)} <span className="text-sm font-bold text-slate-400">MUN</span></p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 text-center uppercase tracking-widest">{totals.balanceBags} Bags | {totals.balanceWeight.toLocaleString()} Kg</p>
            </div>
            <div className="card p-6 bg-white border-b-4 border-b-slate-900 shadow-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center">Sales Revenue</p>
              <p className="text-3xl font-black text-slate-900 mt-2 text-center">Rs. {formatMoney(totals.revenue)}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 text-center italic tracking-tighter">Income from real parties.</p>
            </div>
          </section>

          <section className="card overflow-hidden border-t border-slate-200 shadow-xl">
             <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                <h2 className="font-black uppercase tracking-widest text-sm">Warehouse Aggregated Stock Table</h2>
                <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded">Stock (In/Out/Balance)</span>
             </div>
             <div className="overflow-x-auto">
                <table className="w-full">
                   <thead>
                      <tr className="bg-slate-200 text-slate-700 font-black text-[9px] uppercase tracking-widest border-b border-slate-300">
                         <th rowSpan="2" className="py-4 px-3 text-left border-r border-slate-300">Warehouse / Batch / Quality</th>
                         <th colSpan="3" className="py-2 px-3 text-center border-r border-slate-300 bg-amber-100/50 text-amber-900">Stock IN (Aaya)</th>
                         <th colSpan="3" className="py-2 px-3 text-center border-r border-slate-300 bg-indigo-100/50 text-indigo-900">Stock OUT (Gya)</th>
                         <th colSpan="3" className="py-2 px-3 text-center border-r border-slate-300 bg-emerald-100/50 text-emerald-900">Balance (Baqi)</th>
                         <th rowSpan="2" className="py-4 px-3 text-right font-bold text-slate-900">Revenue (Rs.)</th>
                      </tr>
                      <tr className="bg-slate-100 text-slate-600 font-black text-[8px] uppercase tracking-widest border-b border-slate-200">
                         <th className="py-2 px-2 text-center border-r border-slate-200 bg-amber-50">Bags</th>
                         <th className="py-2 px-2 text-center border-r border-slate-200 bg-amber-50">Weight (Kg)</th>
                         <th className="py-2 px-2 text-center border-r border-slate-200 bg-amber-50">MUN</th>
                         <th className="py-2 px-2 text-center border-r border-slate-200 bg-indigo-50">Bags</th>
                         <th className="py-2 px-2 text-center border-r border-slate-200 bg-indigo-50">Weight (Kg)</th>
                         <th className="py-2 px-2 text-center border-r border-slate-200 bg-indigo-50">MUN</th>
                         <th className="py-2 px-2 text-center border-r border-slate-200 bg-emerald-50">Bags</th>
                         <th className="py-2 px-2 text-center border-r border-slate-200 bg-emerald-50">Weight (Kg)</th>
                         <th className="py-2 px-2 text-center border-r border-slate-200 bg-emerald-50 font-bold">MUN</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100">
                      {list.length === 0 ? (
                         <tr>
                            <td colSpan="11" className="py-20 text-center text-slate-400 font-medium">
                               Koi record nahi mila is period mein.
                            </td>
                         </tr>
                      ) : (
                         list.map((row) => (
                            <tr key={row._id} className="hover:bg-slate-50 transition-colors group text-xs">
                               <td className="py-3 px-3 border-r border-slate-100">
                                  <div className="font-black text-slate-800 flex items-center gap-2">
                                     <FaBox className="text-amber-500/50 w-3 h-3" /> {row.name}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-medium">{row.quality || "—"}</div>
                               </td>
                               
                               {/* Stock IN */}
                               <td className="py-3 px-2 text-center border-r border-slate-100 bg-amber-50/10 font-bold">{row.inBags || 0}</td>
                               <td className="py-3 px-2 text-center border-r border-slate-100 bg-amber-50/10">{row.inWeight.toLocaleString()}</td>
                               <td className="py-3 px-2 text-center border-r border-slate-100 bg-amber-50/30 font-black text-amber-800">{row.inMun.toFixed(3)}</td>
                               
                               {/* Stock OUT */}
                               <td className="py-3 px-2 text-center border-r border-slate-100 bg-indigo-50/10 font-bold">{row.outBags || 0}</td>
                               <td className="py-3 px-2 text-center border-r border-slate-100 bg-indigo-50/10">{row.outWeight.toLocaleString()}</td>
                               <td className="py-3 px-2 text-center border-r border-slate-100 bg-indigo-50/30 font-black text-indigo-800">{row.outMun.toFixed(3)}</td>
                               
                               {/* Balance */}
                               <td className="py-3 px-2 text-center border-r border-slate-100 bg-emerald-50/10 font-bold">{row.balanceBags || 0}</td>
                               <td className="py-3 px-2 text-center border-r border-slate-100 bg-emerald-50/10">{row.balanceWeight.toLocaleString()}</td>
                               <td className={`py-3 px-2 text-center border-r border-slate-100 bg-emerald-50/30 font-black ${row.balanceMun < 0 ? 'text-red-600':'text-emerald-800'}`}>
                                  {row.balanceMun.toFixed(3)}
                               </td>
                               
                               <td className="py-3 px-3 text-right font-black text-slate-900 bg-slate-50/30">
                                  {formatMoney(row.totalRevenue)}
                               </td>
                            </tr>
                         ))
                      )}
                   </tbody>
                   <tfoot className="bg-slate-900 text-white font-black text-[10px] uppercase">
                      <tr>
                         <td className="py-4 px-3 text-right border-r border-slate-800 italic">Combined Totals:</td>
                         <td className="py-4 px-2 text-center border-r border-slate-800 text-amber-400">{totals.inBags}</td>
                         <td className="py-4 px-2 text-center border-r border-slate-800 text-amber-400">{totals.inWeight.toLocaleString()}</td>
                         <td className="py-4 px-2 text-center border-r border-slate-800 text-amber-300 text-xs">{totals.inMun.toFixed(3)}</td>
                         <td className="py-4 px-2 text-center border-r border-slate-800 text-indigo-400">{totals.outBags}</td>
                         <td className="py-4 px-2 text-center border-r border-slate-800 text-indigo-400">{totals.outWeight.toLocaleString()}</td>
                         <td className="py-4 px-2 text-center border-r border-slate-800 text-indigo-300 text-xs">{totals.outMun.toFixed(3)}</td>
                         <td className="py-4 px-2 text-center border-r border-slate-800 text-emerald-400">{totals.balanceBags}</td>
                         <td className="py-4 px-2 text-center border-r border-slate-800 text-emerald-400">{totals.balanceWeight.toLocaleString()}</td>
                         <td className="py-4 px-2 text-center border-r border-slate-800 text-emerald-300 text-xs">{totals.balanceMun.toFixed(3)}</td>
                         <td className="py-4 px-3 text-right text-emerald-400 text-sm tracking-tighter">Rs. {formatMoney(totals.revenue)}</td>
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
