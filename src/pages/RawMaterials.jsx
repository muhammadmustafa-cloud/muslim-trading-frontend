import { useState, useEffect } from "react";
import { apiGet, apiPost, apiDelete, apiPut } from "../config/api.js";
import { FaBoxes, FaPlus, FaTrash, FaEdit, FaBook } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Modal from "../components/Modal.jsx";

export default function RawMaterials() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const fetchList = async () => {
    setLoading(true);
    try {
      const { data } = await apiGet("/raw-material-heads");
      setList(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setName("");
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id);
    setName(item.name);
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (editingId) {
        await apiPut(`/raw-material-heads/${editingId}`, { name });
      } else {
        await apiPost("/raw-material-heads", { name });
      }
      setModalOpen(false);
      fetchList();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kiya aap waqae is Raw Material category ko delete karna chahte hain?")) return;
    try {
      await apiDelete(`/raw-material-heads/${id}`);
      fetchList();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaBoxes className="w-7 h-7 text-teal-500" />
            Raw Material Setup
          </h1>
          <p className="page-subtitle">Manage categories like Bardana, Mitti, and Munshiana for transactions.</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <FaPlus className="w-4 h-4" /> Add Material Type
        </button>
      </header>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm">{error}</div>}

      <section className="card overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Material Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right w-32">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="2" className="p-10 text-center"><div className="loading-spinner mx-auto" /></td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan="2" className="p-10 text-center text-slate-400 font-medium">Abhi koi Raw Material type nahi bani.</td></tr>
            ) : (
              list.map((item) => (
                <tr key={item._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">{item.name}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => navigate(`/transactions?rawMaterialHeadId=${item._id}`)} className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors font-black flex items-center gap-1 text-xs" title="View Ledger">
                        <FaBook className="w-4 h-4" /> Ledger
                      </button>
                      <button onClick={() => openEditModal(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                        <FaEdit className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item._id)} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete">
                        <FaTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Raw Material Update Karein" : "Naya Raw Material Add Karein"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Material Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g. Bardana (New), Mitti (Type A)"
              required
              autoFocus
            />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="btn-primary flex-1 py-3" disabled={submitting}>
              {submitting ? "Saving..." : "Save Material Type"}
            </button>
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary px-6">
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
