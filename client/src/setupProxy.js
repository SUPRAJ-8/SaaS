const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
    console.log('🔧 Setting up proxy middleware for /api, /auth, and /uploads routes');

    // Proxy configuration with pathFilter to prevent stripping prefixes
    const proxyOptions = {
        target: 'http://localhost:5002',
        changeOrigin: true, // Change origin to match target for cookie/session support
        secure: false,
        pathFilter: ['/api', '/auth', '/uploads'], // Matches these paths but preserves them
        onProxyReq: (proxyReq, req, res) => {
            // Preserve original host for subdomain detection on backend
            // Use headers.host or req.hostname as appropriate
            const originalHost = req.headers.host || req.hostname;
            proxyReq.setHeader('X-Forwarded-Host', originalHost);
            proxyReq.setHeader('X-Original-Host', originalHost);

            // Log all proxy requests for debugging
            console.log(`[PROXY] ${req.method} ${req.url} -> http://localhost:5002${req.url}`);
        },
        onError: (err, req, res) => {
            console.error('[PROXY ERROR]', err.message);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Proxy error', message: err.message });
            }
        }
    };

    // Apply proxy to all requests, it will only filter based on pathFilter
    app.use(createProxyMiddleware(proxyOptions));


    console.log('✅ Proxy middleware configured.');
};
