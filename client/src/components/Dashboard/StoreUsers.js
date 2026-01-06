import React, { useState, useEffect } from 'react';
import { FaTrash, FaEdit, FaArrowUp, FaArrowDown, FaSearch, FaInbox, FaUsers, FaSignal, FaEnvelope, FaPlus, FaFilter, FaChevronLeft, FaChevronRight, FaPrint } from 'react-icons/fa';
import { toast } from 'react-toastify';
import AddUserModal from './AddUserModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import API_URL from '../../apiConfig';
import axios from 'axios';
import './StoreUsers.css';
import './Switch.css'; // Styles for the toggle switch

const StoreUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'descending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, type: 'single', user: null });
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/users`, { withCredentials: true });
      setUsers(response.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/current_user`, { withCredentials: true });
      setCurrentUser(response.data);
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const sortedUsers = React.useMemo(() => {
    const filteredUsers = users.filter((user) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (
        (user.name || '').toLowerCase().includes(q) ||
        (user.email || '').toLowerCase().includes(q) ||
        (user.role || '').toLowerCase().includes(q)
      );
    });

    let sortableUsers = [...filteredUsers];
    if (sortConfig.key !== null) {
      sortableUsers.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableUsers;
  }, [users, sortConfig, searchTerm]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    } else {
      direction = 'ascending';
    }
    setSortConfig({ key, direction });
  };

  const handleDelete = (user) => {
    setDeleteModal({ isOpen: true, type: 'single', user });
  };

  const handleBulkDelete = () => {
    setDeleteModal({ isOpen: true, type: 'bulk', user: null });
  };

  const confirmDelete = async () => {
    try {
      if (deleteModal.type === 'single') {
        const user = deleteModal.user;
        if (user) {
          await axios.delete(`${API_URL}/api/users/${user._id}`, { withCredentials: true });
          setUsers(users.filter((u) => u._id !== user._id));
          toast.success(`User ${user.name} removed`);
        }
      } else if (deleteModal.type === 'bulk') {
        await axios.post(`${API_URL}/api/users/bulk-delete`, { ids: selectedUsers }, { withCredentials: true });
        setUsers(users.filter((u) => !selectedUsers.includes(u._id)));
        toast.success(`${selectedUsers.length} users removed`);
        setSelectedUsers([]);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
    setDeleteModal({ isOpen: false, type: 'single', user: null });
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      // Don't select the current user in bulk actions to prevent accidental deletion
      const allUserIds = sortedUsers
        .filter(u => !(currentUser && (currentUser._id === u._id || currentUser.id === u._id)))
        .map(u => u._id);
      setSelectedUsers(allUserIds);
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectOne = (e, id) => {
    e.stopPropagation();
    if (e.target.checked) {
      setSelectedUsers(prev => [...prev, id]);
    } else {
      setSelectedUsers(prev => prev.filter(uid => uid !== id));
    }
  };

  const handleBulkUpdateStatus = async (status) => {
    try {
      await axios.post(`${API_URL}/api/users/bulk-status`, { ids: selectedUsers, status }, { withCredentials: true });
      const updatedUsers = users.map(user =>
        selectedUsers.includes(user._id) ? { ...user, status } : user
      );
      setUsers(updatedUsers);
      setSelectedUsers([]);
      toast.success(`Updated status for ${selectedUsers.length} users`);
    } catch (error) {
      console.error('Error bulk updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleUserUpdate = async (userId, field, value) => {
    try {
      await axios.put(`${API_URL}/api/users/${userId}`, { [field]: value }, { withCredentials: true });
      const updatedUsers = users.map((user) => {
        if (user._id === userId) {
          return { ...user, [field]: value };
        }
        return user;
      });
      setUsers(updatedUsers);
      toast.success(`Updated ${field.replace('emailNotification', 'notification setting')}`);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleUserAdded = (newUser) => {
    setUsers((prevUsers) => [newUser, ...prevUsers]);
  };

  const formatDate = (dateString) => {
    const options = {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    return new Date(dateString).toLocaleString('en-US', options).replace(',', '');
  };

  // Metrics calculations
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const pendingInvites = users.filter(u => u.status === 'Pending').length;

  return (
    <div className="store-users-page">
      <div className="users-page-header">
        <div className="header-title-section">
          <h1 className="page-title">Store Users</h1>
          <p className="page-description">Manage access, roles, and permissions for your team.</p>
        </div>
        <div className="header-actions">
          <button className="export-btn">
            <FaPrint />
            <span>Print</span>
          </button>

          <button onClick={() => setIsModalOpen(true)} className="add-user-btn">
            <FaPlus />
            <span>Invite User</span>
          </button>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="category-stats-row">
        <div className="category-stat-card">
          <div className="category-stat-content">
            <h3>TOTAL USERS</h3>
            <p className="category-stat-value">{totalUsers}</p>
          </div>
          <div className="category-stat-icon-wrapper blue">
            <FaUsers />
          </div>
        </div>
        <div className="category-stat-card">
          <div className="category-stat-content">
            <h3>ACTIVE NOW</h3>
            <p className="category-stat-value">{activeUsers}</p>
          </div>
          <div className="category-stat-icon-wrapper green">
            <FaSignal />
          </div>
        </div>
        <div className="category-stat-card">
          <div className="category-stat-content">
            <h3>PENDING INVITES</h3>
            <p className="category-stat-value">{pendingInvites}</p>
          </div>
          <div className="category-stat-icon-wrapper purple">
            <FaEnvelope />
          </div>
        </div>

        {/* Mobile-only Invite Button positioned in grid */}
        <button onClick={() => setIsModalOpen(true)} className="add-user-btn mobile-stats-invite-btn">
          <FaPlus />
          <span>Invite User</span>
        </button>
      </div>

      <div className="users-toolbar">
        <div className="toolbar-right-section">
          <div className="search-wrapper-compact">
            <FaSearch className="search-icon-grey" />
            <input
              type="text"
              placeholder="Search team members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input-compact"
            />
          </div>
        </div>
      </div>

      {/* Conditional Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-actions-left">
            <span className="bulk-count">{selectedUsers.length} selected</span>
            <button className="bulk-action-btn clear-btn" onClick={() => setSelectedUsers([])}>Deselect All</button>
          </div>
          <div className="bulk-actions-right">
            <button className="bulk-action-btn" onClick={() => handleBulkUpdateStatus('Active')}>Mark Active</button>
            <button className="bulk-action-btn" onClick={() => handleBulkUpdateStatus('Inactive')}>Mark Inactive</button>
            <div className="bulk-divider" style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.3)' }}></div>
            <button className="bulk-action-btn delete-btn" onClick={handleBulkDelete}>Delete</button>
          </div>
        </div>
      )}

      <div className="users-table-container">
        <div className="users-table-scrollable">
          <table className="users-table">
            <thead>
              <tr>
                <th className="checkbox-cell">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={
                      sortedUsers.length > 0 &&
                      sortedUsers
                        .filter(u => !(currentUser && (currentUser._id === u._id || currentUser.id === u._id)))
                        .every(u => selectedUsers.includes(u._id))
                    }
                  />
                </th>
                <th>#</th>
                <th onClick={() => requestSort('name')} className="sortable-header">
                  Name
                  <span className="sort-icon-group">
                    <FaArrowUp
                      className={`sort-icon ${sortConfig.key === 'name' && sortConfig.direction === 'ascending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
                    />
                    <FaArrowDown
                      className={`sort-icon ${sortConfig.key === 'name' && sortConfig.direction === 'descending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
                    />
                  </span>
                </th>
                <th>Email Notification</th>
                <th>Role</th>
                <th>Status</th>
                <th onClick={() => requestSort('createdAt')} className="sortable-header">
                  Joined on
                  <span className="sort-icon-group">
                    <FaArrowUp
                      className={`sort-icon ${sortConfig.key === 'createdAt' && sortConfig.direction === 'ascending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
                    />
                    <FaArrowDown
                      className={`sort-icon ${sortConfig.key === 'createdAt' && sortConfig.direction === 'descending' ? 'active' : (sortConfig.key !== null ? 'inactive' : '')}`}
                    />
                  </span>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: '40px', textAlign: 'center' }}>
                    <div style={{ color: '#4f46e5' }}>Loading team members...</div>
                  </td>
                </tr>
              ) : sortedUsers.length > 0 ? (
                sortedUsers.map((user, index) => {
                  const isSelf = currentUser && (currentUser._id === user._id || currentUser.id === user._id);
                  return (
                    <tr key={user._id} className={selectedUsers.includes(user._id) ? 'row-selected' : ''}>
                      <td className="checkbox-cell">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user._id)}
                          onChange={(e) => handleSelectOne(e, user._id)}
                          onClick={(e) => e.stopPropagation()}
                          disabled={isSelf}
                        />
                      </td>
                      <td>{index + 1}</td>
                      <td>
                        <div className="user-name-cell">
                          <div className="user-avatar" style={{ backgroundColor: user.gender === 'female' ? '#fdf2f8' : '#eff6ff', color: user.gender === 'female' ? '#db2777' : '#2563eb' }}>
                            {user.avatar ? <img src={user.avatar} alt={user.name} className="user-avatar" /> : (user.name ? user.name.charAt(0).toUpperCase() : 'U')}
                          </div>
                          <div>
                            <div className="user-name">
                              {user.name}
                              {isSelf && <span className="admin-badge-self">You</span>}
                            </div>
                            <div className="user-email">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <label className="switch">
                          <input
                            type="checkbox"
                            checked={user.emailNotification}
                            onChange={(e) => handleUserUpdate(user._id, 'emailNotification', e.target.checked)}
                          />
                          <span className="slider round"></span>
                        </label>
                      </td>
                      <td>
                        <select
                          className={`role-select role-${user.role ? user.role.toLowerCase() : 'admin'}`}
                          value={user.role || 'Admin'}
                          disabled={isSelf}
                          onChange={(e) => {
                            const select = e.target;
                            select.className = `role-select role-${select.value.toLowerCase()}`;
                            handleUserUpdate(user._id, 'role', e.target.value);
                          }}
                        >
                          <option>Admin</option>
                          <option>Manager</option>
                          <option>Staff</option>
                        </select>
                      </td>
                      <td>
                        {user.status === 'Pending' ? (
                          <span className="invitation-pending-badge">
                            Invitation Pending
                          </span>
                        ) : (
                          <select
                            className={`status-select status-${user.status ? user.status.toLowerCase() : 'active'}`}
                            value={user.status || 'Active'}
                            disabled={isSelf}
                            onChange={(e) => {
                              const select = e.target;
                              select.className = `status-select status-${select.value.toLowerCase()}`;
                              handleUserUpdate(user._id, 'status', e.target.value);
                            }}
                          >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        )}
                      </td>
                      <td>{formatDate(user.createdAt)}</td>
                      <td className="actions-cell">
                        <div className="actions-wrapper">
                          <button className="action-btn edit-btn" onClick={(e) => { e.stopPropagation(); toast.info("Edit feature coming soon"); }} title="Edit user">
                            <FaEdit />
                          </button>
                          <button
                            className="action-btn delete-btn"
                            onClick={() => handleDelete(user)}
                            title={isSelf ? "Cannot delete yourself" : "Delete user"}
                            disabled={isSelf}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="no-data-cell">
                    <div className="no-data-content">
                      <FaInbox className="no-data-icon" />
                      <span>No members found</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="table-footer">
          <div className="showing-results">
            Showing <span className="text-bold">1</span> to <span className="text-bold">{sortedUsers.length}</span> of <span className="text-bold">{sortedUsers.length}</span> results
          </div>
          <div className="pagination-controls">
            <button className="pagination-btn disabled">
              <FaChevronLeft />
            </button>
            <button className="pagination-btn active">1</button>
            <button className="pagination-btn">
              <FaChevronRight />
            </button>
          </div>
        </div>
      </div>
      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUserAdded={handleUserAdded} />
      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={confirmDelete}
        userName={deleteModal.user?.name || (deleteModal.type === 'bulk' ? `${selectedUsers.length} users` : '')}
      />
    </div>
  );
};

export default StoreUsers;
