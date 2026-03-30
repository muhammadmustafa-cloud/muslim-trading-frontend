import { useState, useEffect, useMemo } from "react";
import { apiGet } from "../config/api.js";
import {
  FaFileContract,
  FaArrowUp,
  FaArrowDown,
  FaWallet,
  FaUsers,
  FaBoxes,
  FaTools,
  FaFilePdf,
  FaCalendarAlt,
  FaSearch,
  FaUserTie,
  FaIndustry,
  FaTruckLoading,
  FaMoneyBillWave,
} from "react-icons/fa";
import { downloadAuditSummaryPdf } from "../utils/exportPdf.js";

const formatMoney = (n) =>
  n == null ? "0" : Math.abs(Number(n)).toLocaleString("en-PK");
const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
const getToday = () => new Date().toISOString().slice(0, 10);

export default function AuditSummary() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: getToday() });
  const [activeTab, setActiveTab] = useState("master_log");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchSummary = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await apiGet("/audit/summary", filters);
      setData(resp.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handlePdf = () => {
    if (data) {
      downloadAuditSummaryPdf(data, filters);
    }
  };

  const getNetPosition = () => {
    if (!data) return 0;
    const assets =
      data.totalCash +
      data.totalReceivables +
      data.totalStockValue +
      data.totalMachineryValue;
    return assets - data.totalPayables;
  };

  const tabs = [
    { id: "master_log", label: "Master Entries Audit", icon: FaFileContract },
    { id: "overview", label: "Overview", icon: FaFileContract },
    { id: "customers", label: "Customers (Receivables)", icon: FaUsers },
    { id: "suppliers", label: "Suppliers (Payables)", icon: FaIndustry },
    { id: "items", label: "Items Activity", icon: FaBoxes },
    { id: "mazdoors", label: "Mazdoor Outstanding", icon: FaTruckLoading },
    { id: "inventory", label: "Inventory & Assets", icon: FaBoxes },
    { id: "expenses", label: "Expenses & Taxes", icon: FaMoneyBillWave },
    { id: "accounts", label: "Cash & Bank Balances", icon: FaWallet },
  ];

  const filteredItems = (list) => {
    if (!list) return [];
    return list.filter((item) =>
      (item.name || item.itemName || item.description || item.note || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()),
    );
  };

  const masterTotals = useMemo(() => {
    if (!data || !data.periodTransactions) return { in: 0, out: 0 };
    let totalIn = 0;
    let totalOut = 0;
    data.periodTransactions.forEach((t) => {
      // Logic for Mill-wide cash movement:
      if (t.fromAccountId) totalOut += Number(t.amount);
      else if (t.toAccountId) totalIn += Number(t.amount);
    });
    return { in: totalIn, out: totalOut };
  }, [data]);

  if (loading)
    return (
      <div className="card p-12 flex flex-col items-center justify-center min-h-[400px]">
        <div className="loading-spinner mb-4" />
        <p className="text-slate-500 animate-pulse font-medium text-lg">
          Preparing Detailed Submail Report...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-8 rounded-xl text-center">
        <p className="font-bold text-lg mb-2">Error loading audit summary</p>
        <p className="text-sm opacity-80">{error}</p>
        <button onClick={fetchSummary} className="btn-primary mt-4">
          Retry
        </button>
      </div>
    );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 sticky top-0 bg-slate-50 z-20 pb-4 shadow-sm -mx-4 px-4 pt-2 -mt-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
            <FaFileContract className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800">
              Financial Audit <span className="text-indigo-600">(Submail)</span>
            </h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest opacity-60">
              Consolidated Mill Balance Sheet
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePdf}
            disabled={!data}
            className="btn-primary flex items-center gap-2 px-6 shadow-md shadow-indigo-100"
          >
            <FaFilePdf /> Export Detailed PDF
          </button>
        </div>
      </header>

      {/* Control Area */}
      <section className="card p-5 bg-white border-none shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-6 pb-4 border-b border-slate-100 mb-4">
          {/* Date Range */}
          <div className="flex flex-wrap items-end gap-3 text-black">
            <div>
              <label className="input-label text-[10px] uppercase text-slate-400 font-black mb-1">
                From Date
              </label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateFrom: e.target.value }))
                }
                className="input-field w-40 text-xs py-1.5"
              />
            </div>
            <div>
              <label className="input-label text-[10px] uppercase text-slate-400 font-black mb-1">
                To Date
              </label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, dateTo: e.target.value }))
                }
                className="input-field w-40 text-xs py-1.5"
              />
            </div>
            <button
              onClick={() => setFilters({ dateFrom: "", dateTo: getToday() })}
              className="btn-secondary text-[10px] uppercase font-bold py-2 mb-0.5"
            >
              Today
            </button>
            <button
              onClick={fetchSummary}
              className="btn-primary text-[10px] uppercase font-bold py-2 px-6 mb-0.5 flex items-center gap-2"
            >
              <FaSearch /> Search Audit
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              placeholder={`Search ${activeTab.replace("_", " ")}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-9 text-sm py-2 rounded-full border-slate-100 focus:border-indigo-300"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchTerm("");
              }}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </nav>
      </section>

      {/* CONTENT AREA */}
      <div className="min-h-[500px]">
        {activeTab === "master_log" && data && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.1em]">
                Master Transaction Audit Log (Register Style)
              </h3>
              <div className="text-xs font-bold text-slate-400 italic">
                Total {data.periodTransactions?.length || 0} Professional
                Entries
              </div>
            </div>
            <div className="card p-0 overflow-hidden border-none shadow-xl">
              <table className="w-full border-collapse">
                <thead className="bg-slate-900 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
                      Date/Time
                    </th>
                    <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest border-b border-slate-700">
                      Description / Participants
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest border-b border-slate-700 bg-emerald-500/20">
                      Credit (Aamad)
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest border-b border-slate-700 bg-rose-500/20">
                      Debit (Kharch)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {filteredItems(data.periodTransactions).map((t, i) => {
                    const isOut = !!t.fromAccountId;
                    const isIn = !!t.toAccountId;
                    const participant =
                      t.customerId?.name ||
                      t.supplierId?.name ||
                      t.mazdoorId?.name ||
                      t.expenseTypeId?.name ||
                      t.taxTypeId?.name ||
                      "Manual Account";
                    const description =
                      t.note ||
                      t.category ||
                      (t.type === "transfer" ? "Internal Transfer" : "Entry");

                    return (
                      <tr
                        key={i}
                        className="hover:bg-slate-50 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-xs font-bold text-slate-500 uppercase">
                            {formatDate(t.date)}
                          </div>
                          <div className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">
                            {t.type}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-black text-slate-800 uppercase tracking-tight">
                            {participant}
                          </div>
                          <div className="text-[10px] text-slate-400 italic font-medium">
                            {description}
                          </div>
                          {t.fromAccountId && t.toAccountId && (
                            <div className="text-[9px] text-indigo-400 font-bold mt-1">
                              {t.fromAccountId.name} ➔ {t.toAccountId.name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-emerald-600 bg-emerald-50/10">
                          {isIn ? (
                            `Rs. ${formatMoney(t.amount)}`
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-black text-rose-600 bg-rose-50/10">
                          {isOut ? (
                            `Rs. ${formatMoney(t.amount)}`
                          ) : (
                            <span className="text-slate-200">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 border-t border-slate-200">
                  <tr className="font-black">
                    <td
                      colSpan="2"
                      className="px-6 py-5 text-right text-[10px] uppercase text-slate-500 tracking-widest italic"
                    >
                      Consolidated Audit Movement:
                    </td>
                    <td className="px-6 py-5 text-right text-base text-emerald-700 font-black">
                      Rs. {formatMoney(masterTotals.in)} (Total Credits)
                    </td>
                    <td className="px-6 py-5 text-right text-base text-rose-700 font-black">
                      Rs. {formatMoney(masterTotals.out)} (Total Debits)
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {activeTab === "overview" && data && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Quick Gross Card */}
            {/* Quick Gross Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="card bg-emerald-700 text-white p-6 shadow-xl shadow-emerald-100 border-none relative overflow-hidden">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">
                  Total Business Receivables (Lene Hain)
                </p>
                <p className="text-3xl font-black">
                  Rs. {formatMoney(data.totalReceivables)}
                </p>
                <FaArrowUp className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
              </div>
              <div className="card bg-rose-700 text-white p-6 shadow-xl shadow-rose-100 border-none relative overflow-hidden">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] opacity-60 mb-1">
                  Total Business Payables (Dene Hain)
                </p>
                <p className="text-3xl font-black">
                  Rs. {formatMoney(data.totalPayables)}
                </p>
                <FaArrowDown className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10" />
              </div>
            </div>

            {/* Net Position Card */}
            <div className="card bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 relative overflow-hidden shadow-2xl border-none">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-2">
                  <p className="text-indigo-200 font-bold uppercase tracking-[0.2em] text-[10px] opacity-80 italic">
                    Certified Net Standing (Submail Analysis)
                  </p>
                  <h2 className="text-5xl font-black tracking-tight leading-none text-white">
                    Rs. {formatMoney(getNetPosition())}
                  </h2>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full text-[10px] font-bold border border-white/10 uppercase tracking-widest text-indigo-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Audit Logic: Assets - Business Liabilities
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-white/5 p-5 rounded-[20px] backdrop-blur-md border border-white/10 flex flex-col justify-center min-w-[140px]">
                    <p className="text-[10px] font-black text-indigo-200/50 uppercase mb-1">
                      Pichli Wasooli
                    </p>
                    <p className="text-xl font-black text-amber-400">
                      Rs. {formatMoney(data.openingBalance || 0)}
                    </p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-[20px] backdrop-blur-md border border-white/10 flex flex-col justify-center min-w-[140px]">
                    <p className="text-[10px] font-black text-indigo-200/50 uppercase mb-1">
                      Total Assets
                    </p>
                    <p className="text-xl font-black text-emerald-400">
                      Rs.{" "}
                      {formatMoney(
                        data.totalCash +
                          data.totalReceivables +
                          data.totalStockValue +
                          data.totalMachineryValue,
                      )}
                    </p>
                  </div>
                  <div className="bg-white/5 p-5 rounded-[20px] backdrop-blur-md border border-white/10 flex flex-col justify-center min-w-[140px]">
                    <p className="text-[10px] font-black text-indigo-200/50 uppercase mb-1">
                      Total Payables
                    </p>
                    <p className="text-xl font-black text-rose-400">
                      Rs. {formatMoney(data.totalPayables)}
                    </p>
                  </div>
                </div>
              </div>
              <FaFileContract className="absolute -right-12 -bottom-12 w-80 h-80 text-white/5 rotate-[15deg]" />
            </div>

            {/* Quick Summary Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <SummaryCard
                label="Cash & Bank"
                amount={data.totalCash}
                color="indigo"
                icon={FaWallet}
              />
              <SummaryCard
                label="Total Lene Hain"
                amount={data.totalReceivables}
                color="emerald"
                icon={FaUsers}
              />
              <SummaryCard
                label="Godam Stock value"
                amount={data.totalStockValue}
                color="orange"
                icon={FaBoxes}
              />
              <SummaryCard
                label="Machinery Value"
                amount={data.totalMachineryValue}
                color="slate"
                icon={FaTools}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
              {/* Account Balances list */}
              <div className="card p-0 overflow-hidden bg-white/50 border-slate-100">
                <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FaWallet className="text-indigo-500" /> Account Balances
                  </h3>
                </div>
                <div className="p-4 space-y-3">
                  {data.accounts
                    .filter((acc) => !acc.isDailyKhata && !acc.isMillKhata)
                    .map((acc, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm transition-transform hover:scale-[1.01]"
                      >
                        <span className="text-sm font-bold text-slate-600">
                          {acc.name}
                        </span>
                        <span className="text-sm font-black text-indigo-700">
                          Rs. {formatMoney(acc.balance)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Period Stats */}
              <div className="card p-0 overflow-hidden bg-white/50 border-slate-100">
                <div className="p-4 bg-slate-50 border-b">
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <FaCalendarAlt className="text-amber-500" /> Range Summary
                    Stats
                  </h3>
                </div>
                <div className="p-4 grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
                      Total Tax Paid
                    </p>
                    <p className="text-xl font-black text-rose-600">
                      Rs.{" "}
                      {formatMoney(
                        data.taxes.reduce((s, t) => s + t.amount, 0),
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
                      Total Expenses
                    </p>
                    <p className="text-xl font-black text-orange-600">
                      Rs.{" "}
                      {formatMoney(
                        data.expenses.reduce((s, e) => s + e.amount, 0),
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "customers" && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.1em]">
                Customer Balances Breakdown
              </h3>
              <div className="text-xs font-bold text-slate-400">
                Total {data.customers.length} Entries
              </div>
            </div>
            <div className="card p-0 overflow-hidden border-none shadow-xl">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                      Customer Name
                    </th>
                    {/* Swapped Columns */}
                    {/* Traditional Mill Perspective for Customers: Debit (Kharch) = Receivable, Credit (Aamad) = Received */}
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-emerald-50/50">
                      Credit (Aamad / Received)
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-rose-50/50">
                      Debit (Kharch / Receivable)
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                      Net Balance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {filteredItems(data.customers).map((c, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase">
                          {c.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {c.balance < 0 ? (
                          <span className="text-sm font-black text-emerald-600">
                            Rs. {formatMoney(Math.abs(c.balance))}
                          </span>
                        ) : (
                          <span className="text-slate-200">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {c.balance > 0 ? (
                          <span className="text-sm font-black text-red-600">
                            Rs. {formatMoney(c.balance)}
                          </span>
                        ) : (
                          <span className="text-slate-200">—</span>
                        )}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-black ${c.balance >= 0 ? "text-red-700 bg-red-50/20" : "text-emerald-700 bg-emerald-50/20"}`}
                      >
                        Rs. {formatMoney(Math.abs(c.balance))}
                        <span className="text-[10px] ml-1">
                          {c.balance >= 0 ? "Dr" : "Cr"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black uppercase tracking-tighter">
                  <tr>
                    <td className="px-6 py-5 text-xs">Customer Pool Totals</td>
                    <td className="px-6 py-5 text-right text-base text-emerald-400">
                      Rs.{" "}
                      {formatMoney(
                        data.customers
                          .filter((c) => c.balance < 0)
                          .reduce((s, c) => s + Math.abs(Number(c.balance)), 0),
                      )}
                    </td>
                    <td className="px-6 py-5 text-right text-base text-rose-400">
                      Rs.{" "}
                      {formatMoney(
                        data.customers
                          .filter((c) => c.balance > 0)
                          .reduce((s, c) => s + Math.abs(Number(c.balance)), 0),
                      )}
                    </td>
                    <td className="px-6 py-5 text-right text-lg text-amber-500">
                      Rs. {formatMoney(data.totalReceivables)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {activeTab === "suppliers" && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.1em]">
                Supplier Payables Breakdown
              </h3>
            </div>
            <div className="card p-0 overflow-hidden border-none shadow-xl">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    {/* Traditional Mill Perspective for Suppliers: Credit (Aamad) = Our Debt/Payable, Debit (Kharch) = Our Payments/Advance */}
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                      Supplier Name
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-emerald-50/50">
                      Credit (Aamad / Payable)
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-rose-50/50">
                      Debit (Kharch / Paid)
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                      Net Payable
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {filteredItems(data.suppliers).map((s, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4 font-bold uppercase text-slate-700">
                        {s.name}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600 bg-emerald-50/10 text-sm">
                        {s.balance < 0 ? (
                          `Rs. ${formatMoney(Math.abs(s.balance))}`
                        ) : (
                          <span className="text-slate-200">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-rose-600 bg-rose-50/10 text-sm">
                        {s.balance > 0 ? (
                          `Rs. ${formatMoney(Math.abs(s.balance))}`
                        ) : (
                          <span className="text-slate-200">—</span>
                        )}
                      </td>
                      <td
                        className={`px-6 py-4 text-right font-black ${s.balance <= 0 ? "text-emerald-700 bg-emerald-50/20" : "text-rose-700 bg-rose-50/20"}`}
                      >
                        Rs. {formatMoney(Math.abs(s.balance))}
                        <span className="text-[10px] ml-1 uppercase">
                          {s.balance <= 0 ? "Cr" : "Dr"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-800 text-white font-black uppercase tracking-tighter">
                  <tr>
                    <td className="px-6 py-5 text-xs text-slate-400 tracking-[0.2em]">
                      Supplier Pool Totals
                    </td>
                    <td className="px-6 py-5 text-right text-base text-emerald-400 italic">
                      Rs.{" "}
                      {formatMoney(
                        data.suppliers
                          .filter((s) => s.balance < 0)
                          .reduce(
                            (sum, s) => sum + Math.abs(Number(s.balance)),
                            0,
                          ),
                      )}
                    </td>
                    <td className="px-6 py-5 text-right text-base text-rose-400 italic">
                      Rs.{" "}
                      {formatMoney(
                        data.suppliers
                          .filter((s) => s.balance > 0)
                          .reduce(
                            (sum, s) => sum + Math.abs(Number(s.balance)),
                            0,
                          ),
                      )}
                    </td>
                    <td className="px-6 py-5 text-right text-lg text-amber-500 font-black">
                      Rs.{" "}
                      {formatMoney(
                        data.suppliers
                          .filter((s) => s.balance < 0)
                          .reduce(
                            (sum, s) => sum + Math.abs(Number(s.balance)),
                            0,
                          ),
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {activeTab === "items" && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.1em]">
                Item-Wise Trading Scenario
              </h3>
            </div>
            <div className="card p-0 overflow-hidden border-none shadow-xl">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                      Item Name
                    </th>
                    {/* Swapped Columns */}
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-emerald-50/50">
                      Credit (Sale Value)
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-rose-50/50">
                      Debit (Purchase)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {filteredItems(data.items).map((item, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      <td className="px-6 py-4 text-sm font-black text-slate-700 uppercase">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-emerald-600">
                        Rs. {formatMoney(Number(item.saleVolume))}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-rose-600">
                        Rs. {formatMoney(Number(item.purchaseVolume))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black">
                  <tr>
                    <td className="px-6 py-5 text-sm uppercase tracking-widest">
                      Total Asset Movement
                    </td>
                    <td className="px-6 py-5 text-right text-base text-emerald-300">
                      Rs.{" "}
                      {formatMoney(
                        data.items.reduce(
                          (s, i) => s + Number(i.saleVolume),
                          0,
                        ),
                      )}
                    </td>
                    <td className="px-6 py-5 text-right text-base text-rose-300">
                      Rs.{" "}
                      {formatMoney(
                        data.items.reduce(
                          (s, i) => s + Number(i.purchaseVolume),
                          0,
                        ),
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {activeTab === "mazdoors" && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.1em]">
                Mazdoor Outstanding Wages
              </h3>
            </div>
            <div className="card p-0 overflow-hidden border-none shadow-xl">
              <table className="w-full border-collapse">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                      Mazdoor Name
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-emerald-50/50">
                      Credit (Earned Wages)
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b bg-rose-50/50">
                      Debit (Paid Wages)
                    </th>
                    <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                      Net Balance (Owed)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-50">
                  {filteredItems(data.mazdoors).map((m, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-700 uppercase">
                          {m.name}
                        </div>
                        <div className="text-[10px] text-slate-400 italic">{m.contact}</div>
                      </td>
                      <td className="px-6 py-4 text-right font-black text-emerald-600 bg-emerald-50/10">
                        Rs. {formatMoney(m.earned)}
                      </td>
                      <td className="px-6 py-4 text-right font-black text-rose-600 bg-rose-50/10">
                        Rs. {formatMoney(m.paid)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span
                          className={`text-sm font-black ${m.balance >= 0 ? "text-amber-600" : "text-emerald-600"}`}
                        >
                          Rs. {formatMoney(Math.abs(Number(m.balance)))}
                          <span className="text-[10px] ml-1 uppercase">
                            {m.balance >= 0 ? "Cr (Dene)" : "Dr (Advance)"}
                          </span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black">
                  <tr>
                    <td className="px-6 py-5 text-sm uppercase tracking-widest">
                      Mazdoor Audit Pool Totals
                    </td>
                    <td className="px-6 py-5 text-right text-base text-emerald-400">
                      Rs. {formatMoney(data.mazdoors.reduce((s, m) => s + Number(m.earned), 0))}
                    </td>
                    <td className="px-6 py-5 text-right text-base text-rose-400">
                      Rs. {formatMoney(data.mazdoors.reduce((s, m) => s + Number(m.paid), 0))}
                    </td>
                    <td className="px-6 py-5 text-right text-lg text-amber-500">
                      Rs. {formatMoney(data.totalPayables - (data.totalReceivables || 0))}
                      <span className="text-xs ml-1 opacity-60">NET</span>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {activeTab === "inventory" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            {/* Stock Table */}
            <div className="card p-0 overflow-hidden border-none shadow-lg">
              <div className="px-6 py-4 bg-slate-50 border-b flex items-center justify-between">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  Current Inventory Valuation
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">
                      Item Name
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase">
                      Weight (Mun)
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase">
                      Kattay
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase">
                      Avg Rate
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase text-indigo-600">
                      Total Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems(data.stock).map((item, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-slate-700 uppercase">
                          {item.itemName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">
                          {item.category}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">
                        {(item.quantity / 40).toFixed(2)} Mun
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium text-slate-600">
                        {item.kattay}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-slate-400">
                        Rs. {formatMoney((item.value / item.quantity) * 40)} /
                        Mun
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-indigo-600">
                        Rs. {formatMoney(item.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 font-black">
                  <tr>
                    <td
                      colSpan="4"
                      className="px-6 py-4 text-xs tracking-widest uppercase"
                    >
                      Stock Grand Total
                    </td>
                    <td className="px-6 py-4 text-right text-indigo-700">
                      Rs. {formatMoney(data.totalStockValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Machinery Table */}
            <div className="card p-0 overflow-hidden border-none shadow-lg">
              <div className="px-6 py-4 bg-slate-50 border-b">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
                  Fixed Asset Purchases (Machinery)
                </h3>
              </div>
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">
                      Particulars
                    </th>
                    <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase">
                      Supplier
                    </th>
                    <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.machinery.map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 text-xs font-bold text-slate-400 whitespace-nowrap">
                        {formatDate(m.date)}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-700 uppercase">
                        {m.machineryItemId?.name}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-500 uppercase">
                        {m.supplierId?.name}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-black text-slate-800">
                        Rs. {formatMoney(m.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 text-white font-black">
                  <tr>
                    <td
                      colSpan="3"
                      className="px-6 py-4 text-xs tracking-widest uppercase"
                    >
                      Total Investment
                    </td>
                    <td className="px-6 py-4 text-right text-lg">
                      Rs. {formatMoney(data.totalMachineryValue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {activeTab === "expenses" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Expenses Table */}
              <div className="card p-0 overflow-hidden border-none shadow-lg">
                <div className="px-6 py-4 bg-orange-50 border-b border-orange-100">
                  <h3 className="text-sm font-black text-orange-900 uppercase tracking-widest italic">
                    General Expenses (Mill Outflow)
                  </h3>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase italic">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase italic">
                        Particulars
                      </th>
                      <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase italic">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.expenses.map((e, i) => (
                      <tr key={i} className="hover:bg-slate-50/70">
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">
                          {formatDate(e.date)}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700 uppercase">
                          {e.expenseTypeId?.name || e.category}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-black text-orange-600">
                          Rs. {formatMoney(Number(e.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-orange-600 text-white font-black border-none">
                    <tr>
                      <td
                        colSpan="2"
                        className="px-6 py-4 text-xs tracking-widest uppercase"
                      >
                        Total Expenses
                      </td>
                      <td className="px-6 py-4 text-right text-lg">
                        Rs.{" "}
                        {formatMoney(
                          data.expenses.reduce(
                            (s, e) => s + Number(e.amount),
                            0,
                          ),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Taxes Table */}
              <div className="card p-0 overflow-hidden border-none shadow-lg">
                <div className="px-6 py-4 bg-rose-50 border-b border-rose-100">
                  <h3 className="text-sm font-black text-rose-900 uppercase tracking-widest italic">
                    Taxation Audit
                  </h3>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase italic">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-[10px] font-black text-slate-400 uppercase italic">
                        Tax Head
                      </th>
                      <th className="px-6 py-3 text-right text-[10px] font-black text-slate-400 uppercase italic">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data.taxes.map((t, i) => (
                      <tr key={i} className="hover:bg-slate-50/70">
                        <td className="px-6 py-4 text-xs font-bold text-slate-400">
                          {formatDate(t.date)}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-slate-700 uppercase">
                          {t.taxTypeId?.name || "General Tax"}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-black text-rose-600">
                          Rs. {formatMoney(Number(t.amount))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-rose-600 text-white font-black border-none">
                    <tr>
                      <td
                        colSpan="2"
                        className="px-6 py-4 text-xs tracking-widest uppercase"
                      >
                        Total Taxes
                      </td>
                      <td className="px-6 py-4 text-right text-lg">
                        Rs.{" "}
                        {formatMoney(
                          data.taxes.reduce((s, t) => s + Number(t.amount), 0),
                        )}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "accounts" && (
          <div className="animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-4 px-2">
              <h1 className="text-lg font-black text-slate-800 uppercase tracking-widest italic">
                Accounts Audit{" "}
                <span className="text-indigo-600">(Aamne-Samne)</span>
              </h1>
              <p className="text-[10px] text-indigo-400 font-black uppercase italic">
                Including All Active Ledgers (Cash Box & Bank)
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8">
              {data.accounts
                .filter((acc) => !acc.isDailyKhata && !acc.isMillKhata)
                .map((acc, i) => (
                  <div
                    key={i}
                    className="card p-0 overflow-hidden border-2 border-slate-100 shadow-xl transform hover:scale-[1.005] transition-transform"
                  >
                    {/* Account Header */}
                    <div className="bg-slate-800 text-white p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500 flex items-center justify-center">
                          <FaWallet className="text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">
                            Commercial Account Audit
                          </p>
                          <h3 className="text-base font-black uppercase tracking-tight leading-none">
                            {acc.name}
                          </h3>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-0.5">
                          Closing Balance
                        </p>
                        <p className="text-xl font-black text-amber-400">
                          Rs. {formatMoney(Number(acc.balance))}
                        </p>
                      </div>
                    </div>

                    {/* Aamne-Samne T-Account View */}
                    <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 bg-white">
                      {/* LEFT: CREDIT (INFLOW / AAMAD) */}
                      <div className="flex-1 w-full md:w-1/2">
                        <div className="bg-emerald-50/50 py-3 px-4 flex items-center justify-between border-b border-emerald-100">
                          <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest flex items-center gap-2 italic">
                            <FaArrowUp className="text-emerald-500" /> Credit
                            (Left / Aamad / Inflow)
                          </h4>
                          <div className="bg-emerald-100 px-3 py-1 rounded-full text-[10px] font-black text-emerald-700 uppercase">
                            Receiving
                          </div>
                        </div>
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black text-left">
                            <tr className="border-b border-slate-100">
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Particulars</th>
                              <th className="py-2 px-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {data.periodTransactions
                              ?.filter(
                                (t) =>
                                  t.toAccountId?._id === acc._id ||
                                  t.toAccountId === acc._id,
                              )
                              .map((t, idx) => (
                                <tr
                                  key={`in-${idx}`}
                                  className="hover:bg-slate-50/50 transition-colors"
                                >
                                  <td className="py-3 px-3 text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                    {formatDate(t.date)}
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-slate-700 text-xs">
                                      {t.customerId
                                        ? t.customerId.name
                                        : t.supplierId
                                          ? t.supplierId.name
                                          : t.mazdoorId
                                            ? t.mazdoorId.name
                                            : t.note ||
                                              t.category ||
                                              "Manual Deposit"}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-right font-black text-emerald-600">
                                    Rs. {formatMoney(t.amount)}
                                  </td>
                                </tr>
                              ))}
                            {(!data.periodTransactions ||
                              data.periodTransactions.filter(
                                (t) =>
                                  t.toAccountId?._id === acc._id ||
                                  t.toAccountId === acc._id,
                              ).length === 0) && (
                              <tr>
                                <td
                                  colSpan="3"
                                  className="py-4 text-center text-[10px] text-slate-400 font-bold uppercase disabled"
                                >
                                  No Credits Recorded
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-emerald-50/30 border-t border-emerald-100">
                            <tr>
                              <td
                                colSpan="2"
                                className="py-3 px-3 text-right text-[10px] uppercase font-black text-slate-500"
                              >
                                Total Aamad (Credit):
                              </td>
                              <td className="py-3 px-3 text-right text-sm font-black text-emerald-700">
                                Rs. {formatMoney(acc.totalIn || 0)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>

                      {/* RIGHT: DEBIT (OUTFLOW / KHARCH) */}
                      <div className="flex-1 w-full md:w-1/2">
                        <div className="bg-rose-50/50 py-3 px-4 flex items-center justify-between border-b border-rose-100">
                          <h4 className="text-xs font-black text-rose-800 uppercase tracking-widest flex items-center gap-2 italic">
                            <FaArrowDown className="text-rose-500" /> Debit
                            (Right / Kharch / Outflow)
                          </h4>
                          <div className="bg-rose-100 px-3 py-1 rounded-full text-[10px] font-black text-rose-700 uppercase">
                            Payments
                          </div>
                        </div>
                        <table className="w-full text-sm">
                          <thead className="bg-slate-50 text-slate-400 uppercase text-[9px] font-black text-left">
                            <tr className="border-b border-slate-100">
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Particulars</th>
                              <th className="py-2 px-3 text-right">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {data.periodTransactions
                              ?.filter(
                                (t) =>
                                  t.fromAccountId?._id === acc._id ||
                                  t.fromAccountId === acc._id,
                              )
                              .map((t, idx) => (
                                <tr
                                  key={`out-${idx}`}
                                  className="hover:bg-slate-50/50 transition-colors"
                                >
                                  <td className="py-3 px-3 text-[10px] font-bold text-slate-400 whitespace-nowrap">
                                    {formatDate(t.date)}
                                  </td>
                                  <td className="py-3 px-3">
                                    <div className="font-bold text-slate-700 text-xs text-rose-800">
                                      {t.customerId
                                        ? t.customerId.name
                                        : t.supplierId
                                          ? t.supplierId.name
                                          : t.mazdoorId
                                            ? t.mazdoorId.name
                                            : t.expenseTypeId
                                              ? t.expenseTypeId.name
                                              : t.note ||
                                                t.category ||
                                                "Manual Outflow"}
                                    </div>
                                  </td>
                                  <td className="py-3 px-3 text-right font-black text-rose-600">
                                    Rs. {formatMoney(t.amount)}
                                  </td>
                                </tr>
                              ))}
                            {(!data.periodTransactions ||
                              data.periodTransactions.filter(
                                (t) =>
                                  t.fromAccountId?._id === acc._id ||
                                  t.fromAccountId === acc._id,
                              ).length === 0) && (
                              <tr>
                                <td
                                  colSpan="3"
                                  className="py-4 text-center text-[10px] text-slate-400 font-bold uppercase disabled"
                                >
                                  No Debits Recorded
                                </td>
                              </tr>
                            )}
                          </tbody>
                          <tfoot className="bg-rose-50/30 border-t border-rose-100">
                            <tr>
                              <td
                                colSpan="2"
                                className="py-3 px-3 text-right text-[10px] uppercase font-black text-slate-500"
                              >
                                Total Kharch (Debit):
                              </td>
                              <td className="py-3 px-3 text-right text-sm font-black text-rose-700">
                                Rs. {formatMoney(acc.totalOut || 0)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>

                    {/* Movement Status Bar */}
                    <div className="bg-slate-50 px-6 py-3 flex items-center justify-between border-t border-slate-100">
                      <div className="text-[10px] font-black text-slate-400 uppercase italic">
                        Net Periodic Movement:
                        <span
                          className={`ml-2 ${Number(acc.totalIn) >= Number(acc.totalOut) ? "text-emerald-600" : "text-rose-600"}`}
                        >
                          Rs.{" "}
                          {formatMoney(
                            Math.abs(
                              Number(acc.totalIn || 0) -
                                Number(acc.totalOut || 0),
                            ),
                          )}
                          {Number(acc.totalIn) >= Number(acc.totalOut)
                            ? " (Surplus)"
                            : " (Deficit)"}
                        </span>
                      </div>
                      <div className="text-[10px] font-black text-indigo-400 uppercase italic">
                        Detailed Ledger Audited ✅
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <footer className="pt-10 pb-6 text-center border-t border-slate-100">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
          Mill Management System | Submail Dashboard
        </p>
      </footer>
    </div>
  );
}

function SummaryCard({ label, amount, color, icon: Icon }) {
  const colors = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    slate: "bg-slate-50 text-slate-600 border-slate-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <div
      className={`card p-5 border-2 ${colors[color]} shadow-none flex items-center gap-4 transition-all hover:shadow-lg hover:-translate-y-1`}
    >
      <div
        className={`w-12 h-12 rounded-2xl ${colors[color].replace("text-", "bg-").split(" ")[0]} flex items-center justify-center`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-[10px] font-black uppercase opacity-60 tracking-wider mb-1">
          {label}
        </p>
        <p className="text-lg font-black text-slate-800 leading-tight">
          Rs. {formatMoney(amount)}
        </p>
      </div>
    </div>
  );
}
