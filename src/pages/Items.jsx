import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPut, apiDelete } from "../config/api.js";
import { FaBox, FaSearch, FaEdit, FaPlus, FaBook, FaSort, FaSortUp, FaSortDown, FaSitemap, FaTrash, FaWarehouse } from "react-icons/fa";
import { useAuth } from "../context/AuthContext.jsx";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";
import DeletePasswordModal from "../components/DeletePasswordModal.jsx";

export default function Items() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id }
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", categoryId: "", quality: "" });
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [customers, setCustomers] = useState([]);

  const fetchCategories = async () => {
    try {
      const data = await apiGet("/categories");
      setCategories(data.data || []);
    } catch (_) { }
  };

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/items", {
        search: search || undefined,
        categoryId: categoryFilter || undefined,
        parentId: "none",
      });
      setList(data.data || []);
    } catch (e) {
      setError(e.message);
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await apiGet("/customers");
      setCustomers((data.data || []).filter(c => c.isWarehouse));
    } catch (_) { }
  };

  useEffect(() => {
    fetchList();
    fetchCategories();
    fetchCustomers();
  }, [search, categoryFilter]);

  const resetForm = () => {
    setForm({ name: "", categoryId: "", quality: "", linkedWarehouseCustomerId: "" });
    setEditingId(null);
    setModalOpen(false);
  };
  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Item ka naam zaroori hai");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        categoryId: form.categoryId || undefined,
        quality: (form.quality || "").trim(),
        linkedWarehouseCustomerId: form.linkedWarehouseCustomerId || undefined,
      };
      if (editingId) await apiPut(`/items/${editingId}`, payload);
      else await apiPost("/items", payload);
      resetForm();
      fetchList();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row) => {
    setForm({
      name: row.name || "",
      categoryId: row.categoryId?._id || row.categoryId || "",
      quality: row.quality || "",
      linkedWarehouseCustomerId: row.linkedWarehouseCustomerId?._id || row.linkedWarehouseCustomerId || "",
    });
    setEditingId(row._id);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
    setDeleteTarget({ id });
  };

  const confirmDelete = async () => {
    try {
      await apiDelete(`/items/${deleteTarget.id}`);
      fetchList();
    } catch (e) {
      alert(e.message);
    }
  };

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const getCategoryName = (row) => row.categoryId?.name ?? (row.category ?? "—");

  const sortedList = useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => {
      const va = (sortKey === "category" ? getCategoryName(a) : (a[sortKey] || "")).toString().toLowerCase();
      const vb = (sortKey === "category" ? getCategoryName(b) : (b[sortKey] || "")).toString().toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : -va.localeCompare(vb);
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

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaBox className="w-7 h-7 text-amber-500" /> Main Items
          </h1>
          <p className="page-subtitle">Pehle main items banain, sub-items ko Sub-Item Management se manage karein.</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary">
          <FaPlus className="w-4 h-4" /> Add Item
        </button>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title={editingId ? "Edit Item" : "Naya Item Add Karein"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Item ka naam *</label>
            <input type="text" placeholder="e.g. Channa, Gehu" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="input-label">Category</label>
            <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="input-field">
              <option value="">— Select Category —</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">Quality</label>
            <input type="text" placeholder="e.g. Premium, Standard" value={form.quality} onChange={(e) => setForm((f) => ({ ...f, quality: e.target.value }))} className="input-field" />
          </div>
          <div>
            <label className="input-label font-bold text-amber-700">Link to Warehouse Customer (Ledger Correction)</label>
            <select value={form.linkedWarehouseCustomerId} onChange={(e) => setForm((f) => ({ ...f, linkedWarehouseCustomerId: e.target.value }))} className="input-field border-amber-200 bg-amber-50/30">
              <option value="">— No Warehouse Link —</option>
              {customers.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1">Agar aap chahte hain ke is item ki sale ka credit "Item Ledger" ki bajaye "Customer Ledger" mein jaye, tw yahan warehouse account select karein.</p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : (editingId ? "Update" : "Add Item")}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary" disabled={submitting}>Cancel</button>
          </div>
        </form>
      </Modal>

      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search items..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input pl-9" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field w-48">
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="empty-state"><div className="loading-spinner mb-3" /><p>Loading...</p></div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-5 py-4 text-left"><button type="button" onClick={() => toggleSort("name")} className="flex items-center hover:text-slate-800 font-bold uppercase tracking-wider text-[10px] text-slate-500">Item <SortIcon columnKey="name" /></button></th>
                    <th className="px-5 py-4 text-left font-bold uppercase tracking-wider text-[10px] text-slate-500">Category</th>
                    <th className="px-5 py-4 text-left font-bold uppercase tracking-wider text-[10px] text-slate-500">Quality</th>
                    <th className="px-5 py-4 text-center font-bold uppercase tracking-wider text-[10px] text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4 font-bold text-slate-800">{row.name}</td>
                      <td className="px-5 py-4 text-slate-600">{getCategoryName(row)}</td>
                      <td className="px-5 py-4 text-slate-500">{row.quality || "—"}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                           <button type="button" onClick={() => navigate(`/items/${row._id}/khata`)} className="btn-ghost-primary flex items-center gap-1.5"><FaBook /> Khata</button>
                           <button type="button" onClick={() => navigate(`/items/${row._id}/warehouse-ledger`)} className="btn-ghost-primary flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"><FaWarehouse /> Warehouse In/Out</button>
                           <button type="button" onClick={() => navigate(`/items/${row._id}/sub-items-summary-report`)} className="btn-ghost-primary flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"><FaSitemap /> Summary</button>
                           <button type="button" onClick={() => handleEdit(row)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit"><FaEdit className="w-4 h-4" /></button>
                           {isAdmin && (
                             <button type="button" onClick={() => handleDelete(row._id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete"><FaTrash className="w-4 h-4" /></button>
                           )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <TablePagination page={page} setPage={setPage} pageSize={pageSize} setPageSize={setPageSize} totalItems={sortedList.length} />
            </>
          )}
        </div>
      </section>

      <DeletePasswordModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Item Delete Karen"
        message="Kya aap waqai is item ko delete karna chahte hain? Is se tamam linked sub-items bhi delete ho jayenge."
      />
    </div>
  );
}
