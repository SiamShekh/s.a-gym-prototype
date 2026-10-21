import { createPortal } from 'react-dom'

/** Renders sheets/dialogs on document.body so bottom-nav cannot cover them. */
export default function Overlay({ children, onClose, className = '' }) {
  return createPortal(
    <div
      className={className ? `overlay ${className}` : 'overlay'}
      onClick={onClose}
      role="presentation"
    >
      {children}
    </div>,
    document.body,
  )
}
