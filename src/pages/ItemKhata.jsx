import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api.js";
import { FaArrowLeft, FaBox, FaFilePdf } from "react-icons/fa";
import { downloadKhataPdf } from "../utils/historyPdf.js";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const formatMoney = (n) => (n != null ? Number(n).toLocaleString("en-PK") : "—");

export default function ItemKhata() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ name: "", purchases: [], sales: [], totalCost: 0, totalRevenue: 0, profit: 0 });
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
        const params = new URLSearchParams();
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        const res = await fetch(`${API_BASE_URL}/items/${id}/khata?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load khata");
        if (!cancelled) setData(json.data || { name: "", purchases: [], sales: [], totalCost: 0, totalRevenue: 0, profit: 0 });
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
      data.name,
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
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-5 border-l-4 border-l-amber-500">
              <p className="text-sm text-slate-500 font-medium">Jitna daala (Total cost)</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{formatMoney(totalCost)}</p>
            </div>
            <div className="card p-5 border-l-4 border-l-emerald-500">
              <p className="text-sm text-slate-500 font-medium">Jitna becha (Total revenue)</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{formatMoney(totalRevenue)}</p>
            </div>
            <div className="card p-5 border-l-4 border-l-blue-500">
              <p className="text-sm text-slate-500 font-medium">Net Movement (Profit)</p>
              <p className={`text-2xl font-bold mt-1 ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatMoney(profit)}</p>
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
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="table-header px-5 py-3.5 italic">Date</th>
                        <th className="table-header px-5 py-3.5">Description</th>
                        <th className="table-header px-5 py-3.5 text-right">Credit (Sale)</th>
                        <th className="table-header px-5 py-3.5 text-right">Debit (Purchase)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.map((row) => {
                        const isSale = row.ledgerType === 'sale';
                        const amount = isSale ? (row.amountReceived || 0) : (row.amountPaid || 0);
                        const participant = isSale ? (row.customerId?.name || "Customer") : (row.supplierId?.name || "Supplier");
                        const description = isSale ? `Sale - ${participant}` : `Purchase - ${participant}`;

                        return (
                          <tr key={row._id} className="table-row-hover border-b border-slate-100">
                            <td className="table-cell py-3 text-xs text-slate-500">{formatDate(row.date)}</td>
                            <td className="table-cell font-medium">
                              <div className="flex flex-col">
                                <span className="text-slate-800">{description}</span>
                                {row.note && <span className="text-[10px] text-slate-400 font-normal">{row.note}</span>}
                              </div>
                            </td>
                            <td className="table-cell text-right font-bold text-emerald-600">{isSale ? formatMoney(amount) : "—"}</td>
                            <td className="table-cell text-right font-bold text-rose-600">{!isSale ? formatMoney(amount) : "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                      <tr className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                        <td colSpan="2" className="px-5 py-5 text-right">Total Summary:</td>
                        <td className="px-5 py-5 text-right text-emerald-700 bg-emerald-50/30">{formatMoney(totalRevenue)}</td>
                        <td className="px-5 py-5 text-right text-rose-700 bg-rose-50/30">{formatMoney(totalCost)}</td>
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
