import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL } from "../config/api.js";
import { FaArrowLeft, FaFilePdf, FaUser } from "react-icons/fa";
import { downloadMazdoorHistoryPdf } from "../utils/historyPdf.js";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");
const formatMoney = (n) => (n != null ? Number(n).toLocaleString("en-PK") : "—");

function getRowType(t) {
  if (t.type === "deposit" && t.category === "udhaar_received") return "Udhaar received";
  if (t.type === "withdraw") return t.category === "udhaar" ? "Udhaar" : "Salary";
  return t.category || "—";
}
function getRowAccount(t) {
  if (t.type === "deposit" && t.toAccountId) return t.toAccountId.name || "—";
  return (t.fromAccountId && t.fromAccountId.name) || "—";
}

export default function MazdoorHistory() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ name: "", transactions: [], totalPaid: 0, totalReceived: 0 });
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
        const params = new URLSearchParams();
        if (dateFrom) params.set("dateFrom", dateFrom);
        if (dateTo) params.set("dateTo", dateTo);
        const res = await fetch(`${API_BASE_URL}/mazdoor/${id}/history?${params}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || "Failed to load history");
        if (!cancelled) setData(json.data || { name: "", transactions: [], totalPaid: 0, totalReceived: 0 });
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
      { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined }
    );
  };

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
            <p className="page-subtitle">Salary / udhaar diya + udhaar wapas liya — saari entries.</p>
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
          <div className="flex flex-wrap gap-4">
            <div className="card p-5 border-l-4 border-l-amber-500 min-w-[180px]">
              <p className="text-sm text-slate-500 font-medium">Total diya (salary + udhaar)</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{formatMoney(data.totalPaid)}</p>
            </div>
            <div className="card p-5 border-l-4 border-l-emerald-500 min-w-[180px]">
              <p className="text-sm text-slate-500 font-medium">Total wapas liya (udhaar)</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{formatMoney(data.totalReceived)}</p>
            </div>
            <div className="card p-5 border-l-4 border-l-slate-400 min-w-[180px]">
              <p className="text-sm text-slate-500 font-medium">Net (diya − wapas)</p>
              <p className="text-2xl font-bold text-slate-800 mt-1">{formatMoney((data.totalPaid ?? 0) - (data.totalReceived ?? 0))}</p>
            </div>
          </div>

          <section className="card overflow-hidden">
            <h2 className="p-4 border-b border-slate-100 font-semibold text-slate-800">Transaction history</h2>
            <div className="overflow-x-auto">
              {data.transactions?.length === 0 ? (
                <p className="p-6 text-slate-500">Abhi koi entry nahi. Mazdoor page se Salary / Udhaar do ya Udhaar wapas lo.</p>
              ) : (
                <table className="w-full">
                  <thead><tr><th className="table-header px-4 py-2 text-left">Date</th><th className="table-header px-4 py-2 text-left">Account</th><th className="table-header px-4 py-2">Type</th><th className="table-header px-4 py-2 text-right">Amount</th><th className="table-header px-4 py-2 text-left">Note</th></tr></thead>
                  <tbody>
                    {data.transactions?.map((t) => {
                      const rowType = getRowType(t);
                      const isReceive = t.type === "deposit" && t.category === "udhaar_received";
                      return (
                        <tr key={t._id} className="table-row-hover border-b border-slate-100">
                          <td className="table-cell py-2">{formatDate(t.date)}</td>
                          <td className="table-cell font-medium">{getRowAccount(t)}</td>
                          <td className="table-cell">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${isReceive ? "bg-emerald-100 text-emerald-800" : rowType === "Udhaar" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"}`}>
                              {rowType}
                            </span>
                          </td>
                          <td className="table-cell text-right font-medium">{formatMoney(t.amount)}</td>
                          <td className="table-cell text-slate-600">{t.note || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
