import React, { useState, useEffect } from 'react';
import './LabelsModal.css';

const LabelsModal = ({ isOpen, onClose, order, onSaveLabels }) => {
  const colorPalette = [
    '#3b82f6', '#ef4444', '#22c55e', '#f97316', '#8b5cf6',
    '#ec4899', '#14b8a6', '#64748b', '#facc15', '#38bdf8'
  ];
    const [labels, setLabels] = useState([]);
  const [newLabel, setNewLabel] = useState('');
    const [labelColor, setLabelColor] = useState(colorPalette[0]);

  useEffect(() => {
        if (order && order.labels) {
      setLabels(order.labels);
    } else {
      setLabels([]);
    }
  }, [order]);

  if (!isOpen || !order) return null;

    const handleAddLabel = () => {
    if (newLabel && !labels.some(label => label.text === newLabel)) {
      setLabels([...labels, { text: newLabel, color: labelColor }]);
      setNewLabel('');
    }
  };

    const handleRemoveLabel = (labelToRemove) => {
    setLabels(labels.filter(label => label.text !== labelToRemove.text));
  };

  const handleSave = () => {
    onSaveLabels(order.orderId, labels);
    onClose();
  };

  return (
    <div className="labels-modal-overlay">
      <div className="labels-modal-content">
        <h4>Edit Labels for Order #{order.orderId}</h4>
        <div className="labels-list">
          {labels.map((label, index) => (
            <div key={index} className="label-tag" style={{ backgroundColor: label.color }}>
              {label.text}
              <button onClick={() => handleRemoveLabel(label)}>&times;</button>
            </div>
          ))}
        </div>
        <div className="add-label-form">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="Add a new label"
          />
          <button onClick={handleAddLabel}>Add</button>
        </div>
        <div className="color-palette">
          {colorPalette.map(color => (
            <button
              key={color}
              type="button"
              className={`color-swatch ${labelColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setLabelColor(color)}
            />
          ))}
        </div>
        <div className="labels-modal-actions">
          <button onClick={onClose} className="btn-cancel">Cancel</button>
          <button onClick={handleSave} className="btn-save">Save</button>
        </div>
      </div>
    </div>
  );
};

export default LabelsModal;
