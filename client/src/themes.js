export const themes = [
  {
    name: 'Ecommerce',
    id: 'ecommerce',
    layout: 'shopcart',
    description: 'Clean, modern, and high-conversion layout for any retail business.',
    fontFamily: 'Poppins',
    availablePages: [
      { id: 'ec-home', title: 'Home Page', slug: '', status: 'Published', lastModified: '2025-12-20', type: 'Core' },
      { id: 'ec-checkout', title: 'Checkout Page', slug: 'checkout', status: 'Published', lastModified: '2025-12-19', type: 'Core' },
      { id: 'ec-products', title: 'All Products', slug: 'products', status: 'Published', lastModified: '2025-12-18', type: 'Core' }
    ]
  },
  {
    name: 'Portfolio',
    id: 'portfolio',
    layout: 'portfolio',
    description: 'Minimalist aesthetic focused on large imagery and elegant typography.',
    fontFamily: 'Montserrat',
    availablePages: [
      { id: 'port-home', title: 'Portfolio Home', slug: '', status: 'Published', lastModified: '2025-12-20', type: 'Core' },
      { id: 'port-projects', title: 'My Projects', slug: 'projects', status: 'Published', lastModified: '2025-12-19', type: 'Custom' },
      { id: 'port-about', title: 'About Me', slug: 'about', status: 'Published', lastModified: '2025-12-18', type: 'Custom' }
    ]
  },
  {
    name: 'Nexus',
    id: 'nexus',
    layout: 'nexus',
    description: 'A bold, futuristic dark aesthetic for high-end digital brands.',
    fontFamily: 'Space Grotesk',
    availablePages: [
      { id: 'nx-home', title: 'Nexus Landing', slug: '', status: 'Published', lastModified: '2025-12-20', type: 'Core' },
      { id: 'nx-vision', title: 'The Vision', slug: 'vision', status: 'Published', lastModified: '2025-12-19', type: 'Custom' },
      { id: 'nx-connect', title: 'Connect', slug: 'connect', status: 'Published', lastModified: '2025-12-18', type: 'Custom' }
    ]
  },
];
