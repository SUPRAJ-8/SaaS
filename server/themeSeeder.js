const mongoose = require('mongoose');
const Theme = require('./models/Theme');
require('dotenv').config();

const themes = [
    {
        name: 'Nexus (Modern)',
        id: 'nexus',
        description: 'A bold, futuristic dark aesthetic for high-end digital brands. Built with modular sections.',
        thumbnail: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?auto=format&fit=crop&q=80&w=2574',
        version: '1.2.0',
        category: 'Ecommerce',
        isActive: true,
        features: {
            ecommerce: true,
            checkout: true,
            categories: true,
            wishlist: true
        },
        blueprint: [
            {
                "id": "hero-1",
                "type": "modern-hero",
                "content": {
                    "title": "Engineering the Future",
                    "subtitle": "Discover the next generation of digital excellence.",
                    "buttonText": "Explore Collection",
                    "alignment": "center"
                }
            },
            {
                "id": "features-1",
                "type": "rich-text",
                "content": {
                    "text": "<h2>Precision & Power</h2><p>Designed for those who demand more from their digital presence.</p>"
                }
            },
            {
                "id": "products-1",
                "type": "product-grid",
                "content": {
                    "title": "Selected Works",
                    "limit": 4
                }
            }
        ],
        customCss: ".dynamic-theme { background: #000; color: #fff; }"
    },
    {
        name: 'Portfolio Elegance',
        id: 'portfolio',
        description: 'Minimalist aesthetic focused on large imagery and elegant typography. Perfect for creators.',
        thumbnail: 'https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&q=80&w=2605',
        version: '1.0.0',
        category: 'Portfolio',
        isActive: true,
        features: {
            ecommerce: false,
            checkout: false,
            categories: true,
            wishlist: false
        },
        blueprint: [
            {
                "id": "p-hero",
                "type": "hero",
                "content": {
                    "title": "The Art of Simplicity",
                    "subtitle": "Showcasing beauty through a minimalist lens.",
                    "buttonText": "View Portfolio"
                }
            },
            {
                "id": "p-text",
                "type": "rich-text",
                "content": {
                    "text": "<p style='text-align: center; font-style: italic;'>Less is more. Every pixel has a purpose.</p>"
                }
            }
        ]
    }
];

const seedThemes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/nepali-cms');
        console.log('Connected to MongoDB for Theme Seeding...');

        // Clear existing default themes to avoid duplicates if re-running
        await Theme.deleteMany({ id: { $in: themes.map(t => t.id) } });

        await Theme.insertMany(themes);
        console.log('✅ Default themes seeded successfully!');

        process.exit();
    } catch (error) {
        console.error('Error seeding themes:', error);
        process.exit(1);
    }
};

seedThemes();
