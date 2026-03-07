import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, apiPost, apiPut, apiDelete } from "../config/api.js";
import { downloadStockEntriesPdf } from "../utils/exportPdf.js";
import { FaBoxOpen, FaSearch, FaEdit, FaTrash, FaPlus, FaSort, FaSortUp, FaSortDown, FaFilePdf } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import TablePagination from "../components/TablePagination.jsx";
import PayBillModal from "../components/PayBillModal.jsx";
import { FaMoneyBillWave } from "react-icons/fa";

const today = new Date().toISOString().slice(0, 10);

export default function StockEntries() {
  const [list, setList] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    date: today,
    itemId: "",
    supplierId: "",
    kattay: "",
    kgPerKata: "",
    ratePerKata: "",
    amount: "",
    millWeight: "",
    supplierWeight: "",
    truckNumber: "",
    amountPaid: "",
    accountId: "",
    notes: "",
    paymentTerms: "cash",
    dueDate: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, id: null });
  const [filters, setFilters] = useState({ dateFrom: "", dateTo: "", itemId: "", supplierId: "" });
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [payEntry, setPayEntry] = useState(null);
  const [payModalOpen, setPayModalOpen] = useState(false);

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
      ratePerKata: "",
      amount: "",
      millWeight: "",
      supplierWeight: "",
      truckNumber: "",
      amountPaid: "",
      accountId: "",
      notes: "",
      paymentTerms: "cash",
      dueDate: "",
    });
    setEditingId(null);
    setModalOpen(false);
  };

  const updateFormWithAutoCalc = (updates) => {
    setForm((prev) => {
      const next = { ...prev, ...updates };

      // Auto calc amount
      const kattay = Number(next.kattay) || 0;
      const ratePerKata = Number(next.ratePerKata) || 0;
      if (kattay > 0 && ratePerKata > 0) next.amount = String(Math.round(kattay * ratePerKata));
      else if ("kattay" in updates || "ratePerKata" in updates) next.amount = "";

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
    try {
      const kattay = Number(form.kattay) || 0;
      const kgPerKata = Number(form.kgPerKata) || 0;
      const payload = {
        date: form.date,
        itemId: form.itemId,
        supplierId: form.supplierId,
        kattay,
        kgPerKata,
        receivedWeight: kattay > 0 && kgPerKata > 0 ? kattay * kgPerKata : 0,
        millWeight: Number(form.millWeight) || 0,
        supplierWeight: Number(form.supplierWeight) || 0,
        truckNumber: (form.truckNumber || "").trim(),
        amount: Number(form.amount) || 0,
        amountPaid: Number(form.amountPaid) || 0,
        dueDate: form.dueDate || undefined,
        accountId: form.accountId || undefined,
        notes: form.notes || "",
      };
      if (editingId) await apiPut(`/stock-entries/${editingId}`, payload);
      else await apiPost("/stock-entries", payload);
      resetForm();
      fetchList();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEdit = (row) => {
    const itemId = row.itemId?._id || row.itemId;
    const kattay = row.kattay != null ? row.kattay : "";
    const amount = row.amount != null ? row.amount : "";
    const ratePerKata = kattay && amount && Number(kattay) > 0 ? String(Number(amount) / Number(kattay)) : "";
    setForm({
      date: row.date ? new Date(row.date).toISOString().slice(0, 10) : today,
      itemId: itemId || "",
      supplierId: row.supplierId?._id || row.supplierId || "",
      kattay: kattay !== "" ? String(kattay) : "",
      kgPerKata: row.kgPerKata != null ? String(row.kgPerKata) : "",
      ratePerKata,
      amount: amount !== "" ? String(amount) : "",
      millWeight: row.millWeight != null ? String(row.millWeight) : "",
      supplierWeight: row.supplierWeight != null ? String(row.supplierWeight) : "",
      truckNumber: row.truckNumber || "",
      amountPaid: row.amountPaid ?? "",
      accountId: row.accountId?._id || row.accountId || "",
      notes: row.notes || "",
      paymentTerms: "custom",
      dueDate: row.dueDate ? new Date(row.dueDate).toISOString().slice(0, 10) : "",
    });
    setEditingId(row._id);
    setModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.id) return;
    setError("");
    try {
      await apiDelete(`/stock-entries/${deleteConfirm.id}`);
      if (editingId === deleteConfirm.id) resetForm();
      fetchList();
    } catch (e) {
      setError(e.message);
    }
    setDeleteConfirm({ open: false, id: null });
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
            Stock Entry
          </h1>
          <p className="page-subtitle">Jab stock aaye: item, supplier, quantity aur optional kattay/amount daalein.</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary">
          <FaPlus className="w-4 h-4" /> Add stock entry
        </button>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title={editingId ? "Edit stock entry" : "Nayi stock entry add karein"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Tarikh *</label>
              <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="input-label">Item *</label>
              <select value={form.itemId} onChange={(e) => setForm((f) => ({ ...f, itemId: e.target.value }))} className="input-field" required>
                <option value="">Select item</option>
                {items.map((i) => (
                  <option key={i._id} value={i._id}>{i.name}{i.categoryId?.name ? ` (${i.categoryId.name})` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Supplier *</label>
              <select value={form.supplierId} onChange={(e) => setForm((f) => ({ ...f, supplierId: e.target.value }))} className="input-field" required>
                <option value="">Select supplier</option>
                {suppliers.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="input-label">Truck number</label>
              <input type="text" placeholder="e.g. LEA-1234" value={form.truckNumber} onChange={(e) => setForm((f) => ({ ...f, truckNumber: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="input-label">Kitne kattay aaye</label>
              <input type="number" placeholder="0" value={form.kattay} onChange={(e) => updateFormWithAutoCalc({ kattay: e.target.value })} className="input-field" min="0" step="1" />
            </div>
            <div>
              <label className="input-label">Aik katta kitne kg ka he</label>
              <input type="number" placeholder="0" value={form.kgPerKata} onChange={(e) => setForm((f) => ({ ...f, kgPerKata: e.target.value }))} className="input-field" min="0" step="any" />
              <p className="text-xs text-slate-500 mt-0.5">Stock weight auto: kattay × kg/katta</p>
            </div>
            <div>
              <label className="input-label">Aik katta kitne ka he (Rs)</label>
              <input type="number" placeholder="0" value={form.ratePerKata} onChange={(e) => updateFormWithAutoCalc({ ratePerKata: e.target.value })} className="input-field" min="0" step="1" />
              <p className="text-xs text-slate-500 mt-0.5">Total amount auto: kattay × rate (e.g. 5 × 5 = 25)</p>
            </div>
            <div>
              <label className="input-label">Total amount (Rs)</label>
              <input type="number" placeholder="0" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="input-field" min="0" step="1" title="Auto: kattay × rate (e.g. 5 × 5 = 25)" />
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
            <button type="submit" className="btn-primary">{editingId ? "Update" : "Add entry"}</button>
            <button type="button" onClick={resetForm} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={deleteConfirm.open} onClose={() => setDeleteConfirm({ open: false, id: null })} onConfirm={handleDeleteConfirm} title="Stock entry delete karein?" message="Is entry ko delete karne se current stock change ho jayega. Continue?" confirmLabel="Haan, delete karein" />

      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <input type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} className="input-field w-40" placeholder="From" />
          <input type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} className="input-field w-40" placeholder="To" />
          <select value={filters.itemId} onChange={(e) => setFilters((f) => ({ ...f, itemId: e.target.value }))} className="input-field w-48">
            <option value="">All items</option>
            {items.map((i) => (
              <option key={i._id} value={i._id}>{i.name}</option>
            ))}
          </select>
          <select value={filters.supplierId} onChange={(e) => setFilters((f) => ({ ...f, supplierId: e.target.value }))} className="input-field w-48">
            <option value="">All suppliers</option>
            {suppliers.map((s) => (
              <option key={s._id} value={s._id}>{s.name}</option>
            ))}
          </select>
          <p className="text-sm text-slate-500">{list.length} entry(ies)</p>
          <button type="button" onClick={() => downloadStockEntriesPdf(sortedList, filters)} className="btn-primary flex items-center gap-1.5" disabled={list.length === 0} title="Download PDF"><FaFilePdf className="w-4 h-4" /> Export PDF</button>
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
                          <button type="button" onClick={() => handleEdit(row)} className="btn-ghost-primary flex items-center gap-1"><FaEdit className="w-3.5 h-3.5" /> Edit</button>
                          <button type="button" onClick={() => setDeleteConfirm({ open: true, id: row._id })} className="btn-ghost-danger flex items-center gap-1"><FaTrash className="w-3.5 h-3.5" /> Delete</button>
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
              <p>Abhi koi stock entry nahi. Add stock entry button se add karein.</p>
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
    </div>
  );
}
