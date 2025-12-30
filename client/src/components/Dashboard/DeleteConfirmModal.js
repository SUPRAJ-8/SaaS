import React, { useState, useEffect } from 'react';
import { FaTrashAlt } from 'react-icons/fa';
import './DeleteConfirmModal.css';

const DeleteConfirmModal = ({ isOpen, onClose, onConfirm, itemName, ordersCount = 0 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setIsVisible(true), 10);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleConfirm = () => {
    onConfirm();
    handleClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`modal-overlay ${isVisible ? 'open' : ''}`} onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon"><FaTrashAlt /></div>
          <h2>Are you sure?</h2>
        </div>
        <p className="confirm-text">
          Do you really want to delete <strong>{itemName}</strong>?
          {ordersCount > 0 && (
            <>
              <br />
              <span style={{ color: '#ef4444', fontWeight: '500' }}>
                ⚠️ This will also delete {ordersCount} associated order{ordersCount > 1 ? 's' : ''}.
              </span>
            </>
          )}
          <br />
          This process cannot be undone.
        </p>
        <div className="modal-actions">
          <button type="button" onClick={handleClose} className="btn-cancel">Cancel</button>
          <button type="button" onClick={handleConfirm} className="btn-delete">Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
