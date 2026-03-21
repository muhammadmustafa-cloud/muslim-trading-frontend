import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL, apiPost, apiPut, apiDelete } from "../config/api.js";
import { FaBox, FaSearch, FaEdit, FaPlus, FaBook, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";

export default function Items() {
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ name: "", categoryId: "", quality: "" });
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      const data = await res.json();
      if (res.ok) setCategories(data.data || []);
    } catch (_) { }
  };

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;
      const res = await fetch(`${API_BASE_URL}/items?${new URLSearchParams(params)}`);
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
    fetchList();
    fetchCategories();
  }, [search, categoryFilter]);

  const resetForm = () => {
    setForm({ name: "", categoryId: "", quality: "" });
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
    });
    setEditingId(row._id);
    setModalOpen(true);
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
            <FaBox className="w-7 h-7 text-amber-500" /> Items (Saman)
          </h1>
          <p className="page-subtitle">Item add karein — category select karein aur quality daalein.</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary">
          <FaPlus className="w-4 h-4" /> Add item
        </button>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title={editingId ? "Edit item" : "Naya item add karein"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Item ka naam *</label>
            <input type="text" placeholder="e.g. Channa, Gehu" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input-field" required />
          </div>
          <div>
            <label className="input-label">Category</label>
            <select value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))} className="input-field">
              <option value="">— Select category —</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            {categories.length === 0 && <p className="text-xs text-slate-500 mt-1">Pehle Categories page se category add karein.</p>}
          </div>
          <div>
            <label className="input-label">Quality</label>
            <input type="text" placeholder="e.g. Premium, Standard" value={form.quality} onChange={(e) => setForm((f) => ({ ...f, quality: e.target.value }))} className="input-field" />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (editingId ? "Update" : "Add item")}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary" disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </Modal>



      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search by item name..." value={search} onChange={(e) => setSearch(e.target.value)} className="search-input pl-9" />
          </div>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="input-field w-48">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-slate-500">{list.length} item(s)</p>
        </div>
        <div className="overflow-x-auto">
          {loading ? (
            <div className="empty-state">
              <div className="loading-spinner mb-3" />
              <p>Loading...</p>
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("name")} className="flex items-center hover:text-slate-800">
                        Item <SortIcon columnKey="name" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("category")} className="flex items-center hover:text-slate-800">
                        Category <SortIcon columnKey="category" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">Quality</th>
                    <th className="table-header px-5 py-3.5 w-40">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      <td className="table-cell font-medium">{row.name}</td>
                      <td className="table-cell text-slate-600">{getCategoryName(row)}</td>
                      <td className="table-cell">{row.quality || "—"}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1 flex-wrap">
                          <button type="button" onClick={() => navigate(`/items/${row._id}/khata`)} className="btn-ghost-primary flex items-center gap-1">
                            <FaBook className="w-3.5 h-3.5" /> Khata
                          </button>
                          <button type="button" onClick={() => handleEdit(row)} className="btn-ghost-primary flex items-center gap-1">
                            <FaEdit className="w-3.5 h-3.5" /> Edit
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
              <FaBox className="w-12 h-12 text-slate-300 mb-2" />
              <p>Abhi koi item nahi. Add item button se add karein.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
