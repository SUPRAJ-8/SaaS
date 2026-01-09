import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
    FaBell, FaShoppingBag, FaUserPlus, FaExclamationTriangle, FaCheckCircle,
    FaTrash, FaSearch, FaSyncAlt
} from 'react-icons/fa';
import { LuCheckCheck } from 'react-icons/lu';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';
import API_URL from '../../apiConfig';
import './Notifications.css';

const Notifications = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [notifications, setNotifications] = useState([]);

    const fetchNotifications = async (isSync = false) => {
        try {
            setLoading(true);
            const endpoint = isSync ? '/sync' : '';
            const res = await axios[isSync ? 'post' : 'get'](`${API_URL}/api/notifications${endpoint}`);
            if (Array.isArray(res.data)) {
                setNotifications(res.data);
            } else {
                console.error('Expected array of notifications, got:', res.data);
                setNotifications([]);
            }
            setLoading(false);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await axios.patch(`${API_URL}/api/notifications/${id}`);
            setNotifications(notifications.map(n => n._id === id ? { ...n, status: 'read' } : n));
            toast.info('Marked as read', {
                position: 'bottom-right',
                autoClose: 1500
            });
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.post(`${API_URL}/api/notifications/mark-all-read`);
            setNotifications(notifications.map(n => ({ ...n, status: 'read' })));
            toast.success('All notifications marked as read', {
                position: 'bottom-right',
                autoClose: 2000
            });
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await axios.delete(`${API_URL}/api/notifications/${id}`);
            setNotifications(notifications.filter(n => n._id !== id));
            toast.success('Notification deleted', {
                position: 'bottom-right',
                autoClose: 2000
            });
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Failed to delete notification');
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'order': return <FaShoppingBag />;
            case 'payment': return <FaCheckCircle />;
            case 'alert': return <FaExclamationTriangle />;
            case 'user': return <FaUserPlus />;
            default: return <FaBell />;
        }
    };

    const filteredNotifications = notifications.filter(n => {
        const matchesFilter = filter === 'All' ? true :
            filter === 'Unread' ? n.status === 'unread' :
                n.type.toLowerCase() === filter.toLowerCase() || (filter === 'Payment' && n.type === 'payment');

        const q = searchTerm.toLowerCase();
        const matchesSearch = n.title.toLowerCase().includes(q) ||
            n.message.toLowerCase().includes(q);

        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="notifications-loading-container">
                <div className="notifications-loader"></div>
                <p>Loading your notifications...</p>
            </div>
        );
    }

    return (
        <div className="notifications-page-premium">
            <div className="notifications-header-premium">
                <div className="header-left">
                    <h1 className="page-title">Notifications</h1>
                </div>
            </div>

            <div className="notifications-toolbar">
                <div className="filter-pills">
                    {['All', 'Unread', 'Order', 'Payment', 'User', 'Alert'].map(f => (
                        <button
                            key={f}
                            className={`filter-pill ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {f}
                        </button>
                    ))}
                </div>
                <div className="header-right">
                    <button className="sync-btn" onClick={() => fetchNotifications(true)} title="Sync Notifications">
                        <FaSyncAlt />
                    </button>
                    <button className="mark-read-btn" onClick={markAllAsRead}>
                        <LuCheckCheck className="check-icon" />
                        <span>Mark all read</span>
                    </button>
                    <div className="notification-search">
                        <FaSearch />
                        <input
                            type="text"
                            placeholder="Search notifications..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="notifications-list-container">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map(notification => (
                        <div
                            key={notification._id}
                            className={`notification-item-premium ${notification.status}`}
                        >
                            <div className={`notification-icon-box ${notification.type}`}>
                                {getIcon(notification.type)}
                            </div>
                            <div className="notification-content-box">
                                <div className="notification-top-row">
                                    <h4 className="notification-title">{notification.title}</h4>
                                    <span className="notification-time">
                                        {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <p className="notification-message">{notification.message}</p>
                                <div className="notification-actions">
                                    {notification.status === 'unread' && (
                                        <button className="action-text-btn" onClick={() => markAsRead(notification._id)}>
                                            Mark as read
                                        </button>
                                    )}
                                    <button
                                        className="action-text-btn"
                                        onClick={() => navigate(notification.targetLink)}
                                    >
                                        View Details
                                    </button>
                                    <button
                                        className="delete-icon-btn"
                                        onClick={() => deleteNotification(notification._id)}
                                        title="Delete"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="no-notifications-box">
                        <FaBell className="empty-icon" />
                        <h3>No notifications found</h3>
                        <p>We'll notify you when something important happens.</p>
                        <button className="sync-data-btn" onClick={() => fetchNotifications(true)}>
                            Sync Recent Activity
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
