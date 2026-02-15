import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const PAGE_SIZES = [5, 10, 20, 50];

export default function TablePagination({
  page,
  setPage,
  pageSize,
  setPageSize,
  totalItems,
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-600">Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
          }}
          className="input-field w-20 py-1.5 text-sm"
        >
          {PAGE_SIZES.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="text-sm text-slate-500">
          {start}-{end} of {totalItems}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Previous page"
        >
          <FaChevronLeft className="w-4 h-4" />
        </button>
        <span className="px-3 text-sm text-slate-600">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 disabled:opacity-40 disabled:pointer-events-none"
          aria-label="Next page"
        >
          <FaChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
