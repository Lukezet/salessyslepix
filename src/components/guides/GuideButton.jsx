import { useTenantConfig } from "../../store/tenantConfig";
import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import "./guides.css";
import { contextualTour, visibleTourSteps } from "./tours";

let activeGuide;
const contexts = new Map();
const subscribers = new Set();
let currentContext = null;
const subscribe = (listener) => { subscribers.add(listener); return () => subscribers.delete(listener); };
const snapshot = () => currentContext;
function publish() {
  currentContext = [...contexts.values()].sort((a, b) => b.priority - a.priority)[0] ?? null;
  subscribers.forEach((listener) => listener());
}

// Pages register their tour; one shared launcher owns the floating UI.
export default function GuideButton({ tour, disabled = false }) {
  const id = useId();
  const location = useLocation();
  useEffect(() => {
    contexts.set(id, { tour, disabled, priority: tour === "publication" ? 100 : tour === "portal" ? 0 : 50 });
    publish();
    return () => { contexts.delete(id); publish(); };
  }, [id, tour, disabled, location.pathname, location.search]);
  return null;
}

export function FloatingGuide() {
  const context = useSyncExternalStore(subscribe, snapshot, snapshot);
  const location = useLocation();
  return <GuideLauncher key={`${location.pathname}${location.search}:${context?.tour ?? "portal"}`}
    tour={context?.tour ?? "portal"} disabled={context?.disabled ?? false} admin={location.pathname.startsWith("/admin")} />;
}

function GuideLauncher({ tour, disabled, admin }) {
  const features = useTenantConfig((state) => state.features);
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const guide = useRef(null);
  const button = useRef(null);
  const bubble = useRef(null);
  const panelId = useId();
  useEffect(() => () => { guide.current?.destroy(); }, []);
  useEffect(() => {
    if (!open) return;
    bubble.current?.querySelector("button")?.focus();
    const dismiss = (event) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); setOpen(false); button.current?.focus(); }
    };
    const outside = (event) => {
      if (!bubble.current?.contains(event.target) && !button.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("keydown", dismiss, true);
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", dismiss, true); document.removeEventListener("pointerdown", outside); };
  }, [open]);

  const start = () => {
    activeGuide?.destroy();
    const steps = visibleTourSteps(contextualTour(tour, features), (target) => Array.from(document.querySelectorAll(`[data-tour="${target}"]`)));
    if (!steps.length || disabled) return;
    setOpen(false);
    setRunning(true);
    const instance = driver({
      steps, showProgress: true, progressText: "{{current}} de {{total}}",
      nextBtnText: "Siguiente", prevBtnText: "Anterior", doneBtnText: "Terminar",
      allowClose: true, allowKeyboardControl: true, disableActiveInteraction: true,
      animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      popoverClass: "lepix-guide", overlayOpacity: 0.55,
      onPopoverRender: ({ closeButton, wrapper }) => {
        closeButton.setAttribute("aria-label", "Cerrar guía");
        wrapper.setAttribute("aria-label", "Guía de la página");
      },
      onDestroyed: () => {
        setRunning(false);
        if (activeGuide === instance) activeGuide = null;
        if (guide.current === instance) guide.current = null;
        requestAnimationFrame(() => { if (button.current?.isConnected) button.current.focus(); });
      },
    });
    guide.current = instance;
    activeGuide = instance;
    instance.drive();
  };

  return createPortal(<aside className={`floating-guide ${admin ? "floating-guide-admin" : ""}`} aria-label="Ayuda de la página" hidden={running}>
    {open && <div ref={bubble} id={panelId} className="floating-guide-bubble" role="dialog" aria-labelledby={`${panelId}-title`}>
      <button type="button" className="floating-guide-close" aria-label="Cerrar ayuda" onClick={() => { setOpen(false); button.current?.focus(); }}><X size={18} aria-hidden="true" /></button>
      <h2 id={`${panelId}-title`}>¿Querés conocer cómo funciona esta página?</h2>
      <p>Te acompañamos paso a paso. Podés volver a esta ayuda cuando quieras.</p>
      <button type="button" className="floating-guide-start" disabled={disabled} onClick={start}>{disabled ? "Esperá un momento…" : "Empezar recorrido"}</button>
    </div>}
    <button ref={button} type="button" className="floating-guide-trigger" aria-label={open ? "Cerrar ayuda de la página" : "Abrir ayuda de la página"}
      aria-expanded={open} aria-controls={open ? panelId : undefined} aria-haspopup="dialog" onClick={() => setOpen((value) => !value)}>
      <span aria-hidden="true">?</span>
    </button>
  </aside>, document.body);
}
