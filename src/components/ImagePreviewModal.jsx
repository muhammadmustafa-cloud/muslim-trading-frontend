import Modal from "./Modal.jsx";
import { API_BASE_URL } from "../config/api.js";
import { useState, useEffect } from "react";

// Extract base URL correctly (e.g. from http://localhost:5000/api to http://localhost:5000)
const BASE_URL = API_BASE_URL.replace(/\/api$/, "");

export default function ImagePreviewModal({ open, onClose, imageUrl, title = "Image Preview" }) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (open) setHasError(false);
  }, [imageUrl, open]);

  if (!imageUrl) return null;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex justify-center items-center bg-slate-100 p-2 rounded-xl border border-slate-200 min-h-[350px] sm:min-w-[400px]">
        {imageUrl && !hasError ? (
          <img
            src={`${BASE_URL}/uploads/${imageUrl}`}
            alt={title}
            className="max-w-full max-h-[65vh] object-contain rounded drop-shadow-sm"
            onError={() => setHasError(true)}
          />
        ) : hasError ? (
          <div className="flex flex-col items-center justify-center text-slate-500 text-sm font-medium">
            <span className="text-3xl mb-2">⚠️</span>
            Image Not Found
          </div>
        ) : (
          <span className="text-slate-400">Loading image...</span>
        )}
      </div>
      <div className="mt-5 flex items-center justify-center gap-4">
        <a 
          href={`${BASE_URL}/uploads/${imageUrl}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="btn-ghost-primary text-sm font-bold w-auto"
        >
          Open in New Tab
        </a>
        <a 
          href={`${BASE_URL}/uploads/${imageUrl}`} 
          download={imageUrl}
          className="btn-primary text-sm font-bold w-auto"
        >
          Download Receipt
        </a>
      </div>
    </Modal>
  );
}
