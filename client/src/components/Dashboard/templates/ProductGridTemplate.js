import React, { useState, useEffect } from 'react';
import { FaFire, FaStar, FaHeart, FaShoppingCart, FaTag, FaGift, FaBolt, FaRocket, FaGem, FaCrown, FaArrowRight } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { useDispatchCart } from '../../Shop/CartProvider';
import './ProductGridTemplate.css';

const ICON_MAP = {
    fire: FaFire,
    star: FaStar,
    heart: FaHeart,
    cart: FaShoppingCart,
    tag: FaTag,
    gift: FaGift,
    bolt: FaBolt,
    rocket: FaRocket,
    gem: FaGem,
    crown: FaCrown
};

const ProductGridTemplate = ({ content }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatchCart();
    const location = useLocation();
    const isBuilder = location.pathname.includes('/dashboard/page-builder');
    const [currency, setCurrency] = useState({ symbol: 'NPR', position: 'before' });
    const [visibleCount, setVisibleCount] = useState(12);

    useEffect(() => {
        const settings = localStorage.getItem('storeSettings');
        if (settings) {
            const parsedSettings = JSON.parse(settings);
            setCurrency({
                symbol: parsedSettings.currencySymbol || 'NPR',
                position: parsedSettings.currencyPosition || 'before',
            });
        }
    }, []);

    // Parse content if it's a string
    const config = typeof content === 'string' ? JSON.parse(content) : content;

    // Destructure config with defaults
    const {
        title = "Featured Products",
        showIcon = true,
        iconType = 'fire',

        useThemeIconBg = true,
        iconBgColor = 'transparent',
        iconColor, // Undefined by default to allow fallback logic
        align = 'left',
        showExploreMore = true,
        paddingTop = 0,
        paddingBottom = 0,
        marginTop = 5,
        marginBottom = 5,
        useThemeBg = false,
        bgColor = 'transparent',
        selectedProductIds = []
    } = config || {};

    const IconComponent = ICON_MAP[iconType] || FaFire;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch('/api/products');
                const data = await response.json();

                // If specific products are selected, filter and sort them to match the selection order
                if (selectedProductIds && selectedProductIds.length > 0) {
                    const sortedProducts = selectedProductIds
                        .map(id => data.find(p => p._id === id))
                        .filter(product => product !== undefined); // Remove any that weren't found
                    setProducts(sortedProducts);
                } else {
                    // Do not show any products if none are selected
                    setProducts([]);
                }
                setLoading(false);
            } catch (error) {
                console.error('Error fetching products for template:', error);
                setLoading(false);
                setProducts([]);
            }
        };

        fetchProducts();
    }, [JSON.stringify(selectedProductIds)]); // Re-fetch/filter if selection changes

    const containerStyle = {
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        background: useThemeBg ? 'var(--theme-bg, #ffffff)' : bgColor
    };

    const iconStyle = {
        background: useThemeIconBg ? 'var(--theme-primary, #7c3aed)' : iconBgColor,
        color: useThemeIconBg ? 'white' : (iconColor || (iconBgColor === 'transparent' ? 'var(--theme-primary, #7c3aed)' : 'white'))
    };

    if (loading) {
        return <div className="product-grid-loading">Loading products...</div>;
    }

    const handleShowMore = () => {
        setVisibleCount(prev => prev + 12);
    };

    const displayedProducts = products.slice(0, visibleCount);

    return (
        <section className="product-grid-template" style={containerStyle}>
            <div className="template-container">
                <div className="section-header">
                    <div className={`title-wrapper ${align}`}>
                        <div className="title-group">
                            {showIcon && (
                                <div className="fire-icon-wrapper" style={iconStyle}>
                                    <IconComponent />
                                </div>
                            )}
                            <h2>
                                {title.split(' ').map((word, i) => (
                                    <span key={i} className={i === 0 ? "highlight" : ""}>
                                        {word}{' '}
                                    </span>
                                ))}
                            </h2>
                        </div>

                        {showExploreMore && (
                            <Link to="/shop/products" className="explore-all-btn" onClick={(e) => isBuilder && e.preventDefault()}>
                                Explore All <FaArrowRight />
                            </Link>
                        )}
                    </div>
                </div>

                {products.length > 0 ? (
                    <>
                        <div className="ecommerce-product-grid">
                            {displayedProducts.map(product => {
                                const discount = product.crossedPrice ? Math.round(((product.crossedPrice - product.sellingPrice) / product.crossedPrice) * 100) : 0;

                                const handleAddToCart = (e) => {
                                    e.preventDefault();
                                    if (isBuilder) return;
                                    const cartItem = {
                                        id: product._id,
                                        name: product.name,
                                        price: product.sellingPrice,
                                        image: product.images && product.images.length > 0 ? `http://localhost:5002${product.images[0]}` : 'https://via.placeholder.com/300',
                                        quantity: 1
                                    };
                                    dispatch({ type: 'ADD_ITEM', payload: cartItem });

                                    // Open cart panel after adding
                                    setTimeout(() => {
                                        window.dispatchEvent(new Event('openCartPanel'));
                                    }, 100);
                                };

                                const priceDisplay = currency.position === 'before'
                                    ? `${currency.symbol} ${Number(product.sellingPrice || product.price || 0).toLocaleString()}`
                                    : `${Number(product.sellingPrice || product.price || 0).toLocaleString()} ${currency.symbol}`;

                                const crossedPriceDisplay = product.crossedPrice > 0
                                    ? (currency.position === 'before'
                                        ? `${currency.symbol} ${Number(product.crossedPrice).toLocaleString()}`
                                        : `${Number(product.crossedPrice).toLocaleString()} ${currency.symbol}`)
                                    : null;

                                return (
                                    <div key={product._id} className="ecommerce-product-card">
                                        <Link to={`/shop/product/${product._id}`} className="product-card-link" onClick={(e) => isBuilder && e.preventDefault()}>
                                            <div className="product-image-container">
                                                {discount > 0 && <div className="discount-badge">{discount}% OFF</div>}
                                                <button className="wishlist-btn" onClick={(e) => e.preventDefault()}>
                                                    <FaHeart size={14} />
                                                </button>
                                                <img
                                                    src={product.images && product.images.length > 0
                                                        ? (product.images[0].startsWith('http') ? product.images[0] : `http://localhost:5002${product.images[0]}`)
                                                        : 'https://via.placeholder.com/300'
                                                    }
                                                    alt={product.name}
                                                />
                                            </div>
                                            <div className="product-details">
                                                <h3>{product.name}</h3>
                                                <div className="product-price-actions">
                                                    <div className="price-container">
                                                        <span className="product-price">{priceDisplay}</span>
                                                        {crossedPriceDisplay && (
                                                            <span className="original-price">{crossedPriceDisplay}</span>
                                                        )}
                                                    </div>
                                                    <div className="product-rating">
                                                        <FaStar className="star" size={10} />
                                                        <span className="rating-value">{product.rating || '4.5'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </Link>
                                        <button className="add-to-cart-btn-small" onClick={handleAddToCart}>
                                            Add To Cart
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                        {products.length > visibleCount && (
                            <div className="show-more-container">
                                <button className="show-more-btn" onClick={handleShowMore}>
                                    Show More Products
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="product-grid-empty-placeholder">
                        <h3>No Products Selected</h3>
                        <p>Select products from the editor to display them here.</p>
                        <div className="empty-zone-badge">
                            PRODUCT GRID
                        </div>
                    </div>
                )}


            </div>
        </section >
    );
};

export default ProductGridTemplate;
