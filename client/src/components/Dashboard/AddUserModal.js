import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import './AddUserModal.css';

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [gender, setGender] = useState(''); // Default to empty for placeholder
  const [error, setError] = useState('');
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

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // Simulate API call
    const newUser = {
      _id: new Date().getTime().toString(), // Create a unique ID
      name: fullName,
      email,
      role,
      gender,
    };

    onUserAdded(newUser);
    toast.success(`Invitation sent to ${fullName}`);
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className={`modal-overlay ${isVisible ? 'open' : ''}`} onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invite user</h2>
          <button onClick={handleClose} className="close-btn">&times;</button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full name</label>
            <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="eg: Supraj Shrestha" required />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="eg: supraj@example.com" required />
          </div>
          <div className="form-group">
            <label htmlFor="role">Role</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="" disabled>Pick one</option>
              <option>Staff</option>
              <option>Manager</option>
              <option>Admin</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="gender">Gender</label>
            <select
              id="gender"
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                const select = e.target;
                select.className = `gender-select gender-${e.target.value.toLowerCase()}`;
              }}
              className={`gender-select ${gender ? `gender-${gender.toLowerCase()}` : ''}`}
              required
            >
              <option value="" disabled>Pick one</option>
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>
          <div className="modal-actions">
            <button type="submit" className="btn-submit">Send invitation</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
