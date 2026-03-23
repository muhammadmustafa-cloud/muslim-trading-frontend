import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../config/api.js";
import {
  FaWallet,
  FaPlus,
  FaTrash,
  FaChartLine,
  FaReceipt,
} from "react-icons/fa";

export default function ExpenseTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState({ name: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTypes = async () => {
    setLoading(true);
    try {
      const res = await apiGet("/expense-types");
      setTypes(res.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newType.name.trim()) return;
    setIsSubmitting(true);
    try {
      await apiPost("/expense-types", newType);
      setNewType({ name: "", description: "" });
      setShowAddModal(false);
      fetchTypes();
    } catch (e) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure? This will only work if no transactions are linked.")) return;
    try {
      await apiDelete(`/expense-types/${id}`);
      fetchTypes();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center">
            <FaWallet className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Expense Management</h1>
            <p className="text-slate-500 text-sm">Manage dynamic expense categories and their history.</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-blue-500/20"
        >
          <FaPlus className="w-4 h-4" /> Add New Expense Type
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl animate-shake">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-20 text-center text-slate-400">
          <div className="loading-spinner mx-auto mb-4" />
          <p className="animate-pulse">Loading categories...</p>
        </div>
      ) : types.length === 0 ? (
        <div className="card p-20 text-center border-dashed border-2 border-slate-200 bg-slate-50/50">
          <FaReceipt className="w-16 h-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-600">No Expense Categories</h3>
          <p className="text-slate-400 max-w-xs mx-auto mt-1 text-sm">
            Add your first expense category (e.g., Petrol, Bill) to start tracking.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-secondary mt-6 text-sm"
          >
            Create Category
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {types.map((type) => (
            <div
              key={type._id}
              className="group card overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border-t-4 border-t-rose-500"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 group-hover:bg-rose-500 group-hover:text-white transition-colors duration-300">
                    <FaWallet className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => handleDelete(type._id)}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    title="Delete Category"
                  >
                    <FaTrash className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">
                  {type.name}
                </h3>
                <p className="text-slate-500 text-sm line-clamp-2 h-10 mb-6">
                  {type.description || "No description provided."}
                </p>
                <div className="flex border-t border-slate-100 -mx-6 -mb-6">
                  <Link
                    to={`/expense-types/${type._id}/ledger`}
                    className="flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all border-r border-slate-100 uppercase tracking-widest"
                  >
                    <FaChartLine className="w-3.5 h-3.5" /> View Khata
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                <FaPlus className="text-blue-500" /> NEW EXPENSE CATEGORY
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              <div>
                <label className="input-label block text-xs font-bold text-slate-500 uppercase mb-2">Category Name *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newType.name}
                  onChange={(e) => setNewType({ ...newType, name: e.target.value })}
                  placeholder="e.g., Petrol, Electricity Bill"
                  className="input-field w-full text-lg font-bold"
                />
              </div>
              <div>
                <label className="input-label block text-xs font-bold text-slate-500 uppercase mb-2">Description / Notes</label>
                <textarea
                  rows="3"
                  value={newType.description}
                  onChange={(e) => setNewType({ ...newType, description: e.target.value })}
                  placeholder="Details about this expense (optional)"
                  className="input-field w-full resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary flex-1 py-3 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 py-3 font-bold flex items-center justify-center gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Creating..." : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
