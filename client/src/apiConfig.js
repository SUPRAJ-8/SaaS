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

  // IMPORTANT: If we are running locally (development) but using the production domain (e.g. via hosts file),
  // we must point to the local backend, otherwise it tries to hit the real production API.
  if (process.env.NODE_ENV === 'development' && hostname.includes('nepostore.xyz')) {
    return 'http://localhost:5002';
  }

  const isMainDomain = hostname.includes('nepostore.xyz');
  const isLocalhost = hostname.includes('localhost');
  const isProd = isMainDomain && !isLocalhost;

  if (isProd) {
    return 'https://api.nepostore.xyz';
  }

  // 3. Custom Domains (e.g. mystore.com)
  if (!isMainDomain && !isLocalhost) {
    // If we're on a custom domain in production environment
    if (process.env.NODE_ENV === 'production' || !hostname.includes('.test')) {
      return 'https://api.nepostore.xyz';
    }
    // Otherwise assume it's a local custom domain test
    return 'http://localhost:5002';
  }

  // 4. Development: If using subdomains on localhost (e.g. app.localhost, nepostore.localhost),
  if (isLocalhost && hostname !== 'localhost') {
    const parts = hostname.split('.');
    const subdomain = parts[0];
    if (subdomain === 'app') {
      return ''; // Use proxy for app subdomain
    } else {
      return 'http://localhost:5002';
    }
  }

  // Standard localhost:3000 -> proxy -> localhost:5002
  return '';
};

const API_URL = getApiUrl();

export default API_URL;
