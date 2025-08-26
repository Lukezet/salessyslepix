// src/components/StateDropdown.jsx
import { useEffect, useRef, useState } from "react";

const STATUS = ["Pending", "Approved", "Delivered", "Cancelled"];

export default function StateDropdown({ o, onChangeState }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cerrar al hacer click afuera
  useEffect(() => {
    const onDocClick = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        className="px-2.5 py-1.5 rounded-xl border-2 text-xs hover:bg-gray-50 btn-custom"
        onClick={(e) => {
          e.stopPropagation();          // evita que un onClick del row se dispare
          setOpen((v) => !v);
        }}
      >
        Estado ▾
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 bg-white border rounded-xl shadow p-1 mt-1 min-w-[160px]">
          {STATUS.map((st) => (
            <button
              key={st}
              onClick={(e) => {
                e.stopPropagation();
                onChangeState(o, st);    // envía el string al back
                setOpen(false);
              }}
              className={`block w-full text-left px-3 py-1.5 rounded-lg text-sm hover:bg-amber-300 ${
                st === o.state ? "opacity-60" : ""
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
