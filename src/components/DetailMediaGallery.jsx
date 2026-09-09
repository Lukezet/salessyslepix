
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import ImageSlider from "./ImageSlider";
import LightboxModal from "./LightBoxModal";
import { useTenantConfig } from "../store/tenantConfig";
import { videosEnabled, videoSource } from "../services/videos";
import useSwipe from "../hooks/useSwipe";

function ActiveVideo({ url }) {
  const ref = useRef(null);
  useEffect(() => {
    const video = ref.current;
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.5;
      if (!visible) video.pause();
    }, { threshold: [0, 0.5] });
    const stopWhenHidden = () => { if (document.hidden) video.pause(); };
    const guardPlay = () => { if (!visible || document.hidden) video.pause(); };
    observer.observe(video);
    document.addEventListener("visibilitychange", stopWhenHidden);
    video.addEventListener("play", guardPlay);
    return () => {
      video.pause();
      observer.disconnect();
      document.removeEventListener("visibilitychange", stopWhenHidden);
      video.removeEventListener("play", guardPlay);
    };
  }, []);
  return <video ref={ref} src={videoSource(url)} controls playsInline preload="metadata" disablePictureInPicture
    className="aspect-video w-full bg-black object-contain" aria-label="Video de la publicación" />;
}

export default function DetailMediaGallery({ images = [], urls = [], category, alt = "" }) {
  const features = useTenantConfig((state) => state.features);
  const photos = images.map((image) => typeof image === "string" ? image : image?.url).filter(Boolean);
  const videos = videosEnabled(features, category) ? urls : [];
  const slides = [...photos.map((url) => ({ url, video: false })), ...videos.map((url) => ({ url, video: true }))];
  // A new publication/variant starts on its first image.
  return videos.length ? <MediaCarousel key={slides.map((slide) => slide.url).join("|")} slides={slides} photos={photos} alt={alt} /> : <ImageSlider images={images} alt={alt} />;
}

function MediaCarousel({ slides, photos, alt }) {
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState(false);
  const next = () => setIndex((value) => (value + 1) % slides.length);
  const prev = () => setIndex((value) => (value - 1 + slides.length) % slides.length);
  const { bind } = useSwipe({ onLeft: next, onRight: prev, threshold: 40 });
  const slide = slides[index];
  return <section aria-label="Fotos y videos de la publicación" className="min-w-0">
    <div className="overflow-hidden rounded-xl">
      {slide.video ? <ActiveVideo key={slide.url} url={slide.url} /> :
        <div {...bind}><button type="button" onClick={() => setZoom(true)} className="block w-full cursor-zoom-in"><img src={slide.url} alt={alt} className="aspect-video w-full bg-neutral-100 object-contain" /></button></div>}
    </div>
    <div className="mt-2 flex items-center justify-between gap-3">
      <button type="button" onClick={prev} className="rounded-lg border px-4 py-2" aria-label="Elemento anterior">‹</button>
      <span className="text-sm" aria-live="polite">{slide.video ? "Video" : "Foto"} · {index + 1} de {slides.length}</span>
      <button type="button" onClick={next} className="rounded-lg border px-4 py-2" aria-label="Elemento siguiente">›</button>
    </div>
    <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
      {slides.map((item, i) => <button key={i} type="button" onClick={() => setIndex(i)} aria-label={`Ver ${item.video ? "video" : "foto"} ${i + 1}`} aria-pressed={i === index}
        className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 ${i === index ? "border-current" : "border-transparent"}`}>
        {item.video ? <span className="flex h-full items-center justify-center gap-1 bg-neutral-100 text-sm text-neutral-900"><Play size={18} />Video</span> : <img src={item.url} alt="" className="h-full w-full object-cover" />}
      </button>)}
    </div>
    <LightboxModal open={zoom} images={photos} index={index} onClose={() => setZoom(false)}
      onPrev={() => setIndex((value) => (value - 1 + photos.length) % photos.length)}
      onNext={() => setIndex((value) => (value + 1) % photos.length)} alt={alt} />
  </section>;
}
