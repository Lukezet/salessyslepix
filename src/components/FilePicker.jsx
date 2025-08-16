import { useRef, useState } from "react";

export default function FilePicker({
  onFiles,                 // (File[]) => void
  multiple = true,
  accept = "image/*",
  label = "Subir archivos",
  className = "",
  disabled = false,
  compact = false,
}) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const openDialog = () => {
    if (disabled) return;
    inputRef.current?.click();
  };

  const handleInput = (e) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length) onFiles?.(files);
    // reset para permitir subir el mismo archivo de nuevo
    e.target.value = "";
  };

  const onDragEnter = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!disabled) setDragOver(true);
  };
  const onDragOver = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!disabled) setDragOver(true);
  };
  const onDragLeave = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(false);
  };
  const onDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    setDragOver(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer?.files ?? []);
    if (files.length) onFiles?.(files);
  };

  return (
    <div className={className}>
      {/* input real oculto */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        onChange={handleInput}
        disabled={disabled}
      />

      {/* caja visible */}
      <div
        role="button"
        tabIndex={0}
        onClick={openDialog}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openDialog()}
        onDragEnter={onDragEnter}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        aria-disabled={disabled}
        className={[
          "w-full rounded-2xl border-2 border-dashed px-4",
          compact ? "py-3" : "py-6",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          dragOver ? "border-neutral-800 bg-neutral-100" : "border-neutral-300 hover:border-neutral-500",
        ].join(" ")}
      >
        <div className="flex items-center justify-center gap-3">
          {/* ícono simple */}
          <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true">
            <path d="M12 16v-8m0 0-3 3m3-3 3 3M6 20h12a2 2 0 0 0 2-2v-4a2 
                     2 0 0 0-2-2h-1.5a.5.5 0 0 1-.5-.5V9a4 4 0 0 0-8 0v2.5a.5.5 0 0 1-.5.5H6a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2z"
                  fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <div className="text-sm">
            <div className="font-medium">{label}</div>
            <div className="text-xs text-neutral-600">Arrastrá y soltá, o hacé click</div>
          </div>
        </div>
      </div>
    </div>
  );
}
