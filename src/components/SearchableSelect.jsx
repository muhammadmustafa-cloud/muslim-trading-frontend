import { useState, useRef, useEffect, useMemo } from "react";
import { FaChevronDown, FaTimes, FaSearch } from "react-icons/fa";

/**
 * SearchableSelect Component
 * @param {Array} options - [{ _id, name }, ...]
 * @param {String} value - Selected option's _id
 * @param {Function} onChange - Callback (value)
 * @param {String} placeholder - Label for the default state
 * @param {String} className - Custom classes for the container
 */
export default function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "Select an option",
  className = "",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter options based on search term
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const lowerSearch = searchTerm.toLowerCase();
    return options.filter((opt) =>
      (opt.name || "").toLowerCase().includes(lowerSearch)
    );
  }, [options, searchTerm]);

  // Get current selected option object
  const selectedOption = useMemo(() => {
    return options.find((opt) => String(opt._id) === String(value));
  }, [options, value]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setSearchTerm("");
      // Focus input after a tick to allow it to render/become visible
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleSelect = (opt) => {
    onChange(opt ? opt._id : "");
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange("");
    setSearchTerm("");
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <div
        onClick={handleToggle}
        className="flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-white cursor-pointer hover:border-amber-400 transition-colors shadow-sm min-h-[40px]"
      >
        <span className={`truncate text-sm ${!selectedOption ? "text-slate-400" : "text-slate-700 font-medium"}`}>
          {selectedOption ? selectedOption.name : placeholder}
        </span>
        <div className="flex items-center gap-2 text-slate-400">
          {value && (
            <button
              onClick={handleClear}
              className="hover:text-red-500 transition-colors p-0.5"
              type="button"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          )}
          <FaChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-100 origin-top">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
            <FaSearch className="w-3.5 h-3.5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-slate-700 placeholder:text-slate-400"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt._id}
                  onClick={() => handleSelect(opt)}
                  className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-amber-50 hover:text-amber-800 transition-colors ${
                    String(value) === String(opt._id)
                      ? "bg-amber-100 text-amber-900 font-semibold border-l-4 border-amber-500"
                      : "text-slate-600"
                  }`}
                >
                  {opt.name}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-slate-400">
                <p className="text-xs">No matching results found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
