import React from 'react';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-content">
        <h4>{title}</h4>
        <p>{children}</p>
        <div className="confirm-modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={onConfirm} className="btn-confirm-delete">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
