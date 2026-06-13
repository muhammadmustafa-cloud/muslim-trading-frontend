import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet } from "../config/api.js";
import { FaArrowLeft, FaWarehouse, FaFilter, FaFilePdf, FaTimes } from "react-icons/fa";
import { downloadWarehouseLedgerPdf } from "../utils/historyPdf.js";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");

export default function WarehouseItemLedger() {
  const { id } = useParams();
  const navigate = useNavigate();

  // Local filter state — does NOT trigger API automatically
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [filterSubItemId, setFilterSubItemId] = useState("");

  // Applied filter state — API is called only when this changes
  const [appliedFilters, setAppliedFilters] = useState({ dateFrom: "", dateTo: "", filterSubItemId: "" });

  const [data, setData] = useState({ itemName: "", subItemsList: [], ledger: [], totals: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiGet(`/items/${id}/warehouse-ledger`, {
        dateFrom: appliedFilters.dateFrom || undefined,
        dateTo: appliedFilters.dateTo || undefined,
        filterSubItemId: appliedFilters.filterSubItemId || undefined,
      });
      setData(res.data || { itemName: "", subItemsList: [], ledger: [], totals: {} });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id, appliedFilters]);

  useEffect(() => { fetchLedger(); }, [fetchLedger]);

  const handleApply = () => {
    setAppliedFilters({ dateFrom, dateTo, filterSubItemId });
  };

  const handleClear = () => {
    setDateFrom("");
    setDateTo("");
    setFilterSubItemId("");
    setAppliedFilters({ dateFrom: "", dateTo: "", filterSubItemId: "" });
  };

  const handlePdf = () => {
    downloadWarehouseLedgerPdf(data, { dateFrom: appliedFilters.dateFrom, dateTo: appliedFilters.dateTo });
  };

  const { totals } = data;
  const hasActiveFilters = appliedFilters.dateFrom || appliedFilters.dateTo || appliedFilters.filterSubItemId;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate("/items")} className="p-2 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors">
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FaWarehouse className="w-7 h-7 text-amber-500" />
              {data.itemName || "Item"} Warehouse Ledger
            </h1>
            <p className="page-subtitle italic font-medium">Detailed IN/OUT rows for this item and all its sub-items in the warehouse.</p>
          </div>
        </div>
        <button type="button" onClick={handlePdf} className="btn-primary flex items-center gap-2" disabled={loading || data.ledger.length === 0}>
          <FaFilePdf className="w-5 h-5" /> Export PDF
        </button>
      </header>

      {error && <div className="card p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

      {/* ── Filter Panel ── */}
      <section className="card p-4 border-l-4 border-l-amber-400">
        <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 uppercase tracking-tighter text-xs">
          <FaFilter className="w-3 h-3" /> Filters &amp; Controls
        </h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="input-label text-xs">From Date</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field w-40" />
          </div>
          <div>
            <label className="input-label text-xs">To Date</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field w-40" />
          </div>
          <div>
            <label className="input-label text-xs">Filter by Sub-Item</label>
            <select value={filterSubItemId} onChange={(e) => setFilterSubItemId(e.target.value)} className="input-field w-48">
              <option value="">All Items (Combined)</option>
              {(data.subItemsList || []).map(si => (
                <option key={si._id} value={si._id}>{si.name} {si.quality ? `(${si.quality})` : ''}</option>
              ))}
            </select>
          </div>

          {/* Apply Button */}
          <button
            type="button"
            onClick={handleApply}
            className="h-[42px] px-5 rounded-xl font-black text-xs uppercase tracking-widest text-white bg-amber-500 hover:bg-amber-600 active:scale-95 transition-all flex items-center gap-2 shadow"
          >
            <FaFilter className="w-3 h-3" /> Search
          </button>

          {/* Clear Button — only visible when filters are active */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClear}
              className="h-[42px] px-4 rounded-xl font-black text-xs uppercase tracking-widest text-slate-600 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-2"
            >
              <FaTimes className="w-3 h-3" /> Clear
            </button>
          )}
        </div>

        {/* Active filter badges */}
        {hasActiveFilters && (
          <div className="mt-3 flex flex-wrap gap-2">
            {appliedFilters.dateFrom && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-full">From: {appliedFilters.dateFrom}</span>
            )}
            {appliedFilters.dateTo && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-full">To: {appliedFilters.dateTo}</span>
            )}
            {appliedFilters.filterSubItemId && (
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                Item: {(data.subItemsList || []).find(si => si._id === appliedFilters.filterSubItemId)?.name || "Selected"}
              </span>
            )}
          </div>
        )}
      </section>

      {loading ? (
        <div className="card p-12 flex justify-center"><div className="loading-spinner" /></div>
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card p-6 bg-white border-b-4 border-b-emerald-500 shadow-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center">Total In (Purchases &amp; Returns)</p>
              <p className="text-3xl font-black text-emerald-700 mt-2 text-center">{(totals.totalInWeight / 40 || 0).toFixed(3)} <span className="text-sm font-bold text-slate-400">MUN</span></p>
              <p className="text-[10px] text-emerald-600 font-bold mt-1 text-center">{totals.totalInBags || 0} Bags | {(totals.totalInWeight || 0).toLocaleString()} Kg</p>
            </div>
            <div className="card p-6 bg-white border-b-4 border-b-indigo-500 shadow-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center">Total Out (Sales)</p>
              <p className="text-3xl font-black text-indigo-700 mt-2 text-center">{(totals.totalOutWeight / 40 || 0).toFixed(3)} <span className="text-sm font-bold text-slate-400">MUN</span></p>
              <p className="text-[10px] text-indigo-600 font-bold mt-1 text-center">{totals.totalOutBags || 0} Bags | {(totals.totalOutWeight || 0).toLocaleString()} Kg</p>
            </div>
            <div className="card p-6 bg-white border-b-4 border-b-amber-500 shadow-sm">
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center">Current Balance</p>
              <p className="text-3xl font-black text-amber-700 mt-2 text-center">{(totals.balanceWeight / 40 || 0).toFixed(3)} <span className="text-sm font-bold text-slate-400">MUN</span></p>
              <p className="text-[10px] text-amber-600 font-bold mt-1 text-center tracking-tighter italic">{totals.balanceBags || 0} Bags | {(totals.balanceWeight || 0).toLocaleString()} Kg</p>
            </div>
          </section>

          <section className="card overflow-hidden border-t border-slate-200 shadow-xl">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h2 className="font-black uppercase tracking-widest text-sm">Detailed In/Out Ledger</h2>
              <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded">{data.ledger.length} Records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-200 text-slate-700 font-black text-[9px] uppercase tracking-widest border-b border-slate-300">
                    <th rowSpan="2" className="py-4 px-3 text-left border-r border-slate-300 w-24">Date</th>
                    <th rowSpan="2" className="py-4 px-3 text-left border-r border-slate-300 w-48">Particulars (Party / Note)</th>
                    <th rowSpan="2" className="py-4 px-3 text-left border-r border-slate-300 w-32">Item</th>
                    <th colSpan="2" className="py-2 px-3 text-center border-r border-slate-300 bg-emerald-100/50 text-emerald-900">Stock IN (Aamad)</th>
                    <th colSpan="2" className="py-2 px-3 text-center border-r border-slate-300 bg-indigo-100/50 text-indigo-900">Stock OUT (Rawangi)</th>
                    <th colSpan="2" className="py-2 px-3 text-center border-r border-slate-300 bg-amber-100/50 text-amber-900">Balance (Baqi)</th>
                  </tr>
                  <tr className="bg-slate-100 text-slate-600 font-black text-[8px] uppercase tracking-widest border-b border-slate-200">
                    <th className="py-2 px-2 text-center border-r border-slate-200 bg-emerald-50">Bags</th>
                    <th className="py-2 px-2 text-center border-r border-slate-200 bg-emerald-50">MUN</th>
                    <th className="py-2 px-2 text-center border-r border-slate-200 bg-indigo-50">Bags</th>
                    <th className="py-2 px-2 text-center border-r border-slate-200 bg-indigo-50">MUN</th>
                    <th className="py-2 px-2 text-center border-r border-slate-200 bg-amber-50">Bags</th>
                    <th className="py-2 px-2 text-center border-r border-slate-200 bg-amber-50">MUN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.ledger.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="py-20 text-center text-slate-400 font-medium">
                        Koi In/Out record nahi mila.
                      </td>
                    </tr>
                  ) : (
                    data.ledger.map((row) => (
                      <tr key={row._id} className="hover:bg-slate-50 transition-colors group text-xs">
                        <td className="py-3 px-3 border-r border-slate-100 text-slate-500 italic">
                          {formatDate(row.date)}
                        </td>
                        <td className="py-3 px-3 border-r border-slate-100">
                          <div className="font-black text-slate-800 uppercase tracking-tighter">
                            {row.partyName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <span className={`px-1 rounded text-[8px] ${row.type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>{row.source}</span>
                            {row.note}
                          </div>
                        </td>
                        <td className="py-3 px-3 border-r border-slate-100">
                          <div className="font-bold text-slate-700 text-[10px] uppercase tracking-tighter">
                            {row.itemName}
                          </div>
                        </td>

                        {/* Stock IN */}
                        <td className="py-3 px-2 text-center border-r border-slate-100 bg-emerald-50/10 font-bold text-emerald-800">
                          {row.type === 'IN' && row.bagsIn > 0 ? row.bagsIn : '—'}
                        </td>
                        <td className="py-3 px-2 text-center border-r border-slate-100 bg-emerald-50/30 font-black text-emerald-900">
                          {row.type === 'IN' && row.weightIn > 0 ? (row.weightIn / 40).toFixed(3) : '—'}
                        </td>

                        {/* Stock OUT */}
                        <td className="py-3 px-2 text-center border-r border-slate-100 bg-indigo-50/10 font-bold text-indigo-800">
                          {row.type === 'OUT' && row.bagsOut > 0 ? row.bagsOut : '—'}
                        </td>
                        <td className="py-3 px-2 text-center border-r border-slate-100 bg-indigo-50/30 font-black text-indigo-900">
                          {row.type === 'OUT' && row.weightOut > 0 ? (row.weightOut / 40).toFixed(3) : '—'}
                        </td>

                        {/* Balance */}
                        <td className="py-3 px-2 text-center border-r border-slate-100 bg-amber-50/10 font-bold">
                          {row.balanceBags}
                        </td>
                        <td className={`py-3 px-2 text-center border-r border-slate-100 bg-amber-50/30 font-black ${row.balanceWeight < 0 ? 'text-red-600' : 'text-amber-800'}`}>
                          {(row.balanceWeight / 40).toFixed(3)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black text-[10px] uppercase">
                  <tr>
                    <td colSpan="3" className="py-4 px-3 text-right border-r border-slate-800 italic">Total Summary:</td>
                    <td className="py-4 px-2 text-center border-r border-slate-800 text-emerald-400">{totals.totalInBags || 0}</td>
                    <td className="py-4 px-2 text-center border-r border-slate-800 text-emerald-300 text-xs">{(totals.totalInWeight / 40 || 0).toFixed(3)}</td>
                    <td className="py-4 px-2 text-center border-r border-slate-800 text-indigo-400">{totals.totalOutBags || 0}</td>
                    <td className="py-4 px-2 text-center border-r border-slate-800 text-indigo-300 text-xs">{(totals.totalOutWeight / 40 || 0).toFixed(3)}</td>
                    <td className="py-4 px-2 text-center border-r border-slate-800 text-amber-400">{totals.balanceBags || 0}</td>
                    <td className="py-4 px-2 text-center border-r border-slate-800 text-amber-300 text-xs">{(totals.balanceWeight / 40 || 0).toFixed(3)}</td>
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
