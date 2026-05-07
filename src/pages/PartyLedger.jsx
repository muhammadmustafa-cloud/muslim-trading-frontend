import { useState, useEffect, useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { apiGet } from "../config/api.js";
import { FaExchangeAlt, FaShoppingCart, FaBoxOpen, FaMoneyBillWave, FaFilter, FaFilePdf } from "react-icons/fa";
import { downloadPartyLedgerPdf } from "../utils/historyPdf.js";
import SearchableSelect from "../components/SearchableSelect.jsx";
import TablePagination from "../components/TablePagination.jsx";

const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "—");
const formatMoney = (n) => (n != null && n !== 0 ? Number(n).toLocaleString("en-PK") : "—");
const formatWeight = (n) => (n != null && n > 0 ? Number(n).toLocaleString("en-PK", { maximumFractionDigits: 2 }) : "—");
const formatMun = (n) => (n != null && n > 0 ? Number(n).toFixed(3) : "—");

const TYPE_CONFIG = {
  opening: { label: "Opening", color: "bg-slate-200 text-slate-700" },
  sale: { label: "Sale", color: "bg-emerald-100 text-emerald-800" },
  purchase: { label: "Purchase", color: "bg-amber-100 text-amber-800" },
  payment: { label: "Payment", color: "bg-blue-100 text-blue-800" },
};

export default function PartyLedger() {
  const { id: routeId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Party Selection State ──
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [selectedRole, setSelectedRole] = useState(searchParams.get("role") || "customer");
  const [selectedId, setSelectedId] = useState(routeId || "");

  // ── Ledger State ──
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const itemIdFilter = searchParams.get("itemId") || "";
  const typeFilter = searchParams.get("type") || "all";

  const [data, setData] = useState({ name: "", ledger: [], summary: {} });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const activeId = routeId || selectedId;

  const setFilters = (updates) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (v == null || v === "" || v === "all") next.delete(k);
      else next.set(k, v);
    });
    if (!next.has("role")) next.set("role", selectedRole);
    setSearchParams(next);
    setPage(1);
  };

  // Fetch customers & suppliers for the person selector
  useEffect(() => {
    async function fetchPeople() {
      try {
        const [custRes, supRes, itemRes] = await Promise.all([
          apiGet("/customers"),
          apiGet("/suppliers"),
          apiGet("/items"),
        ]);
        setCustomers(custRes.data || []);
        setSuppliers(supRes.data || []);
        setItems(itemRes.data || []);
      } catch (_) {}
    }
    fetchPeople();
  }, []);

  // Fetch ledger when person changes
  useEffect(() => {
    if (!activeId) {
      setData({ name: "", ledger: [], summary: {} });
      return;
    }
    let cancelled = false;
    async function fetchLedger() {
      setLoading(true);
      setError("");
      try {
        const result = await apiGet(`/party-ledger/${activeId}`, {
          role: selectedRole,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          itemId: itemIdFilter || undefined,
        });
        if (!cancelled) setData(result.data || { name: "", ledger: [], summary: {} });
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchLedger();
    return () => { cancelled = true; };
  }, [activeId, selectedRole, dateFrom, dateTo, itemIdFilter]);

  // Client-side type filter
  const filteredLedger = useMemo(() => {
    if (typeFilter === "all") return data.ledger || [];
    return (data.ledger || []).filter(row => row.type === typeFilter);
  }, [data.ledger, typeFilter]);

  const paginatedLedger = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredLedger.slice(start, start + pageSize);
  }, [filteredLedger, page, pageSize]);

  // Build combined people list for the selector
  const peopleOptions = useMemo(() => {
    if (selectedRole === "supplier") {
      return suppliers.map(s => ({
        _id: s._id,
        name: s.isAlsoCustomer ? `${s.name} (Supplier + Customer)` : s.name
      }));
    }
    return customers.map(c => ({
      _id: c._id,
      name: c.isAlsoSupplier ? `${c.name} (Customer + Supplier)` : c.name
    }));
  }, [selectedRole, customers, suppliers]);

  const s = data.summary || {};

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <FaExchangeAlt className="w-7 h-7 text-indigo-500" />
            Party Ledger
          </h1>
          <p className="text-slate-500 text-sm mt-1">Kisi bhi bande ka complete hisaab — sale, purchase, payment sab ek jagah.</p>
        </div>
        {activeId && data.name && (
          <button
            type="button"
            onClick={() => downloadPartyLedgerPdf(
              data.name,
              filteredLedger,
              data.summary || {},
              { dateFrom, dateTo }
            )}
            className="btn-primary flex items-center gap-2"
            disabled={loading || filteredLedger.length === 0}
          >
            <FaFilePdf className="w-5 h-5" /> Download PDF
          </button>
        )}
      </header>

      {/* ── Person Selector (only when no routeId) ── */}
      {!routeId && (
        <section className="card p-5 bg-white shadow-soft border-l-4 border-l-indigo-500 relative z-30 !overflow-visible">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select Person</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="input-label text-xs">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setSelectedId("");
                  setData({ name: "", ledger: [], summary: {} });
                  setFilters({ role: e.target.value });
                }}
                className="input-field"
              >
                <option value="customer">Customer (Gahak)</option>
                <option value="supplier">Supplier (Dene Wala)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="input-label text-xs">
                {selectedRole === "customer" ? "Customer" : "Supplier"} Select Karein
              </label>
              <SearchableSelect
                options={peopleOptions}
                value={selectedId}
                onChange={(val) => {
                  setSelectedId(val);
                  setPage(1);
                }}
                placeholder={`— ${selectedRole === "customer" ? "Customer" : "Supplier"} choose karein —`}
              />
            </div>
          </div>
        </section>
      )}

      {/* Show everything below only when a person is selected */}
      {activeId && (
        <>
          {/* ── Name & Badge ── */}
          {data.name && (
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-black text-slate-800">{data.name}</h2>
              {data.isLinked && (
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200">
                  Customer + Supplier
                </span>
              )}
              {data.phone && <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">{data.phone}</span>}
            </div>
          )}

          {error && <div className="card p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">{error}</div>}

          {/* ── Summary Cards ── */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card p-5 border-l-4 border-l-emerald-500 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Sales (Dr)</p>
                <FaShoppingCart className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-xl font-black text-slate-900">{formatMoney(s.totalSaleAmount)}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-emerald-600 font-bold">{s.totalSaleBags || 0} Bags</span>
                <span className="text-[10px] text-indigo-600 font-bold">{(s.totalSaleMun || 0).toFixed(2)} MUN</span>
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-amber-500 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Purchases (Cr)</p>
                <FaBoxOpen className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-xl font-black text-slate-900">{formatMoney(s.totalPurchaseAmount)}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-[10px] text-amber-600 font-bold">{s.totalPurchaseBags || 0} Bags</span>
                <span className="text-[10px] text-indigo-600 font-bold">{(s.totalPurchaseMun || 0).toFixed(2)} MUN</span>
              </div>
            </div>

            <div className="card p-5 border-l-4 border-l-blue-500 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Payments</p>
                <FaMoneyBillWave className="w-4 h-4 text-blue-400" />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-[10px] text-emerald-600 font-bold uppercase">Received:</span>
                  <span className="text-sm font-black text-emerald-700">{formatMoney(s.totalPaymentsReceived)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] text-rose-600 font-bold uppercase">Paid:</span>
                  <span className="text-sm font-black text-rose-700">{formatMoney(s.totalPaymentsMade)}</span>
                </div>
              </div>
            </div>

            <div className="card p-5 bg-slate-900 text-white border-l-4 border-l-indigo-500 hover:shadow-xl transition-shadow">
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-2">Net Balance (Closing)</p>
              <p className={`text-2xl font-black ${(s.netBalance || 0) >= 0 ? 'text-blue-400' : 'text-rose-400'}`}>
                Rs. {formatMoney(Math.abs(s.netBalance || 0))}
              </p>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                {(s.netBalance || 0) > 0 ? 'Receivable (Dr)' : (s.netBalance || 0) < 0 ? 'Payable (Cr)' : 'Settled'}
              </p>
            </div>
          </section>

          {/* ── Filters ── */}
          <section className="card p-4 relative z-20">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="input-label text-xs">Date From</label>
                <input type="date" value={dateFrom} onChange={(e) => setFilters({ dateFrom: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label text-xs">Date To</label>
                <input type="date" value={dateTo} onChange={(e) => setFilters({ dateTo: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="input-label text-xs">Item</label>
                <SearchableSelect
                  options={items.map(i => ({ _id: i._id, name: `${i.name} (${i.quality || 'Std'})` }))}
                  value={itemIdFilter}
                  onChange={(val) => setFilters({ itemId: val })}
                  placeholder="All Items"
                />
              </div>
              <div>
                <label className="input-label text-xs">Type</label>
                <select value={typeFilter} onChange={(e) => setFilters({ type: e.target.value })} className="input-field">
                  <option value="all">All Types</option>
                  <option value="sale">Sales Only</option>
                  <option value="purchase">Purchases Only</option>
                  <option value="payment">Payments Only</option>
                </select>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams();
                  next.set("role", selectedRole);
                  setSearchParams(next);
                  setPage(1);
                }}
                className="btn-secondary h-10 flex items-center gap-1.5"
              >
                <FaFilter className="w-3 h-3" /> Clear
              </button>
            </div>
          </section>

          {/* ── Main Table ── */}
          <section className="card bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-soft">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 border-t-4 border-t-indigo-500 rounded-t-xl">
              <p className="text-sm font-bold text-slate-700">{filteredLedger.length} entries</p>
            </div>

            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-16 flex justify-center">
                  <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredLedger.length === 0 ? (
                <div className="p-20 text-center text-slate-400">
                  <FaExchangeAlt className="w-16 h-16 mx-auto mb-4 opacity-10" />
                  <p className="font-bold tracking-widest uppercase text-xs">No entries found.</p>
                </div>
              ) : (
                <>
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-800 text-white border-b border-slate-700">
                        <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest">Date</th>
                        <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest">Type</th>
                        <th className="py-4 px-4 text-left text-[10px] font-black uppercase tracking-widest">Description</th>
                        <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest">Bags</th>
                        <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest">Gross (Kg)</th>
                        <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest">Net (Kg)</th>
                        <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest bg-amber-900/30">MUN</th>
                        <th className="py-4 px-4 text-center text-[10px] font-black uppercase tracking-widest">Rate/MUN</th>
                        <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest bg-rose-900/30">Debit (Dr)</th>
                        <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest bg-emerald-900/30">Credit (Cr)</th>
                        <th className="py-4 px-4 text-right text-[10px] font-black uppercase tracking-widest bg-slate-700">Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedLedger.map((row, idx) => {
                        const cfg = TYPE_CONFIG[row.type] || TYPE_CONFIG.opening;
                        const isPayment = row.type === 'payment' || row.type === 'opening';

                        return (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4 whitespace-nowrap text-[11px] font-bold text-slate-400">
                              {formatDate(row.date)}
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight ${cfg.color}`}>
                                {cfg.label}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-800 leading-tight">{row.description}</span>
                                {row.truckNumber && (
                                  <span className="text-[10px] text-slate-400 font-medium mt-0.5">Truck: {row.truckNumber}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4 text-center">
                              {!isPayment && row.bags > 0 ? (
                                <span className="px-2 py-1 rounded-md text-xs font-black bg-amber-100 text-amber-700">{row.bags}</span>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="py-4 px-4 text-center text-xs font-medium text-slate-600">
                              {!isPayment ? formatWeight(row.grossWeight) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-4 px-4 text-center text-xs font-bold text-slate-700">
                              {!isPayment ? formatWeight(row.netWeight) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-4 px-4 text-center font-black text-indigo-700 bg-amber-50/30">
                              {!isPayment ? formatMun(row.mun) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-4 px-4 text-center text-xs font-bold text-slate-600">
                              {!isPayment && row.avgRate > 0 ? formatMoney(row.avgRate) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-4 px-4 text-right font-black text-rose-700 bg-rose-50/10 text-base">
                              {row.debit > 0 ? formatMoney(row.debit) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className="py-4 px-4 text-right font-black text-emerald-700 bg-emerald-50/10 text-base">
                              {row.credit > 0 ? formatMoney(row.credit) : <span className="text-slate-300">—</span>}
                            </td>
                            <td className={`py-4 px-4 text-right font-black text-base shadow-inner ${row.balance >= 0 ? 'text-blue-800 bg-blue-50/30' : 'text-rose-800 bg-rose-50/30'}`}>
                              {formatMoney(Math.abs(row.balance))}
                              <span className="text-[10px] ml-1 uppercase">{row.balance >= 0 ? 'Dr' : 'Cr'}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-800 text-white font-black">
                      <tr>
                        <td colSpan="3" className="py-5 px-4 text-right text-[10px] uppercase tracking-[0.15em] text-slate-400">
                          Sales Summary:
                        </td>
                        <td className="py-5 px-4 text-center text-amber-400">{s.totalSaleBags || 0}</td>
                        <td className="py-5 px-4 text-center text-slate-500">—</td>
                        <td className="py-5 px-4 text-center text-slate-500">—</td>
                        <td className="py-5 px-4 text-center text-amber-400 font-black">{(s.totalSaleMun || 0).toFixed(3)}</td>
                        <td className="py-5 px-4 text-center text-slate-500">—</td>
                        <td className="py-5 px-4 text-right text-rose-400 border-t-2 border-rose-500/30 text-lg">
                          {formatMoney(s.totalSaleAmount)}
                        </td>
                        <td className="py-5 px-4 text-right text-slate-500">—</td>
                        <td className="py-5 px-4"></td>
                      </tr>
                      <tr>
                        <td colSpan="3" className="py-5 px-4 text-right text-[10px] uppercase tracking-[0.15em] text-slate-400">
                          Purchases Summary:
                        </td>
                        <td className="py-5 px-4 text-center text-amber-400">{s.totalPurchaseBags || 0}</td>
                        <td className="py-5 px-4 text-center text-slate-500">—</td>
                        <td className="py-5 px-4 text-center text-slate-500">—</td>
                        <td className="py-5 px-4 text-center text-amber-400 font-black">{(s.totalPurchaseMun || 0).toFixed(3)}</td>
                        <td className="py-5 px-4 text-center text-slate-500">—</td>
                        <td className="py-5 px-4 text-right text-slate-500">—</td>
                        <td className="py-5 px-4 text-right text-emerald-400 border-t-2 border-emerald-500/30 text-lg">
                          {formatMoney(s.totalPurchaseAmount)}
                        </td>
                        <td className="py-5 px-4"></td>
                      </tr>
                      <tr className="bg-slate-900">
                        <td colSpan="8" className="py-6 px-4 text-right text-[10px] uppercase tracking-[0.2em] text-slate-400">
                          Closing Balance:
                        </td>
                        <td className="py-6 px-4 text-right text-rose-400 text-lg border-t-4 border-rose-500/50">
                          {formatMoney((s.totalSaleAmount || 0) + (s.totalPaymentsMade || 0))}
                        </td>
                        <td className="py-6 px-4 text-right text-emerald-400 text-lg border-t-4 border-emerald-500/50">
                          {formatMoney((s.totalPurchaseAmount || 0) + (s.totalPaymentsReceived || 0))}
                        </td>
                        <td className="py-6 px-4 text-right border-t-4 border-amber-500 text-xl font-black">
                          {formatMoney(Math.abs(s.netBalance || 0))}
                          <span className="text-[11px] ml-2 text-slate-400 uppercase tracking-widest">
                            {(s.netBalance || 0) >= 0 ? 'Receivable (Dr)' : 'Payable (Cr)'}
                          </span>
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                  <TablePagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} totalItems={filteredLedger.length} />
                </>
              )}
            </div>
          </section>
        </>
      )}

      {/* Empty state when no person selected */}
      {!activeId && !routeId && (
        <div className="card p-20 text-center bg-white rounded-2xl border border-slate-200">
          <FaExchangeAlt className="w-20 h-20 mx-auto mb-6 text-slate-200" />
          <p className="text-lg font-bold text-slate-600">Pehle party select karein</p>
          <p className="text-sm text-slate-400 mt-1">Upar se customer ya supplier choose karein — phir unka poora hisaab yahan dikhega.</p>
        </div>
      )}
    </div>
  );
}
