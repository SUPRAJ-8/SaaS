import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    FaChevronDown,
    FaChevronUp,
    FaPlay,
    FaUserCircle,
    FaGlobe,
    FaShoppingCart,
    FaChartPie,
    FaCheckCircle,
    FaLock,
    FaBolt,
    FaArrowRight,
    FaShoppingBag,
    FaHistory,
    FaHeadset,
    FaShieldAlt,
    FaGem,
    FaWhatsapp,
    FaBars,
    FaTimes
} from 'react-icons/fa';
import axios from 'axios';
import API_URL from '../apiConfig';
import dashboardMockup from '../assets/dashboard-mockup.png';
import './LandingPage.css';

const LandingPage = () => {
    const [openFaq, setOpenFaq] = useState(null);
    const [isAnnual, setIsAnnual] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);

        const fetchSettingsAndLoadChat = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/public-settings`);
                let tawkToId = response.data?.tawkToId;

                if (tawkToId) {
                    let cleanedId = tawkToId.trim();
                    if (cleanedId.includes('tawk.to/chat/')) {
                        const parts = cleanedId.split('tawk.to/chat/')[1].split('/');
                        if (parts.length >= 2) {
                            cleanedId = `${parts[0]}/${parts[1]}`;
                        }
                    } else if (cleanedId.includes('embed.tawk.to/')) {
                        const parts = cleanedId.split('embed.tawk.to/')[1].split('/');
                        if (parts.length >= 2) {
                            cleanedId = `${parts[0]}/${parts[1]}`;
                        }
                    }
                    tawkToId = cleanedId;
                }

                if (tawkToId && tawkToId.includes('/')) {
                    window.Tawk_API = window.Tawk_API || {};
                    window.Tawk_LoadStart = new Date();

                    // Nudge tawk.to up to make room for WhatsApp below it
                    window.Tawk_API.customStyle = {
                        visibility: {
                            desktop: {
                                yOffset: 95
                            },
                            mobile: {
                                yOffset: 85
                            }
                        }
                    };

                    const s1 = document.createElement("script");
                    s1.async = true;
                    s1.src = `https://embed.tawk.to/${tawkToId}`;
                    s1.charset = 'UTF-8';
                    s1.setAttribute('crossorigin', '*');
                    document.head.appendChild(s1);
                } else {
                    console.warn('⚠️ No valid TawkTo ID found or format incorrect (missing slash)');
                }
            } catch (error) {
                console.error('❌ Failed to load site settings:', error);
            }
        };

        fetchSettingsAndLoadChat();

        // Cleanup
        return () => {
            const scripts = document.getElementsByTagName('script');
            for (let i = 0; i < scripts.length; i++) {
                if (scripts[i].src.includes('tawk.to')) {
                    scripts[i].parentNode.removeChild(scripts[i]);
                }
            }
            if (window.Tawk_API && window.Tawk_API.hideWidget) {
                window.Tawk_API.hideWidget();
            }
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    useEffect(() => {
        if (isMenuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
    }, [isMenuOpen]);

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const faqs = [
        {
            question: "How quickly can I set up my store?",
            answer: "You can set up your store in minutes! Just sign up, choose a template, add your products, and you're ready to start selling."
        },
        {
            question: "What are the transaction fees?",
            answer: "We offer competitive transaction fees. On the Starter plan, it's 5%. On Pro, it's 2%, and Enterprise plans have custom rates."
        },
        {
            question: "What kind of products can I sell?",
            answer: "You can sell anything from physical goods like clothing and art to digital downloads like ebooks, courses, and presets."
        },
        {
            question: "Can I connect my existing domain?",
            answer: "Yes! The Pro and Enterprise plans allow you to connect your own custom domain for a fully branded experience."
        },
        {
            question: "Do I need any technical skills?",
            answer: "Not at all. Our platform is designing to be user-friendly with a drag-and-drop builder. No coding knowledge required."
        }
    ];

    return (
        <div className="landing-layout">
            {/* Navigation */}
            <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
                <div className="nav-container">
                    <Link to="/" className="nav-logo" style={{ textDecoration: 'none' }}>
                        <div className="logo-box">
                            <FaShoppingBag />
                        </div>
                        <span>CreatorFlow</span>
                    </Link>
                    <div className={`nav-menu ${isMenuOpen ? 'mobile-active' : ''}`}>
                        <a href="#features" onClick={() => setIsMenuOpen(false)}>Features</a>
                        <a href="#how-it-works" onClick={() => setIsMenuOpen(false)}>How it Works</a>
                        <a href="#pricing" onClick={() => setIsMenuOpen(false)}>Pricing</a>
                        <a href="#faq" onClick={() => setIsMenuOpen(false)}>FAQ</a>
                        <div className="nav-menu-auth-mobile">
                            <Link to="/login" className="btn-text" onClick={() => setIsMenuOpen(false)}>Log In</Link>
                            <Link to="/signup" className="btn-primary" onClick={() => setIsMenuOpen(false)}>Register Now</Link>
                        </div>
                    </div>
                    <div className="nav-auth">
                        <Link to="/login" className="btn-text desktop-only">Log In</Link>
                        <Link to="/signup" className="btn-primary desktop-only">Register Now <FaArrowRight className="btn-arrow" /></Link>
                        <a href="https://wa.me/9779840007310" target="_blank" rel="noopener noreferrer" className="nav-whatsapp-btn">
                            <div className="wa-btn-icon">
                                <FaWhatsapp />
                            </div>
                            <div className="wa-btn-text">
                                <span className="wa-btn-title">WhatsApp Us</span>
                                <span className="wa-btn-number">+977-9840007310</span>
                            </div>
                        </a>
                    </div>
                    <button className={`mobile-menu-toggle ${isMenuOpen ? 'mobile-active-toggle' : ''}`} onClick={toggleMenu} aria-label="Toggle Menu">
                        {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="hero-section">
                <div className="hero-container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="sparkle">✨</span> New Features for Creators!
                        </div>
                        <h1 className="hero-title">
                            Build Your <span className="text-gradient">Creator Empire</span>
                        </h1>
                        <p className="hero-subtitle">
                            Empower your passion. Launch your store, connect with your audience, and sell anything from digital products to physical goods.
                        </p>
                        <div className="hero-actions">
                            <Link to="/signup" className="btn-primary btn-lg">Register Now</Link>
                            <a href="https://wa.me/9779840007310" target="_blank" rel="noopener noreferrer" className="btn-whatsapp btn-lg">
                                <FaWhatsapp className="btn-icon-small" /> Contact us on WhatsApp
                            </a>
                        </div>
                        <div className="hero-social-proof">
                            <div className="avatars">
                                <span className="avatar">👩‍🎨</span>
                                <span className="avatar">👨‍💻</span>
                                <span className="avatar">📸</span>
                            </div>
                            <p>Trusted by 10,000+ creators</p>
                        </div>
                    </div>
                    <div className="hero-visual">
                        <div className="visual-card">
                            <img src={dashboardMockup} alt="Platform Dashboard" className="dashboard-img" />
                            <div className="floating-badge sales-badge">
                                <div className="badge-icon">📈</div>
                                <div className="badge-text">
                                    <span className="label">Sales</span>
                                    <span className="value">+124%</span>
                                </div>
                            </div>
                            <div className="floating-badge order-badge">
                                <div className="badge-icon">📦</div>
                                <div className="badge-text">
                                    <span className="label">New Order Received!</span>
                                    <span className="sub">Ready to be shipped</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Trusted By */}
            <section className="logos-section">
                <p className="logos-title">TRUSTED BY VISIONARY CREATORS WORLDWIDE</p>
                <div className="logos-grid">
                    <div className="logo-item">CreativeCo</div>
                    <div className="logo-item">Artistry Hub</div>
                    <div className="logo-item">Indie Creators</div>
                    <div className="logo-item">StreamMasters</div>
                    <div className="logo-item">Podcast Pros</div>
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="steps-section">
                <div className="section-header center-text">
                    <span className="section-tag">SIMPLE STEPS</span>
                    <h2>Launch Your Creator Business in Minutes</h2>
                    <p>Follow our intuitive process to set up your online presence and start earning. No coding required, just your creativity.</p>
                </div>

                <div className="steps-container">
                    {/* Step 1 */}
                    <div className="step-row">
                        <div className="step-content">
                            <div className="step-number num-1">1</div>
                            <h3>Log In / Sign Up</h3>
                            <p>Create your free CreatorFlow account in seconds. Use your email or connect seamlessly with your existing Google or social accounts to get instant access to your dashboard.</p>
                            <ul className="step-features">
                                <li><FaCheckCircle className="step-check" /> Free forever plan available</li>
                                <li><FaCheckCircle className="step-check" /> No credit card required</li>
                            </ul>
                        </div>
                        <div className="step-visual visual-1">
                            <div className="visual-card-bg"></div>
                            <div className="visual-card-icon">
                                <FaUserCircle />
                            </div>
                            <div className="floating-bubble bubble-1"><FaLock /></div>
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="step-row reverse">
                        <div className="step-content">
                            <div className="step-number num-2">2</div>
                            <h3>Launch Your Website</h3>
                            <p>Customize your beautiful online store with our easy-to-use templates. Choose colors, fonts, and layouts that match your brand identity without writing a single line of code.</p>
                            <div className="step-tags">
                                <span>Drag & Drop</span>
                                <span>Mobile Responsive</span>
                                <span>SEO Optimized</span>
                            </div>
                        </div>
                        <div className="step-visual visual-2">
                            <div className="visual-card-bg"></div>
                            <div className="visual-card-icon">
                                <FaGlobe />
                            </div>
                            <div className="floating-bubble bubble-2"><FaBolt /></div>
                        </div>
                    </div>

                    {/* Step 3 */}
                    <div className="step-row">
                        <div className="step-content">
                            <div className="step-number num-3">3</div>
                            <h3>Add Your Products</h3>
                            <p>Upload digital downloads, physical goods, or services with smart listings. Set your prices, manage inventory, and create variations with our powerful product management system.</p>
                            <Link to="/features" className="step-link">View Product Types <FaArrowRight /></Link>
                        </div>
                        <div className="step-visual visual-3">
                            <div className="visual-card-bg"></div>
                            <div className="visual-card-icon">
                                <FaShoppingCart />
                            </div>
                            <div className="price-tag-floating">$20.00</div>
                        </div>
                    </div>

                    {/* Step 4 */}
                    <div className="step-row reverse">
                        <div className="step-content">
                            <div className="step-number num-4">4</div>
                            <h3>Get Orders & Grow</h3>
                            <p>Start receiving orders, process payments, and watch your business thrive. Utilize our built-in analytics dashboard to track performance and optimize your sales funnel.</p>
                            <div className="step-stats-row">
                                <div className="mini-stat-card">
                                    <strong>24/7</strong>
                                    <span>Support Access</span>
                                </div>
                                <div className="mini-stat-card">
                                    <strong>0%</strong>
                                    <span>Platform Fees*</span>
                                </div>
                            </div>
                        </div>
                        <div className="step-visual visual-4">
                            <div className="visual-card-bg"></div>
                            <div className="visual-card-icon">
                                <FaShoppingBag />
                            </div>
                            <div className="floating-bubble bubble-4">New Order!</div>
                        </div>
                    </div>
                </div>

                <div className="steps-cta">
                    <Link to="/signup" className="btn-primary btn-lg">Start Your Free Trial</Link>
                    <p className="no-credit-card">No credit card required. Cancel anytime.</p>
                </div>
            </section>

            {/* FAQ */}
            <section id="faq" className="faq-section">
                <div className="faq-container">
                    <div className="section-header white-text">
                        <h2>Frequently Asked Questions</h2>
                        <p>Got questions? We've got answers! Find quick help for common queries.</p>
                    </div>
                    <div className="faq-list">
                        {faqs.map((faq, index) => (
                            <div key={index} className={`faq-item ${openFaq === index ? 'active' : ''}`} onClick={() => toggleFaq(index)}>
                                <div className="faq-question">
                                    {faq.question}
                                    {openFaq === index ? <FaChevronUp /> : <FaChevronDown />}
                                </div>
                                <div className="faq-answer">
                                    <p>{faq.answer}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="faq-footer">
                        <button className="btn-white">See All FAQs <FaChevronDown style={{ transform: 'rotate(-90deg)', marginLeft: '5px' }} /></button>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="pricing-section">
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

                <div className="pricing-grid four-col">
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
                            <Link to="/signup" className="btn-outline full-width">For Free</Link>
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
                            <Link to="/signup" className="btn-outline full-width">15 days free trial</Link>
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
                            <Link to="/signup" className="btn-primary full-width">15 days free trial</Link>
                        </div>
                        <div className="divider"></div>
                        <ul className="features-list">
                            <li><FaCheckCircle className="check-icon" /> Unlimited Products</li>
                            <li><FaCheckCircle className="check-icon" /> Advanced Marketing Tools</li>
                            <li><FaCheckCircle className="check-icon" /> Priority Support (24/7)</li>
                            <li><FaCheckCircle className="check-icon" /> Custom Domain</li>
                        </ul>
                    </div>

                    {/* Enterprise */}
                    <div className="pricing-card">
                        <div className="pricing-header">
                            <h3>Enterprise</h3>
                            <div className="price">
                                <span className="amount">Custom</span>
                            </div>
                            <p>FOR MORE CUSTOMIZATION</p>
                            <button className="btn-outline full-width">Contact Sales</button>
                        </div>
                        <div className="divider"></div>
                        <ul className="features-list">
                            <li><FaCheckCircle className="check-icon" /> Custom Integrations</li>
                            <li><FaCheckCircle className="check-icon" /> Dedicated Success Manager</li>
                            <li><FaCheckCircle className="check-icon" /> Advanced Security & SSO</li>
                            <li><FaCheckCircle className="check-icon" /> 99.99% SLA Guarantee</li>
                        </ul>
                    </div>
                </div>

                <div className="pricing-footer-features">
                    <div className="feature-item">
                        <FaLock className="feature-icon" />
                        <span>Free Trial</span>
                    </div>
                    <div className="feature-item">
                        <FaHistory className="feature-icon" />
                        <span>Cancel Anytime</span>
                    </div>
                    <div className="feature-item">
                        <FaHeadset className="feature-icon" />
                        <span>24/7 Support</span>
                    </div>
                    <div className="feature-item">
                        <FaShieldAlt className="feature-icon" />
                        <span>GDPR Compliant</span>
                    </div>
                </div>
            </section >

            {/* CTA */}
            < section className="cta-section" >
                <div className="cta-container">
                    <div className="cta-content">
                        <h2>Ready to empower your creativity?</h2>
                        <p>Join thousands of creators building their brands online. Start your 14-day free trial today. No credit card required.</p>
                        <div className="cta-buttons">
                            <Link to="/signup" className="btn-white-solid">Start Free Trial</Link>
                            <button className="btn-transparent">Talk to Sales</button>
                        </div>
                    </div>
                </div>
            </section >

            {/* Footer */}
            < footer className="main-footer" >
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
                        <a href="#features">Features</a>
                        <a href="#pricing">Pricing</a>
                    </div>
                    <div className="footer-links-col">
                        <h5>Support</h5>
                        <a href="#support">Help Center</a>
                        <Link to="/contact">Contact Us</Link>
                        <a href="#faq">FAQ</a>
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

            {/* Floating WhatsApp Button */}
            <a
                href="https://wa.me/9779840007310"
                className="whatsapp-float"
                target="_blank"
                rel="noopener noreferrer"
                title="Chat with us on WhatsApp"
            >
                <FaWhatsapp className="whatsapp-icon" />
            </a>
        </div>
    );
};

export default LandingPage;
