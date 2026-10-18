import { useEffect, useMemo, useRef, useState } from "react";
import LightboxModal from "./LightBoxModal";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useSwipe from "../hooks/useSwipe";

const arrowClass = "absolute top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-xl border border-neutral-200 bg-white text-neutral-800 shadow-sm transition hover:border-neutral-400 hover:bg-neutral-100 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700 focus-visible:ring-offset-2 active:scale-95 motion-reduce:transition-none";

export default function ImageSlider({ images = [], alt = "" }) {
  // Normalizo: acepto string o { id?, url, sort? }
  const slides = useMemo(() => {
    return images
      .map((img, i) => {
        const url = typeof img === "string" ? img : img?.url;
        if (!url) return null;
        const id = typeof img === "object" ? (img.id ?? img.Id) : null;
        // Key estable y única
        const key = id != null ? `img-${id}` : `img-${url}-${i}`;
        return { key, url };
      })
      .filter(Boolean);
  }, [images]);

  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const lock = useRef(false);

  // Si cambia el set de imágenes, aseguro que el índice sea válido
  useEffect(() => {
    if (idx >= slides.length) setIdx(0);
  }, [slides.length, idx]);

  

  const next = () => { if (!lock.current) { lock.current = true; setIdx(i => (i + 1) % slides.length); setTimeout(() => (lock.current = false), 200); } };
  const prev = () => { if (!lock.current) { lock.current = true; setIdx(i => (i - 1 + slides.length) % slides.length); setTimeout(() => (lock.current = false), 200); } };
  // <- NUEVO: swipe
  const { bind, dragX } = useSwipe({ onLeft: next, onRight: prev, threshold: 40 });
  if (!slides.length) return <div className="h-72 rounded-2xl bg-neutral-100 sm:h-96 lg:h-[440px]" />;

  return (
    <div className="flex w-full min-w-0 flex-col gap-3 sm:flex-row-reverse sm:items-start">
      <div className={`relative h-72 w-full min-w-0 select-none sm:h-96 sm:flex-1 lg:h-[440px] ${slides.length > 1 ? "px-12 sm:px-14" : ""}`}>
        
        <button type="button" onClick={() => setOpen(true)} aria-label="Ver imagen completa" className="block h-full w-full overflow-hidden rounded-2xl bg-neutral-100 touch-pan-y cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-neutral-900" {...bind}>
        <img
          src={slides[idx].url}
          alt={alt}
          style={{
            transform: `translateX(${dragX}px)`,
            transition: dragX === 0 ? "transform 150ms ease-out" : "none",
          }}
          className="h-full w-full object-cover object-center select-none"
        />
        </button>
        {slides.length > 1 && (
          <>
            <button type="button" onClick={prev} className={`${arrowClass} left-0`} aria-label="Foto anterior">
              <ChevronLeft size={26} strokeWidth={1.8} aria-hidden="true" />
            </button>
            <button type="button" onClick={next} className={`${arrowClass} right-0`} aria-label="Foto siguiente">
              <ChevronRight size={26} strokeWidth={1.8} aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <div className="flex shrink-0 gap-2 overflow-x-auto p-1 sm:max-h-96 sm:w-20 sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto lg:max-h-[440px]">
        {slides.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setIdx(i)}
            type="button"
            aria-label={`Ver foto ${i + 1}`}
            aria-pressed={i === idx}
            className={`shrink-0 cursor-pointer transition ease-out duration-100 scale-95 rounded-md ${i === idx ? "scale-100 shadow-lg" : ""}`}
          >
            <img src={s.url} alt={`${alt} ${i + 1}`} className="h-16 w-20 rounded border border-neutral-100 object-cover sm:w-full" />
          </button>
        ))}
      </div>
       {/* Modal */}
      <LightboxModal
        open={open}
        images={slides.map(s => s.url)}
        index={idx}
        onClose={() => setOpen(false)}
        onPrev={prev}
        onNext={next}
        alt={alt}
      />
    </div>
  );
}