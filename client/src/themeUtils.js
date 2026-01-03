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
                document.documentElement.style.setProperty('--primary-color', parsedSettings.primaryColor);
                document.documentElement.style.setProperty('--primary', parsedSettings.primaryColor);
                // The primary color from settings should be the accent/action color in layouts
                document.documentElement.style.setProperty('--theme-accent', parsedSettings.primaryColor);
            }
            if (parsedSettings.secondaryColor) {
                document.documentElement.style.setProperty('--secondary-color', parsedSettings.secondaryColor);
                document.documentElement.style.setProperty('--secondary', parsedSettings.secondaryColor);
            }
            if (parsedSettings.accentColor) {
                document.documentElement.style.setProperty('--accent-color', parsedSettings.accentColor);
            }
            if (parsedSettings.backgroundColor) {
                document.documentElement.style.setProperty('--background-color', parsedSettings.backgroundColor);
                document.documentElement.style.setProperty('--background', parsedSettings.backgroundColor);
                // Background maps to theme-primary in some layouts
                document.documentElement.style.setProperty('--theme-primary', parsedSettings.backgroundColor);
            }
            if (parsedSettings.surfaceColor) {
                document.documentElement.style.setProperty('--surface-color', parsedSettings.surfaceColor);
                document.documentElement.style.setProperty('--foreground', parsedSettings.surfaceColor);
                document.documentElement.style.setProperty('--theme-secondary', parsedSettings.surfaceColor);
            } else if (parsedSettings.backgroundColor) {
                // Fallback surface to background if not defined
                document.documentElement.style.setProperty('--surface-color', parsedSettings.backgroundColor);
                document.documentElement.style.setProperty('--foreground', parsedSettings.backgroundColor);
                document.documentElement.style.setProperty('--theme-secondary', parsedSettings.backgroundColor);
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
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
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
