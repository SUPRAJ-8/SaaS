import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { getProducts } from '../../services/productService';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaTh, FaThLarge, FaChevronRight, FaRegHeart, FaHeart, FaFilter, FaStar, FaBoxOpen } from 'react-icons/fa';
import { useDispatchCart } from './CartProvider';
import axios from 'axios';
import API_URL from '../../apiConfig';
import NotFound from '../../pages/NotFound';
import { getShopPath, resolveImageUrl, getTenantId } from '../../themeUtils';

const ProductCard = ({ product }) => {
    const [currency, setCurrency] = useState({ symbol: 'NPR', position: 'before' });

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
    const discount = product.crossedPrice ? Math.round(((product.crossedPrice - product.sellingPrice) / product.crossedPrice) * 100) : 0;
    const dispatch = useDispatchCart();

    const [isWishlisted, setIsWishlisted] = useState(false);

    useEffect(() => {
        const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
        setIsWishlisted(wishlist.includes(product._id));

        const handleStorageChange = (e) => {
            if (e.key === 'wishlist') {
                const updatedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
                setIsWishlisted(updatedWishlist.includes(product._id));
            }
        };

        const handleWishlistUpdate = () => {
            const updatedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]');
            setIsWishlisted(updatedWishlist.includes(product._id));
        };

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
        const cartItem = {
            id: product._id,
            name: product.name,
            price: product.sellingPrice,
            image: resolveImageUrl(product.images && product.images.length > 0 ? product.images[0] : null, API_URL) || 'https://via.placeholder.com/300'
        };
        dispatch({ type: 'ADD_ITEM', payload: cartItem });
    };

    return (
        <div className="ecommerce-product-card group">
            <div className="product-image-container">
                {discount > 0 && <div className="discount-badge">{discount}% OFF</div>}
                <button className={`wishlist-btn ${isWishlisted ? 'active' : ''}`} onClick={toggleWishlist}>
                    {isWishlisted ? <FaHeart style={{ color: '#ef4444' }} /> : <FaRegHeart />}
                </button>
                <Link to={getShopPath(`/product/${product.handle || product._id}`)}>
                    <img
                        src={resolveImageUrl(product.images && product.images.length > 0 ? product.images[0] : null, API_URL) || 'https://via.placeholder.com/300'}
                        alt={product.name}
                    />
                </Link>
            </div>

            <div className="product-card-content">
                <Link to={getShopPath(`/product/${product.handle || product._id}`)} className="product-card-link">
                    <div className="product-header-row">
                        <h3>{product.name}</h3>
                    </div>

                    <div className="price-row">
                        <div className="price-group">
                            <span className="product-price">
                                {currency.position === 'before' ? `${currency.symbol} ${Number(product.sellingPrice || 0).toLocaleString()} ` : `${Number(product.sellingPrice || 0).toLocaleString()} ${currency.symbol} `}
                            </span>
                            {product.crossedPrice > 0 &&
                                <span className="original-price">
                                    {currency.position === 'before' ? `${currency.symbol} ${Number(product.crossedPrice).toLocaleString()} ` : `${Number(product.crossedPrice).toLocaleString()} ${currency.symbol} `}
                                </span>
                            }
                        </div>
                        <div className="product-rating">
                            <FaStar className="star" />
                            <span className="rating-value">{(product.rating || 4.5).toFixed(1)}</span>
                        </div>
                    </div>
                </Link>

                {product.hasVariants ? (
                    <Link
                        to={getShopPath(`/product/${product.handle || product._id}`)}
                        className="add-to-cart-btn-small variant-btn"
                        style={{ textDecoration: 'none' }}
                    >
                        Select Variant
                    </Link>
                ) : (
                    <button className="add-to-cart-btn-small" onClick={handleAddToCart}>
                        Add to Cart
                    </button>
                )}
            </div>
        </div>
    );
};

const CategoryProducts = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [products, setProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [category, setCategory] = useState(null);
    const [selectedSubcategory, setSelectedSubcategory] = useState('all');
    const [pageNotFound, setPageNotFound] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const slugify = (text) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    };

    // Filter states (matching ProductList.js)
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [stockStatus, setStockStatus] = useState('all');
    const [selectedColors, setSelectedColors] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [availableColors, setAvailableColors] = useState([]);
    const [availableSizes, setAvailableSizes] = useState([]);
    const [sortBy, setSortBy] = useState('newest');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Detect tenant (subdomain or custom domain)
                const tenantId = getTenantId();

                const config = {
                    withCredentials: true
                };

                if (tenantId) {
                    config.headers = { 'x-subdomain': tenantId };
                }

                // Fetch categories
                const catRes = await axios.get(`${API_URL} /api/categories`, config);
                const allCats = catRes.data;
                console.log('📡 [CategoryProducts] Fetched categories:', allCats.length);
                setCategories(allCats);

                const foundCat = allCats.find(c =>
                    c._id === id ||
                    c.slug === id ||
                    slugify(c.name) === id
                );

                console.log('🔍 [CategoryProducts] Current Category ID/Slug:', id, 'Found:', foundCat?.name);
                setCategory(foundCat);

                // Fetch all products to extract variants and filter
                const productsData = await getProducts();
                console.log('📦 [CategoryProducts] Fetched all products:', productsData.length);
                setAllProducts(productsData);

                // Extract colors and sizes
                const colors = new Set();
                const sizes = new Set();
                productsData.forEach(p => {
                    if (p.variantColors) {
                        p.variantColors.forEach(c => {
                            if (c && typeof c === 'string') {
                                const normalizedColor = c.trim().charAt(0).toUpperCase() + c.trim().slice(1).toLowerCase();
                                colors.add(normalizedColor);
                            }
                        });
                    }
                    if (p.variantSizes) {
                        p.variantSizes.forEach(s => {
                            if (s && typeof s === 'string') {
                                sizes.add(s.trim());
                            }
                        });
                    }
                });
                setAvailableColors([...colors]);
                setAvailableSizes([...sizes]);

                // Subcategory Selection Logic (Slug-aware)
                const searchParams = new URLSearchParams(location.search);
                const subParam = searchParams.get('sub');
                if (subParam && subParam !== 'all') {
                    const effectiveCat = foundCat || category;

                    if (effectiveCat && effectiveCat.subcategories) {
                        const matchedSub = effectiveCat.subcategories.find(s =>
                            slugify(s.name) === subParam || s.name === subParam
                        );
                        if (matchedSub) {
                            setSelectedSubcategory(matchedSub.name);
                        } else {
                            setSelectedSubcategory(subParam);
                        }
                    } else {
                        setSelectedSubcategory(subParam);
                    }
                } else {
                    setSelectedSubcategory('all');
                }

                setLoading(false);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load products');
                setLoading(false);
            }
        };

        fetchData();
    }, [id, location.search]); // Run when ID or URL params change

    const filteredProducts = allProducts.filter(product => {
        // Category constraint (fixed for this page)
        const productCategoryId = product.category?._id || product.category;
        const targetCategoryId = category?._id; // Use the resolved category's ID

        if (!targetCategoryId || productCategoryId !== targetCategoryId) {
            return false;
        }

        // Subcategory Filter
        if (selectedSubcategory !== 'all') {
            if (product.subcategory !== selectedSubcategory) {
                return false;
            }
        }

        // Price Filter
        const price = product.sellingPrice || 0;
        if (priceRange.min !== '' && price < parseFloat(priceRange.min)) return false;
        if (priceRange.max !== '' && price > parseFloat(priceRange.max)) return false;

        // Stock Status Filter
        if (stockStatus !== 'all') {
            const totalStock = product.hasVariants
                ? (product.variants || []).reduce((acc, v) => acc + (v.quantity || 0), 0)
                : (product.quantity || 0);

            if (stockStatus === 'inStock' && totalStock <= 0) return false;
            if (stockStatus === 'outStock' && totalStock > 0) return false;
        }

        // Color Filter
        if (selectedColors.length > 0) {
            if (!product.variantColors || !product.variantColors.some(c => selectedColors.includes(c))) {
                return false;
            }
        }

        // Size Filter
        if (selectedSizes.length > 0) {
            if (!product.variantSizes || !product.variantSizes.some(s => selectedSizes.includes(s))) {
                return false;
            }
        }

        return true;
    });

    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === 'price-low') return a.sellingPrice - b.sellingPrice;
        if (sortBy === 'price-high') return b.sellingPrice - a.sellingPrice;
        if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
        return 0;
    });

    const toggleColor = (color) => {
        setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
    };

    const toggleSize = (size) => {
        setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
    };

    return (
        <div className="product-list-page">
            <div className="shop-page-wrapper">
                {/* Centered Header */}
                <div className="shop-page-header">
                    <div className="product-section-header centered">
                        {(!loading && !category) ? (
                            <NotFound />
                        ) : (
                            <h2>
                                <FaThLarge />
                                <span className="heading-first">Category:</span> <span className="heading-last">{category ? category.name : 'Loading...'}</span>
                            </h2>
                        )}
                    </div>
                </div>

                {/* Mobile Filter Toggle */}

                <div className="shop-page-content-layout">
                    {/* Sidebar */}
                    <div className={`shop-sidebar ${showMobileFilters ? 'mobile-visible' : ''}`}>
                        <div className="filters-container">
                            <div className="filter-header">
                                <h3>FILTER BY:</h3>
                            </div>

                            <div className="sidebar-widget">
                                <h3>Categories</h3>
                                <ul className="categories-list">
                                    <li
                                        className={!id ? 'active' : ''}
                                        onClick={() => navigate(getShopPath('/products'))}
                                    >All Categories</li>
                                    {categories.map(cat => (
                                        <React.Fragment key={cat._id}>
                                            <li
                                                className={(category?._id === cat._id) ? 'active' : ''}
                                                onClick={() => navigate(getShopPath(`/ category / ${cat.slug || slugify(cat.name)} `))}
                                            >
                                                {cat.name}
                                            </li>
                                            {/* Subcategories for active category */}
                                            {(category?._id === cat._id) && cat.subcategories && cat.subcategories.length > 0 && (
                                                <ul className="subcategories-list">
                                                    <li
                                                        className={selectedSubcategory === 'all' ? 'active-sub' : ''}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(getShopPath(`/ category / ${cat.slug || slugify(cat.name)} `));
                                                        }}
                                                    >
                                                        — All {cat.name}
                                                    </li>
                                                    {cat.subcategories.map(sub => (
                                                        <li
                                                            key={sub.name}
                                                            className={selectedSubcategory === sub.name ? 'active-sub' : ''}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigate(getShopPath(`/ category / ${cat.slug || slugify(cat.name)}?sub = ${slugify(sub.name)} `));
                                                            }}
                                                        >
                                                            — {sub.name}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </ul>
                            </div>

                            <div className="filter-divider"></div>

                            <div className="sidebar-widget">
                                <h3>Price</h3>
                                <div className="price-filter-group">
                                    <div className="price-input-col">
                                        <label>From</label>
                                        <input
                                            type="number"
                                            value={priceRange.min}
                                            placeholder="0"
                                            onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                                        />
                                    </div>
                                    <span className="price-dash">-</span>
                                    <div className="price-input-col">
                                        <label>To</label>
                                        <input
                                            type="number"
                                            value={priceRange.max}
                                            placeholder="Max"
                                            onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="filter-divider"></div>

                            <div className="sidebar-widget">
                                <h3>Stock Status</h3>
                                <div className="checkbox-list">
                                    <label className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={stockStatus === 'inStock'}
                                            onChange={() => setStockStatus(stockStatus === 'inStock' ? 'all' : 'inStock')}
                                        />
                                        <span className="checkmark"></span>
                                        In Stock
                                    </label>
                                    <label className="checkbox-item">
                                        <input
                                            type="checkbox"
                                            checked={stockStatus === 'outStock'}
                                            onChange={() => setStockStatus(stockStatus === 'outStock' ? 'all' : 'outStock')}
                                        />
                                        <span className="checkmark"></span>
                                        Out Of Stock
                                    </label>
                                </div>
                            </div>

                            {availableColors.length > 0 && (
                                <>
                                    <div className="filter-divider"></div>
                                    <div className="sidebar-widget">
                                        <h3>Product Colors</h3>
                                        <div className="checkbox-list">
                                            {availableColors.map(color => (
                                                <label key={color} className="checkbox-item">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedColors.includes(color)}
                                                        onChange={() => toggleColor(color)}
                                                    />
                                                    <span className="checkmark"></span>
                                                    {color}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {availableSizes.length > 0 && (
                                <>
                                    <div className="filter-divider"></div>
                                    <div className="sidebar-widget">
                                        <h3>Product Sizes</h3>
                                        <div className="checkbox-list">
                                            {availableSizes.map(size => (
                                                <label key={size} className="checkbox-item">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSizes.includes(size)}
                                                        onChange={() => toggleSize(size)}
                                                    />
                                                    <span className="checkmark"></span>
                                                    {size}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Main Grid */}
                    <div className="shop-main-content">
                        {sortedProducts.length > 0 && (
                            <div className="shop-controls-bar">
                                <div className="results-count">
                                    Showing {sortedProducts.length} {sortedProducts.length === 1 ? 'result' : 'results'}
                                </div>
                                <div className="sort-wrapper">
                                    <span className="sort-label">SORT BY</span>
                                    <select
                                        className="sort-select"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value)}
                                    >
                                        <option value="newest">Newest</option>
                                        <option value="price-low">Price: Low to High</option>
                                        <option value="price-high">Price: High to Low</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <button
                            className="mobile-filter-toggle"
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                        >
                            <FaFilter /> {showMobileFilters ? 'Hide Filters' : 'Show Filters'}
                        </button>

                        <div className="product-grid-container">
                            <div className="ecommerce-product-grid">
                                {loading ? (
                                    <p>Loading products...</p>
                                ) : error ? (
                                    <p>{error}</p>
                                ) : sortedProducts.length > 0 ? (
                                    sortedProducts.map(product => <ProductCard key={product._id} product={product} />)
                                ) : (
                                    <div className="no-products-premium">
                                        <div className="empty-icon-circle">
                                            <FaBoxOpen />
                                        </div>
                                        <div className="empty-content">
                                            <h3>Oops! It's empty here.</h3>
                                            <p>We couldn't find any "{category ? category.name : 'products'}" right now. Try adjusting your filters or explore our latest drops.</p>
                                            <button className="explore-new-btn" onClick={() => navigate(getShopPath('/products'))}>
                                                Explore New Arrivals
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryProducts;
