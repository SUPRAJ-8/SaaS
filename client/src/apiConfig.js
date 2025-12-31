// Use relative URL in development to go through proxy (same origin = cookies work)
// In production, use the same domain for API (or set REACT_APP_API_URL env var)
// If API is on same domain, use relative URL. If on subdomain, use absolute URL
const getApiUrl = () => {
  // Check if we're in production
  if (process.env.NODE_ENV === 'production') {
    // If API_URL is explicitly set, use it
    if (process.env.REACT_APP_API_URL) {
      return process.env.REACT_APP_API_URL;
    }
    // If API is on same domain, use relative URL (works with cookies)
    // If API is on api.nepostore.xyz, use absolute URL
    const hostname = window.location.hostname;
    if (hostname.includes('nepostore.xyz')) {
      // API might be on same domain or api subdomain
      // Try relative first (if API is on same domain), fallback to api subdomain
      return ''; // Relative URL - works if API is on same domain
    }
    return 'https://api.nepostore.xyz'; // Fallback to api subdomain
  }
  // Development: use relative URL to go through proxy
  return '';
};

const API_URL = getApiUrl();

export default API_URL;
