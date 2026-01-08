import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaTrash, FaShoppingCart, FaHeart, FaArrowRight } from 'react-icons/fa';
import { useDispatchCart } from './CartProvider';
import { getProductById } from '../../services/productService'; // You might need to export this or use axios directly
import API_URL from '../../apiConfig';
import { getShopPath, resolveImageUrl } from '../../themeUtils';
import './Wishlist.css';
import axios from 'axios';

const Wishlist = () => {
    const [wishlistItems, setWishlistItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const dispatch = useDispatchCart();
    const navigate = useNavigate();

    useEffect(() => {
        fetchWishlistProducts();

        // Listen for storage changes in case wishlist is updated in other tabs/components
        const handleStorageChange = (e) => {
            if (e.key === 'wishlist') {
                fetchWishlistProducts();
            }
        };

        // Custom event for same-tab updates
        const handleWishlistUpdate = () => {
            fetchWishlistProducts();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('wishlistUpdated', handleWishlistUpdate);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
        };
    }, []);

    const fetchWishlistProducts = async () => {
        setLoading(true);
        try {
            const storedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');

            if (storedWishlist.length === 0) {
                setWishlistItems([]);
                setLoading(false);
                return;
            }

            // We have IDs, now we need product details.
            // Ideally we would have a bulk fetch API, but for now we might have to fetch them or use detailed product objects if stored.
            // Let's assume we store IDs.

            // Optimization: Fetch all products once if the list is long, or individual if short. 
            // For simplicity/robustness, let's try to fetch all products and filter. 
            // Or better, fetch individually in parallel.

            const subdomain = window.location.hostname.split('.')[0];
            const config = { withCredentials: true };
            if (
                window.location.hostname.endsWith('.nepostore.xyz') &&
                window.location.hostname !== 'nepostore.xyz' &&
                window.location.hostname !== 'www.nepostore.xyz'
            ) {
                config.headers = { 'x-subdomain': subdomain };
            }

            const promises = storedWishlist.map(id =>
                axios.get(`${API_URL}/api/products/${id}`, config)
                    .then(res => res.data)
                    .catch(err => null) // Ignore failed fetches (e.g. deleted products)
            );

            const products = await Promise.all(promises);
            const validProducts = products.filter(p => p !== null);

            setWishlistItems(validProducts);
        } catch (error) {
            console.error("Error fetching wishlist products:", error);
        } finally {
            setLoading(false);
        }
    };

    const removeFromWishlist = (e, productId) => {
        e.preventDefault();
        e.stopPropagation();

        const storedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        const updatedWishlist = storedWishlist.filter(id => id !== productId);

        localStorage.setItem('wishlist', JSON.stringify(updatedWishlist));
        // Dispatch event for other components
        window.dispatchEvent(new Event('wishlistUpdated'));

        // Update local state immediately
        setWishlistItems(prev => prev.filter(item => item._id !== productId));
    };

    const handleAddToCart = (e, product) => {
        e.preventDefault();
        e.stopPropagation();

        // Check stock
        const totalStock = product.hasVariants
            ? product.variants.reduce((acc, v) => acc + (v.quantity || 0), 0)
            : (product.quantity || 0);

        if (totalStock <= 0) {
            alert("This product is out of stock");
            return;
        }

        const cartItem = {
            id: product._id,
            name: product.name,
            price: product.sellingPrice,
            image: resolveImageUrl(product.images && product.images.length > 0 ? product.images[0] : null, API_URL),
            quantity: 1
        };

        dispatch({ type: 'ADD_ITEM', payload: cartItem });
        // Open cart panel
        setTimeout(() => window.dispatchEvent(new Event('openCartPanel')), 100);
    };

    // Helper for currency
    const getCurrencySettings = () => {
        const settings = JSON.parse(localStorage.getItem('storeSettings') || '{}');
        return {
            symbol: settings.currencySymbol || 'NPR',
            position: settings.currencyPosition || 'before'
        };
    };
    const currency = getCurrencySettings();

    if (loading) return (
        <div className="wishlist-page">
            <div className="wishlist-header"><h2>My Wishlist</h2></div>
            <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
        </div>
    );

    return (
        <div className="wishlist-page">
            <div className="wishlist-header">
                <h2><FaHeart /> My Wishlist</h2>
            </div>

            {wishlistItems.length === 0 ? (
                <div className="empty-wishlist">
                    <div className="empty-wishlist-icon"><FaHeart /></div>
                    <h3>Your wishlist is empty</h3>
                    <p>Browse our catalog and discover items you'll love.</p>
                    <Link to={getShopPath('/products')} className="browse-btn">
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <div className="wishlist-grid">
                    {wishlistItems.map(product => {
                        const hasVariants = product.hasVariants;
                        const totalStock = hasVariants
                            ? (product.variants || []).reduce((acc, v) => acc + (v.quantity || 0), 0)
                            : (product.quantity || 0);
                        const isOutOfStock = totalStock <= 0;

                        return (
                            <div key={product._id} className="wishlist-item-card">
                                <button
                                    className="remove-btn"
                                    onClick={(e) => removeFromWishlist(e, product._id)}
                                    title="Remove from wishlist"
                                >
                                    <FaTrash />
                                </button>

                                <Link to={getShopPath(`/product/${product._id}`)} style={{ textDecoration: 'none', color: 'inherit' }}>
                                    <div className="wishlist-image-container">
                                        <img
                                            src={resolveImageUrl(product.images && product.images.length > 0 ? product.images[0] : null, API_URL)}
                                            alt={product.name}
                                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://via.placeholder.com/300?text=No+Image'; }}
                                        />
                                    </div>

                                    <div className="wishlist-details">
                                        <h3>{product.name}</h3>
                                        <span className="wishlist-price">
                                            {currency.position === 'before'
                                                ? `${currency.symbol} ${Number(product.sellingPrice).toLocaleString()}`
                                                : `${Number(product.sellingPrice).toLocaleString()} ${currency.symbol}`}
                                        </span>

                                        <div className="wishlist-actions">
                                            <button
                                                className="add-to-cart-btn"
                                                onClick={(e) => handleAddToCart(e, product)}
                                                disabled={isOutOfStock}
                                                style={isOutOfStock ? { opacity: 0.7, cursor: 'not-allowed', background: '#ccc' } : {}}
                                            >
                                                <FaShoppingCart /> {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                                            </button>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Wishlist;
