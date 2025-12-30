import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <div className="hero">
      <div className="hero-content">
        <h1 className="hero-title">Welcome to Our Shop</h1>
        <p className="hero-subtitle">Discover the best products for your needs</p>
        <button className="hero-cta-btn">Shop Now</button>
      </div>
    </div>
  );
};

export default Hero;