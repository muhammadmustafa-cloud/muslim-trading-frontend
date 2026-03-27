import { useState, useEffect } from "react";
import { API_BASE_URL, apiGet, apiPost, apiPut, apiDelete } from "../config/api.js";
import { FaUsers, FaUserPlus, FaEdit, FaTrash, FaShieldAlt, FaUserTag, FaLock } from "react-icons/fa";
import Modal from "../components/Modal.jsx";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: "", username: "", password: "", role: "user" });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/users");
      setUsers(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetForm = () => {
    setForm({ name: "", username: "", password: "", role: "user" });
    setEditingId(null);
    setModalOpen(false);
  };

  const handleEdit = (user) => {
    setForm({ name: user.name, username: user.username, password: "", role: user.role });
    setEditingId(user._id);
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await apiDelete(`/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      if (editingId) {
        await apiPut(`/users/${editingId}`, form);
      } else {
        await apiPost("/users", form);
      }
      resetForm();
      fetchUsers();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <FaUsers className="w-8 h-8 text-indigo-600" />
            User Management
          </h1>
          <p className="page-subtitle">System users aur unke permissions manage karein.</p>
        </div>
        <button type="button" onClick={() => { resetForm(); setModalOpen(true); }} className="btn-primary flex items-center gap-2">
          <FaUserPlus /> Naya User Banayein
        </button>
      </header>

      {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200">{error}</div>}

      <div className="card overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr><td colSpan="4" className="p-12 text-center text-slate-400">Loading users...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="4" className="p-12 text-center text-slate-400">No users found.</td></tr>
            ) : (
              users.map((user) => (
                <tr key={user._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                        {(user.name || user.username || "?").charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-800">{user.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{user.username}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 w-fit ${
                      user.role === 'superadmin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {user.role === 'superadmin' ? <FaShieldAlt className="w-3 h-3" /> : <FaUserTag className="w-3 h-3" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleEdit(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit User">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDelete(user._id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete User">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={resetForm} title={editingId ? "Edit User" : "Create New User"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Full Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Abdullah Sadiq" required />
          </div>
          <div>
            <label className="input-label">Username</label>
            <input type="text" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="input-field" placeholder="e.g. abdullah123" required />
          </div>
          <div>
            <label className="input-label">Password {editingId && "(Leave blank to keep current)"}</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" />
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field pl-10" placeholder="••••••••" required={!editingId} />
            </div>
          </div>
          <div>
            <label className="input-label">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="input-field">
              <option value="user">Standard User (Restricted access)</option>
              <option value="superadmin">Super Admin (Full access)</option>
            </select>
            <p className="text-[10px] text-slate-500 mt-1">Super Admin ko delete ya edit karne ki poori ijazat hoti he.</p>
          </div>
          
          <div className="flex gap-2 pt-4">
            <button type="submit" className="btn-primary flex-1" disabled={submitting}>
              {submitting ? "Saving..." : (editingId ? "Update User" : "Banayein")}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary px-6" disabled={submitting}>Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
