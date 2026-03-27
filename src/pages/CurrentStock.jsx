import { useState, useEffect, useMemo } from "react";
import { apiGet } from "../config/api.js";
import { downloadCurrentStockPdf } from "../utils/exportPdf.js";
import { FaBoxes, FaSort, FaSortUp, FaSortDown, FaFilePdf } from "react-icons/fa";
import TablePagination from "../components/TablePagination.jsx";

export default function CurrentStock() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState("itemName");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/stock/current");
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
  }, []);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedList = useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      if (sortKey === "quantity") {
        const va = Number(a.quantity) || 0;
        const vb = Number(b.quantity) || 0;
        return sortDir === "asc" ? va - vb : vb - va;
      }
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : -va.localeCompare(vb);
    });
    return arr;
  }, [list, sortKey, sortDir]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, page, pageSize]);

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) return <FaSort className="w-3.5 h-3.5 ml-1 opacity-50" />;
    return sortDir === "asc" ? <FaSortUp className="w-3.5 h-3.5 ml-1" /> : <FaSortDown className="w-3.5 h-3.5 ml-1" />;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaBoxes className="w-7 h-7 text-amber-500" />
            Current Stock
          </h1>
          <p className="page-subtitle">Har item ki current quantity (kg) — purchases minus sales.</p>
        </div>
      </header>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <p className="text-sm text-slate-500">{list.length} item(s) in stock</p>
          <button type="button" onClick={() => downloadCurrentStockPdf(sortedList)} className="btn-primary flex items-center gap-1.5" disabled={list.length === 0} title="Download PDF"><FaFilePdf className="w-4 h-4" /> Export PDF</button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="empty-state">
              <div className="loading-spinner mb-3" />
              <p>Loading...</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("itemName")} className="flex items-center hover:text-slate-800">
                        Item<SortIcon columnKey="itemName" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("category")} className="flex items-center hover:text-slate-800">
                        Category<SortIcon columnKey="category" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("kattay")} className="flex items-center hover:text-slate-800">
                        Remaining Bags<SortIcon columnKey="kattay" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("quantity")} className="flex items-center hover:text-slate-800">
                        Quantity (kg)<SortIcon columnKey="quantity" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("millWeight")} className="flex items-center hover:text-slate-800">
                        Rem. Mill Weight<SortIcon columnKey="millWeight" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("supplierWeight")} className="flex items-center hover:text-slate-800">
                        Rem. Supplier Weight<SortIcon columnKey="supplierWeight" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row, idx) => (
                    <tr key={row.itemId?.toString?.() || idx} className="table-row-hover">
                      <td className="table-cell font-medium">{row.itemName || "—"}</td>
                      <td className="table-cell">{row.category || "—"}</td>
                      <td className="table-cell">{row.kattay != null ? Number(row.kattay) : "—"}</td>
                      <td className="table-cell font-semibold text-slate-800">{row.quantity != null ? Number(row.quantity) : "—"}</td>
                      <td className="table-cell">{row.millWeight != null ? Number(row.millWeight).toFixed(2) : "—"}</td>
                      <td className="table-cell">{row.supplierWeight != null ? Number(row.supplierWeight).toFixed(2) : "—"}</td>
                      <td className="table-cell">{row.quality || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} totalItems={sortedList.length} />
            </>
          )}
          {!loading && list.length === 0 && (
            <div className="empty-state">
              <FaBoxes className="w-12 h-12 text-slate-300 mb-2" />
              <p>Abhi koi stock nahi. Pehle Purchase se entries add karein.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
