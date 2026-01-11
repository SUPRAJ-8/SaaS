const express = require('express');
const router = express.Router();
const Website = require('../models/Website');
const Client = require('../models/Client');
const { ensureAuthenticated } = require('../middleware/auth');

const findOrCreateWebsite = async (clientId) => {
    const client = await Client.findById(clientId);
    const activeThemeId = client?.settings?.selectedThemeId || 'nexus';

    let website = await Website.findOne({ clientId });
    let needsHome = false;

    if (!website) {
        website = new Website({ clientId, pages: [] });
        needsHome = true;
    } else {
        // --- DEDUPLICATION & NORMALIZATION STEP ---
        // Some users might have legacy data with both "" and "/" slugs.
        // We normalize everything to "" for home page and remove duplicates.
        const seenSlugs = new Set();
        const uniquePages = [];
        let modified = false;

        for (const p of website.pages) {
            const themeKey = `${p.themeId || 'nexus'}_${(p.slug || '').replace(/^\//, '')}`;

            // If we've seen this theme/slug combo before, skip it (deduplicate)
            if (seenSlugs.has(themeKey)) {
                console.log(`[Deduper] Removing duplicate page: ${themeKey}`);
                modified = true;
                continue;
            }

            // Normalize the slug in the record if it has a leading slash
            if (p.slug && p.slug.startsWith('/')) {
                p.slug = p.slug.replace(/^\//, '');
                modified = true;
            }

            seenSlugs.add(themeKey);
            uniquePages.push(p);
        }

        if (modified) {
            website.pages = uniquePages;
            await website.save();
        }
        // -------------------------------------------

        // Check if a Home page exists FOR THE ACTIVE THEME
        const homePage = website.pages.find(p =>
            (p.slug === '' || p.slug === '/') &&
            (p.themeId === activeThemeId || (!p.themeId && activeThemeId === 'nexus'))
        );
        if (!homePage) {
            needsHome = true;
        }
    }

    if (needsHome) {
        website.pages.push({
            title: 'Home Page',
            slug: '', // Standardized empty slug for home
            status: 'published',
            themeId: activeThemeId,
            content: '[]',
            lastModified: new Date()
        });
        await website.save();
    }
    return website;
};

// @route   GET /api/client-pages
// @desc    Get all pages for the logged-in user's active client
// @access  Private
router.get('/', ensureAuthenticated, async (req, res) => {
    try {
        const clientId = req.user.clientId?._id || req.user.clientId;
        const website = await findOrCreateWebsite(clientId);
        res.json(website.pages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/client-pages
// @desc    Create or update a page
// @access  Private
router.post('/', ensureAuthenticated, async (req, res) => {
    console.log('📥 [POST] /api/client-pages | Body:', req.body);
    let { id, title, content, slug = '', status, themeId } = req.body;

    // Normalize slug: remove leading slash if present
    const cleanSlug = slug.replace(/^\//, '');

    try {
        const clientId = req.user.clientId?._id || req.user.clientId;
        const website = await findOrCreateWebsite(clientId);

        let pageIndex = -1;

        // If an ID is provided, look for that specific page (must be 24-char hex)
        if (id && id.length === 24 && /^[0-9a-fA-F]+$/.test(id)) {
            pageIndex = website.pages.findIndex(p => p._id.toString() === id);
        } else {
            // Otherwise try to match by normalized slug AND themeId
            pageIndex = website.pages.findIndex(p => (p.slug || '').replace(/^\//, '') === cleanSlug && (p.themeId === themeId || (!p.themeId && themeId === 'nexus')));
        }

        if (pageIndex > -1) {
            // Update existing
            website.pages[pageIndex].title = title;
            website.pages[pageIndex].content = content;
            website.pages[pageIndex].slug = cleanSlug;
            website.pages[pageIndex].status = status || website.pages[pageIndex].status;
            website.pages[pageIndex].themeId = themeId || website.pages[pageIndex].themeId || 'nexus';
        } else {
            // Create new
            website.pages.push({
                title,
                content,
                slug: cleanSlug,
                status: status || 'published',
                themeId: themeId || 'nexus'
            });
        }

        await website.save();
        res.json(website.pages);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/client-pages/public/:subdomain
// @desc    Get a specific page or all pages for a subdomain/custom domain
// @access  Public
router.get('/public/:subdomain', async (req, res) => {
    try {
        console.log(`[Client Pages] Public page request for: ${req.params.subdomain}, slug: ${req.query.slug || 'none'}`);

        let client = req.tenantClient;

        if (!client) {
            console.log(`[Client Pages] No tenantClient found, searching by subdomain: ${req.params.subdomain}`);

            // Try to find by subdomain or custom domain
            client = await Client.findOne({
                $or: [
                    { subdomain: req.params.subdomain },
                    { customDomain: req.params.subdomain },
                    { customDomain: req.params.subdomain.replace(/^www\./, '') },
                    { customDomain: 'www.' + req.params.subdomain }
                ]
            });
        }

        if (!client) {
            console.log(`[Client Pages] ❌ Store not found for: ${req.params.subdomain}`);
            return res.status(404).json({ msg: 'Store not found', subdomain: req.params.subdomain });
        }

        console.log(`[Client Pages] ✅ Found client: ${client.name} (ID: ${client._id})`);

        const website = await Website.findOne({ clientId: client._id });
        if (!website) {
            console.log(`[Client Pages] ⚠️ No website found for client: ${client.name}`);
            return res.json({}); // No website/pages yet
        }

        console.log(`[Client Pages] Found website with ${website.pages.length} pages`);

        // Optional: Filter by slug if query param provided
        const { slug } = req.query;

        // Get the active theme from client settings
        const activeThemeId = client.settings?.selectedThemeId || 'nexus';

        console.log(`[Public Page Fetch] Subdomain: ${req.params.subdomain}, Slug: ${slug}, ActiveTheme: ${activeThemeId}`);
        if (website && website.pages) {
            console.log('[Public Page Fetch] Available Pages:', website.pages.map(p => ({ slug: p.slug, status: p.status, themeId: p.themeId })));
        }

        if (slug !== undefined) {
            const cleanTargetSlug = slug.replace(/^\//, '');

            // Try to find a published page first, then fall back to draft if it matches
            let page = website.pages.find(p => {
                const dbSlug = (p.slug || '').replace(/^\//, '');

                // CRITICAL FIX: If we are looking for home page (cleanTargetSlug === ''), 
                // accept matches for empty string, '/', OR if the slug equals the page ID.
                const pId = p._id ? p._id.toString() : '';
                const isHomeMatch = cleanTargetSlug === '' && (dbSlug === '' || dbSlug === '/' || dbSlug === pId);

                if (cleanTargetSlug === '') {
                    console.log(`[Home Match Check] ID: ${pId}, dbSlug: ${dbSlug}, isHomeMatch: ${isHomeMatch}`);
                }

                return (dbSlug === cleanTargetSlug || isHomeMatch) &&
                    p.status === 'published' &&
                    (p.themeId === activeThemeId || (!p.themeId && activeThemeId === 'nexus'));
            });

            // If not found, check for a draft (so users can see their work-in-progress immediately)
            if (!page) {
                page = website.pages.find(p => {
                    const dbSlug = (p.slug || '').replace(/^\//, '');

                    const isHomeMatch = cleanTargetSlug === '' && (dbSlug === '' || dbSlug === '/' || dbSlug === (p._id ? p._id.toString() : ''));

                    return (dbSlug === cleanTargetSlug || isHomeMatch) &&
                        (p.themeId === activeThemeId || (!p.themeId && activeThemeId === 'nexus'));
                });
            }
            // Fallback for single page
            if (!page && activeThemeId !== 'nexus') {
                page = website.pages.find(p => p.slug === slug && p.status === 'published' && p.themeId === 'nexus');
            }

            if (!page) {
                console.log(`[Public Page Fetch] ℹ️ Page not found for slug: "${slug}" on tenant: ${req.params.subdomain}. (Returning null)`);
                return res.json(null);
            }

            console.log(`[Public Page Fetch] ✅ Returning page: ${page.title} (slug: ${page.slug})`);
            return res.json(page);
        }

        // Return all published pages for current theme
        let publishedPages = website.pages.filter(p =>
            p.status === 'published' &&
            (p.themeId === activeThemeId || (!p.themeId && activeThemeId === 'nexus'))
        );

        // Fallback: If no pages found for active theme but pages exist for 'nexus', 
        // it means user customized in builder but hasn't fully switched theme yet.
        if (publishedPages.length === 0 && activeThemeId !== 'nexus') {
            publishedPages = website.pages.filter(p => p.status === 'published' && p.themeId === 'nexus');
        }

        console.log(`[Public Page Fetch] ✅ Returning ${publishedPages.length} published pages`);
        res.json(publishedPages);
    } catch (err) {
        console.error('[Client Pages] Error:', err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/client-pages/:id
// @desc    Delete a page from the website
// @access  Private
router.delete('/:id', ensureAuthenticated, async (req, res) => {
    try {
        const clientId = req.user.clientId?._id || req.user.clientId;
        const website = await Website.findOne({ clientId });
        if (!website) {
            return res.status(404).json({ msg: 'Website not found' });
        }

        const originalCount = website.pages.length;

        // Find the page first to check if it's the home page
        const pageToDelete = website.pages.find(p => p._id.toString() === req.params.id);

        if (!pageToDelete) {
            return res.status(404).json({ msg: 'Page not found' });
        }

        // Prevent deletion of Home Page (empty slug)
        if (!pageToDelete.slug || pageToDelete.slug === '') {
            return res.status(400).json({ msg: 'Cannot delete the system Home Page.' });
        }

        website.pages = website.pages.filter(p => p._id.toString() !== req.params.id);

        if (website.pages.length === originalCount) {
            // Should be caught above, but safety check
            return res.status(404).json({ msg: 'Page not found' });
        }

        await website.save();
        res.json({ msg: 'Page removed', pages: website.pages });
    } catch (err) {
        console.error('Delete page error:', err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
