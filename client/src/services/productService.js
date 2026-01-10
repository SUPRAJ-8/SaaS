import API_URL from '../apiConfig';
import axios from 'axios';
import { getTenantId } from '../themeUtils';

const getProducts = async (queryParams = {}) => {
  try {
    const url = `${API_URL}/api/products`;

    const tenantId = getTenantId();

    const config = {
      params: queryParams,
      withCredentials: true // Ensure cookies are sent for authentication
    };

    if (tenantId) {
      config.headers = { 'x-subdomain': tenantId };
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
