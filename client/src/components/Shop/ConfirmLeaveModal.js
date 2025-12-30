import React from 'react';
import './ConfirmLeaveModal.css';

const ConfirmLeaveModal = ({ isOpen, onClose, onConfirm, message }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-leave-overlay" onClick={onClose}>
      <div className="confirm-leave-modal" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-leave-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <h2>Are you sure?</h2>
        <p>{message || 'Are you sure you want to leave checkout?'}</p>
        <p className="warning-text">Your cart items and checkout information will be cleared if you leave now.</p>
        <div className="confirm-leave-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            Yes, Leave
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmLeaveModal;

