import React, { useState, useEffect } from "react";
import { apiGet, apiPut } from "../config/api";
import { 
  FaBuilding, 
  FaUsers, 
  FaTruck, 
  FaBox, 
  FaWallet, 
  FaSearch, 
  FaSave, 
  FaCheckCircle, 
  FaExclamationCircle,
  FaExchangeAlt
} from "react-icons/fa";

const SetupOpeningBalances = () => {
  const [loading, setLoading] = useState(true);
  const [entities, setEntities] = useState({
    customers: [],
    suppliers: [],
    mazdoors: [],
    items: [],
    accounts: []
  });
  const [activeTab, setActiveTab] = useState("customers");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState(null); // ID of entity being updated
  const [status, setStatus] = useState({ type: "", msg: "" }); // for notifications

  useEffect(() => {
    fetchEntities();
  }, []);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const res = await apiGet("/migration/entities");
      if (res.success) {
        setEntities(res.data);
      }
    } catch (err) {
      console.error(err);
      showStatus("error", "Data load karne mein masla hua: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const showStatus = (type, msg) => {
    setStatus({ type, msg });
    setTimeout(() => setStatus({ type: "", msg: "" }), 3000);
  };

  const handleUpdate = async (id, fields) => {
    try {
      setUpdating(id);
      const res = await apiPut("/migration/update", {
        entityType: activeTab.slice(0, -1), // removes 's' e.g. customers -> customer
        id,
        fields
      });
      if (res.success) {
        // Update local state
        const updatedList = entities[activeTab].map(item => 
          item._id === id ? { ...item, ...fields } : item
        );
        setEntities({ ...entities, [activeTab]: updatedList });
        showStatus("success", "Balance update ho gaya!");
      }
    } catch (err) {
      console.error(err);
      showStatus("error", "Update fail ho gaya: " + err.message);
    } finally {
      setUpdating(null);
    }
  };

  const filteredData = (entities[activeTab] || []).filter(item => 
    item.name?.toLowerCase().includes(search.toLowerCase()) ||
    item.accountNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: "customers", label: "Customers", icon: FaUsers, color: "text-blue-600", bg: "bg-blue-50" },
    { id: "suppliers", label: "Suppliers", icon: FaTruck, color: "text-emerald-600", bg: "bg-emerald-50" },
    { id: "mazdoors", label: "Mazdoors", icon: FaBuilding, color: "text-amber-600", bg: "bg-amber-50" },
    { id: "items", label: "Stock / Items", icon: FaBox, color: "text-purple-600", bg: "bg-purple-50" },
    { id: "accounts", label: "Accounts", icon: FaWallet, color: "text-rose-600", bg: "bg-rose-50" },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header section with Premium Aesthetic */}
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
           <FaExchangeAlt className="w-32 h-32 text-indigo-900" />
        </div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-slate-900">Initial Data Migration Setup</h1>
          <p className="text-slate-500 mt-2 max-w-2xl">
            Software start karne se pehle sab ke purane balances yahan se tezi se enter karein. 
            Ye balances aap ke **Ground Zero (Starting Point)** honge.
          </p>
        </div>
      </div>

      {/* Tabs Layout */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(""); }}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 ${
                isActive 
                ? `${tab.bg} ${tab.color} shadow-sm ring-1 ring-inset ring-black/5` 
                : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
              }`}
            >
              <Icon className="w-5 h-5" />
              {tab.label}
              <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${isActive ? "bg-white/50" : "bg-slate-100"}`}>
                {entities[tab.id]?.length || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by name..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {status.msg && (
          <div className={`px-4 py-2 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 ${
            status.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
          }`}>
            {status.type === "success" ? <FaCheckCircle className="w-5 h-5" /> : <FaExclamationCircle className="w-5 h-5" />}
            <span className="font-medium">{status.msg}</span>
          </div>
        )}
      </div>

      {/* Main Data Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">ID / Info</th>
                <th className="px-6 py-4 text-sm font-semibold text-slate-600">Entity Name</th>
                {activeTab === "items" ? (
                  <>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Opening Bags (Boriyan)</th>
                    <th className="px-6 py-4 text-sm font-semibold text-slate-600">Opening Weight (Kg)</th>
                  </>
                ) : (
                  <th className="px-6 py-4 text-sm font-semibold text-slate-600">Opening Balance (Rs.)</th>
                )}
                <th className="px-6 py-4 text-sm font-semibold text-slate-600 text-center w-32">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item, idx) => (
                <TableRow 
                  key={item._id} 
                  item={item} 
                  activeTab={activeTab} 
                  idx={idx}
                  onUpdate={handleUpdate}
                  isUpdating={updating === item._id}
                />
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400 italic">
                    No records found in this category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const TableRow = ({ item, activeTab, idx, onUpdate, isUpdating }) => {
  const [val, setVal] = useState(item.openingBalance || 0);
  const [bags, setBags] = useState(item.openingBags || 0);
  const [weight, setWeight] = useState(item.openingWeight || 0);

  // Sync state if item changes (e.g. on fetch)
  useEffect(() => {
    setVal(item.openingBalance || 0);
    setBags(item.openingBags || 0);
    setWeight(item.openingWeight || 0);
  }, [item]);

  const handleRowUpdate = () => {
    if (activeTab === "items") {
      onUpdate(item._id, { openingBags: Number(bags), openingWeight: Number(weight) });
    } else {
      onUpdate(item._id, { openingBalance: Number(val) });
    }
  };

  const isChanged = () => {
    if (activeTab === "items") {
       return bags !== item.openingBags || weight !== item.openingWeight;
    }
    return Number(val) !== item.openingBalance;
  };

  return (
    <tr className="hover:bg-slate-50/50 transition-colors group">
      <td className="px-6 py-4 text-xs font-mono text-slate-400">
        #{idx + 1}
      </td>
      <td className="px-6 py-4">
        <div className="font-semibold text-slate-800">{item.name}</div>
        {item.accountNumber && <div className="text-xs text-slate-400">{item.accountNumber}</div>}
        {item.phone && <div className="text-xs text-slate-400">{item.phone}</div>}
      </td>
      
      {activeTab === "items" ? (
        <>
          <td className="px-6 py-4">
            <input 
              type="number"
              className="w-32 px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right font-semibold"
              value={bags}
              onChange={(e) => setBags(e.target.value)}
            />
          </td>
          <td className="px-6 py-4">
            <input 
              type="number"
              className="w-32 px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right font-semibold"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
            />
          </td>
        </>
      ) : (
        <td className="px-6 py-4">
          <div className="flex items-center gap-2">
            <input 
              type="number"
              className={`w-48 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-right font-semibold transition-all ${
                Number(val) < 0 ? "border-rose-200 text-rose-600 bg-rose-50/30" : 
                Number(val) > 0 ? "border-emerald-200 text-emerald-600 bg-emerald-50/30" : 
                "border-slate-200 text-slate-700"
              }`}
              value={val}
              onChange={(e) => setVal(e.target.value)}
            />
            <span className="text-[10px] text-slate-400 uppercase font-bold italic">
              {Number(val) < 0 ? "They Owe Us" : Number(val) > 0 ? "We Owe Them" : ""}
            </span>
          </div>
        </td>
      )}

      <td className="px-6 py-4 text-center">
        <button 
          onClick={handleRowUpdate}
          disabled={isUpdating || !isChanged()}
          className={`p-2 rounded-lg transition-all duration-200 ${
            isChanged() 
            ? "bg-indigo-600 text-white shadow-md shadow-indigo-200 hover:bg-indigo-700 active:scale-95" 
            : "bg-slate-100 text-slate-300 pointer-events-none"
          }`}
        >
          {isUpdating ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <FaSave className="w-5 h-5" />
          )}
        </button>
      </td>
    </tr>
  );
};

export default SetupOpeningBalances;
