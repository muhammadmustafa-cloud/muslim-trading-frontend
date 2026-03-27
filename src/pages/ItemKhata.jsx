import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL, apiGet } from "../config/api.js";
import { FaArrowLeft, FaBox, FaFilePdf } from "react-icons/fa";
import { downloadKhataPdf } from "../utils/historyPdf.js";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const formatMoney = (n) => (n != null ? Number(n).toLocaleString("en-PK") : "—");

export default function ItemKhata() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ name: "", purchases: [], sales: [], totalCost: 0, totalRevenue: 0, profit: 0, totalBagsPurchased: 0, totalBagsSold: 0 });
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
        const data = await apiGet(`/items/${id}/khata`, {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        });
        if (!cancelled) setData(data.data || { name: "", purchases: [], sales: [], totalCost: 0, totalRevenue: 0, profit: 0, totalBagsPurchased: 0, totalBagsSold: 0 });
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchKhata();
    return () => { cancelled = true; };
  }, [id, dateFrom, dateTo]);

  const handlePdf = () => {
    downloadKhataPdf(
      data,
      data.purchases,
      data.sales,
      data.totalCost ?? 0,
      data.totalRevenue ?? 0,
      data.profit ?? 0,
      { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }
    );
  };

  const totalCost = data.totalCost ?? 0;
  const totalRevenue = data.totalRevenue ?? 0;
  const profit = data.profit ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate("/items")} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600">
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FaBox className="w-7 h-7 text-amber-500" />
              {data.name || "Item"} Khata
            </h1>
            <p className="page-subtitle">Kitna daala, kis ko kitna becha — saari history aur profit.</p>
          </div>
        </div>
        <button type="button" onClick={handlePdf} className="btn-primary flex items-center gap-2" disabled={loading}>
          <FaFilePdf className="w-5 h-5" /> Download PDF
        </button>
      </header>

      {error && <div className="card p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

      <section className="card p-4">
        <h3 className="font-semibold text-slate-800 mb-3">Filter</h3>
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
          <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="card p-5 border-l-4 border-l-amber-500">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Purchase Cost</p>
              <p className="text-xl font-black text-slate-900 mt-1">{formatMoney(totalCost)}</p>
              <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase italic">{data.totalBagsPurchased || 0} Bags In</p>
            </div>
            <div className="card p-5 border-l-4 border-l-emerald-500">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Sales Revenue</p>
              <p className="text-xl font-black text-slate-900 mt-1">{formatMoney(totalRevenue)}</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1 uppercase italic">{data.totalBagsSold || 0} Bags Out</p>
            </div>
            <div className="card p-5 border-l-4 border-l-blue-500">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Stock Balance (Bags)</p>
              <p className="text-xl font-black text-blue-800 mt-1">{(data.totalBagsPurchased || 0) - (data.totalBagsSold || 0)}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase italic">Remaining in mill</p>
            </div>
            <div className="card p-5 border-l-4 border-l-indigo-500">
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Net Movement (Profit)</p>
              <p className={`text-xl font-black mt-1 ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatMoney(profit)}</p>
              <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase italic">Cash basis profit</p>
            </div>
          </section>

          <section className="card overflow-hidden">
            <h2 className="p-4 border-b border-slate-100 font-semibold text-slate-800">Unified Item Ledger</h2>
            <div className="overflow-x-auto">
              {(() => {
                const ledger = [
                  ...(data.purchases || []).map(p => ({ ...p, ledgerType: 'purchase' })),
                  ...(data.sales || []).map(s => ({ ...s, ledgerType: 'sale' }))
                ].sort((a, b) => new Date(b.date) - new Date(a.date));

                if (ledger.length === 0) return <p className="p-6 text-slate-500 text-center">Abhi koi entries nahi.</p>;

                return (
                  <table className="w-full">
                    <thead className="bg-slate-800 text-white font-bold text-[10px] uppercase tracking-wider">
                      <tr>
                        <th className="py-3 px-4 text-left border-r border-slate-700">Date</th>
                        <th className="py-3 px-4 text-left border-r border-slate-700">Audit Detail (Party / Note)</th>
                        <th className="py-3 px-4 text-center border-r border-slate-700">Bags</th>
                        <th className="py-3 px-4 text-center border-r border-slate-700">Mun (40kg)</th>
                        <th className="py-3 px-4 text-right border-r border-slate-700 text-emerald-300">Sale (Cr)</th>
                        <th className="py-3 px-4 text-right text-rose-300">Purchase (Dr)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((row) => {
                        const isSale = row.ledgerType === 'sale';
                        const amount = isSale ? (row.totalAmount || 0) : (row.amount || 0);
                        const participant = isSale ? (row.customerId?.name || "Customer") : (row.supplierId?.name || "Supplier");
                        const bags = Number(row.kattay) || 0;
                        const weight = Number(isSale ? row.quantity : row.receivedWeight) || 0;
                        const mun = weight > 0 ? (weight / 40).toFixed(3) : 0;

                        return (
                          <tr key={row._id} className="table-row-hover border-b border-slate-100 text-[11px]">
                            <td className="py-3 px-4 text-slate-500 italic font-medium border-r border-slate-100">{formatDate(row.date)}</td>
                            <td className="py-3 px-4 border-r border-slate-100">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 uppercase">{participant}</span>
                                {row.note && <span className="text-[10px] text-slate-500 font-normal italic truncate max-w-[200px]">{row.note}</span>}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center font-bold text-slate-700 border-r border-slate-100 bg-slate-50/30">{bags || "—"}</td>
                            <td className="py-3 px-4 text-center font-bold text-indigo-700 border-r border-slate-100 bg-indigo-50/10">{mun > 0 ? mun : "—"}</td>
                            <td className="py-3 px-4 text-right font-black text-emerald-600 border-r border-slate-100 bg-emerald-50/10">{isSale ? formatMoney(amount) : "—"}</td>
                            <td className="py-3 px-4 text-right font-black text-rose-700 bg-rose-50/10">{!isSale ? formatMoney(amount) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="text-xs border-t-2 border-slate-300 uppercase tracking-tight font-black">
                      <tr className="bg-emerald-900 text-white">
                        <td colSpan="2" className="px-4 py-2.5 text-right border-r border-emerald-800">Purchased (In):</td>
                        <td className="px-4 py-2.5 text-center border-r border-emerald-800 text-emerald-300">{data.totalBagsPurchased}</td>
                        <td className="px-4 py-2.5 text-center border-r border-emerald-800 text-emerald-300">{(data.totalMunPurchased || 0).toFixed(3)}</td>
                        <td className="px-4 py-2.5 text-right border-r border-emerald-800">—</td>
                        <td className="px-4 py-2.5 text-right text-emerald-300">{formatMoney(totalCost)}</td>
                      </tr>
                      <tr className="bg-rose-900 text-white">
                        <td colSpan="2" className="px-4 py-2.5 text-right border-r border-rose-800">Sold (Out):</td>
                        <td className="px-4 py-2.5 text-center border-r border-rose-800 text-rose-300">{data.totalBagsSold}</td>
                        <td className="px-4 py-2.5 text-center border-r border-rose-800 text-rose-300">{(data.totalMunSold || 0).toFixed(3)}</td>
                        <td className="px-4 py-2.5 text-right border-r border-rose-800 text-rose-300">{formatMoney(totalRevenue)}</td>
                        <td className="px-4 py-2.5 text-right">—</td>
                      </tr>
                      <tr className="bg-slate-900 text-white">
                        <td colSpan="2" className="px-4 py-3 text-right border-r border-slate-800">Balance (Remaining):</td>
                        <td className="px-4 py-3 text-center border-r border-slate-800 text-amber-400">{data.totalBagsPurchased - data.totalBagsSold}</td>
                        <td className="px-4 py-3 text-center border-r border-slate-800 text-amber-400">{((data.totalMunPurchased || 0) - (data.totalMunSold || 0)).toFixed(3)}</td>
                        <td className="px-4 py-3 text-right border-r border-slate-800 text-emerald-400">{formatMoney(totalRevenue)}</td>
                        <td className="px-4 py-3 text-right text-rose-400">{formatMoney(totalCost)}</td>
                      </tr>
                    </tfoot>
                  </table>
                );
              })()}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
