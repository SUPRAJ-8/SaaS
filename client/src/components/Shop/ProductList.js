import React, { useState, useEffect, useContext } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatchCart } from './CartProvider';
import { getProducts } from '../../services/productService';
import { ThemeContext } from '../../contexts/ThemeContext';
import { FaRegHeart, FaFire, FaStar, FaTh, FaClock, FaChevronRight } from 'react-icons/fa';
import API_URL from '../../apiConfig';
import axios from 'axios';
import { getShopPath, resolveImageUrl } from '../../themeUtils';

// Import Templates
import ProductGridTemplate from '../Dashboard/templates/ProductGridTemplate';
import HeroTemplate from '../Dashboard/templates/HeroTemplate';
import CategoryGridTemplate from '../Dashboard/templates/CategoryGridTemplate';
import FAQTemplate from '../Dashboard/templates/FAQTemplate';
import RichTextTemplate from '../Dashboard/templates/RichTextTemplate';
import ModernHeroTemplate from '../Dashboard/templates/ModernHeroTemplate';
import NotFound from '../../pages/NotFound';

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

  /* STOCK CALCULATION */
  const totalStock = product.hasVariants
    ? (product.variants || []).reduce((acc, v) => acc + (v.quantity || 0), 0)
    : (product.quantity || 0);
  const isOutOfStock = totalStock <= 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (isOutOfStock) return; // Prevent adding if out of stock

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

  return (
    <div className={`ecommerce-product-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
      <Link to={getShopPath(`/product/${product._id}`)} className="product-card-link">
        <div className="product-image-container">
          {discount > 0 && !isOutOfStock && <div className="discount-badge">{discount}% OFF</div>}
          {isOutOfStock && <div className="out-of-stock-badge">OUT OF STOCK</div>}
          <button className="wishlist-btn" onClick={(e) => e.preventDefault()}>
            <FaRegHeart />
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
      <button
        className="add-to-cart-btn-small"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        style={isOutOfStock ? { cursor: 'not-allowed', opacity: 0.6, backgroundColor: '#9ca3af', borderColor: '#9ca3af' } : {}}
      >
        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
      </button>
    </div>
  );
};

const ProductSection = ({ title, icon, products, loading, error, showExploreAll = false, exploreLink = "/", hideHeader = false }) => {
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
            <Link to={getShopPath('/products')} className="explore-all-btn">
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
      <Link to={getShopPath('/products')} className="explore-all-btn">
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
  const isNexus = theme.id === 'nexus' || localStorage.getItem('themeId') === 'nexus';
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
  const [pageNotFound, setPageNotFound] = useState(false);

  const resetFilters = (e) => {
    if (e) e.preventDefault();
    setSelectedCategory('all');
    setPriceRange({ min: '', max: '' });
    setStockStatus('all');
    setSelectedColors([]);
    setSelectedSizes([]);
    setSortBy('newest');
  };

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
        // Construct Axios config for categories (similar to productService)
        const hostname = window.location.hostname;
        let subdomain = null;
        if (hostname.endsWith('.localhost')) {
          subdomain = hostname.split('.')[0];
        } else if (hostname.endsWith('.nepostore.xyz') && hostname !== 'nepostore.xyz' && hostname !== 'www.nepostore.xyz') {
          subdomain = hostname.split('.')[0];
        }

        const categoryConfig = {
          withCredentials: true
        };

        if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'localhost') {
          categoryConfig.headers = { 'x-subdomain': subdomain };
        }

        const [popular, featured, all, catsResponse] = await Promise.all([
          getProducts({ section: 'Popular', status: 'Active' }),
          getProducts({ section: 'Featured', status: 'Active' }),
          getProducts(),
          axios.get(`${API_URL}/api/categories`, categoryConfig)
        ]);

        const cats = catsResponse.data;

        setPopularProducts(popular);
        setFeaturedProducts(featured);
        setAllProducts(all);
        setCategories(cats || []);

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

  const [loadingDynamic, setLoadingDynamic] = useState(isNexus);

  // Load dynamic sections for Nexus Theme
  useEffect(() => {
    if (isNexus) {
      setLoadingDynamic(true);
      const fetchDynamicContent = async () => {
        let currentSlug = slug || 'new-page'; // Default to home/new-page if no slug

        // 1. Check if we are on a real shop subdomain
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        let subdomain = null;

        if (hostname.endsWith('.localhost')) {
          subdomain = parts[0];
        } else if (hostname.endsWith('.nepostore.xyz')) {
          subdomain = parts[0];
        } else if (parts.length > 2) {
          subdomain = parts[0];
        }

        // 2. Fetch from API if on a shop subdomain
        if (subdomain && subdomain !== 'app' && subdomain !== 'www' && subdomain !== 'localhost') {
          try {
            // If slug is empty, we want the home page (slug: "")
            const targetSlug = slug || '';

            const response = await axios.get(`${API_URL}/api/client-pages/public/${subdomain}?slug=${targetSlug}`);
            if (response.data && response.data.content) {
              setDynamicSections(JSON.parse(response.data.content));
              setLoadingDynamic(false);
              return;
            }
          } catch (error) {
            // Ignore 404s (page not found) as we fallback to standard view
            if (!error.response || error.response.status !== 404) {
              console.error('Failed to fetch dynamic sections from API:', error);
            }
          }
        }

        // 3. Fallback: LocalStorage (for Dashboard Preview or if API fails context)
        // We need to map the slug (from URL) to the page ID (used for storage keys)
        currentSlug = slug || ''; // Normalize home slug
        let pageId = null;

        try {
          const savedPages = JSON.parse(localStorage.getItem('site_pages') || '[]');
          const pageEntry = savedPages.find(p => p.slug === currentSlug);
          if (pageEntry) {
            pageId = pageEntry.id;
          }
        } catch (e) {
          console.error("Error finding page ID from slug:", e);
        }

        // Try different keys in priority: 
        // 1. the specific page ID (e.g. page_3_sections)
        // 2. the direct slug (e.g. page_vision_sections)
        // 3. common fallbacks for home page
        let savedSections = null;
        if (pageId) savedSections = localStorage.getItem(`page_${pageId}_sections`);
        if (!savedSections) savedSections = localStorage.getItem(`page_${currentSlug}_sections`);
        if (!savedSections && !slug) {
          savedSections = localStorage.getItem('page_new-page_sections');
        }

        if (savedSections) {
          try {
            setDynamicSections(JSON.parse(savedSections));
            setPageNotFound(false);
          } catch (e) {
            console.error('Failed to load dynamic sections from local:', e);
            setDynamicSections([]);
            if (slug && slug !== 'products') setPageNotFound(true);
          }
        } else {
          // If no sections found and we have a custom slug, it's a 404
          if (slug && slug !== 'products') {
            setPageNotFound(true);
          } else {
            setPageNotFound(false);
          }
        }
        setLoadingDynamic(false);
      };

      fetchDynamicContent();
    } else {
      // If not Nexus, behavior depends on slug
      if (slug && slug !== 'products') {
        setPageNotFound(true);
      } else {
        setPageNotFound(false);
      }
    }
  }, [theme.id, slug, isNexus]);


  const toggleColor = (color) => {
    setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color]);
  };

  const toggleSize = (size) => {
    setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]);
  };


  if (pageNotFound) {
    return <NotFound />;
  }

  // Show loading spinner if waiting for dynamic content logic to resolve (Nexus only)
  if (isNexus && loadingDynamic) {
    return (
      <div className="product-list-page nexus-theme">
        <div style={{ minHeight: '60vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className={`product-list-page ${isNexus ? 'nexus-theme' : ''}`}>
      {(theme.id === 'ecommerce' && !slug) && (
        <>
          <ProductSection title="Popular Products" icon={<FaFire />} products={popularProducts} loading={loading} error={error} showExploreAll={true} exploreLink={getShopPath('/products')} />
          <ProductSection title="Featured Products" icon={<FaStar />} products={featuredProducts} loading={loading} error={error} showExploreAll={true} exploreLink={getShopPath('/products')} />
          <RecentlyViewedSection products={recentlyViewedProducts} />
          <ProductSection title="All Products" icon={<FaTh />} products={allProducts} loading={loading} error={error} />
        </>
      )}

      {/* Standard Products View: Sidebar + Grid */}
      {/* Shown when: 1. On /products path, OR 2. Non-Nexus theme, OR 3. Nexus theme but NO dynamic sections found */}
      {(slug === 'products' ||
        (slug && theme.id !== 'nexus' && localStorage.getItem('themeId') !== 'nexus') ||
        (theme.id === 'nexus' && dynamicSections.length === 0 && !loadingDynamic)
      ) && (
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
                    <h3>Filter By <span onClick={resetFilters} className="reset-filter-link" style={{ cursor: 'pointer' }}>Reset All</span></h3>
                  </div>

                  <div className="sidebar-widget">
                    <h3>CATEGORIES</h3>
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
                    <h3>PRICE</h3>
                    <div className="price-filter-group">
                      <div className="price-input-col">
                        <input
                          type="number"
                          value={priceRange.min}
                          placeholder="NPR Min"
                          onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })}
                        />
                      </div>
                      <span className="price-dash">-</span>
                      <div className="price-input-col">
                        <input
                          type="number"
                          value={priceRange.max}
                          placeholder="NPR Max"
                          onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="filter-divider"></div>

                  <div className="sidebar-widget">
                    <h3>STOCK STATUS</h3>
                    <div className="checkbox-list">
                      <label className="checkbox-item round-checkbox">
                        <input
                          type="checkbox"
                          checked={stockStatus === 'inStock'}
                          onChange={() => setStockStatus(stockStatus === 'inStock' ? 'all' : 'inStock')}
                        />
                        <span className="checkmark"></span>
                        In Stock
                      </label>
                      <label className="checkbox-item round-checkbox">
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
                        <h3>PRODUCT COLORS</h3>
                        <div className="checkbox-list">
                          {availableColors.map(color => (
                            <label key={color} className="checkbox-item round-checkbox">
                              <input
                                type="checkbox"
                                checked={selectedColors.includes(color)}
                                onChange={() => toggleColor(color)}
                              />
                              <span className="checkmark"></span>
                              <span style={{ textTransform: 'capitalize' }}>{color}</span>
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
                        <h3>PRODUCT SIZES</h3>
                        <div className="size-box-list">
                          {availableSizes.map(size => (
                            <label key={size} className={`size-box-item ${selectedSizes.includes(size) ? 'active' : ''}`}>
                              <input
                                type="checkbox"
                                checked={selectedSizes.includes(size)}
                                onChange={() => toggleSize(size)}
                              />
                              <span className="size-label" style={{ textTransform: 'uppercase' }}>{size}</span>
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
                    Showing <span className="count-highlight">{sortedProducts.length}</span> {sortedProducts.length === 1 ? 'result' : 'results'}
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

      {((theme.id === 'nexus' || localStorage.getItem('themeId') === 'nexus') && slug !== 'products' && dynamicSections.length > 0) && (
        <div className="nexus-dynamic-content">
          {dynamicSections.length > 0 && (
            dynamicSections.map((section, index) => {
              const TemplateComponent = SECTION_TEMPLATES[section.type];
              if (!TemplateComponent) return null;
              return (
                <div key={section.id || index} className="dynamic-section-wrapper">
                  <TemplateComponent content={section.content} />
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ProductList;