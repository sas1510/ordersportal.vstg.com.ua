// components/DropdownMenu.jsx
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

export default function DropdownMenu({ title, items, className = "" }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={() => setOpen(prev => !prev)}
        className="hover:text-blue-500 flex items-center gap-1 focus:outline-none"
      >
        {title} ▾
      </button>
      {open && (
        <div className="bg-white text-gray-700 rounded shadow-md mt-2 absolute z-50">
          {items.map((item, index) => (
            <Link
              key={index}
              to={item.to}
              className="block px-4 py-2 hover:bg-gray-100"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
