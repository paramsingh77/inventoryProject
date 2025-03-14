import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:2000',
  headers: {
    'Content-Type': 'application/json'
  }
});

export const productService = {
  getAll: async (params) => {
    try {
      const response = await api.get('/products', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  create: async (product) => {
    try {
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
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  update: async (id, product) => {
    try {
      const response = await api.put(`/products/${id}`, product);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async (id) => {
    try {
      await api.delete(`/products/${id}`);
      return true;
    } catch (error) {
      throw error;
    }
  },

  uploadImage: async (file) => {
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/products/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data.url;
    } catch (error) {
      throw error;
    }
  }
}; 