import React from 'react';
import styles from './hero.module.css';

/**
 * HeroModern Section Component
 * 
 * Props: data (object) - Editable content from page builder
 * 
 * RULES:
 * - NO hardcoded text/images
 * - ALL content from props.data
 * - Uses CSS Modules for isolation
 */

const Hero = ({ data = {} }) => {
    const {
        title = 'Default Hero Title',
        subtitle = 'Default subtitle text',
        bgColor = '#ffffff',
        textColor = '#000000',
        buttonText = 'Get Started',
        buttonLink = '#',
        showButton = true,
        backgroundImage = ''
    } = data;

    return (
        <section
            className={styles.hero}
            style={{
                backgroundColor: bgColor,
                backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none'
            }}
        >
            <div className={styles.container}>
                <h1
                    className={styles.title}
                    style={{ color: textColor }}
                >
                    {title}
                </h1>
                <p
                    className={styles.subtitle}
                    style={{ color: textColor }}
                >
                    {subtitle}
                </p>
                {showButton && (
                    <a href={buttonLink} className={styles.button}>
                        {buttonText}
                    </a>
                )}
            </div>
        </section>
    );
};

export default Hero;
