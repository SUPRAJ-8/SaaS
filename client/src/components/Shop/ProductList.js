import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatchCart } from './CartProvider';
import { getProducts } from '../../services/productService';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaRegHeart, FaFire, FaStar, FaTh, FaClock, FaChevronRight } from 'react-icons/fa';

// Import Templates
import ProductGridTemplate from '../Dashboard/templates/ProductGridTemplate';
import HeroTemplate from '../Dashboard/templates/HeroTemplate';
import CategoryGridTemplate from '../Dashboard/templates/CategoryGridTemplate';
import FAQTemplate from '../Dashboard/templates/FAQTemplate';
import RichTextTemplate from '../Dashboard/templates/RichTextTemplate';
import ModernHeroTemplate from '../Dashboard/templates/ModernHeroTemplate';

const SECTION_TEMPLATES = {
  'product-grid': ProductGridTemplate,
  'product-grid-basic': ProductGridTemplate,
  'hero-impact': HeroTemplate,
  'hero': HeroTemplate,
  'category-list': CategoryGridTemplate,
  'faq-accordion': FAQTemplate,
  'faq': FAQTemplate,
  'rich-text': RichTextTemplate,
  'modern-hero': ModernHeroTemplate
};

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

  const handleAddToCart = (e) => {
    e.preventDefault();
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

  return (
    <div className="ecommerce-product-card">
      <Link to={`/shop/product/${product._id}`} className="product-card-link">
        <div className="product-image-container">
          {discount > 0 && <div className="discount-badge">{discount}% OFF</div>}
          <button className="wishlist-btn" onClick={(e) => e.preventDefault()}>
            <FaRegHeart />
          </button>
          <img src={product.images && product.images.length > 0 ? `http://localhost:5002${product.images[0]}` : 'https://via.placeholder.com/300'} alt={product.name} />
        </div>
        <div className="product-details">
          <h3>{product.name}</h3>
          <div className="product-price-actions">
            <div className="price-container">
              <span className="product-price">
                {currency.position === 'before' ? `${currency.symbol} ${Number(product.sellingPrice || 0).toLocaleString()}` : `${Number(product.sellingPrice || 0).toLocaleString()} ${currency.symbol}`}
              </span>
              {product.crossedPrice > 0 &&
                <span className="original-price">
                  {currency.position === 'before' ? `${currency.symbol} ${Number(product.crossedPrice).toLocaleString()}` : `${Number(product.crossedPrice).toLocaleString()} ${currency.symbol}`}
                </span>
              }
            </div>
            <div className="product-rating">
              <FaStar className="star" />
              <span className="rating-value">{(product.rating || 4.5).toFixed(1)}</span>
            </div>
          </div>
        </div>
      </Link>
      <button className="add-to-cart-btn-small" onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
};

const ProductSection = ({ title, icon, products, loading, error, showExploreAll = false, exploreLink = "/shop", hideHeader = false }) => {
  const words = title.split(' ');
  const lastWord = words.pop();
  const firstPart = words.join(' ');

  return (
    <div className="product-grid-container">
      {!hideHeader && (
        <div className="product-section-header">
          <h2>
            {icon}
            <span className="heading-first">{firstPart}</span> <span className="heading-last">{lastWord}</span>
          </h2>
          {showExploreAll && (
            <Link to="/shop/products" className="explore-all-btn">
              EXPLORE ALL <FaChevronRight />
            </Link>
          )}
        </div>
      )}
      <div className="ecommerce-product-grid">
        {loading && <p>Loading products...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

const RecentlyViewedSection = ({ products }) => (
  <div className="recently-viewed-section">
    <div className="recently-viewed-header">
      <h2>
        <FaClock />
        <span className="heading-first">Recently Viewed</span> <span className="heading-last">Products</span>
      </h2>
      <Link to="/shop/products" className="explore-all-btn">
        EXPLORE ALL <FaChevronRight />
      </Link>
    </div>
    {products.length === 0 ? (
      <div className="no-recently-viewed">
        <div className="empty-box-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
        </div>
        <h3>No Recently Viewed Products</h3>
        <p>No recently viewed products available. Start browsing to see your recently viewed items here.</p>
      </div>
    ) : (
      <div className="ecommerce-product-grid">
        {products.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    )}
  </div>
);

const ProductList = () => {
  const { theme } = useContext(ThemeContext) || { theme: { id: 'ecommerce' } };
  const { slug } = useParams();
  const [allProducts, setAllProducts] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [recentlyViewedProducts, setRecentlyViewedProducts] = useState([]);
  const [dynamicSections, setDynamicSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [stockStatus, setStockStatus] = useState('all');
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [sortBy, setSortBy] = useState('newest');

  const filteredProducts = allProducts.filter(product => {
    // ... filtering logic ...
    // Category Filter
    if (selectedCategory !== 'all' && product.category && product.category._id !== selectedCategory && product.category !== selectedCategory) {
      return false;
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [popular, featured, all, cats] = await Promise.all([
          getProducts({ section: 'Popular' }),
          getProducts({ section: 'Featured' }),
          getProducts(),
          fetch('/api/categories').then(res => res.json())
        ]);
        setPopularProducts(popular);
        setFeaturedProducts(featured);
        setAllProducts(all);
        setCategories(cats);

        // Extract available colors and sizes
        const colors = new Set();
        const sizes = new Set();
        all.forEach(p => {
          if (p.variantColors) p.variantColors.forEach(c => colors.add(c));
          if (p.variantSizes) p.variantSizes.forEach(s => sizes.add(s));
        });
        setAvailableColors([...colors]);
        setAvailableSizes([...sizes]);

        // Fetch recently viewed products from localStorage
        const recentlyViewedIds = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        const recentlyViewed = all.filter(product => recentlyViewedIds.includes(product._id));
        // Sort by the order in localStorage (most recent first)
        const sortedRecentlyViewed = recentlyViewedIds
          .map(id => recentlyViewed.find(p => p._id === id))
          .filter(Boolean)
          .slice(0, 6); // Show only last 6 products
        setRecentlyViewedProducts(sortedRecentlyViewed);
      } catch (err) {
        setError('Failed to fetch data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load dynamic sections for Nexus Theme
  useEffect(() => {
    if (theme.id === 'nexus' || localStorage.getItem('themeId') === 'nexus') {
      // Find page ID from slug
      const savedPages = JSON.parse(localStorage.getItem('site_pages') || '[]');
      const currentSlug = slug || '';
      const currentPage = savedPages.find(p => p.slug === currentSlug && p.themeId === 'nexus');

      const pageId = currentPage ? currentPage.id : 3; // Fallback to 3 (Home) if not found
      const pageKey = `page_${pageId}_sections`;
      const savedSections = localStorage.getItem(pageKey);

      if (savedSections) {
        try {
          setDynamicSections(JSON.parse(savedSections));
        } catch (e) {
          console.error('Failed to load dynamic sections:', e);
          setDynamicSections([]);
        }
      } else {
        setDynamicSections([]); // Clear if no sections for this page
      }
    }
  }, [theme.id, slug]);


  const toggleColor = (color) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const toggleSize = (size) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };

  return (
    <div className="product-list-page">
      <div className="ecommerce-layout">
        {(theme.id === 'ecommerce' && !slug) && (
          <>
            <ProductSection title="Popular Products" icon={<FaFire />} products={popularProducts} loading={loading} error={error} showExploreAll={true} exploreLink="/shop/products" />
            <ProductSection title="Featured Products" icon={<FaStar />} products={featuredProducts} loading={loading} error={error} showExploreAll={true} exploreLink="/shop/products" />
            <RecentlyViewedSection products={recentlyViewedProducts} />
            <ProductSection title="All Products" icon={<FaTh />} products={allProducts} loading={loading} error={error} />
          </>
        )}

        {(slug === 'products') && (
          <div className="shop-page-wrapper">
            <div className="shop-page-header">
              <div className="product-section-header centered">
                <h2>
                  <FaTh />
                  <span className="heading-first">All</span> <span className="heading-last">Products</span>
                </h2>
              </div>
            </div>

            <div className="shop-page-content-layout">
              {/* Sidebar */}
              <div className="shop-sidebar">
                <div className="filters-container">
                  <div className="filter-header">
                    <h3>FILTER BY:</h3>
                  </div>

                  <div className="sidebar-widget">
                    <h3>Categories</h3>
                    <ul className="categories-list">
                      <li
                        className={selectedCategory === 'all' ? 'active' : ''}
                        onClick={() => setSelectedCategory('all')}
                      >All Categories</li>
                      {categories.map(cat => (
                        <li
                          key={cat._id}
                          className={selectedCategory === cat._id ? 'active' : ''}
                          onClick={() => setSelectedCategory(cat._id)}
                        >
                          {cat.name}
                        </li>
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
                <ProductSection title="All Products" icon={<FaTh />} products={sortedProducts} loading={loading} error={error} hideHeader={true} />
              </div>
            </div>
          </div>
        )}

        {((theme.id === 'nexus' || localStorage.getItem('themeId') === 'nexus') && slug !== 'products') && (
          <div className="nexus-dynamic-content">
            {dynamicSections.length > 0 ? (
              dynamicSections.map((section, index) => {
                const TemplateComponent = SECTION_TEMPLATES[section.type];
                if (!TemplateComponent) return null;
                return (
                  <div key={section.id || index} className="dynamic-section-wrapper">
                    <TemplateComponent content={section.content} />
                  </div>
                );
              })
            ) : (
              <div className="default-page-preview">
                <ModernHeroTemplate content={{
                  title: ".visual poetry",
                  highlightedText: "poetry",
                  subtitle: "Welcome to a visual journey that transcends time and space. Discover the artistry of moments captured in motion",
                  primaryBtnText: "Start Exploring Now",
                  secondaryBtnText: "Watch Video",
                  checklistItems: ["250k+ Videos", "800k+ Hours watched"],
                  imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
                  paddingTop: 80,
                  paddingBottom: 80
                }} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductList;