import { useState } from "react";
import Modal from "./Modal";

export default function UploadScannedDocumentModal({ open, onClose, onSuccess, initialType = "SignatureBook" }) {
  const [formData, setFormData] = useState({
    documentType: initialType,
    recordDate: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [base64Image, setBase64Image] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("File size should not exceed 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image(reader.result);
        setError("");
      };
      reader.onerror = () => {
        setError("Error reading file.");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!base64Image) {
      setError("Please select an image");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const payload = {
        ...formData,
        imageUrl: base64Image,
      };

      const token = localStorage.getItem("mill_token");
      const clientId = localStorage.getItem("mill_client_id");

      const response = await fetch("http://localhost:5000/api/scanned-documents", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "x-client-id": clientId,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to upload document");

      onSuccess(data.data);
      setBase64Image("");
      setFormData({
        documentType: initialType,
        recordDate: new Date().toISOString().split("T")[0],
        notes: "",
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Upload Scanned Document">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
          <select
            className="input-field"
            value={formData.documentType}
            onChange={(e) => setFormData({ ...formData, documentType: e.target.value })}
            required
          >
            <option value="SignatureBook">Signature Book</option>
            <option value="DailyCashMemo">Daily Cash Memo</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
          <input
            type="date"
            className="input-field"
            value={formData.recordDate}
            onChange={(e) => setFormData({ ...formData, recordDate: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Image (Max 5MB)</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="input-field"
            required
          />
          {base64Image && (
            <div className="mt-2 h-32 rounded-lg border overflow-hidden">
              <img src={base64Image} alt="Preview" className="w-full h-full object-contain" />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Notes (Optional)</label>
          <textarea
            className="input-field"
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button type="button" onClick={onClose} className="btn-ghost-primary" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading || !base64Image}>
            {loading ? "Uploading..." : "Upload Document"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
