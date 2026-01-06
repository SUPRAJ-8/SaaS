import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaGoogle, FaArrowRight, FaEye, FaEyeSlash } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import API_URL from '../apiConfig';
import './LoginPage.css';

const SignupPage = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: ''
    });

    const handleGoogleSignup = () => {
        window.location.href = `${API_URL}/auth/google`;
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/api/auth/register`, formData, { withCredentials: true });
            if (response.data.success) {
                toast.success('Store created successfully! Redirecting...');

                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 2000);
            }
        } catch (error) {
            console.error('Signup error:', error);
            toast.error(error.response?.data?.msg || 'Failed to create store');
        } finally {
            setLoading(false);
        }
    };

    const LogoIcon = () => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    return (
        <div className="premium-login-page">
            <div className="login-container-card">
                <div className="login-side-decoration">
                    <div className="brand-section">
                        <div className="brand-icon-wrapper">
                            <LogoIcon />
                        </div>
                        <span>WHCH SaaS</span>
                    </div>

                    <div className="decoration-content">
                        <h1>Empowering Nepal's E-commerce Revolution.</h1>
                        <p>Join thousands of entrepreneurs who are building their legacy with our no-code CMS platform.</p>
                    </div>

                    <div className="floating-shapes">
                        <div className="shape shape-1"></div>
                    </div>
                </div>

                <div className="login-side-form">
                    <div className="login-form-wrapper">
                        <div className="login-form-header">
                            <h2>Get Started</h2>
                            <p>Join thousands of entrepreneurs today</p>
                        </div>

                        <form className="auth-form" onSubmit={handleSubmit}>
                            <div className="premium-input-group">
                                <label>Full Name</label>
                                <div className="input-with-icon">
                                    <input
                                        name="fullName"
                                        type="text"
                                        placeholder="Full Name"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="premium-input-group">
                                <label>Email Address</label>
                                <div className="input-with-icon">
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Email Address"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="premium-input-group">
                                <label>Password</label>
                                <div className="input-with-icon">
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </button>
                                </div>
                            </div>

                            <button type="submit" className="premium-submit-btn" disabled={loading}>
                                {loading ? 'Creating Store...' : 'Create My Store'} <FaArrowRight className="btn-arrow" />
                            </button>
                        </form>

                        <div className="form-divider">
                            <span>or sign up with</span>
                        </div>

                        <button onClick={handleGoogleSignup} className="google-auth-btn">
                            <FaGoogle className="google-icon" style={{ color: '#4285F4' }} />
                            <span>Continue with Google</span>
                        </button>

                        <div className="form-footer">
                            <p>Already have an account? <Link to="/login">Sign In</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignupPage;
