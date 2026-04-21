import { useEffect } from "react";
import { IconClose } from "./Icons.jsx";

export default function Modal({ title, subtitle, children, onClose, wide = false }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  return (
    <div className="modalOverlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modalBackdrop" onClick={onClose} aria-hidden="true" />
      <div className={`modalSheet ${wide ? "modalSheet--wide" : ""}`}>
        <div className="modalHeader">
          <div>
            {title ? (
              <h2 id="modal-title" className="modalTitle">
                {title}
              </h2>
            ) : null}
            {subtitle ? <p className="modalSubtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="modalClose" onClick={onClose} aria-label="Fermer">
            <IconClose size={22} />
          </button>
        </div>
        <div className="modalBody">{children}</div>
      </div>
    </div>
  );
}
