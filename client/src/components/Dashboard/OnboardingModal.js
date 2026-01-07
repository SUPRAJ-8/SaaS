import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FaStore, FaPhoneAlt, FaChevronDown, FaArrowRight } from 'react-icons/fa';
import API_URL from '../../apiConfig';
import './OnboardingModal.css';

const OnboardingModal = ({ user, client, onComplete }) => {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        storeName: client?.name || '',
        storeType: client?.storeType || '',
        phoneNumber: user?.phoneNumber || ''
    });

    // Debug
    console.log('OnboardingModal Render. User:', user);
    console.log('User.isOnboarded:', user?.isOnboarded);

    // Populate initial state if props change (though typically they are static)
    React.useEffect(() => {
        if (client) {
            setFormData(prev => ({
                ...prev,
                storeName: client.name !== 'Untitled Store' ? client.name : '',
                storeType: client.storeType || ''
            }));
        }
        if (user) {
            setFormData(prev => ({
                ...prev,
                phoneNumber: user.phoneNumber || ''
            }));
        }
    }, [user, client]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(
                `${API_URL}/api/auth/onboarding`,
                formData,
                { withCredentials: true }
            );

            if (response.data.success) {
                toast.success('Store setup completed!');
                onComplete(response.data.user, response.data.client);
            }
        } catch (error) {
            console.error('Onboarding error:', error);
            toast.error(error.response?.data?.msg || 'Failed to save details');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="onboarding-modal-overlay">
            <div className="onboarding-modal-card">
                <div className="onboarding-header-icon">
                    <div className="icon-circle">
                        <FaStore />
                    </div>
                </div>

                <div className="onboarding-content">
                    <h2>Welcome to your Dashboard</h2>
                    <p className="onboarding-subtitle">
                        Let's get your store set up. We need a few details to customize your experience.
                    </p>

                    <form onSubmit={handleSubmit} className="onboarding-form">
                        <div className="form-group">
                            <label>Store Name</label>
                            <div className="input-icon-wrapper">
                                <input
                                    type="text"
                                    name="storeName"
                                    placeholder="e.g. Acme Corp"
                                    value={formData.storeName}
                                    onChange={handleInputChange}
                                    required
                                />
                                <FaStore className="field-icon right" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Store Type</label>
                            <div className="input-icon-wrapper select-wrapper">
                                <select
                                    name="storeType"
                                    value={formData.storeType}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="" disabled>Select business type...</option>
                                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                                    <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                                    <option value="Home & Decor">Home & Decor</option>
                                    <option value="Health & Beauty">Health & Beauty</option>
                                    <option value="Food & Beverage">Food & Beverage</option>
                                    <option value="Books & Stationery">Books & Stationery</option>
                                    <option value="Other">Other</option>
                                </select>
                                <FaChevronDown className="field-icon right arrow" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Phone Number</label>
                            <div className="input-icon-wrapper">
                                <input
                                    type="text"
                                    name="phoneNumber"
                                    placeholder="e.g. +1 (555) 000-0000"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    required
                                />
                                <FaPhoneAlt className="field-icon right" />
                            </div>
                        </div>

                        <button type="submit" className={`onboarding-submit-btn ${loading ? 'btn-loading' : ''}`} disabled={loading}>
                            {loading ? 'Saving...' : 'Save and Continue'} <FaArrowRight style={{ marginLeft: '8px' }} />
                        </button>
                    </form>

                    <div className="onboarding-footer">
                        <button onClick={(e) => { e.preventDefault(); toast.info('Support contact feature coming soon!'); }} className="help-link" style={{ background: 'none', border: 'none', padding: 0, font: 'inherit', cursor: 'pointer' }}>
                            <span className="help-icon">?</span> Need help? Contact support
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnboardingModal;
