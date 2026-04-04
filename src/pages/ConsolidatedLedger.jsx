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
  FaHistory
} from "react-icons/fa";
import { downloadConsolidatedLedgersPdf } from "../utils/exportPdf.js";

const getToday = () => new Date().toISOString().slice(0, 10);

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

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrint = () => {
    if (data) {
      downloadConsolidatedLedgersPdf(data, filters);
    }
  };

  const getStats = () => {
    if (!data) return { totalParties: 0, totalEntries: 0, salesCount: 0, purchasesCount: 0 };
    let count = 0;
    let entries = 0;
    Object.entries(data).forEach(([key, list]) => {
      if (key === 'salesInvoices' || key === 'purchaseInvoices') return;
      count += list.length;
      list.forEach(item => entries += item.ledger.length);
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
            ) : (
              <FaSearch />
            )}
            <span className="font-black uppercase tracking-wider text-xs">Fetch Active Logs</span>
          </button>
          
          <div className="flex-1 min-w-[200px] flex items-center gap-6 md:justify-end">
            <div className="text-right">
              <p className="text-[9px] font-black text-slate-400 uppercase leading-none">Active Legders</p>
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
                    {stats.salesCount + stats.purchasesCount} <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1 rounded absolute -mt-3 shadow-sm">{stats.salesCount}S/{stats.purchasesCount}P</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      {error && (
        <div className="card p-4 bg-rose-50 border-rose-100 text-rose-600 text-sm font-bold flex items-center gap-3">
          <FaCheckCircle className="rotate-45" /> {error}
        </div>
      )}

      {loading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center bg-white/50 rounded-3xl border border-dashed border-slate-200">
           <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
           <p className="text-slate-500 font-bold animate-pulse">Aggregating Party Ledgers & Opening Balances...</p>
        </div>
      ) : data ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
          
          {/* ACCOUNTS SECTION */}
          <EntityCard 
            title="Bank & Cash Accounts" 
            icon={FaWallet} 
            color="indigo" 
            list={data.accounts} 
            type="Accounts"
          />

          {/* ITEMS SECTION */}
          <EntityCard 
            title="Stock Item Trading" 
            icon={FaBoxes} 
            color="amber" 
            list={data.items} 
            type="Items"
          />

          {/* CUSTOMERS SECTION */}
          <EntityCard 
            title="Customer Ledgers" 
            icon={FaUsers} 
            color="amber" 
            list={data.customers} 
            type="Receivables"
          />

          {/* SUPPLIERS SECTION */}
          <EntityCard 
            title="Supplier Ledgers" 
            icon={FaTruck} 
            color="indigo" 
            list={data.suppliers} 
            type="Payables"
          />

          {/* MAZDOORS SECTION */}
          <EntityCard 
            title="Mazdoor Wages" 
            icon={FaUserTie} 
            color="emerald" 
            list={data.mazdoors} 
            type="Wages"
          />

          {/* RAWS SECTION */}
          <EntityCard 
            title="Raw Material Units" 
            icon={FaBoxes} 
            color="teal" 
            list={data.rawMaterials} 
            type="Inventory"
          />

          {/* EXPENSES SECTION */}
          <EntityCard 
            title="General Expenses" 
            icon={FaReceipt} 
            color="rose" 
            list={data.expenses} 
            type="Kharch"
          />

        </div>
      ) : null}
    </div>
  );
}

function EntityCard({ title, icon: Icon, color, list, type }) {
  if (!list || list.length === 0) return null;

  const colorClasses = {
    amber: "bg-amber-100 text-amber-600 border-amber-200",
    indigo: "bg-indigo-100 text-indigo-600 border-indigo-200",
    emerald: "bg-emerald-100 text-emerald-600 border-emerald-200",
    teal: "bg-teal-100 text-teal-600 border-teal-200",
    rose: "bg-rose-100 text-rose-600 border-rose-200",
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center gap-3 px-2">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClasses[color]} border shadow-sm`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">{title}</h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{list.length} {type} Active</p>
        </div>
      </div>
      
      <div className="card p-0 overflow-hidden border-none shadow-xl bg-white rounded-3xl">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-6 py-4 text-left">Entity Name</th>
              <th className="px-6 py-4 text-right">Activity</th>
              <th className="px-6 py-4 text-right">Current Ledger Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {list.map((item, i) => {
              // Calculate closing for preview
          const totalDr = item.ledger.reduce((s, l) => s + (Number(l.debit) || 0), 0);
const totalCr = item.ledger.reduce((s, l) => s + (Number(l.credit) || 0), 0);
const net = totalDr - totalCr;


              return (
                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-black text-slate-700 uppercase tracking-tight">{item.name}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] font-black text-slate-500 uppercase">
                      {item.ledger.length} Entries
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-xs font-black text-slate-800">
                     Rs. {Math.abs(net).toLocaleString()} {net >= 0 ? "Dr" : "Cr"}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
