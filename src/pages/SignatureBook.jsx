import { useState, useEffect } from "react";
import { apiGet } from "../config/api.js";
import { downloadSignatureBookPdf } from "../utils/exportPdf.js";
import { FaBookOpen, FaImage, FaFilePdf } from "react-icons/fa";
import TablePagination from "../components/TablePagination.jsx";
import ImagePreviewModal from "../components/ImagePreviewModal.jsx";

const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "—");

export default function SignatureBook() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/transactions", {
        isSignatureBook: "true",
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        page,
        limit: pageSize,
      });
      setList(data.data || []);
      setTotalItems(data.totalCount || 0);
    } catch (e) {
      setError(e.message);
      setList([]);
      setTotalItems(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [page, pageSize, dateFrom, dateTo]);

  const exportData = async () => {
    try {
      const data = await apiGet("/transactions", {
        isSignatureBook: "true",
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        export: "true"
      });
      const exportList = data.data || [];
      if (exportList.length === 0) {
        alert("No data to export");
        return;
      }
      downloadSignatureBookPdf(exportList, { dateFrom, dateTo });
    } catch (e) {
      alert("Export failed: " + e.message);
    }
  };

  const getName = (row) => {
    // We try to find the populated name. 
    // Since this is fetching from the backend non-unified list, populated objects are returned.
    return row.customerId?.name || row.supplierId?.name || row.mazdoorId?.name || "—";
  };

  const getAccountName = (row) => {
    if (row.type === 'deposit') return row.toAccountId?.name || "—";
    if (row.type === 'withdraw' || row.type === 'tax' || row.type === 'expense' || row.type === 'salary') return row.fromAccountId?.name || "—";
    if (row.type === 'transfer') return `${row.fromAccountId?.name || "—"} ➔ ${row.toAccountId?.name || "—"}`;
    return row.fromAccountId?.name || row.toAccountId?.name || "—";
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaBookOpen className="w-7 h-7 text-indigo-500" />
            Signature Book
          </h1>
          <p className="page-subtitle">
            Transactions marked for the signature book listing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="input-field py-1.5 text-sm w-36" />
            <span className="text-slate-400 text-sm">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="input-field py-1.5 text-sm w-36" />
          </div>
          <button type="button" onClick={exportData} className="btn-primary py-1.5 flex items-center gap-1.5 text-sm" disabled={totalItems === 0} title="Download PDF">
            <FaFilePdf className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </header>

      <section className="card">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="empty-state"><div className="loading-spinner mb-3" /><p>Loading...</p></div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header px-5 py-3.5">Date</th>
                    <th className="table-header px-5 py-3.5">Name</th>
                    <th className="table-header px-5 py-3.5">Account</th>
                    <th className="table-header px-5 py-3.5 text-right">Amount</th>
                    <th className="table-header px-5 py-3.5 text-center">Cheque No.</th>
                    <th className="table-header px-5 py-3.5 text-center">Cheque Date</th>
                    <th className="table-header px-5 py-3.5 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      <td className="table-cell text-sm">{formatDate(row.date)}</td>
                      <td className="table-cell font-bold text-slate-800">{getName(row)}</td>
                      <td className="table-cell text-slate-600">{getAccountName(row)}</td>
                      <td className="table-cell text-right font-black text-indigo-600">{formatMoney(row.amount)}</td>
                      <td className="table-cell text-center">{row.chequeNumber || "—"}</td>
                      <td className="table-cell text-center">{formatDate(row.chequeDate)}</td>
                      <td className="table-cell text-center">
                        {row.image && (
                          <button
                            type="button"
                            onClick={() => setPreviewImage(row.image)}
                            className="btn-ghost-primary flex items-center justify-center p-1.5 text-indigo-500 hover:text-indigo-700 bg-indigo-50 rounded mx-auto"
                            title="Preview Receipt"
                          >
                            <FaImage className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} totalItems={totalItems} />
            </>
          )}
          {!loading && list.length === 0 && (
            <div className="empty-state">
              <FaBookOpen className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-medium text-slate-700">No records found.</p>
              <p className="text-sm text-slate-500 mt-1">Mark transactions with "Add to Signature Book (Listing)" to see them here.</p>
            </div>
          )}
        </div>
      </section>

      <ImagePreviewModal
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage}
        title="Transaction Receipt Preview"
      />
    </div>
  );
}
