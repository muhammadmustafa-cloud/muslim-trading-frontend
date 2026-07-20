import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPut, apiDelete } from "../config/api.js";
import { FaSitemap, FaSearch, FaBook, FaSort, FaSortUp, FaSortDown, FaBox, FaPlus, FaEdit, FaTrash, FaDatabase } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import DeletePasswordModal from "../components/DeletePasswordModal.jsx";

export default function SubItems() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [list, setList] = useState([]);
  const [mainItems, setMainItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", parentId: "", quality: "" });
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id }
  
  // Old Stock Modal State
  const [oldStockModalOpen, setOldStockModalOpen] = useState(false);
  const [oldStockForm, setOldStockForm] = useState({ id: "", name: "", openingBags: 0, openingWeight: 0 });

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch all items
      const data = await apiGet("/items");
      const allItems = data.data || [];
      
      // 2. Separate Main and Sub items
      const mains = allItems.filter(i => !i.parentId);
      const subs = allItems.filter(i => i.parentId != null);
      
      setMainItems(mains);
      setList(subs);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setForm({ name: "", parentId: "", quality: "" });
    setEditingId(null);
    setModalOpen(false);
  };

  const openAddModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.parentId) {
      setError("Naam aur Main Item select karna zaroori hai");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        parentId: form.parentId,
        quality: (form.quality || "").trim(),
      };
      if (editingId) await apiPut(`/items/${editingId}`, payload);
      else await apiPost("/items", payload);
      resetForm();
      fetchData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (row) => {
    setForm({
      name: row.name || "",
      parentId: row.parentId?._id || row.parentId || "",
      quality: row.quality || "",
    });
    setEditingId(row._id);
    setModalOpen(true);
  };

  const handleOpenOldStock = (row) => {
    setOldStockForm({
      id: row._id,
      name: row.name,
      openingBags: row.openingBags || 0,
      openingWeight: row.openingWeight || 0,
    });
    setOldStockModalOpen(true);
  };

  const handleOldStockSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await apiPut(`/items/${oldStockForm.id}`, {
        openingBags: Number(oldStockForm.openingBags) || 0,
        openingWeight: Number(oldStockForm.openingWeight) || 0,
      });
      setOldStockModalOpen(false);
      fetchData();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteTarget({ id });
  };

  const confirmDelete = async () => {
    try {
      await apiDelete(`/items/${deleteTarget.id}`);
      fetchData();
    } catch (e) { alert(e.message); }
  };

  const filteredList = useMemo(() => {
    return list.filter(i => 
      i.name.toLowerCase().includes(search.toLowerCase()) || 
      (i.parentId?.name || "").toLowerCase().includes(search.toLowerCase())
    );
  }, [list, search]);

  const sortedList = useMemo(() => {
    const arr = [...filteredList];
    arr.sort((a, b) => {
      const va = (a[sortKey] || "").toString().toLowerCase();
      const vb = (b[sortKey] || "").toString().toLowerCase();
      return sortDir === "asc" ? va.localeCompare(vb) : -va.localeCompare(vb);
    });
    return arr;
  }, [filteredList, sortKey, sortDir]);

  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, page, pageSize]);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) return <FaSort className="w-3.5 h-3.5 ml-1 opacity-50" />;
    return sortDir === "asc" ? <FaSortUp className="w-3.5 h-3.5 ml-1" /> : <FaSortDown className="w-3.5 h-3.5 ml-1" />;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaSitemap className="w-7 h-7 text-amber-500" /> Sub-Item Management
          </h1>
          <p className="page-subtitle">Sub-items (Warehouses/Batches) banain aur unhen main items ke sath bind karein.</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary flex items-center gap-2">
          <FaPlus className="w-4 h-4" /> Add Sub-Item
        </button>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title={editingId ? "Edit Sub-Item" : "Naya Sub-Item Add Karein"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Sub-Item Name *</label>
            <input type="text" placeholder="e.g. Faisalabad Warehouse, LHR Batch" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="input-label">Main Item (Bind to) *</label>
            <select value={form.parentId} onChange={(e) => setForm((f) => ({ ...f, parentId: e.target.value }))} className="input-field" required>
              <option value="">— Select Main Item —</option>
              {mainItems.map(i => <option key={i._id} value={i._id}>{i.name} ({i.quality})</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Quality (Optional)</label>
            <input type="text" placeholder="e.g. Standard" value={form.quality} onChange={(e) => setForm((f) => ({ ...f, quality: e.target.value }))} className="input-field" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? "Saving..." : (editingId ? "Update Sub-Item" : "Create & Bind")}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary" disabled={submitting}>Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal open={oldStockModalOpen} onClose={() => setOldStockModalOpen(false)} title={`Set Old Stock for ${oldStockForm.name}`}>
        <form onSubmit={handleOldStockSubmit} className="space-y-4">
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 text-amber-800 text-sm mb-4 flex items-start gap-2">
            <FaDatabase className="w-5 h-5 mt-0.5 opacity-70" />
            <p><strong>Old Stock (Opening Balance)</strong><br/>Ye wo stock hai jo system start hone se pehle is warehouse mein para tha. Ye amount Ledger aur Summary mein auto-calculate ho jayegi.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Old Stock (Bags/Kattay)</label>
              <input type="number" step="0.01" value={oldStockForm.openingBags} onChange={(e) => setOldStockForm((f) => ({ ...f, openingBags: e.target.value }))} className="input-field font-black text-lg text-slate-800 bg-slate-50" />
            </div>
            <div>
              <label className="input-label">Old Stock (Weight in Kg)</label>
              <input type="number" step="0.01" value={oldStockForm.openingWeight} onChange={(e) => setOldStockForm((f) => ({ ...f, openingWeight: e.target.value }))} className="input-field font-black text-lg text-indigo-800 bg-indigo-50" />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 mt-6">
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? "Saving..." : "Save Old Stock"}
            </button>
            <button type="button" onClick={() => setOldStockModalOpen(false)} className="btn-secondary" disabled={submitting}>Cancel</button>
          </div>
        </form>
      </Modal>

      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search sub-item..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input pl-9" />
          </div>
          <p className="text-sm text-slate-500">{filteredList.length} sub-item(s)</p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="empty-state"><div className="loading-spinner mb-3" /><p>Loading sub-items...</p></div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-5 py-4 text-left"><button type="button" onClick={() => toggleSort("name")} className="flex items-center hover:text-slate-800 font-bold uppercase tracking-wider text-[10px] text-slate-500">Sub-Item <SortIcon columnKey="name" /></button></th>
                    <th className="px-5 py-4 text-left font-bold uppercase tracking-wider text-[10px] text-slate-500">Parent Item</th>
                    <th className="px-5 py-4 text-left font-bold uppercase tracking-wider text-[10px] text-slate-500">Quality</th>
                    <th className="px-5 py-4 text-center font-bold uppercase tracking-wider text-[10px] text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-4 font-bold text-slate-800">{row.name}</td>
                      <td className="px-5 py-4 text-slate-600 font-medium">
                        <span className="flex items-center gap-1.5"><FaBox className="text-amber-500/50 w-3 h-3" /> {row.parentId?.name || "—"}</span>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{row.quality || "—"}</td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1">
                          <button type="button" onClick={() => navigate(`/items/${row._id}/sub-khata`)} className="btn-ghost-primary px-3 py-1.5 text-xs flex items-center gap-1.5"><FaBook /> Ledger</button>
                          <button type="button" onClick={() => handleOpenOldStock(row)} className="btn-ghost-primary px-3 py-1.5 text-xs flex items-center gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50" title="Set Old Stock (Opening Balance)"><FaDatabase /> Old Stock</button>
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
        title="Sub-Item Delete Karen"
        message="Kya aap waqai is sub-item ko delete karna chahte hain? Stock record pe asar par sakta hai."
      />
    </div>
  );
}
