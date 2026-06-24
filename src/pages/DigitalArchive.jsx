import { useState, useEffect } from "react";
import { FaCloudUploadAlt, FaSearch, FaTrash, FaEye } from "react-icons/fa";
import { apiGet, apiDelete } from "../config/api.js";
import UploadScannedDocumentModal from "../components/UploadScannedDocumentModal";
import ImagePreviewModal from "../components/ImagePreviewModal";
import DeletePasswordModal from "../components/DeletePasswordModal.jsx";

export default function DigitalArchive() {
  const [activeTab, setActiveTab] = useState("SignatureBook");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null); // { id }
  
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await apiGet("/scanned-documents", {
        documentType: activeTab,
        startDate: filters.startDate || undefined,
        endDate: filters.endDate || undefined,
        limit: 50,
      });

      setDocuments(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [activeTab, filters]);

  const handleDelete = (id) => {
    setDeleteTarget({ id });
  };

  const confirmDelete = async () => {
    try {
      await apiDelete(`/scanned-documents/${deleteTarget.id}`);
      setDocuments(documents.filter(d => d._id !== deleteTarget.id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Digital Archive</h1>
          <p className="text-slate-500 text-sm mt-1">Manage handwritten records and memos</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="btn-primary inline-flex items-center gap-2 w-full sm:w-auto shadow-indigo-500/25"
        >
          <FaCloudUploadAlt />
          Upload New
        </button>
      </div>

      {/* Filters and Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab("SignatureBook")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "SignatureBook" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Signature Book
            </button>
            <button
              onClick={() => setActiveTab("DailyCashMemo")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === "DailyCashMemo" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Daily Cash Memo
            </button>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <input
              type="date"
              className="input-field max-w-[150px]"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              className="input-field max-w-[150px]"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>

        </div>
      </div>

      {/* Grid View */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-pulse">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-slate-200 rounded-xl aspect-[3/4]"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center border border-red-100">
          {error}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="text-5xl mb-4">📂</div>
          <h3 className="text-lg font-medium text-slate-800">No documents found</h3>
          <p className="text-slate-500 mt-1">Upload a document to see it here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {documents.map((doc) => (
            <div key={doc._id} className="group relative bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-all">
              
              {/* Image Thumbnail */}
              <div 
                className="aspect-[4/5] bg-slate-100 overflow-hidden cursor-pointer relative"
                onClick={() => setPreviewImage(doc.imageUrl)}
              >
                <img 
                  src={doc.imageUrl} 
                  alt="Scanned Document" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-white/90 text-slate-800 px-3 py-1.5 rounded-lg text-sm font-medium inline-flex items-center gap-2">
                    <FaEye /> View Full
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 border-t border-slate-100">
                <div className="flex justify-between items-start mb-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-bold">
                    {new Date(doc.recordDate).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </span>
                  <button 
                    onClick={() => handleDelete(doc._id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Delete"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
                {doc.notes && (
                  <p className="text-xs text-slate-500 line-clamp-2 mt-2 leading-relaxed">
                    {doc.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {showUploadModal && (
        <UploadScannedDocumentModal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          initialType={activeTab}
          onSuccess={(newDoc) => {
            if (newDoc.documentType === activeTab) {
              setDocuments([newDoc, ...documents]);
            }
          }}
        />
      )}

      {previewImage && (
        <ImagePreviewModal
          open={!!previewImage}
          onClose={() => setPreviewImage(null)}
          imageUrl={previewImage}
          title={`${activeTab.replace(/([A-Z])/g, ' $1').trim()} Preview`}
        />
      )}

      <DeletePasswordModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Document Delete Karen"
        message="Kya aap waqai is document ko delete karna chahte hain?"
      />
    </div>
  );
}
