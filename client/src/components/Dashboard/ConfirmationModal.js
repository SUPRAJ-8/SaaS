import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children, confirmText = "Confirm Removal", cancelText = "Cancel" }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-content warning-modal" onClick={e => e.stopPropagation()}>
        <div className="warning-icon-badge">
          <FaExclamationTriangle />
        </div>
        <h3>{title}</h3>
        <p className="confirm-modal-body">{children}</p>
        <div className="confirm-modal-actions">
          <button onClick={onClose} className="btn-cancel">
            {cancelText}
          </button>
          <button onClick={onConfirm} className="btn-confirm-delete">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
