import API_URL from '../apiConfig';
import axios from 'axios';

const getProducts = async (queryParams = {}) => {
  try {
    const url = `${API_URL}/api/products`;

    // Detect subdomain to pass as header for tenant resolution
    const hostname = window.location.hostname;
    let subdomain = null;
    if (hostname.endsWith('.localhost')) {
      subdomain = hostname.split('.')[0];
    } else if (hostname.endsWith('.nepostore.xyz') && hostname !== 'nepostore.xyz' && hostname !== 'www.nepostore.xyz') {
      subdomain = hostname.split('.')[0];
    }

    const config = {
      params: queryParams,
      withCredentials: true // Ensure cookies are sent for authentication
    };

    if (subdomain && subdomain !== 'www' && subdomain !== 'app' && subdomain !== 'localhost') {
      config.headers = { 'x-subdomain': subdomain };
    }

    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
};

const getProductById = async (id) => {
  try {
    const response = await axios.get(`${API_URL}/api/products/${id}`, {
      withCredentials: true // Ensure cookies are sent for authentication
    });
    return response.data;
  } catch (error) {
    console.error(`Error fetching product with id ${id}:`, error);
    throw error;
  }
};

export { getProducts, getProductById };
