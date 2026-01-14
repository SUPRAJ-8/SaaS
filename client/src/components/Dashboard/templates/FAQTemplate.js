import React, { useState } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';
import './FAQTemplate.css';

const FAQTemplate = ({ content }) => {
    const config = typeof content === 'string' ? JSON.parse(content) : content;
    const [activeIndex, setActiveIndex] = useState(0);

    const title = config?.title || 'Frequently Asked Questions';
    const questions = config?.questions || [
        { q: 'What is your return policy?', a: 'We offer a 30-day money back guarantee on all items.' },
        { q: 'How long does shipping take?', a: 'Standard shipping takes 3-5 business days.' },
        { q: 'Do you offer international shipping?', a: 'Yes, we ship to over 50 countries worldwide.' },
        { q: 'How can I track my order?', a: 'You will receive a tracking link via email once your order ships.' }
    ];

    // Extract spacing and background settings
    const paddingTop = config?.paddingTop !== undefined ? config.paddingTop : 0;
    const paddingBottom = config?.paddingBottom !== undefined ? config.paddingBottom : 0;
    const marginTop = config?.marginTop !== undefined ? config.marginTop : 0;
    const marginBottom = config?.marginBottom !== undefined ? config.marginBottom : 0;
    const useThemeBg = config?.useThemeBg !== undefined ? config.useThemeBg : true;
    const bgColor = config?.bgColor || 'transparent';

    const sectionStyle = {
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        backgroundColor: useThemeBg ? 'transparent' : bgColor,
    };

    return (
        <section className="faq-section-template" style={sectionStyle}>
            <div className="template-container">
                <h2 className="faq-title">{title}</h2>
                <div className="faq-list">
                    {questions.map((faq, idx) => (
                        <div
                            key={idx}
                            className={`faq-item ${activeIndex === idx ? 'active' : ''}`}
                            onClick={() => setActiveIndex(activeIndex === idx ? -1 : idx)}
                        >
                            <div className="faq-question">
                                <span>{faq.q}</span>
                                {activeIndex === idx ? <FaMinus className="faq-icon" /> : <FaPlus className="faq-icon" />}
                            </div>
                            <div className="faq-answer">
                                <p>{faq.a}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default FAQTemplate;
