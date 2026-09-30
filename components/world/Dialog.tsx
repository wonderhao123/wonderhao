"use client";
import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
export function Dialog({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const previous = document.activeElement as HTMLElement | null;
    d.showModal();
    const cancel = (e: Event) => {
      e.preventDefault();
      close.current();
    };
    d.addEventListener("cancel", cancel);
    return () => {
      d.removeEventListener("cancel", cancel);
      d.close();
      requestAnimationFrame(() => {
        if (previous?.isConnected) previous.focus();
      });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={`world-dialog ${wide ? "wide" : ""}`}
      aria-label={title}
    >
      <div className="dialog-heading">
        <span className="eyebrow">{title}</span>
        <button
          autoFocus
          type="button"
          className="icon-button"
          aria-label={`Close ${title}`}
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      <div className="dialog-content">{children}</div>
    </dialog>
  );
}
