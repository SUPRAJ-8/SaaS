// Section Template Registry
// Pre-registered React components (NOT uploaded dynamically)

import HeroModern from './hero-modern/Hero';
// import ProductGrid001 from './product-grid-001/ProductGrid';
// import CategoryGrid001 from './category-grid-001/CategoryGrid';
// import Footer001 from './footer-001/Footer';

// Import schemas
import heroSchema from './hero-modern/schema.json';
// import productGridSchema from './product-grid-001/schema.json';
// import categoryGridSchema from './category-grid-001/schema.json';
// import footerSchema from './footer-001/schema.json';

/**
 * SECTION TEMPLATE REGISTRY
 * 
 * Each template MUST have:
 * - id: Unique identifier
 * - component: React component
 * - schema: JSON schema for builder controls
 * - preview: Preview image
 * - cssModule: Scoped CSS (imported automatically in component)
 */

export const SECTION_REGISTRY = {
    'hero-modern': {
        id: 'hero-modern',
        component: HeroModern,
        schema: heroSchema,
        preview: '/previews/hero-modern.png',
        category: 'Hero'
    }
    // TODO: Add these when components are created
    // 'product-grid-001': {
    //     id: 'product-grid-001',
    //     component: ProductGrid001,
    //     schema: productGridSchema,
    //     preview: '/previews/product-grid.png',
    //     category: 'Product'
    // },
    // 'category-grid-001': {
    //     id: 'category-grid-001',
    //     component: CategoryGrid001,
    //     schema: categoryGridSchema,
    //     preview: '/previews/category-grid.png',
    //     category: 'Category'
    // },
    // 'footer-001': {
    //     id: 'footer-001',
    //     component: Footer001,
    //     schema: footerSchema,
    //     preview: '/previews/footer.png',
    //     category: 'Footer'
    // }
};

/**
 * Get template component by ID
 */
export const getTemplate = (templateId) => {
    return SECTION_REGISTRY[templateId];
};

/**
 * Get all available templates
 */
export const getAllTemplates = () => {
    return Object.values(SECTION_REGISTRY);
};

/**
 * Get default data for a template (from its schema)
 */
export const getDefaultData = (templateId) => {
    const template = SECTION_REGISTRY[templateId];
    if (!template?.schema) return {};

    const defaults = {};
    template.schema.forEach(field => {
        if (field.default !== undefined) {
            defaults[field.key] = field.default;
        }
    });
    return defaults;
};
