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
  salary: "Salary Payment",
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

  // Professional Absolute Summation (Rolling Pool)
  const totalIn = Number(summary.openingBalance > 0 ? summary.openingBalance : 0) + Number(summary.totalIn || 0);
  const totalOut = Number(summary.openingBalance < 0 ? Math.abs(summary.openingBalance) : 0) + Number(summary.totalOut || 0);

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <FaFileInvoiceDollar className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Daily Cash Memo</h1>
            <p className="text-slate-500 text-sm font-medium italic">Mukammal Hisaab Kitab — Full Account & Participant Traceability</p>
          </div>
        </div>
      </div>

      {/* Date & Aaj */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-soft p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <FaCalendarDay className="text-slate-500" />
            <label className="text-sm font-semibold text-slate-700">Date Range:</label>
          </div>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters((p) => ({ ...p, dateFrom: e.target.value, dateTo: e.target.value }))}
            className="input border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
          />
          <button
            type="button"
            onClick={setFilterToday}
            className="btn bg-slate-800 hover:bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-bold transition-all shadow-sm"
          >
            Aaj (Today)
          </button>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            className="btn border border-slate-300 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm flex items-center gap-2 font-semibold text-slate-700 transition-colors"
          >
            <FaFilter className="w-3.5 h-3.5" />
            {showFilters ? "Hide options" : "More Filters"}
          </button>
          {showFilters && (
            <button type="button" onClick={clearFilters} className="btn border border-rose-200 text-rose-600 hover:bg-rose-50 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              Reset
            </button>
          )}
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 animate-in slide-in-from-top-2">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Account</label>
              <select
                value={filters.accountId}
                onChange={(e) => setFilters((p) => ({ ...p, accountId: e.target.value }))}
                className="input w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none"
              >
                <option value="">All Accounts</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Customer</label>
              <select
                value={filters.customerId}
                onChange={(e) => setFilters((p) => ({ ...p, customerId: e.target.value }))}
                className="input w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none"
              >
                <option value="">All Customers</option>
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Supplier</label>
              <select
                value={filters.supplierId}
                onChange={(e) => setFilters((p) => ({ ...p, supplierId: e.target.value }))}
                className="input w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none"
              >
                <option value="">All Suppliers</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Mazdoor</label>
              <select
                value={filters.mazdoorId}
                onChange={(e) => setFilters((p) => ({ ...p, mazdoorId: e.target.value }))}
                className="input w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none"
              >
                <option value="">All Mazdoor</option>
                {mazdoor.map((m) => (
                  <option key={m._id} value={m._id}>{m.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Item</label>
              <select
                value={filters.itemId}
                onChange={(e) => setFilters((p) => ({ ...p, itemId: e.target.value }))}
                className="input w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-amber-500 outline-none"
              >
                <option value="">All Items</option>
                {items.map((i) => (
                  <option key={i._id} value={i._id}>{i.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 animate-bounce">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-white border-l-4 border-emerald-500 rounded-xl p-5 shadow-soft transition-all hover:translate-y-[-2px]">
          <p className="text-[10px] uppercase font-black text-emerald-600 mb-1 tracking-widest">TOTAL CREDITS (IN)</p>
          <p className="text-3xl font-black text-emerald-800">{formatMoney(totalIn)}</p>
        </div>
        <div className="bg-white border-l-4 border-rose-500 rounded-xl p-5 shadow-soft transition-all hover:translate-y-[-2px]">
          <p className="text-[10px] uppercase font-black text-rose-600 mb-1 tracking-widest">TOTAL DEBITS (OUT)</p>
          <p className="text-3xl font-black text-rose-800">{formatMoney(totalOut)}</p>
        </div>
        <div className="bg-white border-l-4 border-indigo-500 rounded-xl p-5 shadow-soft transition-all hover:translate-y-[-2px]">
          <p className="text-[10px] uppercase font-black text-indigo-600 mb-1 tracking-widest">NET MOVEMENT</p>
          <p className="text-3xl font-black text-indigo-800">{formatMoney(totalIn - totalOut)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-soft">
        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium tracking-widest uppercase text-xs">Processing Ledger...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
             <FaFileInvoiceDollar className="w-10 h-10 text-slate-200 mx-auto mb-3" />
             <p className="font-bold text-slate-700">No records found for the selected date.</p>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row">
            {/* LEFT SIDE: OUT (Debit) */}
            <div className="flex-1 w-full lg:w-1/2 border-b lg:border-b-0 lg:border-r border-slate-200">
              <div className="bg-slate-900 py-4 px-4 border-b border-slate-800 flex justify-between items-center shadow-inner">
                <h3 className="font-black text-white uppercase text-xs tracking-widest">Debit (Payments Made)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-tighter border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-3">Date</th>
                      <th className="text-left py-3 px-3">Account → Participant</th>
                      <th className="text-right py-3 px-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.openingBalance < 0 && (
                      <tr className="bg-slate-50/50 border-b border-slate-200">
                        <td className="py-4 px-3 text-slate-400 font-bold">—</td>
                        <td className="py-4 px-3">
                           <div className="font-black text-slate-800 uppercase text-[11px] tracking-wider italic">PREVIOUS BALANCE</div>
                           <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Opening Balance</div>
                        </td>
                        <td className="py-4 px-3 text-right font-black text-rose-700 bg-rose-50/20 text-base">
                          {formatMoney(Math.abs(summary.openingBalance))}
                        </td>
                      </tr>
                    )}
                    {list.filter(r => r.amountType === 'out').map((row, idx) => (
                      <tr key={`out-${idx}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-3 text-slate-400 whitespace-nowrap text-[11px]">{formatDate(row.date)}</td>
                        <td className="py-4 px-3">
                           <div className="font-bold text-slate-700 leading-tight">
                              {row.accountName} <span className="text-rose-500 mx-1">➜</span> {row.name || "—"}
                           </div>
                           <div className="text-[10px] text-slate-400 uppercase tracking-tighter mt-1 italic">{row.description}</div>
                        </td>
                        <td className="py-4 px-3 text-right font-black text-rose-600 text-base">{formatMoney(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 text-slate-800 font-black border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="py-5 px-3 text-right text-[10px] uppercase tracking-widest text-slate-500">TOTAL DEBITS:</td>
                      <td className="py-5 px-3 text-right text-lg text-rose-700 font-black bg-rose-50/10 underline decoration-double underline-offset-4">{formatMoney(totalOut)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* RIGHT SIDE: IN (Credit) */}
            <div className="flex-1 w-full lg:w-1/2">
              <div className="bg-slate-800 py-4 px-4 border-b border-slate-700 flex justify-between items-center shadow-inner">
                <h3 className="font-black text-white uppercase text-xs tracking-widest">Credit (Payments Received)</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-tighter border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-3">Date</th>
                      <th className="text-left py-3 px-3">Account → Participant</th>
                      <th className="text-right py-3 px-3">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.openingBalance > 0 && (
                      <tr className="bg-slate-50/50 border-b border-slate-200 group">
                        <td className="py-4 px-3 text-slate-400 font-bold">—</td>
                        <td className="py-4 px-3">
                           <div className="font-black text-slate-800 uppercase text-[11px] tracking-wider italic">PREVIOUS BALANCE</div>
                           <div className="text-[9px] text-slate-400 uppercase font-bold tracking-tighter">Opening Balance</div>
                        </td>
                        <td className="py-4 px-3 text-right font-black text-emerald-700 bg-emerald-50/20 text-base">
                          {formatMoney(summary.openingBalance)}
                        </td>
                      </tr>
                    )}
                    {list.filter(r => r.amountType === 'in').map((row, idx) => (
                      <tr key={`in-${idx}`} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="py-4 px-3 text-slate-400 whitespace-nowrap text-[11px]">{formatDate(row.date)}</td>
                        <td className="py-4 px-3">
                           <div className="font-bold text-slate-800 leading-tight">
                              {row.accountName} <span className="text-rose-500 mx-1">➜</span> {row.name || "—"}
                           </div>
                           <div className="text-[10px] text-slate-400 uppercase tracking-tighter mt-1 italic">{row.description}</div>
                        </td>
                        <td className="py-4 px-3 text-right font-black text-emerald-600 text-base">{formatMoney(row.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-50 text-slate-800 font-black border-t border-slate-200">
                    <tr>
                      <td colSpan={2} className="py-5 px-3 text-right text-[10px] uppercase tracking-widest text-slate-500">TOTAL CREDITS:</td>
                      <td className="py-5 px-3 text-right text-lg text-emerald-700 font-black bg-emerald-50/10 underline decoration-double underline-offset-4">{formatMoney(totalIn)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* End summary: total added, total deducted, overall total */}
      {!loading && list.length > 0 && (
        <div className="mt-8 bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-x divide-slate-700">
            <div className="p-6 bg-slate-800/50">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Available Cash (Wasooli)</p>
              <p className="text-2xl font-black text-emerald-400">Rs. {formatMoney(totalIn)}</p>
              <div className="mt-2 text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Rolling Pool: {formatMoney(summary.openingBalance > 0 ? summary.openingBalance : 0)} + {formatMoney(summary.totalIn)}</div>
            </div>
            <div className="p-6 bg-slate-900/40">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Payments (Kharch)</p>
              <p className="text-2xl font-black text-rose-400">Rs. {formatMoney(totalOut)}</p>
              <div className="mt-2 text-[9px] text-slate-500 font-bold uppercase tracking-tighter">Total Cash Outflow</div>
            </div>
            <div className="p-6 bg-slate-800 hover:bg-slate-700/50 transition-colors">
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1 font-bold">CALCULATED BAQAYA (Net)</p>
              <p className={`text-3xl font-black mt-1 ${totalIn - totalOut >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {formatMoney(totalIn - totalOut)}
              </p>
              <p className="text-[10px] text-slate-400 mt-2 font-bold italic">Cash presently remaining in mill box</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
