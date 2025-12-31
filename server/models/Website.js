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
        required: true,
      },
      content: {
        type: String, // Could be HTML, Markdown, or JSON
        required: true,
      },
      slug: {
        type: String, // e.g., '/about-us'
        required: true,
      },
      metaDescription: {
        type: String,
        default: '',
      },
      status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft',
      },
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

// Ensure slugs are unique per website
WebsiteSchema.pre('save', function (next) {
  if (this.isModified('pages')) {
    const slugs = this.pages.map(page => page.slug);
    const uniqueSlugs = new Set(slugs);
    if (slugs.length !== uniqueSlugs.size) {
      return next(new Error('Page slugs must be unique within a website.'));
    }
  }
  next();
});

module.exports = mongoose.model('Website', WebsiteSchema);
