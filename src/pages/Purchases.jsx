import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, apiPost, apiPut, apiDelete, apiPostFormData } from "../config/api.js";
import { downloadPurchasesPdf, downloadPurchaseInvoicePdf } from "../utils/exportPdf.js";
import { FaBoxOpen, FaSearch, FaEdit, FaPlus, FaSort, FaSortUp, FaSortDown, FaFilePdf, FaImage } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";
import PayBillModal from "../components/PayBillModal.jsx";
import { FaMoneyBillWave } from "react-icons/fa";
import SearchableSelect from "../components/SearchableSelect.jsx";
import ImagePreviewModal from "../components/ImagePreviewModal.jsx";

const today = new Date().toISOString().slice(0, 10);

export default function Purchases() {
  const [list, setList] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: today,
    itemId: "",
    supplierId: "",
    kattay: "",
    kgPerKata: "",
    millWeight: "",
    supplierWeight: "",
    shCut: "",
    rate: "",
    amount: "",
    bardanaAmount: "",
    truckNumber: "",
    gatePassNo: "",
    goods: "",
    amountPaid: "",
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
      const res = await fetch(`${API_BASE_URL}/items`);
      const data = await res.json();
      if (res.ok) setItems(data.data || []);
    } catch (_) { }
  };
  const fetchSuppliers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/suppliers`);
      const data = await res.json();
      if (res.ok) setSuppliers(data.data || []);
    } catch (_) { }
  };
  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/accounts`);
      const data = await res.json();
      if (res.ok) setAccounts(data.data || []);
    } catch (_) { }
  };

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
      if (filters.dateTo) params.set("dateTo", filters.dateTo);
      if (filters.itemId) params.set("itemId", filters.itemId);
      if (filters.supplierId) params.set("supplierId", filters.supplierId);
      const res = await fetch(`${API_BASE_URL}/stock-entries?${params}`);
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
      itemId: "",
      supplierId: "",
      kattay: "",
      kgPerKata: "",
      millWeight: "",
      supplierWeight: "",
      shCut: "",
      rate: "",
      amount: "",
      bardanaAmount: "",
      truckNumber: "",
      gatePassNo: "",
      goods: "",
      amountPaid: "",
      accountId: "",
      notes: "",
      paymentTerms: "cash",
      dueDate: "",
      image: null,
    });
    setModalOpen(false);
  };

  const updateFormWithAutoCalc = (updates) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };

      const kattay = Number(next.kattay) || 0;
      const kgPerKata = Number(next.kgPerKata) || 0;
      const rate = Number(next.rate) || 0;
      const bardanaAmount = Number(next.bardanaAmount) || 0;

      // 1. Calculate Gross Weight
      const grossWeight = kattay > 0 && kgPerKata > 0 ? kattay * kgPerKata : 0;

      // 2. Standard Rule for Purchase: 250g (0.25kg) cut per 40kg (1 MUN)
      let shCut = 0;
      if (grossWeight > 0) {
        shCut = Number(((grossWeight / 40) * 0.25).toFixed(2));
      }
      next.shCut = shCut > 0 ? String(shCut) : "";

      // 3. Calculate Net Weight (receivedWeight)
      const netWeight = Math.max(0, grossWeight - shCut);
      next.receivedWeight = netWeight > 0 ? String(netWeight) : "";

      // 4. Auto calc amount: (NetWeight / 40) * Rate + Bardana
      if (netWeight > 0 && rate > 0) {
        next.amount = String(Math.round((netWeight / 40) * rate + bardanaAmount));
      } else if ("kattay" in updates || "rate" in updates || "bardanaAmount" in updates || "kgPerKata" in updates) {
        next.amount = "";
      }

      // Auto calc dueDate if paymentTerms changed or date changed
      if ("paymentTerms" in updates || "date" in updates) {
        if (next.paymentTerms === "custom") {
          // keep existing or manual
        } else if (next.paymentTerms === "cash") {
          next.dueDate = next.date;
        } else {
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
  const openAddModal = () => {
    resetForm();
    setForm((f) => ({ ...f, date: today }));
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.itemId || !form.supplierId) {
      setError("Item aur supplier zaroori hain.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        date: form.date,
        itemId: form.itemId,
        supplierId: form.supplierId,
        kattay: Number(form.kattay) || 0,
        kgPerKata: Number(form.kgPerKata) || 0,
        shCut: Number(form.shCut) || 0,
        receivedWeight: Number(form.receivedWeight) || 0,
        millWeight: Number(form.millWeight) || 0,
        supplierWeight: Number(form.supplierWeight) || 0,
        rate: Number(form.rate) || 0,
        bardanaAmount: Number(form.amount) || 0, // Wait, was this bardanaAmount? Let me check lines 198
        truckNumber: (form.truckNumber || "").trim(),
        gatePassNo: (form.gatePassNo || "").trim(),
        goods: (form.goods || "").trim(),
        amountPaid: Number(form.amountPaid) || 0,
        dueDate: form.dueDate || undefined,
        accountId: form.accountId || undefined,
        notes: form.notes || "",
      };
      payload.amount = Number(form.amount) || 0;
      payload.bardanaAmount = Number(form.bardanaAmount) || 0;

      const formData = new FormData();
      Object.keys(payload).forEach(key => {
        if (payload[key] !== undefined) {
          formData.append(key, payload[key]);
        }
      });
      if (form.image) {
        formData.append("image", form.image);
      }

      await apiPostFormData("/stock-entries", formData);
      resetForm();
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

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric" }) : "—");

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

      <Modal open={modalOpen} onClose={resetForm} title="New Purchase">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Tarikh *</label>
              <input type="date" value={form.date} onChange={(e) => updateFormWithAutoCalc({ date: e.target.value })} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Item *</label>
              <SearchableSelect
                options={items}
                value={form.itemId}
                onChange={(val) => setForm((f) => ({ ...f, itemId: val }))}
                placeholder="Select item"
              />
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
            <div>
              <label className="input-label">Gate Pass No</label>
              <input type="text" placeholder="e.g. GP-1092" value={form.gatePassNo} onChange={(e) => setForm((f) => ({ ...f, gatePassNo: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="input-label">Goods Description</label>
              <input type="text" placeholder="e.g. Rice, Wheat" value={form.goods} onChange={(e) => setForm((f) => ({ ...f, goods: e.target.value }))} className="input-field" />
            </div>
            <div className="sm:col-span-2">
              <label className="input-label flex items-center gap-2"><FaImage className="text-slate-400" /> Upload Image / Receipt (Max 5MB)</label>
              <input type="file" accept="image/jpeg, image/png, image/jpg, image/webp" onChange={(e) => {
                const file = e.target.files[0];
                if (file && file.size > 5 * 1024 * 1024) {
                  alert("File size exceeds 5MB limit. Please choose a smaller image.");
                  e.target.value = "";
                  return;
                }
                setForm(f => ({ ...f, image: file }));
              }} className="input-field cursor-pointer file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
              {form.image && (
                <div className="mt-3 bg-slate-50 p-2 rounded border border-slate-200 text-center">
                  <p className="text-xs text-slate-500 font-medium mb-2">Selected File Preview:</p>
                  <img src={URL.createObjectURL(form.image)} alt="Preview" className="max-h-32 object-contain mx-auto rounded shadow-sm" />
                </div>
              )}
            </div>
            <div>
              <label className="input-label">Kitne kattay aaye</label>
              <input type="number" placeholder="0" value={form.kattay} onChange={(e) => updateFormWithAutoCalc({ kattay: e.target.value })} className="input-field" min="0" step="1" />
            </div>
            <div>
              <label className="input-label">Aik katta kitne kg ka he</label>
              <input type="number" placeholder="0" value={form.kgPerKata} onChange={(e) => updateFormWithAutoCalc({ kgPerKata: e.target.value })} className="input-field" min="0" step="any" />
            </div>
            <div>
              <label className="input-label">Total S.H Cut (kg)</label>
              <input type="number" placeholder="0" value={form.shCut} onChange={(e) => updateFormWithAutoCalc({ shCut: e.target.value })} className="input-field bg-slate-50" min="0" step="any" readOnly />
              <p className="text-[10px] text-slate-500 mt-0.5">Auto: 250g per 40kg</p>
            </div>
            <div>
              <label className="input-label">Stock Weight (Net kg)</label>
              <input type="number" placeholder="0" value={form.receivedWeight} onChange={(e) => updateFormWithAutoCalc({ receivedWeight: e.target.value })} className="input-field bg-slate-50 font-semibold" min="0" step="any" readOnly />
            </div>
            <div>
              <label className="input-label font-bold text-amber-700">Rate (Per MUN / 40Kg)</label>
              <input type="number" placeholder="0" value={form.rate} onChange={(e) => updateFormWithAutoCalc({ rate: e.target.value })} className="input-field" min="0" step="any" />
            </div>
            <div>
              <label className="input-label">Mill weight (kg)</label>
              <input type="number" placeholder="0" value={form.millWeight} onChange={(e) => setForm((f) => ({ ...f, millWeight: e.target.value }))} className="input-field" min="0" step="any" />
            </div>
            <div>
              <label className="input-label">Supplier weight (kg)</label>
              <input type="number" placeholder="0" value={form.supplierWeight} onChange={(e) => setForm((f) => ({ ...f, supplierWeight: e.target.value }))} className="input-field" min="0" step="any" />
            </div>
            <div>
              <label className="input-label">Bardana Amount</label>
              <input type="number" placeholder="0" value={form.bardanaAmount} onChange={(e) => updateFormWithAutoCalc({ bardanaAmount: e.target.value })} className="input-field" min="0" />
            </div>

            <div>
              <label className="input-label font-bold text-amber-700">Total Bill Amount</label>
              <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input-field font-bold text-amber-900 bg-amber-50" min="0" />
            </div>
            <div>
              <label className="input-label">Amount paid (optional)</label>
              <input type="number" placeholder="0" value={form.amountPaid} onChange={(e) => setForm((f) => ({ ...f, amountPaid: e.target.value }))} className="input-field" min="0" step="1" />
            </div>
            <div>
              <label className="input-label">Account (if paid)</label>
              <select value={form.accountId} onChange={(e) => setForm((f) => ({ ...f, accountId: e.target.value }))} className="input-field">
                <option value="">—</option>
                {accounts.map((a) => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <div>
              <label className="input-label font-semibold text-amber-700">Payment Terms (Kab paise dene hain?)</label>
              <select
                value={form.paymentTerms}
                onChange={(e) => updateFormWithAutoCalc({ paymentTerms: e.target.value })}
                className="input-field border-amber-200 bg-amber-50/30"
              >
                <option value="cash">Full Cash (Aaj)</option>
                <option value="10">10 Din baad (10 Days)</option>
                <option value="15">15 Din baad (15 Days)</option>
                <option value="30">30 Din baad (30 Days)</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>
            <div>
              <label className="input-label">Due Date (Bhugtan ki tareekh)</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value, paymentTerms: 'custom' }))}
                className="input-field"
              />
              <p className="text-xs text-slate-500 mt-1">Audit ke liye yeh tareekh zaroori he.</p>
            </div>
          </div>
          <div>
            <label className="input-label">Notes</label>
            <input type="text" placeholder="Optional" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="input-field" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? (
                 <span className="flex items-center justify-center gap-2">
                   <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Saving...
                 </span>
              ) : "Add entry"}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary px-6" disabled={submitting}>Cancel</button>
          </div>
        </form>
      </Modal>


      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} className="input-field w-40" placeholder="From" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} className="input-field w-40" placeholder="To" />
          
          <SearchableSelect
            options={items}
            value={filters.itemId}
            onChange={(val) => setFilters((f) => ({ ...f, itemId: val }))}
            placeholder="All items"
            className="w-56"
          />

          <SearchableSelect
            options={suppliers}
            value={filters.supplierId}
            onChange={(val) => setFilters((f) => ({ ...f, supplierId: val }))}
            placeholder="All suppliers"
            className="w-56"
          />

          <p className="text-sm text-slate-500">{list.length} entry(ies)</p>
          <button type="button" onClick={() => downloadPurchasesPdf(sortedList, { dateFrom: filters.dateFrom, dateTo: filters.dateTo, itemId: filters.itemId, supplierId: filters.supplierId })} className="btn-primary flex items-center gap-1.5" disabled={list.length === 0} title="Download PDF"><FaFilePdf className="w-4 h-4" /> Export PDF</button>
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
                      <button type="button" onClick={() => toggleSort("item")} className="flex items-center hover:text-slate-800">Item<SortIcon columnKey="item" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("supplier")} className="flex items-center hover:text-slate-800">Supplier<SortIcon columnKey="supplier" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">Truck</th>
                    <th className="table-header px-5 py-3.5">Kattay</th>
                    <th className="table-header px-5 py-3.5">Kg/kata</th>
                    <th className="table-header px-5 py-3.5">Weight</th>
                    <th className="table-header px-5 py-3.5">Mill (kg)</th>
                    <th className="table-header px-5 py-3.5">Supplier (kg)</th>
                    <th className="table-header px-5 py-3.5">Amount</th>
                    <th className="table-header px-5 py-3.5">Status</th>
                    <th className="table-header px-5 py-3.5 w-28">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      <td className="table-cell">{formatDate(row.date)}</td>
                      <td className="table-cell font-medium">{row.itemId?.name || "—"}</td>
                      <td className="table-cell">{row.supplierId?.name || "—"}</td>
                      <td className="table-cell">{row.truckNumber ? row.truckNumber : "—"}</td>
                      <td className="table-cell">{row.kattay != null && row.kattay > 0 ? row.kattay : "—"}</td>
                      <td className="table-cell">{row.kgPerKata != null && row.kgPerKata > 0 ? row.kgPerKata : "—"}</td>
                      <td className="table-cell">{row.receivedWeight != null && row.receivedWeight > 0 ? row.receivedWeight : "—"}</td>
                      <td className="table-cell">{row.millWeight != null && row.millWeight > 0 ? row.millWeight : "—"}</td>
                      <td className="table-cell">{row.supplierWeight != null && row.supplierWeight > 0 ? row.supplierWeight : "—"}</td>
                      <td className="table-cell font-medium">{row.amount != null && row.amount > 0 ? Number(row.amount).toLocaleString("en-PK") : "—"}</td>
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
