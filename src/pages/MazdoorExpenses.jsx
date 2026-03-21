import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiPost, apiDelete } from "../config/api.js";
import {
  FaMoneyBillWave,
  FaPlus,
  FaArrowLeft,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";
import TablePagination from "../components/TablePagination.jsx";
import SearchableSelect from "../components/SearchableSelect.jsx";

const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const getToday = () => new Date().toISOString().slice(0, 10);

export default function MazdoorExpenses() {
  const navigate = useNavigate();
  const today = getToday();
  const [list, setList] = useState([]);
  const [mazdoor, setMazdoor] = useState([]);
  const [items, setItems] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(() => {
    const t = getToday();
    return { dateFrom: t, dateTo: t, mazdoorId: "" };
  });
  const [form, setForm] = useState({
    date: today,
    mazdoorId: "",
    mazdoorItemId: "",
    bags: "",
    accountId: "",
  });
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const selectedItem = useMemo(() => items.find((i) => i._id === form.mazdoorItemId), [items, form.mazdoorItemId]);
  const rate = selectedItem ? Number(selectedItem.rate) || 0 : 0;
  const bagsNum = Number(form.bags);
  const totalPrice = !isNaN(bagsNum) && bagsNum >= 0 ? rate * bagsNum : 0;

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.mazdoorId) params.set("mazdoorId", filters.mazdoorId);
      const res = await fetch(`${API_BASE_URL}/mazdoor-expenses?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch");
      setList(data.data || []);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMazdoor = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/mazdoor`);
      const data = await res.json();
      if (res.ok) setMazdoor(data.data || []);
    } catch (_) { }
  };
  const fetchItems = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/mazdoor-items`);
      const data = await res.json();
      if (res.ok) setItems(data.data || []);
    } catch (_) { }
  };
  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/accounts`);
      const data = await res.json();
      if (res.ok) setAccounts(data.data || []);
    } catch (_) { }
  };

  useEffect(() => {
    fetchList();
  }, [filters.dateFrom, filters.dateTo, filters.mazdoorId]);
  useEffect(() => {
    fetchMazdoor();
    fetchItems();
    fetchAccounts();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [filters.dateFrom, filters.dateTo, filters.mazdoorId]);

  const setFilterToday = () => {
    const t = getToday();
    setFilters({ dateFrom: t, dateTo: t, mazdoorId: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.mazdoorId || !form.mazdoorItemId) {
      setError("Mazdoor aur item select karein.");
      return;
    }
    const bags = Number(form.bags);
    if (isNaN(bags) || bags < 0) {
      setError("Valid bags enter karein.");
      return;
    }
    if (!form.accountId) {
      setError("Account select karein (jahan se paisa deduct hoga).");
      return;
    }
    if (totalPrice <= 0) {
      setError("Total 0 se zyada hona chahiye — item ka rate check karein.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await apiPost("/mazdoor-expenses", {
        date: form.date,
        mazdoorId: form.mazdoorId,
        mazdoorItemId: form.mazdoorItemId,
        bags,
        accountId: form.accountId,
      });
      setForm({ date: today, mazdoorId: form.mazdoorId, mazdoorItemId: "", bags: "", accountId: "" });
      fetchList();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };


  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir(key === "date" ? "desc" : "asc");
    }
  };

  const sortedList = useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      if (sortKey === "date") {
        const va = new Date(a.date).getTime();
        const vb = new Date(b.date).getTime();
        return sortDir === "asc" ? va - vb : vb - va;
      }
      if (sortKey === "mazdoor") {
        const va = (a.mazdoorId?.name || "").toLowerCase();
        const vb = (b.mazdoorId?.name || "").toLowerCase();
        return sortDir === "asc" ? va.localeCompare(vb) : -va.localeCompare(vb);
      }
      if (sortKey === "total") {
        const va = Number(a.totalAmount) || 0;
        const vb = Number(b.totalAmount) || 0;
        return sortDir === "asc" ? va - vb : vb - va;
      }
      return 0;
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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/mazdoor/management")}
            className="p-2 rounded-lg hover:bg-slate-200 text-slate-600"
          >
            <FaArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <FaMoneyBillWave className="w-7 h-7 text-amber-500" />
              Mazdoor Expenses
            </h1>
            <p className="page-subtitle">Mazdoor select karein, item aur bags daalein — total auto calculate. Paisa account se deduct hoga.</p>
          </div>
        </div>
      </header>

      {error && (
        <div className="card p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>
      )}

      {/* Add expense form */}
      <section className="card p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Naya expense add karein</h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div>
            <label className="input-label">Tarikh</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="input-field"
            />
          </div>
          <div>
            <label className="input-label">Mazdoor *</label>
            <SearchableSelect
              options={mazdoor}
              value={form.mazdoorId}
              onChange={(val) => setForm((f) => ({ ...f, mazdoorId: val }))}
              placeholder="Select mazdoor"
            />
          </div>
          <div>
            <label className="input-label">Item *</label>
            <SearchableSelect
              options={items.map(i => ({ _id: i._id, name: `${i.name} (rate: ${formatMoney(i.rate)})` }))}
              value={form.mazdoorItemId}
              onChange={(val) => setForm((f) => ({ ...f, mazdoorItemId: val }))}
              placeholder="Select item"
            />
          </div>
          <div>
            <label className="input-label">Bags *</label>
            <input
              type="number"
              placeholder="0"
              value={form.bags}
              onChange={(e) => setForm((f) => ({ ...f, bags: e.target.value }))}
              className="input-field"
              min="0"
              step="1"
              required
            />
          </div>
          <div>
            <label className="input-label">Total</label>
            <div className="input-field bg-slate-50 font-semibold text-slate-800">
              {formatMoney(totalPrice)}
            </div>
          </div>
          <div>
            <label className="input-label">Account (jahan se deduct) *</label>
            <SearchableSelect
              options={accounts}
              value={form.accountId}
              onChange={(val) => setForm((f) => ({ ...f, accountId: val }))}
              placeholder="Select account"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-6">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Adding...
                </span>
              ) : (
                <>
                  <FaPlus className="w-4 h-4" /> Add expense
                </>
              )}
            </button>
          </div>
        </form>
      </section>


      {/* List */}
      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="input-label text-xs">Date from</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))}
                className="input-field w-40"
              />
            </div>
            <div>
              <label className="input-label text-xs">Date to</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))}
                className="input-field w-40"
              />
            </div>
            <div>
              <label className="input-label text-xs">Mazdoor</label>
              <SearchableSelect
                options={mazdoor}
                value={filters.mazdoorId}
                onChange={(val) => setFilters((f) => ({ ...f, mazdoorId: val }))}
                placeholder="All mazdoor"
                className="w-56"
              />
            </div>
            <button type="button" onClick={setFilterToday} className="btn-secondary self-end">
              Aaj (Today)
            </button>
          </div>
          <p className="text-sm text-slate-500 ml-auto">{list.length} expense(s)</p>
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
                      <button type="button" onClick={() => toggleSort("date")} className="flex items-center hover:text-slate-800">
                        Date <SortIcon columnKey="date" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("mazdoor")} className="flex items-center hover:text-slate-800">
                        Mazdoor <SortIcon columnKey="mazdoor" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">Item</th>
                    <th className="table-header px-5 py-3.5">Bags</th>
                    <th className="table-header px-5 py-3.5">Rate</th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("total")} className="flex items-center hover:text-slate-800">
                        Total <SortIcon columnKey="total" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">Account</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      <td className="table-cell">{formatDate(row.date)}</td>
                      <td className="table-cell font-medium">{row.mazdoorId?.name ?? "—"}</td>
                      <td className="table-cell">{row.mazdoorItemId?.name ?? "—"}</td>
                      <td className="table-cell">{row.bags != null ? row.bags : "—"}</td>
                      <td className="table-cell">{formatMoney(row.mazdoorItemId?.rate)}</td>
                      <td className="table-cell font-semibold text-slate-800">{formatMoney(row.totalAmount)}</td>
                      <td className="table-cell">{row.accountId?.name ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination
                page={page}
                setPage={setPage}
                pageSize={pageSize}
                setPageSize={setPageSize}
                totalItems={sortedList.length}
              />
            </>
          )}
          {!loading && list.length === 0 && (
            <div className="empty-state py-8">
              <FaMoneyBillWave className="w-12 h-12 text-slate-300 mb-2" />
              <p>
                {filters.dateFrom || filters.dateTo
                  ? "Is date range mein koi expense nahi. Filter change karein ya upar form se add karein."
                  : "Abhi koi expense nahi. Upar form se add karein."}
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
