import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function SidePanel({ label, onClose, children }) {
  const [top, setTop] = useState(0);

  useLayoutEffect(() => {
    const navbar = document.querySelector("[data-app-navbar]");
    const measure = () => setTop(Math.max(0, Math.min(window.innerHeight, navbar?.getBoundingClientRect().bottom ?? 0)));
    measure();
    const observer = navbar && window.ResizeObserver ? new window.ResizeObserver(measure) : null;
    if (navbar) observer?.observe(navbar);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    window.visualViewport?.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure);
      window.visualViewport?.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    const closeOnEscape = event => {
      // A confirmation dialog on top owns Escape until it is closed.
      if (event.key === "Escape" && !document.querySelector('[role="dialog"][data-panel-confirmation]')) onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return createPortal(
    <div className="app-side-panel admin-premium tenant-product fixed inset-x-0 bottom-0 z-[900]" style={{ top }} role="dialog" aria-modal="true" aria-label={label}>
      <div className="absolute inset-0 bg-black/30" onClick={onClose} aria-hidden="true" />
      {children}
    </div>, document.body,
  );
}
