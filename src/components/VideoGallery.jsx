import { useTenantConfig } from "../store/tenantConfig";
import { videosEnabled, videoSource } from "../services/videos";
export default function VideoGallery({ urls = [], category }) {
  const features = useTenantConfig((state) => state.features);
  if (!videosEnabled(features, category) || !urls.length) return null;
  return <section className="mt-5 space-y-3" aria-label="Videos"><h2 className="text-xl font-semibold">Videos</h2>{urls.map((url, index) => <video key={url} src={videoSource(url)} controls playsInline preload="metadata" className="w-full rounded-xl bg-black" aria-label={`Video ${index + 1}`}>Tu navegador no permite reproducir este video.</video>)}</section>;
}
