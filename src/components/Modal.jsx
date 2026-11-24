import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/* ==========================================================
   PORTAL MODAL COMPONENT
   Mounted to document.body: Immune to ancestor transforms,
   stays fixed to device screen and follows on scroll.
   ========================================================== */
const Modal = ({ children, onClose, className = '' }) => {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const baseClass = className.split(' ')[0] || 'default';

  return createPortal(
    <div
      className={`modal-backdrop modal-${baseClass}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`modal-card ${className}`}
        onClick={event => event.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default Modal;
