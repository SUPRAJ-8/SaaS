const mongoose = require('mongoose');

const WebsiteSchema = new mongoose.Schema({
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Client',
    required: true,
  },
  pages: [
    {
      title: {
        type: String,
        default: 'Untitled Page'
      },
      content: {
        type: String, // Could be HTML, Markdown, or JSON
        default: '[]'
      },
      slug: {
        type: String, // e.g., '/about-us'
        default: ''
      },
      metaDescription: {
        type: String,
        default: '',
      },
      status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'published',
      },
      themeId: {
        type: String,
        default: 'nexus'
      },
      metadata: {
        type: Object,
        default: {}
      }
    },
  ],
  settings: {
    theme: {
      type: String,
      default: 'default',
    },
    logoUrl: {
      type: String,
      default: '',
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure slugs are unique per website PER THEME
WebsiteSchema.pre('save', function (next) {
  if (this.isModified('pages')) {
    // We check for duplicates within the SAME themeId
    const slugThemeMap = {}; // { themeId: [slugs] }

    for (const page of this.pages) {
      const themeId = page.themeId || 'nexus';
      // Treat '' and '/' as the same (home page)
      let slug = (page.slug || '').replace(/^\//, '');

      if (!slugThemeMap[themeId]) slugThemeMap[themeId] = [];

      if (slugThemeMap[themeId].includes(slug)) {
        return next(new Error(`Duplicate slug "${page.slug}" found for theme "${themeId}".`));
      }
      slugThemeMap[themeId].push(slug);
    }
  }
  next();
});

module.exports = mongoose.model('Website', WebsiteSchema);
