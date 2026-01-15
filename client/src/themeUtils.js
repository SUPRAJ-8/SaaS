// Helper to get RGB from Hex
const hexToRgb = (hex) => {
    if (!hex) return '0, 0, 0';
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ?
        `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` :
        '0, 0, 0';
};

// Helper to update the document favicon
const updateFavicon = (url) => {
    let link = document.querySelector("link[rel~='icon']");
    if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
    }
    // If url is available, use it; otherwise fallback to the default favicon.ico
    link.href = url || '/favicon.ico';
};

export const applyStoreSettings = (providedSettings = null) => {
    let parsedSettings = providedSettings;

    if (!parsedSettings) {
        const settings = localStorage.getItem('storeSettings');
        if (settings) {
            try {
                parsedSettings = JSON.parse(settings);
            } catch (error) {
                console.error('Failed to parse store settings:', error);
            }
        }
    }

    if (parsedSettings) {
        try {
            // Apply document title (Browser Tab Name)
            // Priority: Brand Name > Store Name > Default
            const displayTitle = parsedSettings.brandName || parsedSettings.storeName || 'Ecommerce Store';
            if (displayTitle) {
                document.title = displayTitle;
            }

            // Apply favicon with fallback
            updateFavicon(parsedSettings.favicon);

            // Apply font family
            if (parsedSettings.fontFamily) {
                const fontFamily = `'${parsedSettings.fontFamily}', sans-serif`;
                document.documentElement.style.setProperty('--font-family', fontFamily);
            }

            // Apply colors
            if (parsedSettings.primaryColor) {
                const primary = parsedSettings.primaryColor;
                const primaryRgb = hexToRgb(primary);

                document.documentElement.style.setProperty('--primary-color', primary);
                document.documentElement.style.setProperty('--primary', primary);
                document.documentElement.style.setProperty('--primary-color-rgb', primaryRgb);
                document.documentElement.style.setProperty('--primary-light', `rgba(${primaryRgb}, 0.15)`);

                // Common layout mappings
                document.documentElement.style.setProperty('--theme-primary', primary);
                document.documentElement.style.setProperty('--theme-accent', primary);
            }

            if (parsedSettings.brandTextColor) {
                const brandText = parsedSettings.brandTextColor;
                document.documentElement.style.setProperty('--brand-text-color', brandText);
                document.documentElement.style.setProperty('--on-primary', brandText);
                document.documentElement.style.setProperty('--primary-content', brandText);
                document.documentElement.style.setProperty('--primary-text', brandText);
            }

            if (parsedSettings.backgroundColor) {
                document.documentElement.style.setProperty('--background-color', parsedSettings.backgroundColor);
                document.documentElement.style.setProperty('--background', parsedSettings.backgroundColor);
            }

            if (parsedSettings.textColor) {
                document.documentElement.style.setProperty('--text-color', parsedSettings.textColor);
                document.documentElement.style.setProperty('--copy', parsedSettings.textColor);
                document.documentElement.style.setProperty('--theme-text', parsedSettings.textColor);
            }

            // Apply specific layout variables if they exist in theme definitions
            // This ensures a clean fallback for all theme types
            if (parsedSettings.borderColor) {
                document.documentElement.style.setProperty('--border', parsedSettings.borderColor);
                document.documentElement.style.setProperty('--theme-border', parsedSettings.borderColor);
            } else {
                document.documentElement.style.setProperty('--border', 'rgba(0,0,0,0.1)');
                document.documentElement.style.setProperty('--theme-border', 'rgba(0,0,0,0.1)');
            }
        } catch (error) {
            console.error('Failed to apply store settings:', error);
        }
    }
};

// Helper for links to stay within /shop subpath if that's where we are
export const getShopPath = (path) => {
    const prefix = window.location.pathname.startsWith('/shop') ? '/shop' : '';
    let cleanPath = path.startsWith('/') ? path : `/${path}`;

    // Check for localhost tenant param and preserve it
    // This ensures that navigation on localhost with ?tenant=... works correctly
    // and doesn't redirect back to the Landing Page.
    if (window.location.hostname === 'localhost') {
        const urlParams = new URLSearchParams(window.location.search);
        const tenant = urlParams.get('tenant');

        if (tenant) {
            const separator = cleanPath.includes('?') ? '&' : '?';
            return `${prefix}${cleanPath}${separator}tenant=${tenant}`;
        }
    }

    return `${prefix}${cleanPath}`;
};

// Robust helper to resolve image URLs from DB or local file picks
export const resolveImageUrl = (imagePath, API_URL) => {
    if (!imagePath) return '';
    if (typeof imagePath !== 'string') return '';

    // 1. If it's already an absolute URL (http/https), a data URL, or a blob URL, return as is
    if (imagePath.startsWith('http') || imagePath.startsWith('data:') || imagePath.startsWith('blob:')) {
        return imagePath;
    }

    // 2. Ensure we have a clean path (starts with / if not present)
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;

    // 3. Append API_URL (which might be empty if using proxy)
    return `${API_URL}${cleanPath}`;
};

// Unified helper to get the tenant identifier (subdomain or custom domain)
export const getTenantId = () => {
    const hostname = window.location.hostname;
    const parts = hostname.split('.');

    // localhost:3000?tenant=...
    if (hostname === 'localhost') {
        return new URLSearchParams(window.location.search).get('tenant') || null;
    }

    if (hostname.endsWith('.localhost')) {
        return parts[0] === 'app' ? null : parts[0];
    }

    if (hostname.endsWith('.nepostore.xyz')) {
        const subdomain = parts[0];
        if (subdomain === 'app' || subdomain === 'www') return null;
        return subdomain;
    }

    // Custom domain
    if (!hostname.includes('nepostore.xyz') && !hostname.includes('localhost')) {
        return hostname;
    }

    return null;
};
