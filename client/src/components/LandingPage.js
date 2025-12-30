import React from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
    return (
        <div className="landing-container">
            <nav className="landing-nav">
                <div className="logo">WHCH SaaS</div>
                <div className="nav-links">
                    <a href="https://app.nepostore.xyz/dashboard" className="login-link">Sign In</a>
                    <a href="https://app.nepostore.xyz/dashboard" className="btn-primary-landing">Get Started</a>
                </div>
            </nav>

            <header className="hero-landing">
                <h1>Create Your Own E-commerce Store in Minutes</h1>
                <p>The all-in-one CMS designed for Nepal. Simple, fast, and beautiful.</p>
                <div className="hero-btns">
                    <a href="https://app.nepostore.xyz/dashboard" className="btn-main">Create Your Store</a>
                    <button className="btn-secondary-landing">Learn More</button>
                </div>
            </header>

            <section className="features-landing">
                <div className="feature-card">
                    <h3>No Code Required</h3>
                    <p>Drag and drop builder to design your site.</p>
                </div>
                <div className="feature-card">
                    <h3>Local Support</h3>
                    <p>Customized for the Nepali market and currency.</p>
                </div>
                <div className="feature-card">
                    <h3>Fast & Secure</h3>
                    <p>Hosted on global edge networks for maximum speed.</p>
                </div>
            </section>

            <footer className="landing-footer">
                <p>&copy; 2025 WHCH. All rights reserved.</p>
            </footer>
        </div>
    );
};

export default LandingPage;
