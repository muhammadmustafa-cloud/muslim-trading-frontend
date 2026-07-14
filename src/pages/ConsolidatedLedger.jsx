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
  FaHistory,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaMoneyBillWave,
  FaPercentage,
  FaCubes,
  FaCogs,
  FaIndustry
} from "react-icons/fa";
import { downloadConsolidatedLedgersPdf } from "../utils/exportPdf.js";

const getToday = () => new Date().toISOString().slice(0, 10);
const fmt = (d) => d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—";
const fmtDay = (d) => { try { return new Date(d).toLocaleDateString("en-PK", { weekday: "short" }).toUpperCase(); } catch { return "—"; } };
const fmtAmt = (n) => n != null ? Math.abs(Number(n)).toLocaleString("en-PK") : "—";

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

  const handlePrint = () => { if (data) downloadConsolidatedLedgersPdf(data, filters); };

  const getStats = () => {
    if (!data) return { totalParties: 0, totalEntries: 0 };
    let count = 0, entries = 0;
    ["customers", "suppliers", "mazdoors", "accounts", "items"].forEach(key => {
      const list = data[key] || [];
      count += list.length;
      list.forEach(item => entries += (item.ledger || []).length);
    });
    return { totalParties: count, totalEntries: entries };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
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

      {/* Range Selection Card */}
      <section className="card p-6 bg-white border-none shadow-xl shadow-slate-200/50 rounded-3xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-wrap items-end gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-1">
              <FaCalendarAlt className="text-amber-500" /> Start Date
            </label>
            <input type="date" value={filters.dateFrom} onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="input-field w-52 py-3 px-4 bg-slate-50 border-slate-100 focus:bg-white text-sm font-bold rounded-xl" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2 ml-1">
              <FaCalendarAlt className="text-rose-500" /> End Date
            </label>
            <input type="date" value={filters.dateTo} onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="input-field w-52 py-3 px-4 bg-slate-50 border-slate-100 focus:bg-white text-sm font-bold rounded-xl" />
          </div>
          <button onClick={fetchData} disabled={loading} className="btn-primary bg-slate-900 hover:bg-slate-800 text-white border-none px-8 py-3.5 rounded-xl flex items-center gap-3 shadow-lg shadow-slate-200">
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FaSearch />}
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
          </div>
        </div>
      </section>

      {error && (
        <div className="card p-4 bg-rose-50 border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3">
          <FaCheckCircle className="rotate-45" /> {error}
        </div>
      )}

      {loading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center bg-white/50 rounded-3xl border border-dashed border-slate-200">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-500 font-bold animate-pulse">Aggregating all Party Ledgers...</p>
        </div>
      ) : data ? (
        <div className="space-y-8 pb-10">
          {/* CUSTOMERS */}
          <LedgerSection title="Customer Ledgers" icon={FaUsers} color="amber" list={data.customers} type="party" />
          {/* SUPPLIERS */}
          <LedgerSection title="Supplier Ledgers" icon={FaTruck} color="indigo" list={data.suppliers} type="party" />
          {/* MAZDOORS */}
          <LedgerSection title="Mazdoor / Labour Ledgers" icon={FaUserTie} color="emerald" list={data.mazdoors} type="mazdoor" />
          {/* EXPENSES */}
          <LedgerSection title="Expenses Management" icon={FaMoneyBillWave} color="rose" list={data.expenses} type="party" />
          {/* TAXES */}
          <LedgerSection title="Tax Management" icon={FaPercentage} color="blue" list={data.taxes} type="party" />
          {/* RAW MATERIALS */}
          <LedgerSection title="Raw Materials" icon={FaCubes} color="amber" list={data.rawMaterials} type="party" />
          {/* MACHINERY */}
          <LedgerSection title="Machinery & Assets" icon={FaCogs} color="indigo" list={data.machinery} type="party" />
          {/* MILL EXPENSES */}
          <LedgerSection title="Mill General Activity" icon={FaIndustry} color="emerald" list={data.millExpenses} type="party" />
          {/* ACCOUNTS */}
          <LedgerSection title="Bank & Cash Accounts" icon={FaWallet} color="blue" list={data.accounts} type="account" />
          {/* ITEMS */}
          <LedgerSection title="Stock Item Trading" icon={FaBoxes} color="rose" list={data.items} type="item" />
        </div>
      ) : null}
    </div>
  );
}

// ─── Section wrapper with collapsible party cards ───────────────────────────
function LedgerSection({ title, icon: Icon, color, list, type }) {
  if (!list || list.length === 0) return null;

  const colorMap = {
    amber: { icon: "bg-amber-100 text-amber-600 border-amber-200", badge: "bg-amber-50 text-amber-700 border-amber-200", header: "from-amber-600 to-amber-500" },
    indigo: { icon: "bg-indigo-100 text-indigo-600 border-indigo-200", badge: "bg-indigo-50 text-indigo-700 border-indigo-200", header: "from-indigo-600 to-indigo-500" },
    emerald: { icon: "bg-emerald-100 text-emerald-600 border-emerald-200", badge: "bg-emerald-50 text-emerald-700 border-emerald-200", header: "from-emerald-600 to-emerald-500" },
    blue: { icon: "bg-blue-100 text-blue-600 border-blue-200", badge: "bg-blue-50 text-blue-700 border-blue-200", header: "from-blue-600 to-blue-500" },
    rose: { icon: "bg-rose-100 text-rose-600 border-rose-200", badge: "bg-rose-50 text-rose-700 border-rose-200", header: "from-rose-600 to-rose-500" },
  };
  const c = colorMap[color] || colorMap.amber;

  return (
    <div className="space-y-3">
      <div className={`flex items-center gap-3 px-1`}>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c.icon} border shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider">{title}</h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{list.length} active</p>
        </div>
      </div>
      <div className="space-y-3">
        {list.map((item, i) => (
          <PartyLedgerCard key={i} item={item} type={type} color={color} colorCls={c} />
        ))}
      </div>
    </div>
  );
}

// ─── Individual collapsible ledger card ─────────────────────────────────────
function PartyLedgerCard({ item, type, color, colorCls }) {
  const [open, setOpen] = useState(false);

  const ledger = item.ledger || [];

  // Compute net balance depending on type
  const summary = item.summary || {};

  const netBalance = (() => {
    if (type === "party") {
      return summary.netBalance != null ? summary.netBalance : (() => {
        const dr = ledger.reduce((s, l) => s + (Number(l.debit) || 0), 0);
        const cr = ledger.reduce((s, l) => s + (Number(l.credit) || 0), 0);
        return (item.openingBalance || 0) + dr - cr;
      })();
    }
    if (type === "mazdoor") return summary.balance || 0;
    if (type === "account") return summary.closingBalance || 0;
    if (type === "item") return summary.profit || 0;
    return 0;
  })();

  const netLabel = (() => {
    if (type === "party") return netBalance >= 0 ? "Dr (Receivable)" : "Cr (Payable)";
    if (type === "mazdoor") return netBalance >= 0 ? "Payable" : "Receivable";
    if (type === "account") return netBalance >= 0 ? "Balance" : "Deficit";
    if (type === "item") return netBalance >= 0 ? "Profit" : "Loss";
    return "";
  })();

  return (
    <div className="card p-0 overflow-hidden border border-slate-100 rounded-2xl shadow-sm">
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <span className="font-black text-slate-800 text-sm uppercase tracking-tight">{item.name}</span>
            {type === "party" && (
              <span className="text-[10px] text-slate-400 font-bold">
                Op. Bal: Rs. {fmtAmt(item.openingBalance || 0)}
                {summary.totalSaleAmount > 0 && ` | Sale: ${fmtAmt(summary.totalSaleAmount)}`}
                {summary.totalPurchaseAmount > 0 && ` | Purchase: ${fmtAmt(summary.totalPurchaseAmount)}`}
              </span>
            )}
            {type === "mazdoor" && (
              <span className="text-[10px] text-slate-400 font-bold">
                Earned: Rs. {fmtAmt(summary.totalEarned)} | Paid: Rs. {fmtAmt(summary.totalPaid)}
              </span>
            )}
            {type === "item" && (
              <span className="text-[10px] text-slate-400 font-bold">
                Purchase: {summary.totalBagsPurchased || 0} Bags / {(summary.totalMunPurchased || 0).toFixed(2)} Mun
                {" | "}Sale: {summary.totalBagsSold || 0} Bags / {(summary.totalMunSold || 0).toFixed(2)} Mun
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[9px] font-black text-slate-400 uppercase block">{netLabel}</span>
            <span className={`text-base font-black ${netBalance >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              Rs. {fmtAmt(netBalance)}
            </span>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-black px-2 py-1 rounded-md uppercase mr-2">
            {ledger.length} entries
          </span>
          {open ? <FaChevronUp className="text-slate-400 w-3 h-3" /> : <FaChevronDown className="text-slate-400 w-3 h-3" />}
        </div>
      </button>

      {/* Ledger table — shown when expanded */}
      {open && (
        <div className="border-t border-slate-100 overflow-x-auto">
          {type === "party" && <PartyLedgerTable ledger={ledger} summary={summary} openingBalance={item.openingBalance} />}
          {type === "mazdoor" && <MazdoorLedgerTable ledger={ledger} summary={summary} />}
          {type === "account" && <AccountLedgerTable ledger={ledger} summary={summary} />}
          {type === "item" && <ItemLedgerTable item={item} />}
        </div>
      )}
    </div>
  );
}

// ─── Party (Customer/Supplier) Ledger Table — identical to PartyLedger.jsx ──
function PartyLedgerTable({ ledger, summary, openingBalance }) {
  let runBal = openingBalance || 0;
  return (
    <table className="w-full text-[11px]">
      <thead className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[9px]">
        <tr>
          <th className="py-2 px-3 text-left border-r border-slate-700">Date</th>
          <th className="py-2 px-3 text-left border-r border-slate-700">Day</th>
          <th className="py-2 px-3 text-left border-r border-slate-700">Description</th>
          <th className="py-2 px-2 text-center border-r border-slate-700">Bags</th>
          <th className="py-2 px-2 text-center border-r border-slate-700">Mun</th>
          <th className="py-2 px-2 text-center border-r border-slate-700">Rate</th>
          <th className="py-2 px-3 text-right border-r border-slate-700 text-rose-300">Debit (Dr)</th>
          <th className="py-2 px-3 text-right border-r border-slate-700 text-emerald-300">Credit (Cr)</th>
          <th className="py-2 px-3 text-right">Balance</th>
        </tr>
      </thead>
      <tbody>
        {openingBalance !== 0 && (
          <tr className="bg-amber-50 border-b border-amber-100 text-amber-800">
            <td colSpan={6} className="py-2 px-3 font-black italic text-[10px]">Opening Balance</td>
            <td className="py-2 px-3 text-right font-black">{openingBalance > 0 ? fmtAmt(openingBalance) : "—"}</td>
            <td className="py-2 px-3 text-right font-black">{openingBalance < 0 ? fmtAmt(openingBalance) : "—"}</td>
            <td className="py-2 px-3 text-right font-black text-amber-700">Rs. {fmtAmt(openingBalance)}</td>
          </tr>
        )}
        {ledger.map((row, i) => {
          runBal += (row.debit || 0) - (row.credit || 0);
          const isSale = row.type === "sale";
          const isPay = row.type === "payment";
          const bgCls = isSale ? "bg-rose-50/30" : isPay ? "bg-emerald-50/30" : "bg-blue-50/30";
          return (
            <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 ${bgCls}`}>
              <td className="py-2 px-3 text-slate-500 italic">{fmt(row.date)}</td>
              <td className="py-2 px-3 text-slate-400 font-bold">{fmtDay(row.date)}</td>
              <td className="py-2 px-3 text-slate-700 max-w-[200px] truncate">{row.description}</td>
              <td className="py-2 px-2 text-center text-slate-600">{row.bags > 0 ? row.bags : "—"}</td>
              <td className="py-2 px-2 text-center text-slate-600">{row.mun > 0 ? Number(row.mun).toFixed(3) : "—"}</td>
              <td className="py-2 px-2 text-center text-slate-500">{row.avgRate > 0 ? fmtAmt(row.avgRate) : "—"}</td>
              <td className="py-2 px-3 text-right font-black text-rose-700">{row.debit > 0 ? fmtAmt(row.debit) : "—"}</td>
              <td className="py-2 px-3 text-right font-black text-emerald-600">{row.credit > 0 ? fmtAmt(row.credit) : "—"}</td>
              <td className={`py-2 px-3 text-right font-black ${runBal >= 0 ? "text-slate-800" : "text-blue-700"}`}>
                {fmtAmt(runBal)} {runBal >= 0 ? "Dr" : "Cr"}
              </td>
            </tr>
          );
        })}
      </tbody>
      <tfoot className="bg-slate-800 text-white text-[9px] font-black uppercase">
        <tr>
          <td colSpan={3} className="px-3 py-3 text-right border-r border-slate-700">Totals:</td>
          <td className="px-2 py-3 text-center border-r border-slate-700 text-amber-300">{summary.totalSaleBags || 0}</td>
          <td className="px-2 py-3 text-center border-r border-slate-700 text-amber-300">{(summary.totalSaleMun || 0).toFixed(3)}</td>
          <td className="px-2 py-3 border-r border-slate-700"></td>
          <td className="px-3 py-3 text-right border-r border-slate-700 text-rose-300">{fmtAmt(summary.totalSaleAmount)}</td>
          <td className="px-3 py-3 text-right border-r border-slate-700 text-emerald-300">{fmtAmt((summary.totalPurchaseAmount || 0) + (summary.totalPaymentsReceived || 0))}</td>
          <td className="px-3 py-3 text-right text-amber-300">
            Rs. {fmtAmt(Math.abs(summary.netBalance || 0))} {(summary.netBalance || 0) >= 0 ? "Dr" : "Cr"}
          </td>
        </tr>
      </tfoot>
    </table>
  );
}

// ─── Mazdoor Ledger Table — identical to mazdoor history ────────────────────
function MazdoorLedgerTable({ ledger, summary }) {
  return (
    <table className="w-full text-[11px]">
      <thead className="bg-emerald-800 text-white font-bold uppercase tracking-wider text-[9px]">
        <tr>
          <th className="py-2 px-3 text-left border-r border-emerald-700">Date</th>
          <th className="py-2 px-3 text-left border-r border-emerald-700">Day</th>
          <th className="py-2 px-3 text-left border-r border-emerald-700">Type</th>
          <th className="py-2 px-3 text-left border-r border-emerald-700">Note</th>
          <th className="py-2 px-3 text-right border-r border-emerald-700 text-rose-300">Paid (Dr)</th>
          <th className="py-2 px-3 text-right text-emerald-300">Earned (Cr)</th>
        </tr>
      </thead>
      <tbody>
        {ledger.map((t, i) => {
          const isEarned = t.category === "salary_accrual" || t.category === "mazdoor_expense";
          const isPaid = t.type === "withdraw" || t.type === "salary" || t.type === "transfer";
          return (
            <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 ${isEarned ? "bg-emerald-50/20" : "bg-rose-50/20"}`}>
              <td className="py-2 px-3 text-slate-500 italic">{fmt(t.date)}</td>
              <td className="py-2 px-3 text-slate-400 font-bold">{fmtDay(t.date)}</td>
              <td className="py-2 px-3 font-bold text-slate-600 capitalize">{(t.type || "").replace("_", " ")}</td>
              <td className="py-2 px-3 text-slate-500 truncate max-w-[180px]">{t.note || t.category || "—"}</td>
              <td className="py-2 px-3 text-right font-black text-rose-700">{isPaid && !isEarned ? fmtAmt(t.amount) : "—"}</td>
              <td className="py-2 px-3 text-right font-black text-emerald-600">{isEarned ? fmtAmt(t.amount) : "—"}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot className="bg-emerald-800 text-white text-[9px] font-black uppercase">
        <tr>
          <td colSpan={4} className="px-3 py-3 text-right border-r border-emerald-700">Totals:</td>
          <td className="px-3 py-3 text-right border-r border-emerald-700 text-rose-300">{fmtAmt(summary.totalPaid)}</td>
          <td className="px-3 py-3 text-right text-emerald-300">{fmtAmt(summary.totalEarned)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

// ─── Account (Universal Ledger) Table ───────────────────────────────────────
function AccountLedgerTable({ ledger, summary }) {
  return (
    <table className="w-full text-[11px]">
      <thead className="bg-blue-800 text-white font-bold uppercase tracking-wider text-[9px]">
        <tr>
          <th className="py-2 px-3 text-left border-r border-blue-700">Date</th>
          <th className="py-2 px-3 text-left border-r border-blue-700">Day</th>
          <th className="py-2 px-3 text-left border-r border-blue-700">Party</th>
          <th className="py-2 px-3 text-left border-r border-blue-700">Description</th>
          <th className="py-2 px-3 text-right border-r border-blue-700 text-emerald-300">In (Cr)</th>
          <th className="py-2 px-3 text-right text-rose-300">Out (Dr)</th>
        </tr>
      </thead>
      <tbody>
        {ledger.map((row, i) => (
          <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 ${row.amountType === "in" ? "bg-emerald-50/20" : "bg-rose-50/20"}`}>
            <td className="py-2 px-3 text-slate-500 italic">{fmt(row.date)}</td>
            <td className="py-2 px-3 text-slate-400 font-bold">{fmtDay(row.date)}</td>
            <td className="py-2 px-3 font-bold text-slate-700 truncate max-w-[120px]">{row.name || "—"}</td>
            <td className="py-2 px-3 text-slate-500 truncate max-w-[160px]">{row.description || "—"}</td>
            <td className="py-2 px-3 text-right font-black text-emerald-600">{row.amountType === "in" ? fmtAmt(row.amount) : "—"}</td>
            <td className="py-2 px-3 text-right font-black text-rose-700">{row.amountType === "out" ? fmtAmt(row.amount) : "—"}</td>
          </tr>
        ))}
      </tbody>
      <tfoot className="bg-blue-800 text-white text-[9px] font-black uppercase">
        <tr>
          <td colSpan={4} className="px-3 py-3 text-right border-r border-blue-700">Totals:</td>
          <td className="px-3 py-3 text-right border-r border-blue-700 text-emerald-300">{fmtAmt(summary.totalIn)}</td>
          <td className="px-3 py-3 text-right text-rose-300">{fmtAmt(summary.totalOut)}</td>
        </tr>
      </tfoot>
    </table>
  );
}

// ─── Item Khata Table — identical to ItemKhata.jsx ──────────────────────────
function ItemLedgerTable({ item }) {
  const ledger = item.ledger || [];
  const summary = item.summary || {};
  return (
    <table className="w-full text-[11px]">
      <thead className="bg-slate-800 text-white font-bold uppercase tracking-wider text-[9px]">
        <tr>
          <th className="py-2 px-3 text-left border-r border-slate-700">Date</th>
          <th className="py-2 px-3 text-left border-r border-slate-700">Day</th>
          <th className="py-2 px-3 text-left border-r border-slate-700">Party</th>
          <th className="py-2 px-2 text-center border-r border-slate-700 bg-rose-900/30">Pur Bag</th>
          <th className="py-2 px-2 text-center border-r border-slate-700 bg-emerald-900/30">Sale Bag</th>
          <th className="py-2 px-2 text-center border-r border-slate-700 bg-rose-900/30">Pur Mun</th>
          <th className="py-2 px-2 text-center border-r border-slate-700 bg-emerald-900/30">Sale Mun</th>
          <th className="py-2 px-3 text-right border-r border-slate-700 text-rose-300">Purchase (Dr)</th>
          <th className="py-2 px-3 text-right text-emerald-300">Sale (Cr)</th>
        </tr>
      </thead>
      <tbody>
        {ledger.map((row, i) => {
          const isPur = row.ledgerType === "purchase";
          const bags = Number(row.kattay) || 0;
          const weight = Number(isPur ? row.receivedWeight : row.quantity) || 0;
          const mun = weight > 0 ? (weight / 40).toFixed(3) : 0;
          const amount = isPur ? (row.amount || 0) : (row.totalAmount || 0);
          const participant = isPur ? (row.supplierId?.name || "Supplier") : (row.customerId?.name || "Customer");
          return (
            <tr key={i} className={`border-b border-slate-100 hover:bg-slate-50 ${isPur ? "bg-rose-50/20" : "bg-emerald-50/20"}`}>
              <td className="py-2 px-3 text-slate-500 italic">{fmt(row.date)}</td>
              <td className="py-2 px-3 text-slate-400 font-bold">{fmtDay(row.date)}</td>
              <td className="py-2 px-3 font-bold text-slate-700 uppercase truncate max-w-[140px]">{participant}</td>
              <td className="py-2 px-2 text-center font-bold text-rose-700 bg-rose-50/20">{!isPur ? "—" : bags > 0 ? bags : "—"}</td>
              <td className="py-2 px-2 text-center font-bold text-emerald-700 bg-emerald-50/20">{isPur ? "—" : bags > 0 ? bags : "—"}</td>
              <td className="py-2 px-2 text-center font-bold text-rose-700 bg-rose-50/20">{!isPur ? "—" : mun > 0 ? mun : "—"}</td>
              <td className="py-2 px-2 text-center font-bold text-emerald-700 bg-emerald-50/20">{isPur ? "—" : mun > 0 ? mun : "—"}</td>
              <td className="py-2 px-3 text-right font-black text-rose-700">{isPur ? fmtAmt(amount) : "—"}</td>
              <td className="py-2 px-3 text-right font-black text-emerald-600">{!isPur ? fmtAmt(amount) : "—"}</td>
            </tr>
          );
        })}
      </tbody>
      <tfoot className="bg-slate-800 text-white text-[9px] font-black uppercase">
        <tr>
          <td colSpan={3} className="px-3 py-3 text-right border-r border-slate-700">Grand Totals:</td>
          <td className="px-2 py-3 text-center border-r border-slate-700 text-rose-300">{summary.totalBagsPurchased || "—"}</td>
          <td className="px-2 py-3 text-center border-r border-slate-700 text-emerald-300">{summary.totalBagsSold || "—"}</td>
          <td className="px-2 py-3 text-center border-r border-slate-700 text-rose-300">{(summary.totalMunPurchased || 0).toFixed(3)}</td>
          <td className="px-2 py-3 text-center border-r border-slate-700 text-emerald-300">{(summary.totalMunSold || 0).toFixed(3)}</td>
          <td className="px-3 py-3 text-right border-r border-slate-700 text-rose-300">{fmtAmt(summary.totalCost)}</td>
          <td className="px-3 py-3 text-right text-emerald-300">{fmtAmt(summary.totalRevenue)}</td>
        </tr>
        <tr>
          <td colSpan={7} className="px-3 py-2 text-right border-r border-slate-700 text-amber-300 text-[8px]">Remaining Bags: {(summary.totalBagsPurchased || 0) - (summary.totalBagsSold || 0)} | Mun: {((summary.totalMunPurchased || 0) - (summary.totalMunSold || 0)).toFixed(3)} | Profit:</td>
          <td colSpan={2} className="px-3 py-2 text-right font-black text-[11px]">
            <span className={summary.profit >= 0 ? "text-emerald-400" : "text-rose-400"}>
              Rs. {fmtAmt(summary.profit)} {summary.profit >= 0 ? "✓" : "✗"}
            </span>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
