import React, { useState, useEffect } from 'react';
import { FaFire, FaStar, FaHeart, FaRegHeart, FaShoppingCart, FaTag, FaGift, FaBolt, FaRocket, FaGem, FaCrown, FaArrowRight } from 'react-icons/fa';
import { Link, useLocation } from 'react-router-dom';
import { useDispatchCart } from '../../Shop/CartProvider';
import { getProducts } from '../../../services/productService';
import API_URL from '../../../apiConfig';
import { getShopPath, resolveImageUrl } from '../../../themeUtils';
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
    const config = typeof content === 'string' ? (content.trim() ? JSON.parse(content) : {}) : (content || {});

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
        marginTop = 0,
        marginBottom = 0,
        useThemeBg = true,
        bgColor = 'transparent',
        sourceType = 'products', // 'products' or 'categories'
        selectedCategoryId = null,
        selectedProductIds = []
    } = config;

    const IconComponent = ICON_MAP[iconType] || FaFire;

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                // Use the standardized productService to handle tenant headers
                const data = await getProducts();

                if (sourceType === 'categories' && selectedCategoryId) {
                    const filtered = data.filter(p => {
                        const pCatId = p.category && (typeof p.category === 'object' ? p.category._id : p.category);
                        return pCatId === selectedCategoryId;
                    });
                    setProducts(filtered);
                }
                // If specific products are selected, filter and sort them to match the selection order
                else if (sourceType !== 'categories' && selectedProductIds && selectedProductIds.length > 0) {
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
    }, [JSON.stringify(selectedProductIds), selectedCategoryId, sourceType]); // Re-fetch/filter if selection changes

    const containerStyle = {
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingBottom}px`,
        marginTop: `${marginTop}px`,
        marginBottom: `${marginBottom}px`,
        background: useThemeBg ? '#f9fafb' : bgColor
    };

    const iconStyle = {
        background: useThemeIconBg ? 'var(--primary-color, #ef4444)' : iconBgColor,
        color: useThemeIconBg ? 'white' : (iconColor || (iconBgColor === 'transparent' ? 'var(--primary-content)' : 'white'))
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
                            <Link to={getShopPath('/products')} className="explore-all-btn" onClick={(e) => isBuilder && e.preventDefault()}>
                                Explore All <FaArrowRight />
                            </Link>
                        )}
                    </div>
                </div>

                {products.length > 0 ? (
                    <>
                        <div className="ecommerce-product-grid">
                            {displayedProducts.map(product => (
                                <ProductCardItem
                                    key={product._id}
                                    product={product}
                                    currency={currency}
                                    isBuilder={isBuilder}
                                    dispatch={dispatch}
                                />
                            ))}
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

// Inner component to handle individual product state (like wishlist)
const ProductCardItem = ({ product, currency, isBuilder, dispatch }) => {
    const [isWishlisted, setIsWishlisted] = useState(false);

    // Calculate stock and discounts
    const totalStock = product.hasVariants
        ? (product.variants || []).reduce((acc, v) => acc + (v.quantity || 0), 0)
        : (product.quantity || 0);
    const isOutOfStock = totalStock <= 0;
    const discount = product.crossedPrice ? Math.round(((product.crossedPrice - product.sellingPrice) / product.crossedPrice) * 100) : 0;

    // Wishlist Logic
    useEffect(() => {
        const checkWishlist = () => {
            const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            setIsWishlisted(wishlist.includes(product._id));
        };

        checkWishlist();

        const handleStorageChange = (e) => {
            if (e.key === 'wishlist') checkWishlist();
        };

        const handleWishlistUpdate = () => checkWishlist();

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('wishlistUpdated', handleWishlistUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
        };
    }, [product._id]);

    const toggleWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isBuilder) return;

        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        let updatedWishlist;

        if (wishlist.includes(product._id)) {
            updatedWishlist = wishlist.filter(id => id !== product._id);
        } else {
            updatedWishlist = [...wishlist, product._id];
        }

        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
        setIsWishlisted(!isWishlisted);
        window.dispatchEvent(new Event('wishlistUpdated'));
    };

    const handleAddToCart = (e) => {
        e.preventDefault();
        if (isBuilder || isOutOfStock) return;
        const cartItem = {
            id: product._id,
            name: product.name,
            price: product.sellingPrice,
            image: resolveImageUrl(product.images && product.images.length > 0 ? product.images[0] : null, API_URL) || 'https://via.placeholder.com/300',
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
        <div className={`ecommerce-product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
            <Link to={getShopPath(`/product/${product._id}`)} className="product-card-link" onClick={(e) => isBuilder && e.preventDefault()}>
                <div className="product-image-container">
                    {discount > 0 && !isOutOfStock && <div className="discount-badge">{discount}% OFF</div>}
                    {isOutOfStock && <div className="out-of-stock-badge">OUT OF STOCK</div>}
                    <button className="wishlist-btn" onClick={toggleWishlist}>
                        {isWishlisted ? <FaHeart size={14} style={{ color: 'red' }} /> : <FaRegHeart size={14} />}
                    </button>
                    <img
                        src={resolveImageUrl(product.images && product.images.length > 0 ? product.images[0] : null, API_URL) || 'https://via.placeholder.com/300'}
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
            {product.hasVariants ? (
                <Link
                    to={getShopPath(`/product/${product._id}`)}
                    className="add-to-cart-btn-small"
                    style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}
                    onClick={(e) => isBuilder && e.preventDefault()}
                >
                    Select Variant
                </Link>
            ) : (
                <button
                    className="add-to-cart-btn-small"
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    style={isOutOfStock ? { cursor: 'not-allowed', opacity: 0.6, backgroundColor: '#9ca3af', borderColor: '#9ca3af' } : {}}
                >
                    {isOutOfStock ? 'Out of Stock' : 'Add To Cart'}
                </button>
            )}
        </div>
    );
};

export default ProductGridTemplate;
