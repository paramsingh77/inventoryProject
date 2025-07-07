import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api'
});

// Add request interceptor to include site ID
api.interceptors.request.use(config => {
  const siteId = localStorage.getItem('selectedSiteId');
  if (siteId) {
    config.params = { ...config.params, siteId };
  }
  return config;
});

export const productService = {
  getAll: async (params) => {
    try {
      const siteId = localStorage.getItem('selectedSiteId');
      const response = await api.get('/products', { params, headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (product) => {
    try {
      const siteId = localStorage.getItem('selectedSiteId');
      const formData = new FormData();
      Object.keys(product).forEach(key => {
        if (key === 'images') {
          product[key].forEach(image => {
            formData.append('images', image);
          });
        } else {
          formData.append(key, product[key]);
        }
      });
      const response = await api.post('/products', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, product) => {
    try {
      const siteId = localStorage.getItem('selectedSiteId');
      const response = await api.put(`/products/${id}`, product, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      const siteId = localStorage.getItem('selectedSiteId');
      await api.delete(`/products/${id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return true;
    } catch (error) {
      throw error;
    }
  },

  uploadImage: async (file) => {
    try {
      const siteId = localStorage.getItem('selectedSiteId');
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      return response.data.url;
    } catch (error) {
      throw error;
    }
  }
};

export const inventoryService = {
  getAll: async (params) => {
    const siteId = localStorage.getItem('selectedSiteId');
    const response = await api.get(`/inventory`, { params: { ...params, siteId } });
    return response.data;
  },
  // ... other methods
};

export const supplierService = {
  getAll: async (params) => {
    const siteId = localStorage.getItem('selectedSiteId');
    const response = await api.get(`/suppliers`, { params: { ...params, siteId } });
    return response.data;
  },
  // ... other methods
};

export const purchaseOrderService = {
  getAll: async (params) => {
    const siteId = localStorage.getItem('selectedSiteId');
    const response = await api.get(`/purchase-orders`, { params: { ...params, siteId } });
    return response.data;
  },
  // ... other methods
}; 