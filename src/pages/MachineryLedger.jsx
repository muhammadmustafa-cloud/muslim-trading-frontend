import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../config/api.js";
import { downloadMachineryLedgerPdf } from "../utils/exportPdf.js";
import { FaBook, FaSearch, FaEye, FaFilePdf } from "react-icons/fa";
import TablePagination from "../components/TablePagination.jsx";

const formatMoney = (n) => (n == null || n === 0 ? "—" : Number(n).toLocaleString("en-PK"));

export default function MachineryLedger() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/machinery-items", { search: search || undefined });
      setList(data.data || []);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [search]);

  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => b.totalCost - a.totalCost);
  }, [list]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, page, pageSize]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaBook className="w-7 h-7 text-amber-500" /> Machinery Ledger
          </h1>
          <p className="page-subtitle">Machinery items ka mukammal investment aur khata list.</p>
        </div>
      </header>

      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input pl-9" />
          </div>
          <p className="text-sm text-slate-500">{list.length} item(s)</p>
          <button type="button" onClick={() => downloadMachineryLedgerPdf(sortedList)} className="btn-primary flex items-center gap-1.5 shadow-indigo-200" disabled={list.length === 0}><FaFilePdf className="w-4 h-4" /> Export PDF</button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center"><div className="loading-spinner mb-3" />Loading...</div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase text-left">Machinery Item</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase text-left">Model/Quality</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase text-right">Total Investment (Debit)</th>
                    <th className="px-5 py-4 text-xs font-bold text-slate-500 uppercase w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4 text-sm font-semibold text-slate-900">{row.name}</td>
                      <td className="px-5 py-4 text-sm text-slate-500">{row.quality || "—"}</td>
                      <td className="px-5 py-4 text-sm text-right font-black text-rose-700">{formatMoney(row.totalCost)}</td>
                      <td className="px-5 py-4 text-sm text-center">
                        <button 
                          onClick={() => navigate(`/machinery-items/${row._id}/khata`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm"
                        >
                          <FaEye className="w-3 h-3" /> View Khata
                        </button>
                      </td>
                    </tr>
                  ))}
                  {paginatedList.length === 0 && (
                    <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-medium italic">No machinery items found.</td></tr>
                  )}
                </tbody>
              </table>
              <TablePagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} totalItems={sortedList.length} />
            </>
          )}
        </div>
      </section>
    </div>
  );
}
