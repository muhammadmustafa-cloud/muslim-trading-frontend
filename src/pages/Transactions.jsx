import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { apiGet, apiPost, apiPostFormData, apiPutFormData, apiDelete } from "../config/api.js";
import { buildCsv, downloadCsv } from "../utils/exportToCsv.js";
import { downloadTransactionsPdf } from "../utils/exportPdf.js";
import { FaExchangeAlt, FaPlus, FaSort, FaSortUp, FaSortDown, FaFileExport, FaFilePdf, FaImage, FaEdit, FaTrash } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";
import SearchableSelect from "../components/SearchableSelect.jsx";
import ImagePreviewModal from "../components/ImagePreviewModal.jsx";

const today = (() => {
  const d = new Date();
  return d.toLocaleString("en-CA", { timeZone: "Asia/Karachi" }).slice(0, 10);
})();
const formatMoney = (n) => (n == null ? "—" : Number(n).toLocaleString("en-PK"));
const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-PK", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Karachi" }) : "—");
const formatTime = (d) => (d ? new Date(d).toLocaleTimeString("en-PK", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" }) : "—");

export default function Transactions() {
  const [searchParams, setSearchParams] = useSearchParams();
  const accountIdFromUrl = searchParams.get("accountId") || "";
  const rawMaterialHeadIdFromUrl = searchParams.get("rawMaterialHeadId") || "";

  const [list, setList] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [mazdoor, setMazdoor] = useState([]);
  const [taxTypes, setTaxTypes] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [rawMaterialHeads, setRawMaterialHeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: today,
    type: "deposit",
    fromAccountId: "",
    toAccountId: "",
    amount: "",
    category: "",
    note: "",
    customerId: "",
    supplierId: "",
    mazdoorId: "",
    taxTypeId: "",
    expenseTypeId: "",
    rawMaterialHeadId: "",
    image: null,
    paymentMethod: "cash",
    chequeNumber: "",
    chequeDate: "",
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ accountId: accountIdFromUrl, dateFrom: "", dateTo: "", rawMaterialHeadId: rawMaterialHeadIdFromUrl });
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (accountIdFromUrl && filters.accountId !== accountIdFromUrl) {
      setFilters((f) => ({ ...f, accountId: accountIdFromUrl }));
    }
  }, [accountIdFromUrl]);

  useEffect(() => {
    if (rawMaterialHeadIdFromUrl && filters.rawMaterialHeadId !== rawMaterialHeadIdFromUrl) {
      setFilters((f) => ({ ...f, rawMaterialHeadId: rawMaterialHeadIdFromUrl }));
    }
  }, [rawMaterialHeadIdFromUrl]);

  const fetchAccounts = async () => {
    try {
      const data = await apiGet("/accounts");
      setAccounts(data.data || []);
    } catch (_) { }
  };
  const fetchSuppliers = async () => {
    try {
      const data = await apiGet("/suppliers");
      setSuppliers(data.data || []);
    } catch (_) { }
  };
  const fetchCustomers = async () => {
    try {
      const data = await apiGet("/customers");
      setCustomers(data.data || []);
    } catch (_) { }
  };
  const fetchMazdoor = async () => {
    try {
      const data = await apiGet("/mazdoor");
      setMazdoor(data.data || []);
    } catch (_) { }
  };
  const fetchTaxTypes = async () => {
    try {
      const { data } = await apiGet("/tax-types");
      setTaxTypes(data || []);
    } catch (_) { }
  };
  const fetchExpenseTypes = async () => {
    try {
      const { data } = await apiGet("/expense-types");
      setExpenseTypes(data || []);
    } catch (_) { }
  };
  const fetchRawMaterialHeads = async () => {
    try {
      const { data } = await apiGet("/raw-material-heads");
      setRawMaterialHeads(data || []);
    } catch (_) { }
  };
 
  const activeAccount = useMemo(() => {
    if (!filters.accountId) return null;
    return accounts.find(a => a._id === filters.accountId);
  }, [accounts, filters.accountId]);

  const isTraditional = activeAccount?.isDailyKhata || activeAccount?.isMillKhata;
  
  const activeRawMaterial = useMemo(() => {
    if (!filters.rawMaterialHeadId) return null;
    return rawMaterialHeads.find(r => r._id === filters.rawMaterialHeadId);
  }, [rawMaterialHeads, filters.rawMaterialHeadId]);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/transactions", {
        unified: "true",
        accountId: filters.accountId || undefined,
        rawMaterialHeadId: filters.rawMaterialHeadId || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
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
    fetchAccounts();
    fetchCustomers();
    fetchSuppliers();
    fetchMazdoor();
    fetchTaxTypes();
    fetchExpenseTypes();
    fetchRawMaterialHeads();
  }, []);
  useEffect(() => {
    fetchList();
  }, [filters.accountId, filters.dateFrom, filters.dateTo, filters.rawMaterialHeadId]);

  const resetForm = () => {
    setForm({
      date: today,
      type: "deposit",
      fromAccountId: "",
      toAccountId: "",
      amount: "",
      category: "",
      note: "",
      customerId: "",
      supplierId: "",
      mazdoorId: "",
      taxTypeId: "",
      expenseTypeId: "",
      rawMaterialHeadId: "",
      image: null,
      paymentMethod: "cash",
      chequeNumber: "",
      chequeDate: "",
    });
    setEditingId(null);
    setModalOpen(false);
  };
  const openAddModal = () => {
    resetForm();
    setForm((f) => ({ 
      ...f, 
      date: today,
      rawMaterialHeadId: filters.rawMaterialHeadId || ""
    }));
    setModalOpen(true);
  };

  const handleEdit = (row) => {
    if (row.source !== 'transaction') {
      alert("System-generated transactions (Sales/Purchases) ko yahan se edit nahi kiya ja sakta.");
      return;
    }
    setEditingId(row._id);
    setForm({
      date: row.date ? new Date(row.date).toISOString().split('T')[0] : today,
      type: row.type || "deposit",
      fromAccountId: row.fromAccountId?._id || row.fromAccountId || "",
      toAccountId: row.toAccountId?._id || row.toAccountId || "",
      amount: row.amount || "",
      category: row.category || "",
      note: row.note || "",
      customerId: row.customerId?._id || row.customerId || "",
      supplierId: row.supplierId?._id || row.supplierId || "",
      mazdoorId: row.mazdoorId?._id || row.mazdoorId || "",
      taxTypeId: row.taxTypeId?._id || row.taxTypeId || "",
      expenseTypeId: row.expenseTypeId?._id || row.expenseTypeId || "",
      rawMaterialHeadId: row.rawMaterialHeadId?._id || row.rawMaterialHeadId || "",
      image: null,
      paymentMethod: row.paymentMethod || "cash",
      chequeNumber: row.chequeNumber || "",
      chequeDate: row.chequeDate ? new Date(row.chequeDate).toISOString().split('T')[0] : "",
    });
    setModalOpen(true);
  };

  const handleDelete = async (id, source) => {
    if (source !== 'transaction') {
      alert("System-generated transactions (Sales/Purchases) ko yahan se delete nahi kiya ja sakta.");
      return;
    }
    if (!window.confirm("Kya aap waqai is transaction ko delete karna chahte hain?")) return;
    try {
      await apiDelete(`/transactions/${id}`);
      fetchList();
    } catch (e) {
      alert(e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const amt = Number(form.amount);
    if (isNaN(amt) || amt <= 0) {
      setError("Valid amount enter karein.");
      setSubmitting(false);
      return;
    }
    if (form.type === "deposit" && !form.toAccountId) {
      setError("Deposit ke liye account select karein.");
      setSubmitting(false);
      return;
    }
    if ((form.type === "withdraw" || form.type === "salary" || form.type === "tax" || form.type === "expense") && !form.fromAccountId) {
      setError(`${form.type === "salary" ? "Salary" : form.type === "tax" ? "Tax" : form.type === "expense" ? "Expense" : "Withdraw"} ke liye account select karein.`);
      setSubmitting(false);
      return;
    }
    if (form.type === "tax" && !form.taxTypeId) {
      setError("Tax type select karein.");
      setSubmitting(false);
      return;
    }
    if (form.type === "expense" && !form.expenseTypeId) {
      setError("Expense type select karein.");
      setSubmitting(false);
      return;
    }
    if (form.type === "salary" && !form.mazdoorId) {
      setError("Mazdoor select karein jise salary de rahe hain.");
      setSubmitting(false);
      return;
    }
    if (form.type === "transfer" && (!form.fromAccountId || !form.toAccountId)) {
      setError("Standard Transfer ke liye dono accounts select karein.");
      setSubmitting(false);
      return;
    }
    if (form.type === "journal" && ((!form.customerId && !form.fromAccountId) || (!form.supplierId && !form.mazdoorId))) {
      setError("Party Transfer ke liye Source (Customer ya Mill Account) aur Destination (Supplier/Mazdoor) dono zaroori hain.");
      setSubmitting(false);
      return;
    }
    if (form.type === "transfer" && form.fromAccountId === form.toAccountId) {
      setError("Same account pe transfer nahi kar sakte.");
      setSubmitting(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("date", form.date);
      formData.append("type", form.type === "journal" ? "transfer" : form.type);
      if (form.fromAccountId) formData.append("fromAccountId", form.fromAccountId);
      if (form.toAccountId) formData.append("toAccountId", form.toAccountId);
      if (form.amount) formData.append("amount", amt);
      if (form.category) formData.append("category", form.category.trim());
      if (form.note) formData.append("note", form.note.trim());
      if (form.customerId) formData.append("customerId", form.customerId);
      if (form.supplierId) formData.append("supplierId", form.supplierId);
      if (form.mazdoorId) formData.append("mazdoorId", form.mazdoorId);
      if (form.taxTypeId) formData.append("taxTypeId", form.taxTypeId);
      if (form.expenseTypeId) formData.append("expenseTypeId", form.expenseTypeId);
      if (form.rawMaterialHeadId) formData.append("rawMaterialHeadId", form.rawMaterialHeadId);
      if (form.image) formData.append("image", form.image);
      if (form.paymentMethod) formData.append("paymentMethod", form.paymentMethod);
      if (form.paymentMethod === "cheque") {
        if (!form.chequeNumber.trim()) {
          setError("Cheque number zaroori hai.");
          setSubmitting(false);
          return;
        }
        formData.append("chequeNumber", form.chequeNumber.trim());
        if (form.chequeDate) formData.append("chequeDate", form.chequeDate);
      }

      if (editingId) {
        await apiPutFormData(`/transactions/${editingId}`, formData);
      } else {
        await apiPostFormData("/transactions", formData);
      }
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
      if (sortKey === "amount") {
        const va = Number(a.amount) || 0;
        const vb = Number(b.amount) || 0;
        return sortDir === "asc" ? va - vb : vb - va;
      }
      if (sortKey === "type") {
        const va = (a.type || "").toLowerCase();
        const vb = (b.type || "").toLowerCase();
        return sortDir === "asc" ? va.localeCompare(vb) : -va.localeCompare(vb);
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

  const getParticipant = (row) => {
    // 1. Prioritize direct person names from backend
    const person = row.customerName || row.supplierName || row.mazdoorName;
    if (person) return person;

    // 2. Transfer logic
    if (row.type === "transfer") {
      return `${row.fromAccountId?.name || "—"} ➔ ${row.toAccountId?.name || "—"}`;
    }

    // 3. Account-specific view fallback
    if (filters.accountId) {
      if (row.fromAccountId?._id === filters.accountId) return row.toAccountId?.name || "Manual";
      if (row.toAccountId?._id === filters.accountId) return row.fromAccountId?.name || "Manual";
    }

    // 5. Machinery fallback
    if (row.machineryPurchaseId) {
      return row.machineryPurchaseId.machineryItemId?.name || "Machinery Part";
    }
    
    // 6. Tax logic
    if (row.type === "tax") return row.taxTypeName || "Tax Payment";
    if (row.type === "expense") return row.expenseTypeName || "General Expense";
    if (row.rawMaterialHeadId) return row.rawMaterialHeadName || "Raw Material";
    
    // 4. Global view fallback
    return row.fromAccountId?.name || row.toAccountId?.name || "Manual";
  };

  const getReference = (row) => {
    if (row.stockEntryId) {
      const entry = row.stockEntryId;
      return `Bill: ${entry._id?.slice(-6).toUpperCase() || "—"} ${entry.truckNumber ? `(${entry.truckNumber})` : ""}`;
    }
    if (row.saleId) {
      const sale = row.saleId;
      return `Sale Ref: ${sale._id?.slice(-6).toUpperCase() || "—"} ${sale.truckNumber ? `(${sale.truckNumber})` : ""}`;
    }
    if (row.machineryPurchaseId) {
      return `Machinery: ${row.machineryPurchaseId.machineryItemId?.name || "Asset"} (Ref: ${row.machineryPurchaseId._id?.slice(-6).toUpperCase()})`;
    }
    if (row.type === "tax") return `Tax Payment: ${row.taxTypeName || "—"}`;
    if (row.type === "expense") return `Expense: ${row.expenseTypeName || "—"}`;
    if (row.rawMaterialHeadId) return `Raw Material: ${row.rawMaterialHeadName || "—"}`;
    return row.note || "—";
  };

  const typeLabel = (t) => {
    if (t === "deposit") return "Deposit";
    if (t === "withdraw") return "Withdraw";
    if (t === "transfer") return "Transfer";
    if (t === "salary") return "Salary Paid";
    if (t === "tax") return "Tax Paid";
    if (t === "expense") return "Expense Paid";
    if (t === "sale") return "Sale";
    if (t === "purchase") return "Purchase";
    if (t === "transfer") return "Transfer";
    return t;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaExchangeAlt className={`w-7 h-7 ${activeRawMaterial ? "text-teal-500" : "text-amber-500"}`} />
            {activeRawMaterial ? (
              <span className="flex items-center gap-2">
                <span className="text-teal-600">{activeRawMaterial.name}</span>
                <span className="text-slate-400 font-light ml-1">Ledger</span>
              </span>
            ) : "Transactions (Lena-dena)"}
          </h1>
          <p className="page-subtitle">
            {activeRawMaterial 
              ? `Showing all ledger entries specifically for ${activeRawMaterial.name}.`
              : "Saari account movement: manual deposit/withdraw/transfer plus Sales aur Purchases jahan account select kiya ho."}
          </p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary">
          <FaPlus className="w-4 h-4" /> Add transaction
        </button>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title={editingId ? "Transaction update karein" : "Naya transaction add karein"}>
        {accounts.length === 0 && (
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-sm mb-4">
            Pehle <strong>Accounts</strong> page se kam az kam ek account (e.g. Cash ya Bank) add karein, phir yahan transaction add kar sakte hain.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Tarikh *</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Type *</label>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input-field" required>
                <option value="deposit">Credit (Aamad / Lena / In / Deposit)</option>
                <option value="withdraw">Debit (Kharch / Dena / Out / Withdraw)</option>
                <option value="tax">Tax Payment (Audit)</option>
                <option value="expense">General Expense (Kharcha)</option>
                <option value="salary">Salary (Payment)</option>
                <option value="transfer">Standard Transfer (Acc to Acc)</option>
                <option value="journal">Direct Party Transfer (Journal)</option>
              </select>
            </div>
            {form.type === "tax" && (
              <div>
                <label className="input-label font-bold text-orange-600">Tax Type *</label>
                <SearchableSelect
                  options={taxTypes}
                  value={form.taxTypeId}
                  onChange={(val) => setForm((f) => ({ ...f, taxTypeId: val }))}
                  placeholder="Select tax type"
                  className="border-orange-200 bg-orange-50/30"
                />
              </div>
            )}
            {form.type === "expense" && (
              <div>
                <label className="input-label font-bold text-rose-600">Expense Type *</label>
                <SearchableSelect
                  options={expenseTypes}
                  value={form.expenseTypeId}
                  onChange={(val) => setForm((f) => ({ ...f, expenseTypeId: val }))}
                  placeholder="Select expense category"
                  className="border-rose-200 bg-rose-50/30"
                />
              </div>
            )}
            {(form.type === "withdraw" || form.type === "transfer" || form.type === "salary" || form.type === "tax" || form.type === "expense") && (
              <div>
                <label className="input-label">From account *</label>
                <SearchableSelect
                  options={accounts}
                  value={form.fromAccountId}
                  onChange={(val) => setForm((f) => ({ ...f, fromAccountId: val }))}
                  placeholder="Select account"
                />
              </div>
            )}
            {(form.type === "deposit" || form.type === "transfer") && (
              <div>
                <label className="input-label">To account *</label>
                <SearchableSelect
                  options={accounts}
                  value={form.toAccountId}
                  onChange={(val) => setForm((f) => ({ ...f, toAccountId: val }))}
                  placeholder="Select account"
                />
              </div>
            )}

            {form.type === "journal" && (
              <div className="sm:col-span-2 bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-2">
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Party-to-Party Transfer Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label text-emerald-600 font-black">Source (Giver) *</label>
                    <div className="space-y-2">
                       <SearchableSelect
                         options={customers}
                         value={form.customerId}
                         onChange={(val) => setForm((f) => ({ ...f, customerId: val, fromAccountId: "" }))}
                         placeholder="Select customer"
                       />
                        <SearchableSelect
                          options={accounts}
                          value={form.fromAccountId}
                          onChange={(val) => setForm((f) => ({ ...f, fromAccountId: val, customerId: "" }))}
                          placeholder="OR Select Account"
                        />
                    </div>
                  </div>
                  <div>
                    <label className="input-label text-rose-600 font-black">Destination: Recipient (Debit) *</label>
                    <div className="space-y-2">
                      <SearchableSelect
                        options={suppliers}
                        value={form.supplierId}
                        onChange={(val) => setForm((f) => ({ ...f, supplierId: val, mazdoorId: "" }))}
                        placeholder="Select supplier"
                      />
                      <SearchableSelect
                        options={mazdoor}
                        value={form.mazdoorId}
                        onChange={(val) => setForm((f) => ({ ...f, mazdoorId: val, supplierId: "" }))}
                        placeholder="OR Select mazdoor"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 mt-3 italic">* This entry records direct payment from Customer to Supplier. **Cash balance will not change.**</p>
              </div>
            )}
            <div>
              <label className="input-label font-bold text-teal-600">Raw Material (Optional)</label>
              <SearchableSelect
                options={rawMaterialHeads}
                value={form.rawMaterialHeadId}
                onChange={(val) => setForm((f) => ({ ...f, rawMaterialHeadId: val }))}
                placeholder="Select Bardana/Mitti etc"
                className="border-teal-200 bg-teal-50/30"
              />
            </div>
            <div>
              <label className="input-label">Amount *</label>
              <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input-field" min="0" step="1" required />
            </div>
            <div>
              <label className="input-label">Category (optional)</label>
              <input type="text" placeholder="e.g. Salary, Rent" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="input-label">Customer/Sale (optional)</label>
              <SearchableSelect
                options={customers}
                value={form.customerId}
                onChange={(val) => setForm((f) => ({ ...f, customerId: val }))}
                placeholder="Select customer"
              />
            </div>
            <div>
              <label className="input-label">Supplier/Purchase (optional)</label>
              <SearchableSelect
                options={suppliers}
                value={form.supplierId}
                onChange={(val) => setForm((f) => ({ ...f, supplierId: val }))}
                placeholder="Select supplier"
              />
            </div>
            <div>
              <label className={`input-label ${form.type === "salary" ? "text-amber-700 font-bold" : ""}`}>Mazdoor {form.type === "salary" ? "*" : "(optional)"}</label>
              <SearchableSelect
                options={mazdoor}
                value={form.mazdoorId}
                onChange={(val) => setForm((f) => ({ ...f, mazdoorId: val }))}
                placeholder="Select mazdoor"
              />
            </div>
            <div>
              <label className="input-label flex items-center gap-2"><FaImage className="text-slate-400" /> Image / Receipt</label>
              <input type="file" accept="image/*" onChange={(e) => setForm(f => ({ ...f, image: e.target.files[0] }))} className="input-field" />
            </div>
            {form.type !== "transfer" && (
              <div>
                <label className="input-label font-bold text-indigo-600">Payment Method</label>
                <select value={form.paymentMethod} onChange={(e) => setForm((f) => ({ ...f, paymentMethod: e.target.value }))} className="input-field border-indigo-200 bg-indigo-50/30">
                  <option value="cash">Cash</option>
                  <option value="online">Online Transfer</option>
                  <option value="cheque">Cheque</option>
                </select>
              </div>
            )}
            {form.paymentMethod === "cheque" && form.type !== "transfer" && (
              <>
                <div>
                  <label className="input-label font-bold text-indigo-700">Cheque Number *</label>
                  <input type="text" placeholder="e.g. 521456" value={form.chequeNumber} onChange={(e) => setForm((f) => ({ ...f, chequeNumber: e.target.value }))} className="input-field border-indigo-200 bg-indigo-50/30" required />
                </div>
                <div>
                  <label className="input-label font-bold text-indigo-700">Cheque Date</label>
                  <input type="date" value={form.chequeDate} onChange={(e) => setForm((f) => ({ ...f, chequeDate: e.target.value }))} className="input-field border-indigo-200 bg-indigo-50/30" />
                </div>
              </>
            )}
            <div className="sm:col-span-2">
              <label className="input-label">Note / Category {form.type === "salary" ? "(e.g. Salary for March 2024)" : "(optional)"}</label>
              <input type="text" placeholder="Optional" value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="input-field" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (editingId ? "Update Transaction" : "Save Transaction")}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary px-6" disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>


      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <SearchableSelect
            options={accounts}
            value={filters.accountId}
            onChange={(val) => setFilters((f) => ({ ...f, accountId: val }))}
            placeholder="All accounts"
            className="w-56"
          />
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} className="input-field w-40" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} className="input-field w-40" />
          <SearchableSelect
            options={rawMaterialHeads}
            value={filters.rawMaterialHeadId}
            onChange={(val) => setFilters((f) => ({ ...f, rawMaterialHeadId: val }))}
            placeholder="Filter by Raw Material"
            className="w-56"
          />
          <p className="text-sm text-slate-500">{list.length} transaction(s)</p>
          <button type="button" onClick={() => downloadTransactionsPdf(sortedList, { ...filters, isTraditional })} className="btn-primary flex items-center gap-1.5" disabled={list.length === 0} title="Download PDF"><FaFilePdf className="w-4 h-4" /> Export PDF</button>
          <button type="button" onClick={() => { const csv = buildCsv(list, [{ key: "date", label: "Date" }, { key: "type", label: "Type" }, { key: "fromAccountId.name", label: "From Account" }, { key: "toAccountId.name", label: "To Account" }, { key: "amount", label: "Amount" }, { key: "category", label: "Category" }, { key: "note", label: "Note" }]); downloadCsv(csv, "transactions.csv"); }} className="btn-secondary flex items-center gap-1.5" disabled={list.length === 0}><FaFileExport className="w-4 h-4" /> Export CSV</button>
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
                      <button type="button" onClick={() => toggleSort("type")} className="flex items-center hover:text-slate-800">Type<SortIcon columnKey="type" /></button>
                    </th>
                    <th className="table-header px-5 py-3.5">Description</th>
                    <th className="table-header px-5 py-3.5 text-right">
                      <button type="button" onClick={() => toggleSort("amount")} className="flex items-center justify-end w-full hover:text-slate-800">
                        Credit (Aamad)
                        <SortIcon columnKey="amount" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5 text-right">
                      <button type="button" onClick={() => toggleSort("amount")} className="flex items-center justify-end w-full hover:text-slate-800">
                        Debit (Kharch)
                        <SortIcon columnKey="amount" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5 w-16 text-center">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => {
                     let col1 = 0; // Left Col (Credit / Aamad)
                     let col2 = 0; // Right Col (Debit / Kharch)
                      // Nature-based Decision: Global/Mill = Credit Inflow, Bank = Debit Inflow
                      const isMillNature = !filters.accountId || isTraditional;

                      if (filters.accountId) {
                        if (row.type === "transfer") {
                          if (row.fromAccountId?._id === filters.accountId || row.fromAccountId === filters.accountId) {
                            // Source Account (Giver) = Credit (Aamad)
                            col1 = row.amount;
                          } else if (row.toAccountId?._id === filters.accountId || row.toAccountId === filters.accountId) {
                            // Destination Account (Receiver) = Debit (Kharch)
                            col2 = row.amount;
                          }
                        } else {
                          // Standard Inflow/Outflow
                          const isInflow = row.type === "deposit" || row.type === "sale" || row.type === "income";
                          if (isMillNature) {
                            if (isInflow) col1 = row.amount; // Credit (Aamad)
                            else col2 = row.amount; // Debit (Kharch)
                          } else {
                            if (isInflow) col2 = row.amount; // Debit
                            else col1 = row.amount; // Credit
                          }
                        }
                      } else {
                        // Global Perspective (Always Mill Nature)
                        if (row.type === "deposit" || row.type === "sale" || row.type === "income") col1 = row.amount;
                        else col2 = row.amount;
                      }

                      const participant = getParticipant(row);
                      const reference = getReference(row);

                      return (
                        <tr key={row._id} className="table-row-hover">
                          <td className="table-cell text-sm">{formatDate(row.date)}</td>
                          <td className="table-cell">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                                row.type === "deposit"
                                  ? "bg-green-100 text-green-700"
                                  : row.type === "sale"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : row.type === "withdraw"
                                      ? "bg-red-100 text-red-700"
                                      : row.type === "tax"
                                        ? "bg-orange-100 text-orange-700 border border-orange-200"
                                        : row.type === "salary"
                                          ? "bg-amber-100 text-amber-700 border border-amber-200"
                                          : row.type === "expense"
                                            ? "bg-rose-100 text-rose-700 border border-rose-200"
                                            : row.type === "purchase"
                                              ? "bg-orange-100 text-orange-700"
                                              : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {typeLabel(row.type)}
                            </span>
                          </td>
                          <td className="table-cell">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800 text-sm leading-tight">
                                {participant}
                              </span>
                              <span className="text-[11px] text-slate-500 leading-tight mt-0.5">
                                {reference} {row.category ? `• ${row.category}` : ""}
                              </span>
                            </div>
                          </td>
                          <td className="table-cell text-right font-black text-emerald-600">
                            {col1 > 0 ? formatMoney(col1) : "—"}
                          </td>
                          <td className="table-cell text-right font-black text-rose-600">
                            {col2 > 0 ? formatMoney(col2) : "—"}
                          </td>
                          <td className="table-cell text-center">
                            {row.image && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(row.image)}
                                className="btn-ghost-primary flex items-center justify-center p-1.5 text-indigo-500 hover:text-indigo-700 bg-indigo-50 rounded mx-auto"
                                title="Preview Receipt"
                              >
                                <FaImage className="w-4 h-4" />
                              </button>
                            )}
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center justify-center gap-2">
                              {row.source === 'transaction' && (
                                <>
                                  <button
                                    onClick={() => handleEdit(row)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit"
                                  >
                                    <FaEdit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(row._id, row.source)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete"
                                  >
                                    <FaTrash className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              {row.source !== 'transaction' && (
                                <span className="text-[10px] text-slate-400 italic">System</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                    {(() => {
                      let tKharchTotal = 0;
                      let tAamadTotal = 0;

                      // Use consistent logic with PDF export
                      const isMillNatureFooter = !filters.accountId || isTraditional;

                      list.forEach((row) => {
                        let rowAamad = 0;
                        let rowKharch = 0;

                        if (filters.accountId) {
                          if (row.type === "transfer") {
                            const fromId = (row.fromAccountId?._id || row.fromAccountId)?.toString();
                            const toId = (row.toAccountId?._id || row.toAccountId)?.toString();
                            const filterId = filters.accountId.toString();

                            // SAHI: Ignore internal self-transfers for net total
                            if (fromId === filterId && toId === filterId) return;

                            if (fromId === filterId) rowAamad = row.amount;
                            if (toId === filterId) rowKharch = row.amount;
                          } else {
                            const isInflow = row.type === "deposit" || row.type === "sale" || row.type === "income";
                            if (isMillNatureFooter) {
                               if (isInflow) rowAamad = row.amount;
                               else rowKharch = row.amount;
                            } else {
                               if (isInflow) rowKharch = row.amount;
                               else rowAamad = row.amount;
                            }
                          }
                        } else {
                          // Global (Mill Standard)
                          if (row.type === "deposit" || row.type === "sale" || row.type === "income") rowAamad = row.amount;
                          else rowKharch = row.amount;
                        }

                        tAamadTotal += rowAamad;
                        tKharchTotal += rowKharch;
                      });

                      const netBal = tAamadTotal - tKharchTotal;
                      const isCredit = netBal >= 0;

                      return (
                        <>
                          <tr className="font-black text-slate-800 border-b border-slate-200">
                            <td colSpan="3" className="px-5 py-4 text-right uppercase tracking-[0.2em] text-[10px] text-slate-500 font-black">
                              Total Account Movements:
                            </td>
                            <td className="px-5 py-4 text-right text-emerald-800 bg-emerald-50/50 border-x border-slate-200">
                              {formatMoney(tAamadTotal)}
                            </td>
                            <td className="px-5 py-4 text-right text-rose-800 bg-rose-50/50 border-x border-slate-200">
                              {formatMoney(tKharchTotal)}
                            </td>
                            <td className="bg-slate-50/30"></td>
                          </tr>
                          <tr className="font-black text-slate-800 bg-slate-200/50">
                            <td colSpan="3" className="px-5 py-3 text-right uppercase tracking-[0.2em] text-[10px] text-slate-600 font-black">
                              Net Period Balance (Standing):
                            </td>
                            <td colSpan="2" className="px-5 py-3 text-center text-indigo-900 border-x border-slate-300">
                              <span className="text-lg mr-2">{formatMoney(Math.abs(netBal))}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${isCredit ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                                {isCredit ? 'CR' : 'DR'}
                              </span>
                            </td>
                            <td className="bg-white"></td>
                          </tr>
                        </>
                      );
                    })()}
                  </tfoot>
              </table>
              <TablePagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} totalItems={sortedList.length} />
            </>
          )}
          {!loading && list.length === 0 && (
            <div className="empty-state">
              <FaExchangeAlt className="w-12 h-12 text-slate-300 mb-2" />
              <p className="font-medium text-slate-700">Abhi koi transaction nahi.</p>
              <p className="text-sm text-slate-500 mt-1 max-w-md">
                Yahan manual transactions (deposit/withdraw/transfer) plus <strong>Sales</strong> aur <strong>Purchases</strong> jahan aap ne account select kiya ho — sab ek saath dikhti hain. Manual entry ke liye pehle Accounts banaen, phir Add transaction use karein.
              </p>
              <button type="button" onClick={openAddModal} className="btn-primary mt-4">
                <FaPlus className="w-4 h-4 inline mr-1.5" /> Add first transaction
              </button>
            </div>
          )}
        </div>
      </section>

      <ImagePreviewModal
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        imageUrl={previewImage}
        title="Transaction Receipt Preview"
      />
    </div>
  );
}
