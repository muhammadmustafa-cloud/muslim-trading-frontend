import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, apiGet, apiPost, apiPut, apiDelete, apiPostFormData, apiPutFormData } from "../config/api.js";
import { downloadPurchasesPdf, downloadPurchaseInvoicePdf } from "../utils/exportPdf.js";
import { FaBoxOpen, FaSearch, FaEdit, FaPlus, FaSort, FaSortUp, FaSortDown, FaFilePdf, FaImage } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";
import PayBillModal from "../components/PayBillModal.jsx";
import { FaMoneyBillWave } from "react-icons/fa";
import SearchableSelect from "../components/SearchableSelect.jsx";
import ImagePreviewModal from "../components/ImagePreviewModal.jsx";

const today = (() => {
  const d = new Date();
  return d.toLocaleString("en-CA", { timeZone: "Asia/Karachi" }).slice(0, 10);
})();

export default function Purchases() {
  const [list, setList] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("list"); // "list" or "form"
  const [editingId, setEditingId] = useState(null);
  const { isAdmin } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: today,
    supplierId: "",
    totalGrossWeight: "",
    totalSHCut: "",
    netWeight: "",
    items: [{
      itemId: "",
      kattay: "",
      rate: "",
      totalAmount: "",
      itemNetWeight: "",
      deductionKg: "",
      addKg: "",
      bardanaAmount: "",
      extrasAmount: "",
    }],
    truckNumber: "",
    gatePassNo: "",
    goods: "",
    amountPaid: "",
    extras: "",
    accountId: "",
    notes: "",
    paymentTerms: "cash",
    dueDate: "",
    image: null,
  });
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", itemId: "", supplierId: "" });
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [payEntry, setPayEntry] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchItems = async () => {
    try {
      const data = await apiGet("/items");
      setItems(data.data || []);
    } catch (_) { }
  };
  const fetchSuppliers = async () => {
    try {
      const data = await apiGet("/suppliers");
      setSuppliers(data.data || []);
    } catch (_) { }
  };
  const fetchAccounts = async () => {
    try {
      const data = await apiGet("/accounts");
      setAccounts(data.data || []);
    } catch (_) { }
  };

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/stock-entries", {
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        itemId: filters.itemId || undefined,
        supplierId: filters.supplierId || undefined,
      });
      setList(data.data || []);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
    fetchSuppliers();
    fetchAccounts();
  }, []);
  useEffect(() => {
    fetchList();
  }, [filters.dateFrom, filters.dateTo, filters.itemId, filters.supplierId]);

  const resetForm = () => {
    setForm({
      date: today,
      supplierId: "",
      totalGrossWeight: "",
      totalSHCut: "",
      netWeight: "",
      items: [{
        itemId: "",
        kattay: "",
        rate: "",
        totalAmount: "",
        itemNetWeight: "",
        deductionKg: "",
        addKg: "",
        bardanaAmount: "",
        extrasAmount: "",
      }],
      truckNumber: "",
      gatePassNo: "",
      goods: "",
      amountPaid: "",
      totalBardanaAmount: "",
      totalMazdori: "",
      extras: "",
      accountId: "",
      notes: "",
      paymentTerms: "cash",
      dueDate: "",
      image: null,
    });
    setEditingId(null);
    setView("list");
  };

  const handleEdit = (row) => {
    setEditingId(row._id);
    setForm({
      date: formatDateForInput(row.date),
      supplierId: row.supplierId?._id || "",
      totalGrossWeight: String(row.totalGrossWeight || ""),
      totalSHCut: String(row.totalSHCut || ""),
      netWeight: String(row.netWeight || ""),
      items: row.items?.map(it => ({
        itemId: it.itemId?._id || it.itemId || "",
        kattay: String(it.kattay || ""),
        rate: String(it.rate || ""),
        totalAmount: String(it.amount || ""),
        itemNetWeight: String(it.itemNetWeight || ""),
        deductionKg: String(it.deductionKg || ""),
        addKg: String(it.addKg || ""),
        bardanaAmount: String(it.bardanaAmount || ""),
        extrasAmount: String(it.extrasAmount || ""),
      })) || [{
        itemId: row.itemId?._id || row.itemId || "",
        kattay: String(row.kattay || ""),
        rate: String(row.rate || ""),
        totalAmount: String(row.amount || ""),
        itemNetWeight: String(row.itemNetWeight || ""),
        deductionKg: String(row.deductionKg || ""),
        addKg: String(row.addKg || ""),
        bardanaAmount: String(row.bardanaAmount || ""),
        extrasAmount: String(row.extrasAmount || ""),
      }],
      truckNumber: row.truckNumber || "",
      gatePassNo: row.gatePassNo || "",
      goods: row.goods || "",
      amountPaid: String(row.amountPaid || ""),
      totalBardanaAmount: String(row.totalBardanaAmount || ""),
      totalMazdori: String(row.totalMazdori || ""),
      extras: String(row.extras || ""),
      accountId: row.accountId?._id || row.accountId || "",
      dueDate: row.dueDate ? formatDateForInput(row.dueDate) : "",
      notes: row.notes || "",
      paymentTerms: row.paymentTerms || "custom",
      image: null,
    });
    setView("form");
  };

  const formatDateForInput = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleString("en-CA", { timeZone: "Asia/Karachi" }).slice(0, 10);
  };

  const updateFormWithAutoCalc = (updates) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };

      // 1. MASTER TOTALS (Source of Truth) - Total Gross Weight comes from user input
      const totalGross = Number(next.totalGrossWeight) || 0;

      // Purchase Rule: 0.25kg S.H cut per 40kg (MUN)
      if (!("totalSHCut" in updates)) {
          next.totalSHCut = totalGross > 0 ? String(Number(((totalGross / 40) * 0.25).toFixed(2))) : next.totalSHCut;
      }

      const totalCut = Number(next.totalSHCut) || 0;
      const totalNet = Math.max(0, totalGross - totalCut);
      const totalMun = totalNet / 40;

      next.netWeight = Math.max(0, totalNet);

      // 2. Equal Distribution to Items (simplified approach)
      const itemCount = next.items.filter(it => it.itemId).length;
      const nextItems = next.items.map((it, index) => {
        // Only calculate for items that have itemId selected
        if (!it.itemId) {
          return {
            ...it,
            itemNetWeight: "",
            totalAmount: "",
          };
        }

        // Equal distribution among all valid items
        const ratio = itemCount > 0 ? 1 / itemCount : 0;
        
        const itemMun = totalMun * ratio;
        const itemNet = totalNet * ratio;
        const itemSHCut = totalCut * ratio;
        
        const rate = Number(it.rate) || 0;
        const totalLineBase = Math.round(itemMun * rate);
        
        return {
          ...it,
          shCut: String(itemSHCut.toFixed(2)),
          itemNetWeight: String(itemNet.toFixed(3)),
          totalAmount: totalLineBase > 0 ? String(totalLineBase) : "",
          bardanaAmount: "",
          extrasAmount: "",
          _calcInfo: { itemMun, totalLineBase } // for bardana, mazdori and extras distribution
        };
      });

      // 3. Distribute Extras, Bardana and Mazdori (like Sales system)
      const totalExtras = Number(next.extras) || 0;
      const totalBardana = Number(next.totalBardanaAmount) || 0;
      const totalMazdori = Number(next.totalMazdori) || 0;

      const extraPerMun = totalMun > 0 ? (totalExtras / totalMun) : 0;
      const bardanaPerMun = totalMun > 0 ? (totalBardana / totalMun) : 0;
      const mazdoriPerMun = totalMun > 0 ? (totalMazdori / totalMun) : 0;

      next.items = nextItems.map(item => {
        if (!item.itemId) {
          const { _calcInfo, ...rest } = item;
          return rest;
        }

        const itemProportionalExtra = item._calcInfo.itemMun * extraPerMun;
        const itemProportionalBardana = item._calcInfo.itemMun * bardanaPerMun;
        const itemProportionalMazdori = item._calcInfo.itemMun * mazdoriPerMun;

        const finalTotal = Math.round(item._calcInfo.totalLineBase + itemProportionalBardana + itemProportionalMazdori - itemProportionalExtra);
        
        const { _calcInfo, ...rest } = item;
        return {
          ...rest,
          bardanaAmount: String(Math.round(itemProportionalBardana)),
          extrasAmount: String(Math.round(itemProportionalExtra)),
          totalAmount: String(Math.max(0, finalTotal))
        };
      });

      // Payment terms / due date
      if ("paymentTerms" in updates || "date" in updates) {
          if (next.paymentTerms === "custom") { }
          else if (next.paymentTerms === "cash") next.dueDate = next.date;
          else {
              const days = parseInt(next.paymentTerms);
              if (!isNaN(days) && next.date) {
                  const d = new Date(next.date);
                  d.setDate(d.getDate() + days);
                  next.dueDate = d.toISOString().slice(0, 10);
              }
          }
      }

      return next;
    });
  };

  const addItemRow = () => {
    setForm(prev => ({
      ...prev,
      items: [...prev.items, {
        itemId: "",
        kattay: "",
        rate: "",
        totalAmount: "",
        itemNetWeight: "",
        deductionKg: "",
        addKg: "",
        bardanaAmount: "",
        extrasAmount: "",
      }]
    }));
  };

  const removeItemRow = (index) => {
    if (form.items.length <= 1) return;
    setForm(prev => {
      const newItems = prev.items.filter((_, i) => i !== index);
      return { ...prev, items: newItems };
    });
  };
  const openAddModal = () => {
    resetForm();
    setForm((f) => ({ ...f, date: today }));
    setEditingId(null);
    setView("form");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplierId || form.items.some(it => !it.itemId)) {
      setError("Supplier aur saare items select karein.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        date: form.date,
        supplierId: form.supplierId,
        totalGrossWeight: Number(form.totalGrossWeight) || 0,
        totalSHCut: Number(form.totalSHCut) || 0,
        netWeight: Number(form.netWeight) || 0,
        items: JSON.stringify(form.items.map(it => ({
          itemId: it.itemId,
          kattay: Number(it.kattay) || 0,
          rate: Number(it.rate) || 0,
          totalAmount: Number(it.totalAmount) || 0,
          deductionKg: Number(it.deductionKg) || 0,
          addKg: Number(it.addKg) || 0,
          bardanaAmount: Number(it.bardanaAmount) || 0,
          extrasAmount: Number(it.extrasAmount) || 0,
        }))),
        truckNumber: (form.truckNumber || "").trim(),
        gatePassNo: (form.gatePassNo || "").trim(),
        goods: (form.goods || "").trim(),
        amountPaid: Number(form.amountPaid) || 0,
        totalBardanaAmount: Number(form.totalBardanaAmount) || 0,
        totalMazdori: Number(form.totalMazdori) || 0,
        extras: Number(form.extras) || 0,
        dueDate: form.dueDate || undefined,
        accountId: form.accountId || undefined,
        notes: (form.notes || "").trim(),
      };

      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== undefined) {
          formData.append(key, payload[key]);
        }
      });
      if (form.image) {
        formData.append("image", form.image);
      }
      
      if (editingId) {
        await apiPutFormData(`/stock-entries/${editingId}`, formData);
      } else {
        await apiPostFormData("/stock-entries", formData);
      }
      resetForm();
      setView("list");
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
      if (sortKey === "item") {
        const va = (a.itemId?.name || "").toLowerCase();
        const vb = (b.itemId?.name || "").toLowerCase();
        return sortDir === "asc" ? va.localeCompare(vb) : -va.localeCompare(vb);
      }
      if (sortKey === "supplier") {
        const va = (a.supplierId?.name || "").toLowerCase();
        const vb = (b.supplierId?.name || "").toLowerCase();
        return sortDir === "asc" ? va.localeCompare(vb) : -va.localeCompare(vb);
      }
      if (sortKey === "kgPerKata") {
        const va = Number(a.kgPerKata) || 0;
        const vb = Number(b.kgPerKata) || 0;
        return sortDir === "asc" ? va - vb : vb - va;
      }
      if (sortKey === "amount") {
        const va = Number(a.amount) || 0;
        const vb = Number(b.amount) || 0;
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

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "—");

  if (view === "form") {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <header className="flex items-center justify-between border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FaBoxOpen className="text-amber-500" />
              {editingId ? "Edit Purchase Invoice" : "Nayi Purchase Entry"}
            </h1>
            <p className="text-slate-500 text-sm">Supplier details enter karein aur items add karein.</p>
          </div>
          <button type="button" onClick={resetForm} className="btn-secondary">
            Back to List
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="card p-6 border-t-4 border-t-indigo-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="input-label">Tarikh *</label>
                <input type="date" value={form.date} onChange={(e) => updateFormWithAutoCalc({ date: e.target.value })} className="input-field" required />
              </div>
              <div>
                <label className="input-label">Supplier *</label>
                <SearchableSelect
                  options={suppliers}
                  value={form.supplierId}
                  onChange={(val) => setForm((f) => ({ ...f, supplierId: val }))}
                  placeholder="Select supplier"
                />
              </div>
              <div>
                <label className="input-label">Truck number</label>
                <input type="text" placeholder="e.g. LEA-1234" value={form.truckNumber} onChange={(e) => setForm((f) => ({ ...f, truckNumber: e.target.value }))} className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
              <div>
                <label className="input-label font-bold text-indigo-800">Total Gross Weight (Kg)</label>
                <input type="number" value={form.totalGrossWeight} onChange={(e) => updateFormWithAutoCalc({ totalGrossWeight: e.target.value })} className="input-field border-indigo-300 shadow-sm" placeholder="0" />
              </div>
              <div className="relative">
                <label className="input-label font-bold text-indigo-800">Total S.H Cut (Kg)</label>
                <input type="number" value={form.totalSHCut} onChange={(e) => updateFormWithAutoCalc({ totalSHCut: e.target.value })} className="input-field border-indigo-300 shadow-sm" placeholder="0" />
                <span className="absolute -bottom-5 left-0 text-[10px] text-indigo-500 font-medium whitespace-nowrap">* Auto: 0.25kg per MUN (40kg)</span>
              </div>
              <div>
                <label className="input-label font-bold text-indigo-800">Net Weight (Kg)</label>
                <div className="bg-indigo-100 border border-indigo-300 rounded-lg py-2.5 px-3 font-black text-indigo-900 text-lg shadow-inner">
                  {form.netWeight} Kg
                </div>
              </div>
              <div>
                <label className="input-label">GP# / Remark / Goods</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="GP#" value={form.gatePassNo} onChange={(e) => setForm(f => ({ ...f, gatePassNo: e.target.value }))} className="input-field w-1/2 shadow-sm" />
                  <input type="text" placeholder="Goods" value={form.goods} onChange={(e) => setForm(f => ({ ...f, goods: e.target.value }))} className="input-field w-1/2 shadow-sm" />
                </div>
              </div>
            </div>
          </section>

          <section className="card overflow-hidden border-t-4 border-t-amber-500">
            <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Purchase Items List</h3>
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Line items in this delivery</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left w-64">Item *</th>
                    <th className="px-4 py-3 text-left w-24">Bags</th>
                    <th className="px-4 py-3 text-left w-24 text-rose-800">Less (Kg)</th>
                    <th className="px-4 py-3 text-left w-24 text-emerald-800">Add (Kg)</th>
                    <th className="px-4 py-3 text-left w-24 bg-amber-50 font-black text-amber-900 border-x border-amber-100">Net MUN</th>
                    <th className="px-4 py-3 text-left w-36">Rate (MUN) *</th>
                    <th className="px-4 py-3 text-right font-bold bg-slate-200/50">Line Total</th>
                    <th className="px-4 py-3 text-center w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {form.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                      <td className="p-3">
                        <SearchableSelect
                          options={items.map(i => ({ _id: i._id, name: `${i.name} (${i.quality || "Standard"})` }))}
                          value={item.itemId}
                          onChange={(val) => {
                            const newItems = [...form.items];
                            newItems[idx].itemId = val;
                            updateFormWithAutoCalc({ items: newItems });
                          }}
                          placeholder="Select Item"
                        />
                      </td>
                      <td className="p-3">
                        <input type="number" value={item.kattay} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].kattay = e.target.value;
                          updateFormWithAutoCalc({ items: newItems });
                        }} className="input-field py-1.5 px-2" placeholder="0" />
                      </td>
                      <td className="p-3">
                        <input type="number" value={item.deductionKg} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].deductionKg = e.target.value;
                          updateFormWithAutoCalc({ items: newItems });
                        }} className="input-field py-1.5 px-2 bg-rose-50 border-rose-200 placeholder:text-rose-300 text-center" placeholder="0" />
                      </td>
                      <td className="p-3">
                        <input type="number" value={item.addKg} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].addKg = e.target.value;
                          updateFormWithAutoCalc({ items: newItems });
                        }} className="input-field py-1.5 px-2 bg-emerald-50 border-emerald-200 placeholder:text-emerald-300 text-center" placeholder="0" />
                      </td>
                      <td className="p-3 text-center bg-amber-50 font-black text-amber-900 border-x border-amber-100">
                        {item.itemNetWeight !== undefined && item.itemNetWeight !== "" ? (Number(item.itemNetWeight) / 40).toFixed(4) : "â"}
                      </td>
                      <td className="p-3">
                        <input type="number" value={item.rate} onChange={(e) => {
                          const newItems = [...form.items];
                          newItems[idx].rate = e.target.value;
                          updateFormWithAutoCalc({ items: newItems });
                        }} className="input-field py-1.5 px-2 font-bold text-amber-700 bg-amber-50/50" placeholder="0" />
                      </td>
                      <td className="p-3 text-right font-black text-indigo-700 bg-slate-50/50 text-base">
                        {item.totalAmount ? Number(item.totalAmount).toLocaleString("en-PK") : "â"}
                      </td>
                      <td className="p-3 text-center">
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItemRow(idx)} className="text-red-400 hover:text-red-600 transition-colors p-1.5 hover:bg-red-50 rounded" title="Remove row">
                            <FaPlus className="w-4 h-4 rotate-45" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <button type="button" onClick={addItemRow} className="w-full py-4 bg-slate-50 text-indigo-600 font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 border-t border-slate-200 group">
                <FaPlus className="w-4 h-4 group-hover:scale-110" /> Add Another Item to this Invoice
              </button>
            </div>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-6 space-y-4 lg:col-span-2">
              <h3 className="font-bold text-slate-700 border-b pb-2">Payment Info & Receipts</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Amount Paid / Account</label>
                  <div className="flex gap-2">
                    <input type="number" value={form.amountPaid} onChange={(e) => setForm(f => ({ ...f, amountPaid: e.target.value }))} className="input-field w-1/2" placeholder="0" />
                    <select value={form.accountId} onChange={(e) => setForm(f => ({ ...f, accountId: e.target.value }))} className="input-field w-1/2">
                      <option value="">Account —</option>
                      {accounts.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="input-label">Payment Terms & Due Date</label>
                  <div className="flex gap-2">
                    <select value={form.paymentTerms} onChange={(e) => updateFormWithAutoCalc({ paymentTerms: e.target.value })} className="input-field w-1/2">
                      <option value="cash">Full Cash (Aaj)</option>
                      <option value="15">15 Din baad</option>
                      <option value="30">30 Din baad</option>
                      <option value="custom">Custom Date</option>
                    </select>
                    <input type="date" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value, paymentTerms: 'custom' }))} className="input-field w-1/2" />
                  </div>
                </div>
                <div>
                  <label className="input-label font-bold text-slate-600">Total Bardana (Truck)</label>
                  <input type="number" value={form.totalBardanaAmount} onChange={(e) => setForm(f => ({ ...f, totalBardanaAmount: e.target.value }))} className="input-field bg-slate-50 border-slate-200" placeholder="0" />
                </div>
                <div>
                  <label className="input-label font-bold text-slate-600">Total Mazdori (Truck)</label>
                  <input type="number" value={form.totalMazdori} onChange={(e) => setForm(f => ({ ...f, totalMazdori: e.target.value }))} className="input-field bg-slate-50 border-slate-200" placeholder="0" />
                </div>
                <div>
                  <label className="input-label text-rose-600 font-bold">Extras (Deduction)</label>
                  <input type="number" value={form.extras} onChange={(e) => setForm(f => ({ ...f, extras: e.target.value }))} className="input-field border-rose-300 bg-rose-50" placeholder="e.g. 500" />
                </div>
              </div>
              <div>
                <label className="input-label flex items-center gap-2"><FaImage className="text-slate-400" /> Image / Receipt</label>
                <input type="file" accept="image/*" onChange={(e) => setForm(f => ({ ...f, image: e.target.files[0] }))} className="input-field" />
              </div>
              <div>
                <label className="input-label">Special Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="input-field h-20" placeholder="Any special notes for this purchase..." />
              </div>
            </div>

            <div className="card p-6 bg-slate-900 text-white flex flex-col justify-between border-t-4 border-t-emerald-500 shadow-xl">
              <div className="space-y-4">
                <h3 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em]">Purchase Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-400">
                    <span>Total Items:</span>
                    <span className="text-white font-bold">{form.items.length}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Total Net MUN:</span>
                    <span className="text-white font-bold">{(Number(form.netWeight) / 40).toFixed(4)} MUN</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Net Weight (Kg):</span>
                    <span className="text-white font-bold">{form.netWeight} Kg</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-1">
                    <span>Items Sum:</span>
                    <span className="text-white font-bold">Rs. {form.items.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0).toLocaleString("en-PK")}</span>
                  </div>
                  <div className="flex justify-between text-amber-400">
                    <span>Total Bardana:</span>
                    <span className="font-bold">+ Rs. {Number(form.totalBardanaAmount || 0).toLocaleString("en-PK")}</span>
                  </div>
                  <div className="flex justify-between text-blue-400">
                    <span>Total Mazdori:</span>
                    <span className="font-bold">+ Rs. {Number(form.totalMazdori || 0).toLocaleString("en-PK")}</span>
                  </div>
                  <div className="flex justify-between text-rose-400 border-b border-slate-800 pb-2">
                    <span>Extras Deduction:</span>
                    <span className="font-bold">- Rs. {Number(form.extras || 0).toLocaleString("en-PK")}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 pt-2 pb-2 border-b border-slate-800">
                    <span className="text-emerald-400 font-bold text-lg uppercase tracking-tight">Grand Total:</span>
                    <span className="text-3xl font-black text-white">Rs. {
                      (form.items.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0) + 
                      (Number(form.totalBardanaAmount) || 0) + 
                      (Number(form.totalMazdori) || 0) - 
                      (Number(form.extras) || 0)).toLocaleString("en-PK")
                    }</span>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-1">Status Preview</p>
                  <p className="text-lg font-black text-amber-500">
                    {Number(form.amountPaid) >= (form.items.reduce((sum, i) => sum + (Number(i.totalAmount) || 0), 0) + 
                      (Number(form.totalBardanaAmount) || 0) + 
                      (Number(form.totalMazdori) || 0) - 
                      (Number(form.extras) || 0)) ? "PAID" : "CREDIT / PARTIAL"}
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {error && <p className="text-xs text-red-400 font-bold bg-red-400/10 p-2 rounded border border-red-400/20">{error}</p>}
                <button type="submit" className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-lg rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2" disabled={submitting}>
                  {submitting ? (
                    <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Processing...</>
                  ) : (editingId ? "Update Purchase" : "Save Purchase Invoice")}
                </button>
                <button type="button" onClick={resetForm} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-all" disabled={submitting}>
                  Cancel / Go Back
                </button>
              </div>
            </div>
          </section>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaBoxOpen className="w-7 h-7 text-amber-500" />
            Purchase
          </h1>
          <p className="page-subtitle">Naya maal jo suppliers se aata hai.</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary">
          <FaPlus className="w-4 h-4" /> Add Purchase
        </button>
      </header>



      {/* Filters */}
      <section className="card p-4 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="input-label">Date from</label>
            <input type="date" value={filters.dateFrom} onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="input-label">Date to</label>
            <input type="date" value={filters.dateTo} onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="input-label">Supplier</label>
            <SearchableSelect
              options={suppliers}
              value={filters.supplierId}
              onChange={(val) => setFilters(f => ({ ...f, supplierId: val }))}
              placeholder="All Suppliers"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="input-label">Item</label>
              <SearchableSelect
                options={items}
                value={filters.itemId}
                onChange={(val) => setFilters(f => ({ ...f, itemId: val }))}
                placeholder="All Items"
              />
            </div>
            <button type="button" onClick={() => setFilters({ dateFrom: "", dateTo: "", itemId: "", supplierId: "" })} className="btn-ghost-secondary h-10 px-3 mt-auto" title="Clear Filters">
              <FaPlus className="w-4 h-4 rotate-45 opacity-50" />
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 border-t-4 border-t-amber-500 rounded-t-xl">
          <p className="text-sm font-bold text-slate-700">{list.length} purchase invoices</p>
          <button type="button" onClick={() => downloadPurchasesPdf(sortedList, filters)} className="btn-primary flex items-center gap-1.5" disabled={list.length === 0} title="Download PDF"><FaFilePdf className="w-4 h-4" /> Export PDF</button>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="empty-state"><div className="loading-spinner mb-3" /><p>Loading...</p></div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("date")} className="flex items-center hover:text-slate-800">Date<SortIcon columnKey="date" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("supplier")} className="flex items-center hover:text-slate-800">Supplier<SortIcon columnKey="supplier" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">Products</th>
                    <th className="table-header px-5 py-3.5 text-center">Bags</th>
                    <th className="table-header px-5 py-3.5">Gross Wt (kg)</th>
                    <th className="table-header px-5 py-3.5">Net Wt (kg)</th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("amount")} className="flex items-center hover:text-slate-800">Total Bill<SortIcon columnKey="amount" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">Truck</th>
                    <th className="table-header px-5 py-3.5">Status</th>
                    <th className="table-header px-5 py-3.5 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover text-sm">
                      <td className="table-cell">{formatDate(row.date)}</td>
                      <td className="table-cell font-bold text-slate-900">{row.supplierId?.name || "—"}</td>
                      <td className="table-cell">
                        <div className="flex flex-col gap-0.5">
                          {row.items?.slice(0, 2).map((it, idx) => (
                            <span key={idx} className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 truncate max-w-[120px]">
                              {it.itemId?.name || "Item"}
                            </span>
                          ))}
                          {(row.items?.length > 2) && <span className="text-[10px] text-slate-500 font-medium">+{row.items.length - 2} more</span>}
                        </div>
                      </td>
                      <td className="table-cell text-center font-medium">
                        {row.items?.reduce((sum, it) => sum + (it.kattay || 0), 0) || row.kattay || "—"}
                      </td>
                      <td className="table-cell font-medium text-slate-600">
                        {row.totalGrossWeight || (row.kattay * row.kgPerKata) || "—"}
                      </td>
                      <td className="table-cell font-bold text-indigo-700">
                        {row.netWeight || row.receivedWeight || "—"}
                      </td>
                      <td className="table-cell font-black text-slate-900">
                        {row.totalAmount ? Number(row.totalAmount).toLocaleString("en-PK") : Number(row.amount).toLocaleString("en-PK")}
                      </td>
                      <td className="table-cell text-xs uppercase font-medium">{row.truckNumber || "—"}</td>
                      <td className="table-cell">
                        {row.paymentStatus === 'paid' ? (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">Paid</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold w-fit ${row.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                              {row.paymentStatus === 'partial' ? 'Partial' : 'Pending'}
                            </span>
                            {row.dueDate && (
                              <span className={`text-[10px] whitespace-nowrap ${new Date(row.dueDate) < new Date() ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                                Due: {formatDate(row.dueDate)}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          {row.image && (
                            <button type="button" onClick={() => setPreviewImage(row.image)} className="btn-ghost-primary flex items-center gap-1 text-indigo-500 hover:text-indigo-700 bg-indigo-50" title="Preview Image">
                              <FaImage className="w-3.5 h-3.5" /> 
                            </button>
                          )}
                          {row.paymentStatus !== "paid" && (
                            <button
                              type="button"
                              onClick={() => {
                                setPayEntry(row);
                                setPayModalOpen(true);
                              }}
                              className="px-2 py-1 bg-emerald-600 text-white text-[10px] font-bold rounded hover:bg-emerald-700 flex items-center gap-1"
                              title="Bill Settle Karein"
                            >
                              <FaMoneyBillWave className="w-3 h-3" /> Pay
                            </button>
                          )}
                          {isAdmin && (
                            <button type="button" onClick={() => handleEdit(row)} className="btn-ghost-primary flex items-center gap-1 shadow-sm px-3 hover:bg-slate-100 transition-colors">
                              <FaEdit className="w-3.5 h-3.5" /> Edit
                            </button>
                          )}
                          <button type="button" onClick={() => downloadPurchaseInvoicePdf(row)} className="btn-ghost-secondary flex items-center gap-1">
                            <FaFilePdf className="w-3.5 h-3.5" /> Invoice
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} totalItems={sortedList.length} />
            </>
          )}
          {!loading && list.length === 0 && (
            <div className="empty-state">
              <FaBoxOpen className="w-12 h-12 text-slate-300 mb-2" />
              <p>Abhi koi purchases nahi.</p>
            </div>
          )}
        </div>
      </section>

      <PayBillModal
        open={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        entry={payEntry}
        onSuccess={() => fetchList()}
      />

      <ImagePreviewModal
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage}
        title="Purchase Receipt Preview"
      />
    </div>
  );
}
