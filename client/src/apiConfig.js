// Use relative URL in development to go through proxy (same origin = cookies work)
// In production, use the same domain for API (or set REACT_APP_API_URL env var)
// If API is on same domain, use relative URL. If on subdomain, use absolute URL
const getApiUrl = () => {
  // 1. If API_URL is explicitly set via environment variable, ALWAYS use it
  // This is the most reliable way in production (Vercel/Render)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 2. Fallback logic based on hostname
  const hostname = window.location.hostname;
  const isProd = hostname.includes('nepostore.xyz');

  if (isProd) {
    // If on production domain but no env var, assume backend is on api subdomain
    return 'https://api.nepostore.xyz';
  }

  // 3. Development: If using subdomains on localhost (e.g. app.localhost, nepostore.localhost),
  // For 'app' subdomain, we want to use the proxy (relative path) so cookies/sessions work
  // For other subdomains, use direct backend
  if (hostname.includes('localhost') && hostname !== 'localhost') {
    const parts = hostname.split('.');
    const subdomain = parts[0];
    // For app subdomain, use proxy (empty string) - proxy should forward to backend
    // For tenant stores, use direct backend
    if (subdomain === 'app') {
      return ''; // Use proxy for app subdomain
    } else if (subdomain !== 'www' && subdomain !== 'localhost') {
      return 'http://localhost:5002';
    }
  }

  // Standard localhost:3000 -> proxy -> localhost:5002
  return '';
};

const API_URL = getApiUrl();

export default API_URL;
