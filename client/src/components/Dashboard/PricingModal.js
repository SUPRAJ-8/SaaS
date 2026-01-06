import React, { useState } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaGem } from 'react-icons/fa';
import { toast } from 'react-toastify';
import API_URL from '../../apiConfig';
import './PricingModal.css';

const PricingModal = ({ onClose }) => {
    const [isAnnual, setIsAnnual] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const handleSelectPlan = async (plan) => {
        setLoading(true);
        setSelectedPlan(plan);
        try {
            const response = await axios.post(
                `${API_URL}/api/auth/plan-selection`,
                { plan },
                { withCredentials: true }
            );

            toast.success(`Plan ${plan.toUpperCase()} selected successfully!`);

            // Pass the updated user back to the parent to refresh the dashboard state
            setTimeout(() => {
                onClose(response.data.user);
            }, 1000); // Small delay to let user see success toast
        } catch (error) {
            console.error('Error selecting plan:', error);
            toast.error(error.response?.data?.msg || 'Failed to select plan');
            setLoading(false);
            setSelectedPlan(null);
        }
    };

    return (
        <div className="pricing-modal-overlay">
            <div className="pricing-modal-card">
                <div className="pricing-content">
                    <div className="section-header center-text">
                        <h2>Simple, Transparent Pricing</h2>
                        <p>Start for free, upgrade when you love it. No hidden fees.</p>
                    </div>

                    <div className="pricing-toggle">
                        <span className={`toggle-label ${!isAnnual ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setIsAnnual(false)}>Monthly</span>
                        <div className={`toggle-switch ${isAnnual ? 'on' : ''}`} onClick={() => setIsAnnual(!isAnnual)}></div>
                        <span className={`toggle-label ${isAnnual ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setIsAnnual(true)}>
                            Annually <span className="discount-tag">-20%</span>
                        </span>
                    </div>

                    <div className="pricing-grid modal-grid">
                        {/* Starter */}
                        <div className="pricing-card">
                            <div className="pricing-header">
                                <h3>Starter</h3>
                                <div className="price">
                                    <span className="currency">Rs.</span>
                                    <span className="amount">0</span>
                                    <span className="period">{isAnnual ? '/yr' : '/mo'}</span>
                                </div>
                                <p>FOR STARTER</p>
                                <button
                                    className="btn-outline full-width"
                                    onClick={() => handleSelectPlan('free')}
                                    disabled={loading}
                                >
                                    {selectedPlan === 'free' ? 'Processing...' : 'Continue with Free'}
                                </button>
                            </div>
                            <div className="divider"></div>
                            <ul className="features-list">
                                <li><FaCheckCircle className="check-icon" /> 5 Products</li>
                                <li><FaCheckCircle className="check-icon" /> Basic Analytics</li>
                                <li><FaCheckCircle className="check-icon" /> Community Support</li>
                            </ul>
                        </div>

                        {/* Pro */}
                        <div className="pricing-card">
                            <div className="pricing-header">
                                <h3>Pro</h3>
                                <div className="price">
                                    <span className="currency">Rs.</span>
                                    <span className="amount">{isAnnual ? '19,190' : '1,999'}</span>
                                    <span className="period">{isAnnual ? '/yr' : '/mo'}</span>
                                </div>
                                <p>FOR GROWING BUSINESS</p>
                                <button
                                    className="btn-outline full-width"
                                    onClick={() => handleSelectPlan('pro')}
                                    disabled={loading}
                                >
                                    {selectedPlan === 'pro' ? 'Processing...' : 'Start 15-day Trial'}
                                </button>
                            </div>
                            <div className="divider"></div>
                            <ul className="features-list">
                                <li><FaCheckCircle className="check-icon" /> 50 Products</li>
                                <li><FaCheckCircle className="check-icon" /> Standard Analytics</li>
                                <li><FaCheckCircle className="check-icon" /> Email Support</li>
                                <li><FaCheckCircle className="check-icon" /> Remove Branding</li>
                            </ul>
                        </div>

                        {/* Platinum (Popular) */}
                        <div className="pricing-card popular-purple">
                            <div className="popular-badge-purple">MOST POPULAR</div>
                            <div className="pricing-header">
                                <div className="header-top">
                                    <h3>Platinum</h3>
                                    <FaGem className="gem-icon" />
                                </div>
                                <div className="price">
                                    <span className="currency">Rs.</span>
                                    <span className="amount">{isAnnual ? '33,590' : '3,499'}</span>
                                    <span className="period">{isAnnual ? '/yr' : '/mo'}</span>
                                </div>
                                <p>MOST POPULAR</p>
                                <button
                                    className="btn-primary full-width"
                                    onClick={() => handleSelectPlan('platinum')}
                                    disabled={loading}
                                >
                                    {selectedPlan === 'platinum' ? 'Processing...' : 'Start 15-day Trial'}
                                </button>
                            </div>
                            <div className="divider"></div>
                            <ul className="features-list">
                                <li><FaCheckCircle className="check-icon" /> Unlimited Products</li>
                                <li><FaCheckCircle className="check-icon" /> Advanced Marketing Tools</li>
                                <li><FaCheckCircle className="check-icon" /> Priority Support (24/7)</li>
                                <li><FaCheckCircle className="check-icon" /> Custom Domain</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PricingModal;
