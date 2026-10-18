import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useSwipe from "../hooks/useSwipe";

const navigationButtonClass = "group absolute top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-slate-950/45 text-white shadow-lg backdrop-blur-xl transition duration-200 hover:border-white/40 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/90 focus-visible:ring-offset-4 focus-visible:ring-offset-black/40 active:bg-white/25 sm:h-14 sm:w-14 motion-reduce:transition-none";

export default function LightboxModal({
  open,
  images = [],
  index = 0,
  onClose,
  onPrev,
  onNext,
  alt = "",
}) {
  const { bind, dragX } = useSwipe({ onLeft: onNext, onRight: onPrev, threshold: 40 });

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, onPrev, onNext]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[1500] bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        // ⬇⬇ IMPORTANTE en iOS: desactiva gestos por defecto para que lleguen los pointer events
        className="absolute inset-0 flex items-center justify-center p-4 touch-none"
        onClick={(e) => e.stopPropagation()}
        {...bind}  // ← los handlers de swipe van acá
        role="dialog"
        aria-modal="true"
      >
        <img
          src={images[index]}
          alt={alt}
          draggable={false}               // ⬅ evita drag nativo del img
          className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl select-none"
          style={{
            transform: `translateX(${dragX}px)`,
            transition: dragX === 0 ? "transform 150ms ease-out" : "none",
          }}
        />

        <button
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white grid place-content-center"
        >
          ✕
        </button>

        {images.length > 1 && (
          <>
            <button
              onClick={onPrev}
              type="button"
              className={`${navigationButtonClass} left-3 sm:left-6`}
              aria-label="Anterior"
            >
              <ChevronLeft aria-hidden="true" size={28} strokeWidth={1.75} className="transition-transform duration-200 group-hover:-translate-x-0.5 motion-reduce:transition-none" />
            </button>
            <button
              onClick={onNext}
              type="button"
              className={`${navigationButtonClass} right-3 sm:right-6`}
              aria-label="Siguiente"
            >
              <ChevronRight aria-hidden="true" size={28} strokeWidth={1.75} className="transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transition-none" />
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
