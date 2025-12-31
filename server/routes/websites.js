const express = require('express');
const router = express.Router();
const Website = require('../models/Website');

const { ensureAuthenticated } = require('../middleware/auth');

router.use(ensureAuthenticated);

// --- CRUD ROUTES FOR WEBSITES ---

// GET all websites for the logged-in user's client
router.get('/', async (req, res) => {
  try {
    const websites = await Website.find({ clientId: req.user.clientId });
    res.json(websites);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// POST (create) a new website for the logged-in user's client
router.post('/', async (req, res) => {
  const { name, url } = req.body;
  try {
    const newWebsite = new Website({
      clientId: req.user.clientId, // Associate with the user's client
      name,
      url
    });
    const website = await newWebsite.save();
    res.status(201).json(website);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Middleware to find a website by ID and verify ownership
async function getWebsite(req, res, next) {
  try {
    const website = await Website.findById(req.params.id);
    if (!website) {
      return res.status(404).json({ message: 'Website not found' });
    }
    // SECURITY CHECK: Ensure the website belongs to the user's client
    if (website.clientId.toString() !== req.user.clientId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.website = website;
    next();
  } catch (err) {
    return res.status(500).json({ message: 'Error finding website' });
  }
}

// GET a single website by its ID
router.get('/:id', getWebsite, (req, res) => {
  res.json(res.website);
});

// DELETE a website by its ID
router.delete('/:id', getWebsite, async (req, res) => {
  try {
    await res.website.remove();
    res.json({ message: 'Successfully deleted website' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
