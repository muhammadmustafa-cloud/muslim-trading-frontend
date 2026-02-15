import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api.js";
import { FaArrowLeft, FaFilePdf, FaUsers } from "react-icons/fa";
import { downloadCustomerHistoryPdf } from "../utils/historyPdf.js";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const formatMoney = (n) => (n != null ? Number(n).toLocaleString("en-PK") : "—");

export default function CustomerHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ name: "", sales: [], stockEntries: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const type = searchParams.get("type") || "all";

  const setFilters = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v == null || v === "" || v === "all") next.delete(k);
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
        const params = new URLSearchParams();
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        if (type && type !== "all") params.set("type", type);
        const res = await fetch(`${API_BASE_URL}/customers/${id}/history?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load history");
        if (!cancelled) setData(json.data || { name: "", sales: [], stockEntries: [] });
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchHistory();
    return () => { cancelled = true; };
  }, [id, dateFrom, dateTo, type]);

  const handlePdf = () => {
    downloadCustomerHistoryPdf(
      data.name,
      data.sales,
      data.stockEntries,
      { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, type: type !== "all" ? type : undefined }
    );
  };

  const showSales = !type || type === "all" || type === "sales";
  const showStock = !type || type === "all" || type === "stock";

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate("/customers")} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600">
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FaUsers className="w-7 h-7 text-amber-500" />
              History — {data.name || "Customer"}
            </h1>
            <p className="page-subtitle">Sales aur stock entry history (filter karke PDF download karein).</p>
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
          <div>
            <label className="input-label text-xs">Type</label>
            <select value={type} onChange={(e) => setFilters({ type: e.target.value })} className="input-field w-44">
              <option value="all">All (Sales + Stock)</option>
              <option value="sales">Sales only</option>
              <option value="stock">Stock entry only</option>
            </select>
          </div>
          <button type="button" onClick={() => setSearchParams({})} className="btn-secondary mt-6">Clear filters</button>
        </div>
      </section>

      {loading ? (
        <div className="card p-12 flex justify-center"><div className="loading-spinner" /></div>
      ) : (
        <div className="space-y-6">
          {showSales && (
            <section className="card overflow-hidden">
              <h2 className="p-4 border-b border-slate-100 font-semibold text-slate-800">Jab isne khareeda (Sales)</h2>
              <div className="overflow-x-auto">
                {data.sales?.length === 0 ? (
                  <p className="p-6 text-slate-500">Koi sale nahi.</p>
                ) : (
                  <table className="w-full">
                    <thead><tr><th className="table-header px-4 py-2 text-left">Date</th><th className="table-header px-4 py-2 text-left">Item</th><th className="table-header px-4 py-2 text-left">Part</th><th className="table-header px-4 py-2">Qty</th><th className="table-header px-4 py-2 text-right">Received</th></tr></thead>
                    <tbody>
                      {data.sales?.map((s) => (
                        <tr key={s._id} className="table-row-hover border-b border-slate-100">
                          <td className="table-cell py-2">{formatDate(s.date)}</td>
                          <td className="table-cell">{s.itemId?.name || "—"}</td>
                          <td className="table-cell">{s.partName || "—"}</td>
                          <td className="table-cell">{s.quantity} {s.partUnit || ""}</td>
                          <td className="table-cell text-right font-medium">{formatMoney(s.amountReceived)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {showStock && (
            <section className="card overflow-hidden">
              <h2 className="p-4 border-b border-slate-100 font-semibold text-slate-800">Jab humne inse khareeda (Stock Entry)</h2>
              <div className="overflow-x-auto">
                {!data.stockEntries?.length ? (
                  <p className="p-6 text-slate-500">Link kiya hua supplier nahi, ya koi stock entry nahi.</p>
                ) : (
                  <table className="w-full">
                    <thead><tr><th className="table-header px-4 py-2 text-left">Date</th><th className="table-header px-4 py-2 text-left">Item</th><th className="table-header px-4 py-2">Weight</th><th className="table-header px-4 py-2 text-right">Paid</th></tr></thead>
                    <tbody>
                      {data.stockEntries?.map((e) => (
                        <tr key={e._id} className="table-row-hover border-b border-slate-100">
                          <td className="table-cell py-2">{formatDate(e.date)}</td>
                          <td className="table-cell">{e.itemId?.name || "—"}</td>
                          <td className="table-cell">{e.receivedWeight}</td>
                          <td className="table-cell text-right font-medium">{formatMoney(e.amountPaid)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
