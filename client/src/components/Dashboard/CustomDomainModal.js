import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    FaChevronLeft, FaChevronRight, FaCopy, FaCheck,
    FaInfoCircle, FaCheckCircle, FaExclamationCircle,
    FaSpinner, FaEdit, FaExternalLinkAlt
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import API_URL from '../../apiConfig';
import './CustomDomainModal.css';

const CustomDomainModal = ({ isOpen, onClose, currentDomain, initialStatus, onUpdate }) => {
    const [step, setStep] = useState(1);
    const [domain, setDomain] = useState(currentDomain || '');
    const [status, setStatus] = useState(initialStatus || 'none');
    const [loading, setLoading] = useState(false);
    const [copiedField, setCopiedField] = useState(null);

    useEffect(() => {
        if (isOpen) {
            setDomain(currentDomain || '');
            setStatus(initialStatus || 'none');
            // If already verified or pending, go to step 3 or 2
            if (currentDomain) {
                setStep(2);
            } else {
                setStep(1);
            }
        }
    }, [isOpen, currentDomain, initialStatus]);

    const handleCopy = (text, field) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        setTimeout(() => setCopiedField(null), 2000);
        toast.info('Copied to clipboard');
    };

    const handleSaveDomain = async () => {
        if (!domain) {
            toast.error('Please enter a domain');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.put(`${API_URL}/api/store-settings`,
                { customDomain: domain },
                { withCredentials: true }
            );
            setStatus('pending');
            onUpdate(domain, 'pending');
            setStep(2);
        } catch (error) {
            console.error('Error saving domain:', error);
            toast.error('Failed to save domain');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async () => {
        setLoading(true);
        try {
            // Re-using the logic from the super admin verification route if available, 
            // or just checking if status changed. 
            // For now, let's assume we call a verification endpoint.
            const res = await axios.post(`${API_URL}/api/store-settings/verify-domain`,
                {},
                { withCredentials: true }
            );

            if (res.data.success) {
                setStatus('verified');
                onUpdate(domain, 'verified');
                setStep(3);
                toast.success('Domain verified successfully!');
            } else {
                setStatus('error');
                onUpdate(domain, 'error');
                toast.error(res.data.msg || 'Verification failed. Please check your DNS records.');
            }
        } catch (error) {
            console.error('Error verifying domain:', error);
            toast.error('Verification failed. DNS records not found.');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveDomain = async () => {
        if (!window.confirm('Are you sure you want to remove this custom domain?')) return;
        setLoading(true);
        try {
            await axios.put(`${API_URL}/api/store-settings`,
                { customDomain: '' },
                { withCredentials: true }
            );
            setDomain('');
            setStatus('none');
            onUpdate('', 'none');
            setStep(1);
            toast.success('Domain removed');
        } catch (error) {
            console.error('Error removing domain:', error);
            toast.error('Failed to remove domain');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="custom-domain-modal-overlay">
            <div className="custom-domain-modal-content">
                <button className="close-x" onClick={onClose}>&times;</button>

                <div className="modal-header-section">
                    <h2>Custom Domain</h2>
                    <p>Connect your own domain to your shop</p>
                </div>

                <div className="domain-stepper">
                    <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
                        <div className="step-circle">{step > 1 ? <FaCheck /> : 1}</div>
                        <span className="step-label">Enter Your Domain</span>
                    </div>
                    <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
                        <div className="step-circle">{step > 2 ? <FaCheck /> : 2}</div>
                        <span className="step-label">Point Your CNAME</span>
                    </div>
                    <div className={`step-item ${step >= 3 ? 'active' : ''}`}>
                        <div className="step-circle">3</div>
                        <span className="step-label">Verify / Remove</span>
                    </div>
                    <div className="step-line">
                        <div className="step-line-progress" style={{ width: `${(step - 1) * 50}%` }}></div>
                    </div>
                </div>

                <div className="step-content-box">
                    {step === 1 && (
                        <div className="step-1">
                            <div className="step-input-group">
                                <label>Your Custom Domain</label>
                                <input
                                    type="text"
                                    placeholder="eg: myshop.com"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                />
                                <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '10px' }}>
                                    Enter the domain you've purchased from a provider like GoDaddy or Namecheap.
                                </p>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="step-2">
                            <div className="step-sub-header">
                                <div className="sub-header-circle">2</div>
                                <div>
                                    <h3>Point Your CNAME</h3>
                                    <p>Add these DNS records in your domain provider</p>
                                </div>
                                {status === 'verified' && (
                                    <span className="status-pill pill-verified" style={{ marginLeft: 'auto' }}>CONNECTED</span>
                                )}
                            </div>

                            <div className="dns-alert">
                                <FaInfoCircle className="alert-icon" />
                                <div className="alert-text">
                                    <h4>DNS Configuration Required</h4>
                                    <p>Add the following CNAME record in your domain's DNS settings. This may take a few minutes to propagate.</p>
                                </div>
                            </div>

                            <div className="dns-records-grid">
                                <div className="dns-record-header">Main CNAME Record</div>
                                <div className="record-row">
                                    <div className="record-field">
                                        <label>Type</label>
                                        <div className="copy-input-wrapper">
                                            <input type="text" value="CNAME" readOnly />
                                            <button className="copy-btn" onClick={() => handleCopy('CNAME', 'type1')}>
                                                {copiedField === 'type1' ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="record-field">
                                        <label>Name</label>
                                        <div className="copy-input-wrapper">
                                            <input type="text" value="@" readOnly />
                                            <button className="copy-btn" onClick={() => handleCopy('@', 'name1')}>
                                                {copiedField === 'name1' ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="record-field">
                                        <label>Value</label>
                                        <div className="copy-input-wrapper">
                                            <input type="text" value="nepostore.xyz" readOnly />
                                            <button className="copy-btn" onClick={() => handleCopy('nepostore.xyz', 'value1')}>
                                                {copiedField === 'value1' ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="record-row" style={{ marginTop: '1rem' }}>
                                    <div className="record-field">
                                        <label>Type</label>
                                        <div className="copy-input-wrapper">
                                            <input type="text" value="CNAME" readOnly />
                                            <button className="copy-btn" onClick={() => handleCopy('CNAME', 'type2')}>
                                                {copiedField === 'type2' ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="record-field">
                                        <label>Name</label>
                                        <div className="copy-input-wrapper">
                                            <input type="text" value="www" readOnly />
                                            <button className="copy-btn" onClick={() => handleCopy('www', 'name2')}>
                                                {copiedField === 'name2' ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="record-field">
                                        <label>Value</label>
                                        <div className="copy-input-wrapper">
                                            <input type="text" value="nepostore.xyz" readOnly />
                                            <button className="copy-btn" onClick={() => handleCopy('nepostore.xyz', 'value2')}>
                                                {copiedField === 'value2' ? <FaCheck style={{ color: '#10b981' }} /> : <FaCopy />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="note-box">
                                <FaEdit className="note-icon" />
                                <div className="note-text">
                                    <h4>Note</h4>
                                    <p>Please disable the proxy mode if you are using Cloudflare DNS. Contact your domain provider's support if you need help adding these DNS records. Common providers: GoDaddy, Namecheap, Cloudflare, Google Domains.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="step-3">
                            <div className="verification-status-box">
                                {status === 'verified' ? (
                                    <>
                                        <FaCheckCircle className="status-icon-big verified" />
                                        <h3>Your Domain is Connected!</h3>
                                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>
                                            Shop is active at: <a href={`https://${domain}`} target="_blank" rel="noreferrer" style={{ color: '#3b82f6', fontWeight: 600 }}>{domain} <FaExternalLinkAlt size={12} /></a>
                                        </p>
                                    </>
                                ) : status === 'error' ? (
                                    <>
                                        <FaExclamationCircle className="status-icon-big error" />
                                        <h3>Verification Failed</h3>
                                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>We couldn't detect the correct DNS records yet. Please try again in a few minutes.</p>
                                    </>
                                ) : (
                                    <>
                                        <FaSpinner className="status-icon-big pending spin" />
                                        <h3>Pending Verification</h3>
                                        <p style={{ color: '#64748b', marginTop: '0.5rem' }}>Your domain settings are saved. Click verify below once you've updated your DNS records.</p>
                                    </>
                                )}

                                <div style={{ marginTop: '2.5rem', borderTop: '1px solid #e2e8f0', paddingTop: '2rem' }}>
                                    <button
                                        onClick={handleRemoveDomain}
                                        style={{ background: 'none', border: '1px solid #ef4444', color: '#ef4444', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        Remove Custom Domain
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="btn-back" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
                        <FaChevronLeft /> Back
                    </button>

                    {step === 1 && (
                        <button className="btn-next" onClick={handleSaveDomain} disabled={loading || !domain}>
                            {loading ? <FaSpinner className="spin" /> : 'Continue'} <FaChevronRight />
                        </button>
                    )}

                    {step === 2 && (
                        <button className="btn-verify" onClick={handleVerify} disabled={loading}>
                            {loading ? <FaSpinner className="spin" /> : 'Verify Domain'} <FaChevronRight />
                        </button>
                    )}

                    {step === 3 && status !== 'verified' && (
                        <button className="btn-verify" onClick={handleVerify} disabled={loading}>
                            {loading ? <FaSpinner className="spin" /> : 'Try Verify Again'} <FaChevronRight />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CustomDomainModal;
