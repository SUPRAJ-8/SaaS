const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    console.log('🔧 Setting up proxy middleware for /api and /auth routes');
    // Proxy API and Auth requests to the backend
    const proxyOptions = {
        target: 'http://localhost:5002',
        changeOrigin: false, // Preserve the original Host header (crucial for subdomain detection)
        secure: false,       // Handle self-signed certs if any (not needed for localhost but good practice)
        logLevel: 'debug',
        onProxyReq: (proxyReq, req, res) => {
            console.log(`[PROXY] ${req.method} ${req.url} -> http://localhost:5002${req.url}`);
        },
        onProxyRes: (proxyRes, req, res) => {
            console.log(`[PROXY RESPONSE] ${req.method} ${req.url} -> Status: ${proxyRes.statusCode}`);
        },
        onError: (err, req, res) => {
            console.error('[PROXY ERROR]', err.message);
            console.error('[PROXY ERROR] Request URL:', req.url);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Proxy error', message: err.message });
            }
        }
    };

    // Create the proxy middleware instance
    const proxy = createProxyMiddleware(proxyOptions);

    // Use a manual middleware wrapper to ensure paths are NOT stripped by Express
    app.use((req, res, next) => {
        if (req.url.startsWith('/api') || req.url.startsWith('/auth') || req.url.startsWith('/uploads')) {
            return proxy(req, res, next);
        }
        next();
    });

    console.log('✅ Proxy middleware configured for /api and /auth routes (prefix-preserving mode)');
};
