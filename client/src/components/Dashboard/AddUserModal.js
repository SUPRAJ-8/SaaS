import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_URL from '../../apiConfig';
import './AddUserModal.css';

const AddUserModal = ({ isOpen, onClose, onUserAdded }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [gender, setGender] = useState(''); // Default to empty for placeholder
  const [error, setError] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const payload = {
        name: fullName,
        email,
        role,
        gender: gender.toLowerCase()
      };

      const response = await axios.post(`${API_URL}/api/users`, payload, { withCredentials: true });

      onUserAdded(response.data);
      toast.success(`Invitation sent to ${fullName}`);
      handleClose();
    } catch (err) {
      console.error('Error inviting user:', err);
      const errorMsg = err.response?.data?.msg || 'Failed to send invitation';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`add-user-modal-overlay ${isVisible ? 'open' : ''}`} onClick={handleClose}>
      <div className="add-user-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="add-user-modal-header">
          <h2>Invite user</h2>
          <button onClick={handleClose} className="add-user-close-btn">&times;</button>
        </div>
        {error && <div className="add-user-error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="add-user-form-group">
            <label htmlFor="fullName">Full name</label>
            <input type="text" id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="eg: John Doe" required />
          </div>
          <div className="add-user-form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="eg: john.doe@example.com" required />
          </div>
          <div className="add-user-form-group">
            <label htmlFor="role">Role</label>
            <select id="role" value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="" disabled>Pick one</option>
              <option>Staff</option>
              <option>Manager</option>
              <option>Admin</option>
            </select>
          </div>
          <div className="add-user-form-group">
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
          <div className="add-user-modal-actions">
            <button type="submit" className="add-user-btn-submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;
