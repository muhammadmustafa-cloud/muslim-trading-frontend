import Modal from "./Modal.jsx";
import { useState, useEffect, useCallback } from "react";
import { FaChevronLeft, FaChevronRight, FaDownload, FaExpand, FaTimes, FaImage } from "react-icons/fa";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const BASE_URL = API_BASE_URL.replace(/\/api$/, "");

function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) return imageUrl;
  if (imageUrl.startsWith("data:image/")) return imageUrl;
  if (imageUrl.startsWith("mill_receipts/")) {
    return `https://res.cloudinary.com/dbs72ujyh/image/upload/${imageUrl}`;
  }
  return `${BASE_URL}/uploads/${imageUrl}`;
}

export default function ImagePreviewModal({ open, onClose, images = [], title = "Image Preview" }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);

  // Normalize: accept a single string or an array
  const imageList = Array.isArray(images)
    ? images.filter(Boolean)
    : images
    ? [images]
    : [];

  const currentUrl = resolveImageUrl(imageList[activeIndex]);
  const total = imageList.length;

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      setHasError(false);
      setIsZoomed(false);
    }
  }, [open, images]);

  const goNext = useCallback(() => {
    setHasError(false);
    setIsZoomed(false);
    setActiveIndex((i) => (i + 1) % total);
  }, [total]);

  const goPrev = useCallback(() => {
    setHasError(false);
    setIsZoomed(false);
    setActiveIndex((i) => (i - 1 + total) % total);
  }, [total]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, goNext, goPrev, onClose]);

  if (!open || total === 0) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)" }}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-50 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all backdrop-blur-sm"
        title="Close"
      >
        <FaTimes className="w-5 h-5" />
      </button>

      {/* Title + count */}
      <div className="absolute top-4 left-4 z-50">
        <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
          <FaImage className="text-white/70 w-4 h-4" />
          <span className="text-white font-bold text-sm">{title}</span>
          {total > 1 && (
            <span className="ml-2 bg-white/20 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {activeIndex + 1} / {total}
            </span>
          )}
        </div>
      </div>

      {/* Main image area */}
      <div className="relative flex items-center justify-center w-full h-full px-20">
        {/* Prev arrow */}
        {total > 1 && (
          <button
            onClick={goPrev}
            className="absolute left-4 z-40 p-3 bg-white/10 hover:bg-white/25 rounded-full text-white transition-all backdrop-blur-sm hover:scale-110"
          >
            <FaChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Image */}
        <div
          className={`relative flex items-center justify-center transition-transform duration-300 ${isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"}`}
          onClick={() => setIsZoomed((z) => !z)}
          style={{ maxWidth: "85vw", maxHeight: "75vh" }}
        >
          {!hasError ? (
            <img
              key={currentUrl}
              src={currentUrl}
              alt={`${title} ${activeIndex + 1}`}
              className="max-w-full max-h-[72vh] object-contain rounded-xl shadow-2xl border border-white/10"
              onError={() => setHasError(true)}
              draggable={false}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-white/60 gap-3 p-16 bg-white/5 rounded-2xl border border-white/10">
              <span className="text-5xl">⚠️</span>
              <span className="font-medium">Image Not Found</span>
            </div>
          )}
        </div>

        {/* Next arrow */}
        {total > 1 && (
          <button
            onClick={goNext}
            className="absolute right-4 z-40 p-3 bg-white/10 hover:bg-white/25 rounded-full text-white transition-all backdrop-blur-sm hover:scale-110"
          >
            <FaChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-0 left-0 right-0 z-50 px-6 pb-5 flex flex-col items-center gap-3">
        {/* Thumbnails */}
        {total > 1 && (
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-2xl px-4 py-2.5 max-w-full overflow-x-auto">
            {imageList.map((imgUrl, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); setHasError(false); setIsZoomed(false); }}
                className={`flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden border-2 transition-all ${
                  idx === activeIndex
                    ? "border-white scale-110 shadow-lg shadow-white/20"
                    : "border-white/20 hover:border-white/50 opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={resolveImageUrl(imgUrl)}
                  alt={`thumb-${idx}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <a
            href={currentUrl}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.open(currentUrl, "_blank", "noopener,noreferrer");
            }}
            className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all backdrop-blur-sm border border-white/20"
          >
            <FaExpand className="w-4 h-4" />
            Open Full Size
          </a>
          <a
            href={currentUrl}
            download={`receipt-${activeIndex + 1}.jpg`}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/30"
          >
            <FaDownload className="w-4 h-4" />
            Download {total > 1 ? `(${activeIndex + 1}/${total})` : ""}
          </a>
        </div>
      </div>
    </div>
  );
}
