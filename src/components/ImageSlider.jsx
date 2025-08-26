import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import LightboxModal from "./LightBoxModal";
import useSwipe from "../hooks/useSwipe";

export default function ImageSlider({ images = [], alt = "" }) {
  const slides = useMemo(() => {
    return images
      .map((img, i) => {
        const url = typeof img === "string" ? img : img?.url;
        if (!url) return null;
        const id = typeof img === "object" ? (img.id ?? img.Id) : null;
        const key = id != null ? `img-${id}` : `img-${url}-${i}`;
        return { key, url };
      })
      .filter(Boolean);
  }, [images]);

  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    if (idx >= slides.length) setIdx(0);
  }, [slides.length, idx]);

  const next = useCallback(() => {
    if (lock.current || slides.length === 0) return;
    lock.current = true;
    setIdx(i => (i + 1) % slides.length);
    setTimeout(() => (lock.current = false), 200);
  }, [slides.length]);

  const prev = useCallback(() => {
    if (lock.current || slides.length === 0) return;
    lock.current = true;
    setIdx(i => (i - 1 + slides.length) % slides.length);
    setTimeout(() => (lock.current = false), 200);
  }, [slides.length]);

  // ⬇️ El hook va ANTES de cualquier return
  const { bind, dragX } = useSwipe({ onLeft: next, onRight: prev, threshold: 40 });

  if (!slides.length) {
    return <div className="h-64 bg-neutral-100 rounded" />;
  }

  return (
    <div className="w-full sm:flex sm:flex-row-reverse">
      <div className="relative overflow-hidden rounded-b-3xl touch-pan-y" {...bind}>
        <img
          src={slides[idx].url}
          alt={alt}
          style={{
            transform: `translateX(${dragX}px)`,
            transition: dragX === 0 ? "transform 150ms ease-out" : "none",
          }}
          className="w-full h-auto select-none cursor-zoom-in"
          onClick={() => setOpen(true)}
        />
        <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-9 h-9 grid place-content-center active:scale-95">‹</button>
        <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 rounded-full w-9 h-9 grid place-content-center active:scale-95">›</button>
      </div>

      <div className="m-2 sm:flex sm:flex-col gap-2 overflow-x-auto">
        {slides.map((s, i) => (
          <button
            key={s.key}
            onClick={() => setIdx(i)}
            className={`cursor-pointer transition ease-out duration-100 scale-95 rounded-md ${i === idx ? "scale-100 shadow-lg" : ""}`}
          >
            <img src={s.url} alt={`${alt} ${i + 1}`} className="h-12 w-24 object-cover border border-neutral-100 sm:h-24 sm:w-52 sm:object-contain rounded" />
          </button>
        ))}
      </div>

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
