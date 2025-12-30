import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './CategoryGridTemplate.css';

const CategoryGridTemplate = ({ content }) => {
    const [categories, setCategories] = useState([]);
    const location = useLocation();
    const isBuilder = location.pathname.includes('/dashboard/page-builder');
    const config = typeof content === 'string' ? JSON.parse(content) : content;
    const title = config?.title || 'Shop by Category';

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch('/api/categories');
                const data = await response.json();
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
                // Mock
                setCategories([
                    { _id: '1', name: 'Electronics', image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80' },
                    { _id: '2', name: 'Apparel', image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80' },
                    { _id: '3', name: 'Home Decor', image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80' },
                    { _id: '4', name: 'Accessories', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80' }
                ]);
            }
        };
        fetchCategories();
    }, []);

    // Extract spacing and background settings
    const paddingTop = config?.paddingTop !== undefined ? config.paddingTop : 0;
    const paddingBottom = config?.paddingBottom !== undefined ? config.paddingBottom : 0;
    const marginTop = config?.marginTop !== undefined ? config.marginTop : 5;
    const marginBottom = config?.marginBottom !== undefined ? config.marginBottom : 5;
    const useThemeBg = config?.useThemeBg || false;
    const bgColor = config?.bgColor || 'transparent';

    const sectionStyle = {
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        backgroundColor: useThemeBg ? 'var(--theme-primary, #ffffff)' : bgColor,
    };

    return (
        <section className="category-grid-template" style={sectionStyle}>
            <div className="template-container">
                <h2 className="cat-title">{title}</h2>
                <div className="cat-grid">
                    {categories.map(cat => (
                        <Link
                            key={cat._id}
                            to={`/shop/category/${cat._id}`}
                            className="cat-card"
                            onClick={(e) => isBuilder && e.preventDefault()}
                        >
                            <div className="cat-img-wrapper">
                                <img src={cat.image || 'https://via.placeholder.com/400'} alt={cat.name} />
                                <div className="cat-overlay">
                                    <h3>{cat.name}</h3>
                                    <button className="shop-now-mini">SHOP NOW</button>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default CategoryGridTemplate;
