import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getShopPath } from '../themeUtils';
import './NotFound.css';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="not-found-container">
            <div className="not-found-content">
                <div className="not-found-bg-text">404</div>
                <div className="not-found-image-container">
                    <img src="/404.gif" alt="404 Not Found" className="not-found-gif" />
                </div>
                <div className="not-found-text-content">
                    <h1 className="not-found-title">Look like you're lost</h1>
                    <p className="not-found-subtitle">the page you are looking for not available!</p>
                    <button
                        className="not-found-home-btn"
                        onClick={() => navigate(getShopPath('/'))}
                    >
                        Go to Home
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
