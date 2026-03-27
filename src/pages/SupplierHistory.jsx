import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE_URL, apiGet } from "../config/api.js";
import { FaArrowLeft, FaFilePdf, FaTruck } from "react-icons/fa";
import { downloadSupplierHistoryPdf } from "../utils/historyPdf.js";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");
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

      <section className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3">
            <h3 className="font-semibold text-slate-800 mb-3">Filter by Date</h3>
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
          </div>
          
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Current Balance</h3>
            <div className={`text-2xl font-black ${data.summary?.finalBalance >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
              Rs. {formatMoney(Math.abs(data.summary?.finalBalance || 0))}
              <span className="text-xs ml-1 font-bold">
                {data.summary?.finalBalance < 0 ? '(Payable)' : data.summary?.finalBalance > 0 ? '(Receivable)' : ''}
              </span>
            </div>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="card p-12 flex justify-center"><div className="loading-spinner" /></div>
      ) : (
        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            {!data.ledger?.length ? (
              <p className="p-12 text-center text-slate-500">Koi transaction nahi mili.</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="table-header px-4 py-3 text-left">Date</th>
                    <th className="table-header px-4 py-3 text-left">Description</th>
                    <th className="table-header px-4 py-3 text-center">Bags</th>
                    <th className="table-header px-4 py-3 text-right">Debit (Dr)</th>
                    <th className="table-header px-4 py-3 text-right">Credit (Cr)</th>
                    <th className="table-header px-4 py-3 text-right bg-amber-50">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ledger.map((item, idx) => (
                    <tr key={idx} className="table-row-hover border-b border-slate-100">
                      <td className="table-cell py-3 whitespace-nowrap text-xs">{formatDate(item.date)}</td>
                      <td className="table-cell text-sm font-medium">
                        <div className="flex flex-col">
                          <span>{item.description}</span>
                          {item.type === 'payment' && <span className="text-[10px] text-slate-500 uppercase">{item.type}</span>}
                        </div>
                      </td>
                      <td className="table-cell text-center font-bold text-slate-600">
                        {item.bags > 0 ? item.bags : '—'}
                      </td>
                      <td className="table-cell text-right font-semibold text-blue-700">
                        {item.debit > 0 ? formatMoney(item.debit) : '—'}
                      </td>
                      <td className="table-cell text-right font-semibold text-emerald-700">
                        {item.credit > 0 ? formatMoney(item.credit) : '—'}
                      </td>
                      <td className={`table-cell text-right font-bold bg-slate-50/50 ${item.balance >= 0 ? 'text-red-800' : 'text-blue-800'}`}>
                        {formatMoney(Math.abs(item.balance))}
                        <span className="text-[9px] ml-1">{item.balance >= 0 ? 'Dr' : 'Cr'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-bold">
                  <tr>
                    <td colSpan="3" className="px-4 py-3 text-right text-slate-700">TOTALS:</td>
                    <td className="px-4 py-3 text-right text-blue-700 border-t-2 border-slate-300">{formatMoney(data.summary?.totalDebit)}</td>
                    <td className="px-4 py-3 text-right text-emerald-700 border-t-2 border-slate-300">{formatMoney(data.summary?.totalCredit)}</td>
                    <td className="px-4 py-3 text-right bg-amber-100 text-amber-900 border-t-2 border-amber-300">
                      {formatMoney(Math.abs(data.summary?.finalBalance || 0))} 
                      <span className="text-[10px] ml-1">{data.summary?.finalBalance >= 0 ? 'Dr' : 'Cr'}</span>
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
