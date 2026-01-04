import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaShoppingBag,
    FaArrowRight,
    FaWhatsapp,
    FaBars,
    FaTimes,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaQuestionCircle,
    FaAt,
    FaHeadset,
    FaCheckCircle
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import API_URL from '../apiConfig';
import './ContactPage.css';

const ContactPage = () => {
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [whatsAppNumber, setWhatsAppNumber] = useState('');
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        subject: '',
        message: ''
    });

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        window.scrollTo(0, 0);

        // Fetch WhatsApp number
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/public-settings`);
                const whatsAppNum = response.data?.whatsAppNumber;
                if (whatsAppNum) {
                    setWhatsAppNumber(whatsAppNum);
                }
            } catch (error) {
                console.error('Failed to load settings:', error);
            }
        };

        fetchSettings();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            await axios.post(`${API_URL}/api/contact`, formData);

            toast.success('Thank you for contacting us! Your message has been sent to our team.', {
                position: "top-right",
                autoClose: 5000,
            });

            // Clear form
            setFormData({
                fullName: '',
                email: '',
                subject: '',
                message: ''
            });
        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Failed to send message. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="contact-layout">
            {/* Navigation (Reused from LandingPage) */}
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-container">
                    <Link to="/" className="nav-logo" style={{ textDecoration: 'none' }}>
                        <div className="logo-box">
                            <FaShoppingBag />
                        </div>
                        <span>CreatorFlow</span>
                    </Link>
                    <div className={`nav-menu ${isMenuOpen ? 'mobile-active' : ''}`}>
                        <Link to="/#features" onClick={() => setIsMenuOpen(false)}>Features</Link>
                        <Link to="/#how-it-works" onClick={() => setIsMenuOpen(false)}>How it Works</Link>
                        <Link to="/#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</Link>
                        <Link to="/#faq" onClick={() => setIsMenuOpen(false)}>FAQ</Link>
                        <div className="nav-menu-auth-mobile">
                            <Link to="/login" className="btn-text" onClick={() => setIsMenuOpen(false)}>Log In</Link>
                            <Link to="/signup" className="btn-primary" onClick={() => setIsMenuOpen(false)}>Register Now</Link>
                        </div>
                    </div>
                    <div className="nav-auth">
                        <Link to="/login" className="btn-text desktop-only">Log In</Link>
                        <Link to="/signup" className="btn-primary desktop-only">Register Now <FaArrowRight className="btn-arrow" /></Link>
                        {whatsAppNumber && (
                            <a href={`https://wa.me/${whatsAppNumber.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="nav-whatsapp-btn">
                                <div className="wa-btn-icon">
                                    <FaWhatsapp />
                                </div>
                                <div className="wa-btn-text">
                                    <span className="wa-btn-title">WhatsApp Us</span>
                                    <span className="wa-btn-number">
                                        {whatsAppNumber.startsWith('+')
                                            ? whatsAppNumber.slice(0, 4) + '-' + whatsAppNumber.slice(4)
                                            : whatsAppNumber}
                                    </span>
                                </div>
                            </a>
                        )}
                    </div>
                    <button className={`mobile-menu-toggle ${isMenuOpen ? 'mobile-active-toggle' : ''}`} onClick={toggleMenu} aria-label="Toggle Menu">
                        {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                    </button>
                </div>
            </nav >

            <main className="contact-main">
                <section className="contact-hero">
                    <div className="contact-container">
                        <div className="contact-header">
                            <h1 className="contact-title">Contact our <span className="text-gradient">Support Team</span></h1>
                            <p className="contact-subtitle">
                                We are here to help. Fill out the form below or reach us via email for any inquiries about our platform.
                            </p>
                        </div>

                        <div className="contact-grid">
                            {/* Contact Form */}
                            <div className="contact-form-card">
                                <form onSubmit={handleSubmit}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="fullName">Full Name</label>
                                            <input
                                                type="text"
                                                id="fullName"
                                                name="fullName"
                                                placeholder="Jane Doe"
                                                value={formData.fullName}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="email">Email</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                placeholder="jane@example.com"
                                                value={formData.email}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="subject">Subject</label>
                                        <select
                                            id="subject"
                                            name="subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="" disabled>Select a topic</option>
                                            <option value="General Inquiry">General Inquiry</option>
                                            <option value="Technical Support">Technical Support</option>
                                            <option value="Billing">Billing</option>
                                            <option value="Feature Request">Feature Request</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor="message">Message</label>
                                        <textarea
                                            id="message"
                                            name="message"
                                            rows="6"
                                            placeholder="How can we help you?"
                                            value={formData.message}
                                            onChange={handleChange}
                                            required
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        className="btn-primary btn-lg submit-btn"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Message'}
                                    </button>
                                </form>
                            </div>

                            {/* Contact Information */}
                            <div className="contact-sidebar">
                                <div className="info-card">
                                    <h3>Quick Contact</h3>

                                    <div className="info-item">
                                        <div className="info-icon purple">
                                            <FaEnvelope />
                                        </div>
                                        <div className="info-text">
                                            <span className="info-label">Email Us</span>
                                            <span className="info-value">
                                                <a href="mailto:support@nepostore.xyz" className="contact-link">support@nepostore.xyz</a>
                                            </span>
                                            <span className="info-sub">Response time: within 24 hours</span>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-icon blue">
                                            <FaPhone />
                                        </div>
                                        <div className="info-text">
                                            <span className="info-label">Phone Support</span>
                                            <span className="info-value">
                                                <a href="tel:+9779888888888" className="contact-link">+9779888888888</a>
                                            </span>
                                            <span className="info-sub">Sun-Fri from 9am to 5pm</span>
                                        </div>
                                    </div>

                                    <div className="info-item">
                                        <div className="info-icon orange">
                                            <FaMapMarkerAlt />
                                        </div>
                                        <div className="info-text">
                                            <span className="info-label">Office</span>
                                            <span className="info-value">sdfdfsdfsdf</span>
                                        </div>
                                    </div>
                                </div>

                                <h2 className="section-subtitle-small" style={{ marginTop: '2rem' }}>FIND US</h2>
                                <div className="map-wrapper">
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3533.2731804791054!2d85.35825737536952!3d27.67794147619864!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39eb1a681df7481b%3A0xe5a3c180909f18b!2sBlanxer%20Technology%20Pvt.%20Ltd.!5e0!3m2!1sen!2snp!4v1704358894179!5m2!1sen!2snp"
                                        width="100%"
                                        height="300"
                                        style={{ border: 0, borderRadius: '16px' }}
                                        allowFullScreen=""
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        title="Blanxer Technology Location"
                                    ></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>



                <section className="availability-section">
                    <div className="contact-container">
                        <h2 className="availability-title">Availability at a Glance</h2>
                        <div className="availability-grid">
                            <div className="availability-card">
                                <div className="availability-icon-box purple">
                                    <FaAt />
                                </div>
                                <h3>Email Responses</h3>
                                <p>We strive to respond to all email inquiries within:</p>
                                <div className="availability-time">24 Hours</div>
                                <div className="availability-status">
                                    <FaCheckCircle className="status-icon green" /> Always Available
                                </div>
                            </div>

                            <div className="availability-card">
                                <div className="availability-icon-box blue">
                                    <FaHeadset />
                                </div>
                                <h3>Phone Support</h3>
                                <p>Reach our support team by phone:</p>
                                <div className="availability-time">Sun - Fri</div>
                                <div className="availability-detail">9 AM - 5 PM</div>
                                <div className="availability-status">
                                    <span className="status-dot green"></span> Open Now
                                </div>
                            </div>

                            {whatsAppNumber && (
                                <a
                                    href={`https://wa.me/${whatsAppNumber.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="availability-card"
                                    style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
                                >
                                    <div className="availability-icon-box green">
                                        <FaWhatsapp />
                                    </div>
                                    <h3>WhatsApp Support</h3>
                                    <p>Get instant help via chat:</p>
                                    <div className="availability-time">{whatsAppNumber}</div>
                                    <div className="availability-detail">9 AM - 6 PM</div>
                                    <div className="availability-status">
                                        <span className="status-dot green"></span> Available Now
                                    </div>
                                </a>
                            )}
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer (Reused from LandingPage) */}
            <footer className="main-footer">
                <div className="footer-content">
                    <div className="footer-brand">
                        <div className="logo-icon small">🛍️</div>
                        <h4>CreatorFlow</h4>
                        <p>Empowering creators to build, grow, and monetize their passions online.</p>
                        <div className="newsletter-box">
                            <input type="email" placeholder="Enter your email" />
                            <button>Subscribe</button>
                        </div>
                    </div>
                    <div className="footer-links-col">
                        <h5>Product</h5>
                        <Link to="/#features">Features</Link>
                        <Link to="/#pricing">Pricing</Link>
                    </div>
                    <div className="footer-links-col">
                        <h5>Support</h5>
                        <Link to="/#support">Help Center</Link>
                        <Link to="/contact">Contact Us</Link>
                        <Link to="/#faq">FAQ</Link>
                    </div>
                    <div className="footer-links-col">
                        <h5>Company</h5>
                        <a href="#about">About Us</a>
                        <a href="#careers">Careers</a>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2026 CreatorFlow Inc. All rights reserved.</p>
                    <div className="footer-legal">
                        <Link to="/terms">Terms of Service</Link>
                        <Link to="/privacy">Privacy Policy</Link>
                        <Link to="/returns">Return & Refunds</Link>
                    </div>
                </div>
            </footer>
        </div >
    );
};

export default ContactPage;
