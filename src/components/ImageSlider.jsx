import { useState, useRef } from "react";

export default function ImageSlider({ images = [], alt = "" }) {
  const [idx, setIdx] = useState(0);
  const lock = useRef(false); // anti-spam de clicks

  if (!images.length) return <div className="h-64 bg-neutral-100 rounded"/>;

  const next = () => {
    if (lock.current) return;
    lock.current = true;
    setIdx((i) => (i + 1) % images.length);
    setTimeout(() => (lock.current = false), 200);
  };
  const prev = () => {
    if (lock.current) return;
    lock.current = true;
    setIdx((i) => (i - 1 + images.length) % images.length);
    setTimeout(() => (lock.current = false), 200);
  };

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-b-3xl ">
        <img src={images[idx]} alt={alt} className="w-full h-auto select-none"/>
        <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80  rounded-full w-9 h-9 grid place-content-center active:scale-95">‹</button>
        <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80  rounded-full w-9 h-9 grid place-content-center active:scale-95">›</button>
      </div>
      <div className="m-2 flex gap-2 overflow-x-auto">
        {images.map((src, i) => (
          <button key={src} onClick={() => setIdx(i)} className={`cursor-pointer transition ease-out duration-100 scale-95 rounded-md  ${i === idx ? "scale-100 shadow-lg" : ""}`}>
            <img src={src} alt={`${alt} ${i + 1}`} className="h-12 w-24 object-cover rounded"/>
          </button>
        ))}
      </div>
    </div>
  );
}