import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatchCart } from './CartProvider';
import { getProductById } from '../../services/productService';
import './ProductDetail.css';
import API_URL from '../../apiConfig';
import NotFound from '../../pages/NotFound';
import { getShopPath, resolveImageUrl } from '../../themeUtils';
import { useTheme } from '../../contexts/ThemeContext';

const ProductDetail = () => {
  const { theme } = useTheme();
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
  const dispatch = useDispatchCart();
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);

  const totalStock = useMemo(() => {
    if (product && product.hasVariants && product.variants.length > 0) {
      return product.variants.reduce((total, variant) => total + (variant.quantity || 0), 0);
    }
    return product ? product.quantity : 0;
  }, [product]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [activeTab, setActiveTab] = useState('description');
  const [zoomStyle, setZoomStyle] = useState({});
  const [isAutoChangePaused, setIsAutoChangePaused] = useState(false);

  useEffect(() => {
    let interval;
    if (product && product.images && product.images.length > 1 && !isAutoChangePaused) {
      interval = setInterval(() => {
        setSelectedImage((prev) => (prev + 1) % product.images.length);
      }, 3000); // Change every 3 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [product, isAutoChangePaused]);

  const selectedVariant = useMemo(() => {
    if (product && product.hasVariants && selectedColor && selectedSize) {
      return product.variants.find(
        (variant) => variant.color === selectedColor && variant.size === selectedSize
      );
    }
    return null;
  }, [product, selectedColor, selectedSize]);

  const maxQuantity = useMemo(() => {
    if (selectedVariant) {
      return selectedVariant.quantity;
    }
    if (product && !product.hasVariants) {
      return totalStock;
    }
    // If variants exist but none is selected, there's no specific stock limit to enforce yet.
    // We can return a high number or handle this in the UI.
    // For now, let's use totalStock as a fallback.
    return totalStock;
  }, [product, selectedVariant, totalStock]);

  // Check if product is out of stock
  const isOutOfStock = useMemo(() => {
    if (product && product.hasVariants) {
      // If variants exist and one is selected, check its quantity
      if (selectedVariant) {
        return selectedVariant.quantity === 0;
      }
      // If no variant selected, check if total stock is 0
      return totalStock === 0;
    }
    // For non-variant products, check total stock
    return totalStock === 0;
  }, [product, selectedVariant, totalStock]);

  useEffect(() => {
    // When the selected variant changes, cap the quantity at the new max quantity.
    if (quantity > maxQuantity) {
      setQuantity(maxQuantity > 0 ? maxQuantity : 1);
    }
  }, [maxQuantity, quantity]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await getProductById(id);
        setProduct(data);

        // Track recently viewed product
        if (data && data._id) {
          const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
          // Remove if already exists to avoid duplicates
          const filtered = recentlyViewed.filter(productId => productId !== data._id);
          // Add to beginning (most recent first)
          const updated = [data._id, ...filtered].slice(0, 12); // Keep only last 12
          localStorage.setItem('recentlyViewed', JSON.stringify(updated));
        }

        if (data && data.hasVariants) {
          if (data.variantColors && data.variantColors.length > 0) {
            setSelectedColor(data.variantColors[0]);
          }
          if (data.variantSizes && data.variantSizes.length > 0) {
            setSelectedSize(data.variantSizes[0]);
          }
        }
      } catch (err) {
        setError('Failed to fetch product details.');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleQuantityChange = (amount) => {
    setQuantity(prev => {
      const newQuantity = prev + amount;
      if (newQuantity < 1) return 1;
      if (newQuantity > maxQuantity) return maxQuantity;
      return newQuantity;
    });
  };

  const handleQuantityInputChange = (e) => {
    const value = e.target.value;
    if (value === '') {
      setQuantity('');
      return;
    }
    const num = parseInt(value, 10);
    if (!isNaN(num) && num > 0) {
      setQuantity(Math.min(num, maxQuantity));
    } else if (!isNaN(num) && num < 1) {
      setQuantity(1);
    }
  };

  const handleQuantityBlur = () => {
    if (quantity === '' || quantity < 1) {
      setQuantity(1);
    }
  };

  const handleBuyNow = () => {
    // First, add the item to the cart
    handleAddToCart();
    // Then, navigate to checkout
    navigate(getShopPath('/checkout'));
  };

  const handleAddToCart = () => {
    const cartItem = {
      id: product._id,
      name: product.name,
      price: product.sellingPrice,
      image: `${API_URL}${product.images[0]}`,
      quantity: quantity,
      variant: selectedVariant
        ? `Variant: ${selectedVariant.color.charAt(0).toUpperCase() + selectedVariant.color.slice(1)}/${selectedVariant.size.toUpperCase()}`
        : null
    };
    dispatch({ type: 'ADD_ITEM', payload: cartItem });

    // Open cart panel after adding
    setTimeout(() => {
      window.dispatchEvent(new Event('openCartPanel'));
    }, 100);
  };

  /* ZOOM LOGIC HANDLERS */
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;
    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(1.8)'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });
  };

  if (loading) {
    return <p>Loading product...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!product) {
    return <NotFound />;
  }

  const originalPrice = product.crossedPrice || 0;
  const sellingPrice = product.sellingPrice || 0;
  const discount = originalPrice > 0 ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100) : 0;

  const processDescription = (html) => {
    if (!html) return '';

    // Helper to extract YouTube ID
    const getYouTubeId = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };

    // Replace anchor tags pointing to YouTube with iframes
    let processed = html.replace(
      /<a\s+(?:[^>]*?\s+)?href="(https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\/[^"]+)"[^>]*>.*?<\/a>/gi,
      (match, url) => {
        const videoId = getYouTubeId(url);
        if (videoId) {
          return `<div class="video-container"><iframe src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>`;
        }
        return match;
      }
    );

    return processed;
  };


  return (
    <div className="product-list-page">
      <div className="shop-page-wrapper">
        <div className="breadcrumb">
          <Link to={getShopPath('/')}>Home</Link> &nbsp;/&nbsp;
          <Link to={getShopPath('/products')}>Products</Link> &nbsp;/&nbsp;
          <span>{product.name}</span>
        </div>
        <div className="product-detail-content">
          <div
            className="product-gallery"
            onMouseEnter={() => setIsAutoChangePaused(true)}
            onMouseLeave={() => setIsAutoChangePaused(false)}
          >
            {/* Sidebar for Desktop: first 6 images */}
            <div className="thumbnail-sidebar hide-on-mobile">
              {product.images && product.images.slice(0, 6).map((image, index) => (
                <img
                  key={index}
                  src={resolveImageUrl(image, API_URL)}
                  alt={`${product.name} thumbnail ${index + 1}`}
                  className={`thumbnail-image ${selectedImage === index ? 'active' : ''}`}
                  onClick={() => setSelectedImage(index)}
                />
              ))}
            </div>

            <div className="gallery-main-group">
              <div
                className="main-image-container"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <img
                  src={resolveImageUrl(product.images && product.images.length > 0 ? product.images[selectedImage] : null, API_URL) || 'https://via.placeholder.com/400x400.png?text=No+Image'}
                  alt={product.name}
                  className="main-product-image"
                  style={zoomStyle}
                />
                <div className="zoom-text">Hover to zoom</div>
              </div>

              {/* Bottom Row for Desktop: images 7 and onwards */}
              {product.images && product.images.length > 6 && (
                <div className="thumbnail-bottom hide-on-mobile">
                  {product.images.slice(6).map((image, sliceIndex) => {
                    const absoluteIndex = sliceIndex + 6;
                    return (
                      <img
                        key={absoluteIndex}
                        src={resolveImageUrl(image, API_URL)}
                        alt={`${product.name} thumbnail ${absoluteIndex + 1}`}
                        className={`thumbnail-image ${selectedImage === absoluteIndex ? 'active' : ''}`}
                        onClick={() => setSelectedImage(absoluteIndex)}
                      />
                    );
                  })}
                </div>
              )}

              {/* Mobile-only: Full row of thumbnails */}
              <div className="thumbnail-mobile-row show-on-mobile">
                {product.images && product.images.map((image, index) => (
                  <img
                    key={index}
                    src={resolveImageUrl(image, API_URL)}
                    alt={`${product.name} thumbnail ${index + 1}`}
                    className={`thumbnail-image ${selectedImage === index ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="product-detail-info">
            <h1 className="product-detail-name"><b>{product.name}</b></h1>
            <div className="product-stats">
              <span className="product-rating"><span className="star">★</span><span className="rating-text"> {(product.rating || 0).toFixed(1)} </span><span className="reviews-text">({product.reviews || 0} reviews) </span></span>
              <span className="product-sold">{product.sold || 0} sold</span>
            </div>
            <div className="product-price-container">
              <span className="product-selling-price">
                {currency.position === 'before' ? `${currency.symbol} ${sellingPrice.toLocaleString()}` : `${sellingPrice.toLocaleString()} ${currency.symbol}`}
              </span>
              {originalPrice > sellingPrice && (
                <span className="product-original-price">
                  {currency.position === 'before' ? `${currency.symbol} ${originalPrice.toLocaleString()}` : `${originalPrice.toLocaleString()} ${currency.symbol}`}
                </span>
              )}
              {discount > 0 && (
                <span className="product-discount">-{discount}% OFF</span>
              )}
            </div>
            <div className="product-stock">
              {selectedVariant ? (
                selectedVariant.quantity > 0 ? (
                  <span>
                    <span className="stock-dot"></span>In Stock
                    {selectedVariant.quantity <= 10 && (
                      <span className="low-stock-warning"> (Only {selectedVariant.quantity} left!)</span>
                    )}
                  </span>
                ) : (
                  <span className="out-of-stock">Out of Stock</span>
                )
              ) : totalStock > 0 ? (
                <span>
                  <span className="stock-dot"></span>In Stock
                  {totalStock <= 10 && !product.hasVariants && (
                    <span className="low-stock-warning"> (Only {totalStock} left)</span>
                  )}
                </span>
              ) : (
                <span className="out-of-stock">Out of Stock</span>
              )}
            </div>
            <div className="product-options-header">
              {product.hasVariants && <span>Choose Options</span>}
              <div className="options-right">
                {product.hasVariants && <a href="#" className="size-guide">Size Guide</a>}
                <div className="quantity-selector">
                  <span>Quantity</span>
                  <div className="quantity-control">
                    <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1 || isOutOfStock}>-</button>
                    <input
                      type="number"
                      className="quantity-input"
                      value={quantity}
                      onChange={handleQuantityInputChange}
                      onBlur={handleQuantityBlur}
                      min="1"
                      disabled={isOutOfStock}
                    />
                    <button onClick={() => handleQuantityChange(1)} disabled={quantity >= maxQuantity || isOutOfStock}>+</button>
                  </div>
                </div>
              </div>
            </div>
            {product.hasVariants && (
              <div className="option-row">
                <div className="option-group">
                  <label>Choose Color</label>
                  <div className="color-swatches">
                    {product.variantColors && product.variantColors.map(color => (
                      <div key={color} className={`color-option ${selectedColor === color ? 'active' : ''}`}>
                        <button
                          className="color-swatch"
                          style={{ '--swatch-bg': color.toLowerCase() }}
                          onClick={() => setSelectedColor(color)}
                        ></button>
                        <span>{color.charAt(0).toUpperCase() + color.slice(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="option-group">
                  <label>Choose Size</label>
                  <div className="size-buttons">
                    {product.variantSizes && product.variantSizes.map(size => (
                      <button key={size} className={`size-button ${selectedSize === size ? 'active' : ''}`} onClick={() => setSelectedSize(size)}>{size.toUpperCase()}</button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div className="action-buttons">
              <button
                className="buy-now-btn"
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                title={isOutOfStock ? 'Out of Stock' : 'Buy Now'}
              >
                {isOutOfStock ? 'Out of Stock' : 'Buy Now'}
              </button>
              <button
                className="add-to-cart-btn-detail"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                title={isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              >
                {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>

          </div>
        </div>

        <div className="product-bottom-tabs">
          <div className="tabs-header">
            <button
              className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({product.reviews || 0})
            </button>
          </div>
          <div className="tab-content">
            {activeTab === 'description' && (
              <div className="description-content">
                {product.longDescription ? (
                  <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: processDescription(product.longDescription) }} />
                ) : (
                  <div style={{ whiteSpace: 'pre-line' }}>
                    {product.shortDescription || 'No description available.'}
                  </div>
                )}
              </div>
            )}
            {activeTab === 'reviews' && (
              <div className="reviews-content">
                <h3>Customer Reviews</h3>
                <p>No reviews yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;