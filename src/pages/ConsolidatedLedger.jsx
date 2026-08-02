import { useState, useEffect } from "react";
import { apiGet } from "../config/api.js";
import {
  FaBookOpen,
  FaCalendarAlt,
  FaSearch,
  FaFilePdf,
  FaUsers,
  FaTruck,
  FaUserTie,
  FaWallet,
  FaBoxes,
  FaReceipt,
  FaCheckCircle,
  FaHistory,
  FaCoins,
  FaCogs,
  FaBuilding,
  FaChevronDown,
  FaChevronUp
} from "react-icons/fa";
import { downloadConsolidatedLedgersPdf } from "../utils/exportPdf.js";

const getToday = () => new Date().toISOString().slice(0, 10);
const fmt = (n) => Number(n || 0).toLocaleString("en-PK", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const fmtDate = (d) => {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "2-digit" }); }
  catch { return d; }
};

export default function ConsolidatedLedger() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({ dateFrom: getToday(), dateTo: getToday() });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const resp = await apiGet("/audit/consolidated-ledgers", filters);
      setData(resp.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePrint = () => {
    if (data) downloadConsolidatedLedgersPdf(data, filters);
  };

  const getStats = () => {
    if (!data) return { totalParties: 0, totalEntries: 0, salesCount: 0, purchasesCount: 0 };
    let count = 0, entries = 0;
    Object.entries(data).forEach(([key, list]) => {
      if (key === "salesInvoices" || key === "purchaseInvoices") return;
      count += list.length;
      list.forEach(item => (entries += item.ledger.length));
    });
    return {
      totalParties: count,
      totalEntries: entries,
      salesCount: data.salesInvoices?.length || 0,
      purchasesCount: data.purchaseInvoices?.length || 0
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <header className="flex flex-wrap items-center justify-between gap-4 sticky top-0 bg-slate-50/95 backdrop-blur-md z-20 pb-4 shadow-sm -mx-4 px-4 pt-2 -mt-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-amber-200">
            <FaBookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Consolidated <span className="text-amber-600">Ledger Book</span>
            </h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-70 flex items-center gap-1">
              <FaHistory /> Periodic Historical Audit Bundle
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={!data || stats.totalParties === 0}
            className="btn-primary flex items-center gap-2 px-8 py-3 rounded-xl shadow-xl shadow-amber-500/20 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 border-none"
          >
            <FaFilePdf className="text-lg" />
            <span className="font-bold">PRINT FULL DIARY</span>
          </button>
        </div>
      </header>

      {/* DATE FILTER CARD */}
      <section className="card p-6 bg-white border-none shadow-xl shadow-slate-200/50 rounded-3xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
          <FaCalendarAlt className="text-8xl text-slate-900" />
        </div>
        <div className="relative z-10 flex flex-wrap items-end gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-1">
              <FaCalendarAlt className="text-amber-500" /> Start Date
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
              className="input-field w-52 py-3 px-4 bg-slate-50 border-slate-100 focus:bg-white text-sm font-bold rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-1">
              <FaCalendarAlt className="text-rose-500" /> End Date
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
              className="input-field w-52 py-3 px-4 bg-slate-50 border-slate-100 focus:bg-white text-sm font-bold rounded-xl"
            />
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="btn-primary bg-slate-900 hover:bg-slate-800 text-white border-none px-8 py-3.5 rounded-xl flex items-center gap-3 shadow-lg shadow-slate-200"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : <FaSearch />}
            <span className="font-black uppercase tracking-wider text-xs">Fetch Active Logs</span>
          </button>
          <div className="flex-1 min-w-[200px] flex items-center gap-6 md:justify-end">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Active Ledgers</p>
              <p className="text-2xl font-black text-slate-800">{stats.totalParties}</p>
            </div>
            <div className="h-10 w-px bg-slate-100" />
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Total Entries</p>
              <p className="text-2xl font-black text-amber-600">{stats.totalEntries}</p>
            </div>
            {data && (
              <>
                <div className="h-10 w-px bg-slate-100" />
                <div className="text-right">
                  <p className="text-[9px] font-black text-indigo-400 uppercase leading-none flex items-center gap-1 justify-end"><FaFilePdf /> Invoices</p>
                  <p className="text-2xl font-black text-indigo-600">
                    {stats.salesCount + stats.purchasesCount}{" "}
                    <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded">
                      {stats.salesCount}S/{stats.purchasesCount}P
                    </span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ERROR */}
      {error && (
        <div className="card p-4 bg-rose-50 border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3">
          <FaCheckCircle className="rotate-45" /> {error}
        </div>
      )}

      {/* LOADING */}
      {loading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center bg-white/50 rounded-3xl border border-dashed border-slate-200">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-bold animate-pulse">Aggregating Party Ledgers & Opening Balances...</p>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-10 pb-10">
          <LedgerSection title="Bank & Cash Accounts" icon={FaWallet} color="indigo" list={data.accounts} type="accounts" />
          <LedgerSection title="Stock Item Trading" icon={FaBoxes} color="amber" list={data.items} type="items" />
          <LedgerSection title="Customer Ledgers" icon={FaUsers} color="amber" list={data.customers} type="customers" />
          <LedgerSection title="Supplier Ledgers" icon={FaTruck} color="indigo" list={data.suppliers} type="suppliers" />
          <LedgerSection title="Mazdoor Wages" icon={FaUserTie} color="emerald" list={data.mazdoors} type="mazdoors" />
          <LedgerSection title="Raw Material Units" icon={FaBoxes} color="teal" list={data.rawMaterials} type="rawMaterials" />
          <LedgerSection title="General Expenses" icon={FaReceipt} color="rose" list={data.expenses} type="expenses" />
          <LedgerSection title="Tax Payments" icon={FaCoins} color="rose" list={data.taxes} type="taxes" />
          <LedgerSection title="Machinery & Assets" icon={FaCogs} color="indigo" list={data.machinery} type="machinery" />
          <LedgerSection title="Mill Overhead" icon={FaBuilding} color="slate" list={data.millExpenses} type="millExpenses" />
        </div>
      ) : null}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   LEDGER SECTION: groups multiple entity ledgers under one category header
───────────────────────────────────────────────────────────────────────*/
const COLOR_CLASSES = {
  amber:   { bg: "bg-amber-100",   text: "text-amber-600",   border: "border-amber-200"   },
  indigo:  { bg: "bg-indigo-100",  text: "text-indigo-600",  border: "border-indigo-200"  },
  emerald: { bg: "bg-emerald-100", text: "text-emerald-600", border: "border-emerald-200" },
  teal:    { bg: "bg-teal-100",    text: "text-teal-600",    border: "border-teal-200"    },
  rose:    { bg: "bg-rose-100",    text: "text-rose-600",    border: "border-rose-200"    },
  slate:   { bg: "bg-slate-100",   text: "text-slate-600",   border: "border-slate-200"   },
};

function LedgerSection({ title, icon: Icon, color, list, type }) {
  if (!list || list.length === 0) return null;
  const c = COLOR_CLASSES[color] || COLOR_CLASSES.slate;

  const totalEntries = list.reduce((s, e) => s + e.ledger.length, 0);
  const totalDr = list.reduce((s, e) => s + e.ledger.reduce((a, r) => a + (Number(r.debit) || 0), 0), 0);
  const totalCr = list.reduce((s, e) => s + e.ledger.reduce((a, r) => a + (Number(r.credit) || 0), 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 px-1">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.bg} ${c.text} border ${c.border} shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-black text-slate-800 uppercase tracking-wider">{title}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            {list.length} active · {totalEntries} entries · Dr {fmt(totalDr)} · Cr {fmt(totalCr)}
          </p>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {list.map((entity, i) => (
          <EntityLedger key={i} entity={entity} type={type} c={c} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   ENTITY LEDGER
───────────────────────────────────────────────────────────────────────*/
function EntityLedger({ entity, type, c }) {
  const [collapsed, setCollapsed] = useState(false);

  const totalDr = entity.ledger.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalCr = entity.ledger.reduce((s, r) => s + (Number(r.credit) || 0), 0);
  const openBal = Number(entity.openingBalance) || 0;

  const getClosing = () => {
    if (type === "mazdoors" || type === "rawMaterials") return openBal + totalCr - totalDr;
    return openBal + totalDr - totalCr;
  };
  const closing = getClosing();

  return (
    <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/60 border border-slate-100 overflow-hidden">
      {/* Entity Header */}
      <div
        className="flex items-center justify-between px-5 py-3 cursor-pointer hover:bg-slate-50/60 transition-colors border-b border-slate-100"
        style={{ background: "linear-gradient(90deg,#f8fafc,#f1f5f9)" }}
        onClick={() => setCollapsed(v => !v)}
      >
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-8 rounded-full ${c.bg.replace("-100", "-400")}`} />
          <div>
            <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{entity.name}</p>
            <p className="text-[10px] text-slate-400 font-semibold">
              Opening: <span className="text-slate-600 font-bold">Rs. {fmt(Math.abs(openBal))}</span>
              {" · "}{entity.ledger.length} entries{" · "}
              Closing: <span className={`font-black ${closing >= 0 ? "text-rose-600" : "text-emerald-600"}`}>
                Rs. {fmt(Math.abs(closing))} {closing >= 0 ? "Dr" : "Cr"}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] text-slate-400 font-bold uppercase">Debit / Credit</p>
            <p className="text-xs font-black text-slate-700">
              <span className="text-rose-600">{fmt(totalDr)}</span>
              {" / "}
              <span className="text-emerald-600">{fmt(totalCr)}</span>
            </p>
          </div>
          {collapsed ? <FaChevronDown className="w-3 h-3 text-slate-400" /> : <FaChevronUp className="w-3 h-3 text-slate-400" />}
        </div>
      </div>

      {/* Table */}
      {!collapsed && (
        <div className="overflow-x-auto">
          {(type === "customers" || type === "suppliers") ? (
            <CustomerSupplierTable entity={entity} type={type} openBal={openBal} />
          ) : type === "items" ? (
            <ItemTable entity={entity} openBal={openBal} />
          ) : type === "accounts" ? (
            <AccountTable entity={entity} openBal={openBal} />
          ) : type === "mazdoors" ? (
            <MazdoorTable entity={entity} openBal={openBal} />
          ) : type === "rawMaterials" ? (
            <RawMaterialTable entity={entity} openBal={openBal} />
          ) : (
            <SimpleDebitTable entity={entity} openBal={openBal} type={type} />
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   SHARED TABLE CELL COMPONENTS
───────────────────────────────────────────────────────────────────────*/
function Th({ children, right, center }) {
  return (
    <th className={`px-4 py-2.5 text-[9px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap bg-slate-800 ${right ? "text-right" : center ? "text-center" : "text-left"}`}>
      {children}
    </th>
  );
}
function Td({ children, right, center, bold, muted, green, red, className = "" }) {
  return (
    <td className={`px-4 py-2.5 text-xs whitespace-nowrap ${right ? "text-right" : center ? "text-center" : "text-left"} ${bold ? "font-black" : "font-medium"} ${muted ? "text-slate-400" : red ? "text-rose-700 font-bold" : green ? "text-emerald-700 font-bold" : "text-slate-700"} ${className}`}>
      {children}
    </td>
  );
}
function FootRow({ children }) {
  return <tr className="bg-slate-800 text-slate-100">{children}</tr>;
}
function FootTd({ children, right, center, className = "" }) {
  return (
    <td className={`px-4 py-2.5 text-xs font-black whitespace-nowrap ${right ? "text-right" : center ? "text-center" : "text-left"} ${className}`}>
      {children}
    </td>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   TABLE IMPLEMENTATIONS (No Opening Balance row in body)
───────────────────────────────────────────────────────────────────────*/

// CUSTOMER / SUPPLIER — Date | Description | Bags | Credit | Debit | Running Balance
function CustomerSupplierTable({ entity, type, openBal }) {
  let running = openBal;
  const isCustomer = type === "customers";
  const crLabel = isCustomer ? "Credit / Jama" : "Credit / Purchase";
  const drLabel = isCustomer ? "Debit / Naam" : "Debit / Paid";
  const totalDr = entity.ledger.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalCr = entity.ledger.reduce((s, r) => s + (Number(r.credit) || 0), 0);
  return (
    <table className="w-full">
      <thead><tr>
        <Th>Date</Th>
        <Th>Description / Particulars</Th>
        <Th center>Bags</Th>
        <Th right>{crLabel}</Th>
        <Th right>{drLabel}</Th>
        <Th right>Balance</Th>
      </tr></thead>
      <tbody className="divide-y divide-slate-50">
        {entity.ledger.map((row, i) => {
          const d = Number(row.debit) || 0;
          const cr = Number(row.credit) || 0;
          running += (d - cr);
          return (
            <tr key={i} className="hover:bg-slate-50/70 transition-colors">
              <Td muted>{fmtDate(row.date)}</Td>
              <Td>{row.description || "—"}</Td>
              <Td center>{row.bags > 0 ? row.bags : "—"}</Td>
              <Td right green={cr > 0}>{cr > 0 ? `Rs. ${fmt(cr)}` : "—"}</Td>
              <Td right red={d > 0}>{d > 0 ? `Rs. ${fmt(d)}` : "—"}</Td>
              <Td right bold className={running >= 0 ? "text-rose-700" : "text-emerald-700"}>
                Rs. {fmt(Math.abs(running))} {running >= 0 ? "Dr" : "Cr"}
              </Td>
            </tr>
          );
        })}
        {entity.ledger.length === 0 && (
          <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-xs font-bold">No entries in this period</td></tr>
        )}
      </tbody>
      <tfoot><FootRow>
        <FootTd colSpan={3}>Grand Totals</FootTd>
        <FootTd right className="text-emerald-300">Rs. {fmt(totalCr)}</FootTd>
        <FootTd right className="text-rose-300">Rs. {fmt(totalDr)}</FootTd>
        <FootTd right className={running >= 0 ? "text-rose-300" : "text-emerald-300"}>
          Rs. {fmt(Math.abs(running))} {running >= 0 ? "Dr" : "Cr"}
        </FootTd>
      </FootRow></tfoot>
    </table>
  );
}

// ITEM — Date | Party / Description | Type | Bags | Weight (Kg) | Rate | Sale | Purchase
function ItemTable({ entity, openBal }) {
  let totalBagsIn = 0, totalBagsOut = 0, totalAmtIn = 0, totalAmtOut = 0;
  return (
    <table className="w-full">
      <thead><tr>
        <Th>Date</Th>
        <Th>Party / Description</Th>
        <Th center>Type</Th>
        <Th center>Bags</Th>
        <Th right>Weight (Kg)</Th>
        <Th right>Rate</Th>
        <Th right>Sale (Dr)</Th>
        <Th right>Purchase (Cr)</Th>
      </tr></thead>
      <tbody className="divide-y divide-slate-50">
        {entity.ledger.map((row, i) => {
          const isSale = row.status === "sold";
          const isPurchase = row.status === "purchased";
          const bags = row.bags || 0;
          if (isSale) { totalBagsOut += bags; totalAmtOut += Number(row.debit) || 0; }
          if (isPurchase) { totalBagsIn += bags; totalAmtIn += Number(row.credit) || 0; }
          return (
            <tr key={i} className="hover:bg-slate-50/70 transition-colors">
              <Td muted>{fmtDate(row.date)}</Td>
              <Td>{row.description || "—"}</Td>
              <Td center>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${isSale ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                  {isSale ? "Sale" : "Purchase"}
                </span>
              </Td>
              <Td center bold>{bags || "—"}</Td>
              <Td right muted>{row.weight > 0 ? fmt(row.weight) : "—"}</Td>
              <Td right muted>{row.rate > 0 ? `Rs. ${fmt(row.rate)}` : "—"}</Td>
              <Td right red={isSale}>{isSale ? `Rs. ${fmt(row.debit)}` : "—"}</Td>
              <Td right green={isPurchase}>{isPurchase ? `Rs. ${fmt(row.credit)}` : "—"}</Td>
            </tr>
          );
        })}
        {entity.ledger.length === 0 && (
          <tr><td colSpan={8} className="px-4 py-6 text-center text-slate-400 text-xs font-bold">No entries in this period</td></tr>
        )}
      </tbody>
      <tfoot><FootRow>
        <FootTd colSpan={3}>Period Totals</FootTd>
        <FootTd center>
          <span className="text-rose-300">{totalBagsOut}</span>
          {" / "}
          <span className="text-emerald-300">{totalBagsIn}</span>
        </FootTd>
        <FootTd right>—</FootTd>
        <FootTd right>—</FootTd>
        <FootTd right className="text-rose-300">Rs. {fmt(totalAmtOut)}</FootTd>
        <FootTd right className="text-emerald-300">Rs. {fmt(totalAmtIn)}</FootTd>
      </FootRow></tfoot>
    </table>
  );
}

// ACCOUNT — Date | Description | Category | Outflow (Credit) | Inflow (Debit) | Balance
function AccountTable({ entity, openBal }) {
  let running = openBal;
  const totalDr = entity.ledger.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalCr = entity.ledger.reduce((s, r) => s + (Number(r.credit) || 0), 0);
  return (
    <table className="w-full">
      <thead><tr>
        <Th>Date</Th>
        <Th>Description / Party</Th>
        <Th>Category</Th>
        <Th right>Outflow / Credit</Th>
        <Th right>Inflow / Debit</Th>
        <Th right>Balance</Th>
      </tr></thead>
      <tbody className="divide-y divide-slate-50">
        {entity.ledger.map((row, i) => {
          const d = Number(row.debit) || 0;
          const cr = Number(row.credit) || 0;
          running += (d - cr);
          return (
            <tr key={i} className="hover:bg-slate-50/70 transition-colors">
              <Td muted>{fmtDate(row.date)}</Td>
              <Td>{row.description || "—"}</Td>
              <Td>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase">{row.category || "—"}</span>
              </Td>
              <Td right red={cr > 0}>{cr > 0 ? `Rs. ${fmt(cr)}` : "—"}</Td>
              <Td right green={d > 0}>{d > 0 ? `Rs. ${fmt(d)}` : "—"}</Td>
              <Td right bold className={running >= 0 ? "text-indigo-700" : "text-rose-600"}>
                Rs. {fmt(Math.abs(running))} {running >= 0 ? "Dr" : "Cr"}
              </Td>
            </tr>
          );
        })}
        {entity.ledger.length === 0 && (
          <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-xs font-bold">No entries in this period</td></tr>
        )}
      </tbody>
      <tfoot><FootRow>
        <FootTd colSpan={3}>Grand Totals</FootTd>
        <FootTd right className="text-rose-300">Rs. {fmt(totalCr)}</FootTd>
        <FootTd right className="text-emerald-300">Rs. {fmt(totalDr)}</FootTd>
        <FootTd right className={running >= 0 ? "text-indigo-300" : "text-rose-300"}>
          Rs. {fmt(Math.abs(running))} {running >= 0 ? "Dr" : "Cr"}
        </FootTd>
      </FootRow></tfoot>
    </table>
  );
}

// MAZDOOR — Date | Description | Category | Earned (Cr) | Paid (Dr) | Balance
function MazdoorTable({ entity, openBal }) {
  let running = openBal;
  const totalDr = entity.ledger.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalCr = entity.ledger.reduce((s, r) => s + (Number(r.credit) || 0), 0);
  return (
    <table className="w-full">
      <thead><tr>
        <Th>Date</Th>
        <Th>Description</Th>
        <Th>Category</Th>
        <Th right>Earned / Credit</Th>
        <Th right>Paid / Debit</Th>
        <Th right>Balance</Th>
      </tr></thead>
      <tbody className="divide-y divide-slate-50">
        {entity.ledger.map((row, i) => {
          const d = Number(row.debit) || 0;
          const cr = Number(row.credit) || 0;
          running += (cr - d);
          return (
            <tr key={i} className="hover:bg-slate-50/70 transition-colors">
              <Td muted>{fmtDate(row.date)}</Td>
              <Td>{row.description || "—"}</Td>
              <Td>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[9px] font-bold uppercase">{row.category || "wage"}</span>
              </Td>
              <Td right green={cr > 0}>{cr > 0 ? `Rs. ${fmt(cr)}` : "—"}</Td>
              <Td right red={d > 0}>{d > 0 ? `Rs. ${fmt(d)}` : "—"}</Td>
              <Td right bold className={running >= 0 ? "text-emerald-700" : "text-rose-600"}>
                Rs. {fmt(Math.abs(running))} {running >= 0 ? "Cr" : "Dr"}
              </Td>
            </tr>
          );
        })}
        {entity.ledger.length === 0 && (
          <tr><td colSpan={6} className="px-4 py-6 text-center text-slate-400 text-xs font-bold">No entries in this period</td></tr>
        )}
      </tbody>
      <tfoot><FootRow>
        <FootTd colSpan={3}>Total Movement</FootTd>
        <FootTd right className="text-emerald-300">Rs. {fmt(totalCr)}</FootTd>
        <FootTd right className="text-rose-300">Rs. {fmt(totalDr)}</FootTd>
        <FootTd right className={running >= 0 ? "text-emerald-300" : "text-rose-300"}>
          Rs. {fmt(Math.abs(running))} {running >= 0 ? "Cr" : "Dr"}
        </FootTd>
      </FootRow></tfoot>
    </table>
  );
}

// RAW MATERIAL — Date | Description | Stock In (Cr) | Stock Out (Dr) | Balance
function RawMaterialTable({ entity, openBal }) {
  let running = openBal;
  const totalDr = entity.ledger.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const totalCr = entity.ledger.reduce((s, r) => s + (Number(r.credit) || 0), 0);
  return (
    <table className="w-full">
      <thead><tr>
        <Th>Date</Th>
        <Th>Description</Th>
        <Th right>Stock In / Credit</Th>
        <Th right>Stock Out / Debit</Th>
        <Th right>Balance</Th>
      </tr></thead>
      <tbody className="divide-y divide-slate-50">
        {entity.ledger.map((row, i) => {
          const d = Number(row.debit) || 0;
          const cr = Number(row.credit) || 0;
          running += (cr - d);
          return (
            <tr key={i} className="hover:bg-slate-50/70 transition-colors">
              <Td muted>{fmtDate(row.date)}</Td>
              <Td>{row.description || "—"}</Td>
              <Td right green={cr > 0}>{cr > 0 ? `Rs. ${fmt(cr)}` : "—"}</Td>
              <Td right red={d > 0}>{d > 0 ? `Rs. ${fmt(d)}` : "—"}</Td>
              <Td right bold className={running >= 0 ? "text-teal-700" : "text-rose-600"}>
                Rs. {fmt(Math.abs(running))} {running >= 0 ? "Cr" : "Dr"}
              </Td>
            </tr>
          );
        })}
        {entity.ledger.length === 0 && (
          <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-xs font-bold">No entries in this period</td></tr>
        )}
      </tbody>
      <tfoot><FootRow>
        <FootTd colSpan={2}>Net Totals</FootTd>
        <FootTd right className="text-emerald-300">Rs. {fmt(totalCr)}</FootTd>
        <FootTd right className="text-rose-300">Rs. {fmt(totalDr)}</FootTd>
        <FootTd right className={running >= 0 ? "text-teal-300" : "text-rose-300"}>
          Rs. {fmt(Math.abs(running))} {running >= 0 ? "Cr" : "Dr"}
        </FootTd>
      </FootRow></tfoot>
    </table>
  );
}

// SIMPLE DEBIT (Expenses / Taxes / Machinery / Mill Overhead) — Date | Description | Account | Amount | Cumulative
function SimpleDebitTable({ entity, openBal, type }) {
  let running = openBal;
  const totalAmt = entity.ledger.reduce((s, r) => s + (Number(r.debit) || 0), 0);
  const label = type === "expenses" ? "Expense" : type === "taxes" ? "Tax" : type === "machinery" ? "Asset Purchase" : "Mill Expense";
  return (
    <table className="w-full">
      <thead><tr>
        <Th>Date</Th>
        <Th>Description / Note</Th>
        <Th>Account / Source</Th>
        <Th right>Amount</Th>
        <Th right>Cumulative</Th>
      </tr></thead>
      <tbody className="divide-y divide-slate-50">
        {entity.ledger.map((row, i) => {
          running += Number(row.debit) || 0;
          return (
            <tr key={i} className="hover:bg-slate-50/70 transition-colors">
              <Td muted>{fmtDate(row.date)}</Td>
              <Td>{row.description || label}</Td>
              <Td muted>{row.accountName || "Cash"}</Td>
              <Td right bold className="text-rose-700">Rs. {fmt(row.debit)}</Td>
              <Td right muted>Rs. {fmt(running)}</Td>
            </tr>
          );
        })}
        {entity.ledger.length === 0 && (
          <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-400 text-xs font-bold">No entries in this period</td></tr>
        )}
      </tbody>
      <tfoot><FootRow>
        <FootTd colSpan={3}>Total {label}</FootTd>
        <FootTd right className="text-rose-300">Rs. {fmt(totalAmt)}</FootTd>
        <FootTd right>Rs. {fmt(running)}</FootTd>
      </FootRow></tfoot>
    </table>
  );
}
