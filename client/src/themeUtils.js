export const applyStoreSettings = () => {
    const settings = localStorage.getItem('storeSettings');
    if (settings) {
        try {
            const parsedSettings = JSON.parse(settings);

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
