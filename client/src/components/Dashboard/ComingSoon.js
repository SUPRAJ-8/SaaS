import React from 'react';
import { FaTools, FaClock, FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './ComingSoon.css';

const ComingSoon = ({ title = "Feature Coming Soon", description = "We're working hard to bring you this feature. Stay tuned!" }) => {
    const navigate = useNavigate();

    return (
        <div className="coming-soon-container">
            <div className="coming-soon-content">
                <div className="icon-wrapper">
                    <FaTools className="main-icon" />
                    <FaClock className="corner-icon" />
                </div>
                <h1>{title}</h1>
                <p>{description}</p>
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: '65%' }}></div>
                </div>
                <span className="progress-text">65% Complete</span>
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <FaArrowLeft /> Go Back
                </button>
            </div>
            <div className="background-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>
        </div>
    );
};

export default ComingSoon;
