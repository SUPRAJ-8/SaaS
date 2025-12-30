import React, { useState, useEffect } from 'react';
import { FaTrash, FaArrowUp, FaArrowDown, FaSearch, FaInbox } from 'react-icons/fa';
import { toast } from 'react-toastify';
import AddUserModal from './AddUserModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import './StoreUsers.css';
import './Switch.css'; // Styles for the toggle switch

const StoreUsers = () => {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [userToDelete, setUserToDelete] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      const mockUsers = [
      {
        _id: '1',
        name: 'John Doe',
        gender: 'male',
        avatar: 'https://www.w3schools.com/howto/img_avatar.png',
        email: 'john.doe@example.com',
        role: 'Admin',
        status: 'Active',
        emailNotification: true,
        createdAt: '2025-12-09T14:00:00.000Z',
      },
      {
        _id: '2',
        name: 'Jane Smith',
        gender: 'female',
        avatar: 'https://www.w3schools.com/howto/img_avatar2.png',
        email: 'jane.smith@example.com',
        role: 'Manager',
        status: 'Active',
        emailNotification: false,
        createdAt: '2025-12-08T11:30:00.000Z',
      },
      {
        _id: '3',
        name: 'Peter Jones',
        gender: 'male',
        avatar: 'https://www.w3schools.com/howto/img_avatar.png',
        email: 'peter.jones@example.com',
        role: 'Staff',
        status: 'Inactive',
        emailNotification: true,
        createdAt: '2025-12-07T09:00:00.000Z',
      },
      ];
      setUsers(mockUsers);
    }
  }, []);

  // Save users to localStorage whenever the list changes
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem('users', JSON.stringify(users));
    }
  }, [users]);

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
    setUserToDelete(user);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setUsers(users.filter((user) => user._id !== userToDelete._id));
      toast.success(`User ${userToDelete.name} deleted successfully`);
      setUserToDelete(null); // Close modal and clear user
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allUserIds = sortedUsers.map(u => u._id);
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

  const handleUserUpdate = (userId, field, value) => {
    const updatedUsers = users.map((user) => {
      if (user._id === userId) {
        return { ...user, [field]: value };
      }
      return user;
    });
    setUsers(updatedUsers);
    toast.success(`User's ${field.replace('emailNotification', 'notification setting')} updated successfully`);
  };

  const handleUserAdded = (newUser) => {
    const avatar = newUser.gender === 'male' 
      ? 'https://www.w3schools.com/howto/img_avatar.png' 
      : 'https://www.w3schools.com/howto/img_avatar2.png';

    const userWithDefaults = {
      ...newUser,
      avatar,
      emailNotification: true,
      status: 'Active',
      createdAt: new Date().toISOString(),
    };
    setUsers((prevUsers) => [userWithDefaults, ...prevUsers]);
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

  return (
    <div className="store-users-page">
      <div className="page-header">
        <div className="page-header-left">
          <h2 className="page-title">Store Users</h2>
          <div className="store-users-search">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="add-user-btn">Invite user</button>
      </div>
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th><input type="checkbox" onChange={handleSelectAll} checked={selectedUsers.length === sortedUsers.length && sortedUsers.length > 0} /></th>
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
            {sortedUsers.length > 0 ? (
              sortedUsers.map((user, index) => (
                <tr key={user._id} className={selectedUsers.includes(user._id) ? 'row-selected' : ''}>
                  <td><input type="checkbox" checked={selectedUsers.includes(user._id)} onChange={(e) => handleSelectOne(e, user._id)} onClick={(e) => e.stopPropagation()} /></td>
                  <td>{index + 1}</td>
                  <td>
                    <div className="user-name-cell">
                      <img src={user.avatar} alt={user.name} className="user-avatar" />
                      <div>
                        <div className="user-name">{user.name}</div>
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
                      className={`role-select role-${user.role.toLowerCase()}`}
                      value={user.role}
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
                    <select
                      className={`status-select status-${user.status.toLowerCase()}`}
                      value={user.status}
                      onChange={(e) => {
                        const select = e.target;
                        select.className = `status-select status-${select.value.toLowerCase()}`;
                        handleUserUpdate(user._id, 'status', e.target.value);
                      }}
                    >
                      <option>Active</option>
                      <option>Inactive</option>
                    </select>
                  </td>
                  <td>{formatDate(user.createdAt)}</td>
                  <td className="actions-cell">
                    <button className="action-btn delete-btn" onClick={() => handleDelete(user)}>
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data-cell">
                  <div className="no-data-content">
                    <FaInbox className="no-data-icon" />
                    <span>No data available</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <AddUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onUserAdded={handleUserAdded} />
      <DeleteConfirmModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={confirmDelete}
        userName={userToDelete?.name}
      />
    </div>
  );
};

export default StoreUsers;
