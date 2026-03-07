import { useState, useEffect, useMemo } from "react";
import { API_BASE_URL, apiPost, apiPut, apiDelete } from "../config/api.js";
import { FaTags, FaSearch, FaEdit, FaPlus, FaSort, FaSortUp, FaSortDown } from "react-icons/fa";
import Modal from "../components/Modal.jsx";
import TablePagination from "../components/TablePagination.jsx";

export default function Categories() {
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", order: "" });
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchList = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
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
  }, []);

  const resetForm = () => {
    setForm({ name: "", order: "" });
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
      setError("Category ka naam zaroori hai");
      return;
    }
    setError("");
    try {
      const payload = {
        name: form.name.trim(),
        order: form.order !== "" && !isNaN(Number(form.order)) ? Number(form.order) : 0,
      };
      if (editingId) await apiPut(`/categories/${editingId}`, payload);
      else await apiPost("/categories", payload);
      resetForm();
      fetchList();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleEdit = (row) => {
    setForm({
      name: row.name || "",
      order: row.order != null ? row.order : "",
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

  const filteredList = useMemo(() => {
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [list, search]);

  const sortedList = useMemo(() => {
    const arr = [...filteredList];
    arr.sort((a, b) => {
      if (sortKey === "order") {
        const va = Number(a.order) || 0;
        const vb = Number(b.order) || 0;
        return sortDir === "asc" ? va - vb : vb - va;
      }
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

  const SortIcon = ({ columnKey }) => {
    if (sortKey !== columnKey) return <FaSort className="w-3.5 h-3.5 ml-1 opacity-50" />;
    return sortDir === "asc" ? <FaSortUp className="w-3.5 h-3.5 ml-1" /> : <FaSortDown className="w-3.5 h-3.5 ml-1" />;
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaTags className="w-7 h-7 text-amber-500" /> Categories
          </h1>
          <p className="page-subtitle">Categories add karein — phir items mein inhe select karein.</p>
        </div>
        <button type="button" onClick={openAddModal} className="btn-primary">
          <FaPlus className="w-4 h-4" /> Add category
        </button>
      </header>

      <Modal open={modalOpen} onClose={resetForm} title={editingId ? "Edit category" : "Nayi category add karein"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Category ka naam *</label>
            <input
              type="text"
              placeholder="e.g. Daal, Anaaj"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="input-field"
              required
            />
          </div>
          <div>
            <label className="input-label">Order (optional)</label>
            <input
              type="number"
              placeholder="0"
              value={form.order}
              onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))}
              className="input-field"
              min="0"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary">
              {editingId ? "Update" : "Add category"}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary">
              Cancel
            </button>
          </div>
        </form>
      </Modal>


      <section className="card">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input pl-9"
            />
          </div>
          <p className="text-sm text-slate-500">{filteredList.length} category(ies)</p>
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
                        Name <SortIcon columnKey="name" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5">
                      <button type="button" onClick={() => toggleSort("order")} className="flex items-center hover:text-slate-800">
                        Order <SortIcon columnKey="order" />
                      </button>
                    </th>
                    <th className="table-header px-5 py-3.5 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedList.map((row) => (
                    <tr key={row._id} className="table-row-hover">
                      <td className="table-cell font-medium">{row.name}</td>
                      <td className="table-cell text-slate-600">{row.order != null ? row.order : "—"}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
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
          {!loading && filteredList.length === 0 && (
            <div className="empty-state">
              <FaTags className="w-12 h-12 text-slate-300 mb-2" />
              <p>Abhi koi category nahi. Add category button se add karein.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
