import { useState, useEffect } from "react";
import { API_BASE_URL, apiGet } from "../config/api.js";
import { FaFileInvoiceDollar, FaCalendarDay, FaFilter } from "react-icons/fa";

const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const formatTime = (d) => (d ? new Date(d).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit" }) : "—");
const getToday = () => new Date().toISOString().slice(0, 10);

const TYPE_LABELS = {
  sale: "Sale",
  stock_entry: "Purchase",
  deposit: "Deposit",
  withdraw: "Withdraw",
  transfer: "Transfer",
  mill_expense: "Mill Expense",
  mazdoor_expense: "Mazdoor Expense",
};

export default function DailyCashMemo() {
  const today = getToday();
  const [list, setList] = useState([]);
  const [summary, setSummary] = useState({ openingBalance: 0, totalIn: 0, totalOut: 0, closingBalance: 0 });
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [mazdoor, setMazdoor] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState(() => ({
    dateFrom: today,
    dateTo: today,
    accountId: "",
    customerId: "",
    supplierId: "",
    mazdoorId: "",
    itemId: "",
  }));
  const [showFilters, setShowFilters] = useState(false);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params = { dateFrom: filters.dateFrom, dateTo: filters.dateTo };
      if (filters.accountId) params.accountId = filters.accountId;
      if (filters.customerId) params.customerId = filters.customerId;
      if (filters.supplierId) params.supplierId = filters.supplierId;
      if (filters.mazdoorId) params.mazdoorId = filters.mazdoorId;
      if (filters.itemId) params.itemId = filters.itemId;
      const data = await apiGet("/daily-memo", params);
      setList(data.data || []);
      setSummary(data.summary || { openingBalance: 0, totalIn: 0, totalOut: 0, closingBalance: 0 });
    } catch (e) {
      setError(e.message);
      setList([]);
      setSummary({ openingBalance: 0, totalIn: 0, totalOut: 0, closingBalance: 0 });
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [acc, cust, sup, maz, it] = await Promise.all([
        apiGet("/accounts"),
        apiGet("/customers"),
        apiGet("/suppliers"),
        apiGet("/mazdoor"),
        apiGet("/items"),
      ]);
      if (acc.data) setAccounts(acc.data);
      if (cust.data) setCustomers(cust.data);
      if (sup.data) setSuppliers(sup.data);
      if (maz.data) setMazdoor(maz.data);
      if (it.data) setItems(it.data);
    } catch (_) {}
  };

  useEffect(() => {
    fetchList();
  }, [filters.dateFrom, filters.dateTo, filters.accountId, filters.customerId, filters.supplierId, filters.mazdoorId, filters.itemId]);
  useEffect(() => {
    fetchOptions();
  }, []);

  const setFilterToday = () => {
    const t = getToday();
    setFilters((prev) => ({ ...prev, dateFrom: t, dateTo: t }));
  };

  const clearFilters = () => {
    const t = getToday();
    setFilters({
      dateFrom: t,
      dateTo: t,
      accountId: "",
      customerId: "",
      supplierId: "",
      mazdoorId: "",
      itemId: "",
    });
  };

  const totalIn = summary.totalIn;
  const totalOut = summary.totalOut;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <FaFileInvoiceDollar className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Daily Cash Memo</h1>
            <p className="text-slate-500 text-sm">Aaj ki saari transactions — sales, purchase, udhaar, salary, deposit, withdraw, transfer</p>
          </div>
        </div>
      </div>

      {/* Date & Aaj */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <FaCalendarDay className="text-slate-500" />
            <label className="text-sm font-medium text-slate-600">Date</label>
          </div>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value, dateTo: e.target.value }))}
            className="input border border-slate-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={setFilterToday}
            className="btn bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Aaj (Today)
          </button>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="btn border border-slate-200 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            <FaFilter className="w-4 h-4" />
            {showFilters ? "Hide filters" : "Filters"}
          </button>
          {showFilters && (
            <button type="button" onClick={clearFilters} className="btn border border-slate-200 hover:bg-slate-50 px-3 py-2 rounded-lg text-sm">
              Clear filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Account</label>
              <select
                value={filters.accountId}
                onChange={(e) => setFilters((p) => ({ ...p, accountId: e.target.value }))}
                className="input w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Customer</label>
              <select
                value={filters.customerId}
                onChange={(e) => setFilters((p) => ({ ...p, customerId: e.target.value }))}
                className="input w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Supplier</label>
              <select
                value={filters.supplierId}
                onChange={(e) => setFilters((p) => ({ ...p, supplierId: e.target.value }))}
                className="input w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Mazdoor</label>
              <select
                value={filters.mazdoorId}
                onChange={(e) => setFilters((p) => ({ ...p, mazdoorId: e.target.value }))}
                className="input w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {mazdoor.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Item (Khata)</label>
              <select
                value={filters.itemId}
                onChange={(e) => setFilters((p) => ({ ...p, itemId: e.target.value }))}
                className="input w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">All</option>
                {items.map((i) => (
                  <option key={i._id} value={i._id}>{i.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <p className="text-sm text-emerald-700 font-medium">Total In</p>
          <p className="text-2xl font-bold text-emerald-800">{formatMoney(totalIn)}</p>
        </div>
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
          <p className="text-sm text-rose-700 font-medium">Total Out</p>
          <p className="text-2xl font-bold text-rose-800">{formatMoney(totalOut)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : list.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No records for selected date/filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Date / Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Type</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Description</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Account</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-600">Party / Item</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">In</th>
                  <th className="text-right py-3 px-4 font-semibold text-slate-600">Out</th>
                </tr>
              </thead>
              <tbody>
                {/* Previous Balance Row (Opening) */}
                <tr className="bg-slate-50 border-b border-slate-200">
                  <td className="py-2.5 px-4 text-slate-400 font-bold">—</td>
                  <td className="py-2.5 px-4 font-bold">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-200 text-slate-700 uppercase">Opening</span>
                  </td>
                  <td className="py-2.5 px-4 text-slate-800 font-bold italic">Previous Balance (Opening Balance)</td>
                  <td className="py-2.5 px-4 text-slate-400">—</td>
                  <td className="py-2.5 px-4 text-slate-400">—</td>
                  <td className="py-2.5 px-4 text-right font-black text-emerald-700 bg-emerald-50/20">
                    {summary.openingBalance > 0 ? formatMoney(summary.openingBalance) : ""}
                  </td>
                  <td className="py-2.5 px-4 text-right font-black text-rose-700 bg-rose-50/20">
                    {summary.openingBalance < 0 ? formatMoney(Math.abs(summary.openingBalance)) : ""}
                  </td>
                </tr>

                {list.map((row, idx) => (
                  <tr key={`${row.type}-${row.referenceId}-${idx}`} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="py-2.5 px-4 text-slate-700">
                      {formatDate(row.date)} {formatTime(row.date)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                          row.type === "sale" || row.type === "deposit"
                            ? "bg-emerald-100 text-emerald-800"
                            : row.type === "stock_entry" || row.type === "withdraw"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {TYPE_LABELS[row.type] || row.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-800">{row.description || "—"}</td>
                    <td className="py-2.5 px-4 text-slate-600">{row.accountName || "—"}</td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {row.customerName || row.supplierName || row.mazdoorName || row.itemName || "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-emerald-700">
                      {row.amountType === "in" ? formatMoney(row.amount) : "—"}
                    </td>
                    <td className="py-2.5 px-4 text-right font-medium text-rose-700">
                      {row.amountType === "out" ? formatMoney(row.amount) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* End summary: total added, total deducted, overall total */}
      {!loading && list.length > 0 && (
        <div className="mt-6 bg-slate-800 text-white rounded-xl border border-slate-700 overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-0">
            <div className="p-5 border-b sm:border-b-0 sm:border-r border-slate-600">
              <p className="text-slate-400 text-sm font-medium">Total Added</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">{formatMoney(totalIn)}</p>
            </div>
            <div className="p-5 border-b sm:border-b-0 sm:border-r border-slate-600">
              <p className="text-slate-400 text-sm font-medium">Total Deducted</p>
              <p className="text-xl font-bold text-rose-400 mt-1">{formatMoney(totalOut)}</p>
            </div>
            <div className="p-5">
              <p className="text-slate-400 text-sm font-medium">Overall Total (Net)</p>
              <p className={`text-xl font-bold mt-1 ${totalIn - totalOut >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {formatMoney(totalIn - totalOut)}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{totalIn - totalOut >= 0 ? "More in than out" : "More out than in"}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
