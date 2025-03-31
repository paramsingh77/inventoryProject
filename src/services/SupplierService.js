/**
 * Supplier Service
 * Provides methods for interacting with the supplier API endpoints
 */

import api from '../utils/api';

class SupplierService {
  /**
   * Fetches all suppliers from the API
   * @returns {Promise<Array>} A promise that resolves to an array of suppliers
   */
  static async getAllSuppliers() {
    try {
      console.log('Fetching all suppliers...');
      const response = await api.get('/suppliers');
      console.log(`Retrieved ${response.data?.length || 0} suppliers`);
      return response.data;
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      console.error('Response:', error.response?.data);
      console.error('Status:', error.response?.status);
      // Return empty array on error
      return [];
    }
  }

  /**
   * Fetches a single supplier by ID
   * @param {number} id The supplier ID
   * @returns {Promise<Object>} A promise that resolves to a supplier object
   */
  static async getSupplierById(id) {
    try {
      console.log(`Fetching supplier with ID: ${id}`);
      const response = await api.get(`/suppliers/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching supplier with ID ${id}:`, error);
      console.error('Response:', error.response?.data);
      throw error;
    }
  }

  /**
   * Fetches supplier statistics
   * @returns {Promise<Object>} A promise that resolves to supplier statistics
   */
  static async getStats() {
    try {
      console.log('Fetching supplier statistics...');
      const response = await api.get('/suppliers/stats');
      console.log('Supplier statistics:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching supplier statistics:', error);
      console.error('Response:', error.response?.data);
      throw error;
    }
  }

  /**
   * Creates a new supplier
   * @param {Object} supplierData The supplier data
   * @returns {Promise<Object>} A promise that resolves to the created supplier
   */
  static async createSupplier(supplierData) {
    try {
      // Map the form data to the API structure
      const apiData = {
        name: supplierData.companyName,
        contact_person: supplierData.contactPerson || '',
        email: supplierData.email,
        phone: supplierData.phone || '',
        address: this.formatAddress(supplierData),
        website: supplierData.website || '',
        tax_id: supplierData.taxId || '',
        payment_terms: supplierData.paymentTerms || '',
        notes: supplierData.notes || '',
        category: supplierData.category || 'general'
      };

      console.log('Creating supplier with data:', apiData);
      
      // Validate required fields client-side as well
      if (!apiData.name || !apiData.email) {
        console.error('Missing required fields for supplier creation');
        throw new Error('Company name and email are required fields');
      }
      
      const response = await api.post('/suppliers', apiData);
      console.log('Supplier created successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating supplier:', error);
      console.error('Request data:', supplierData);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Updates an existing supplier
   * @param {number} id The supplier ID
   * @param {Object} supplierData The updated supplier data
   * @returns {Promise<Object>} A promise that resolves to the updated supplier
   */
  static async updateSupplier(id, supplierData) {
    try {
      // Map the form data to the API structure
      const apiData = {
        name: supplierData.companyName,
        contact_person: supplierData.contactPerson || '',
        email: supplierData.email,
        phone: supplierData.phone || '',
        address: this.formatAddress(supplierData),
        website: supplierData.website || '',
        tax_id: supplierData.taxId || '',
        payment_terms: supplierData.paymentTerms || '',
        status: supplierData.status || 'active',
        notes: supplierData.notes || '',
        category: supplierData.category || 'general'
      };

      console.log(`Updating supplier with ID ${id} with data:`, apiData);
      const response = await api.put(`/suppliers/${id}`, apiData);
      console.log('Supplier updated successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Error updating supplier with ID ${id}:`, error);
      console.error('Request data:', supplierData);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      throw error;
    }
  }

  /**
   * Deletes a supplier (soft delete)
   * @param {number} id The supplier ID
   * @returns {Promise<Object>} A promise that resolves to a success message
   */
  static async deleteSupplier(id) {
    try {
      console.log(`Deleting supplier with ID: ${id}`);
      const response = await api.delete(`/suppliers/${id}`);
      console.log('Supplier deleted successfully');
      return response.data;
    } catch (error) {
      console.error(`Error deleting supplier with ID ${id}:`, error);
      console.error('Response:', error.response?.data);
      throw error;
    }
  }
  
  /**
   * Fetches products associated with a supplier
   * @param {number} id The supplier ID
   * @returns {Promise<Array>} A promise that resolves to an array of products
   */
  static async getSupplierProducts(id) {
    try {
      console.log(`Fetching products for supplier with ID: ${id}`);
      const response = await api.get(`/suppliers/${id}/products`);
      console.log(`Retrieved ${response.data?.data?.length || 0} products`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching products for supplier ID ${id}:`, error);
      console.error('Response:', error.response?.data);
      return [];
    }
  }

  /**
   * Formats the address from form data
   * @param {Object} supplierData The supplier form data
   * @returns {string} The formatted address string
   */
  static formatAddress(supplierData) {
    // Only include parts that have values
    const addressParts = [];
    
    if (supplierData.street) addressParts.push(supplierData.street);
    if (supplierData.city) addressParts.push(supplierData.city);
    
    // Combine state and postal code if both exist
    let statePostal = '';
    if (supplierData.state) statePostal += supplierData.state;
    if (supplierData.postalCode) statePostal += ` ${supplierData.postalCode}`;
    if (statePostal) addressParts.push(statePostal);
    
    if (supplierData.country) addressParts.push(supplierData.country);
    
    return addressParts.join(', ');
  }

  /**
   * Gets a list of suppliers formatted for dropdown selection
   * @param {boolean} activeOnly Whether to include only active suppliers
   * @returns {Promise<Array>} A promise that resolves to an array of supplier names/ids for dropdowns
   */
  static async getSuppliersForDropdown(activeOnly = true) {
    try {
      console.log('Fetching suppliers for dropdown...');
      const suppliers = await this.getAllSuppliers();
      
      // Filter for active suppliers if requested
      const filteredSuppliers = activeOnly 
        ? suppliers.filter(supplier => supplier.status === 'active')
        : suppliers;
      
      // Format for dropdown use
      const dropdownItems = filteredSuppliers.map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        value: supplier.name
      }));
      
      console.log(`Prepared ${dropdownItems.length} suppliers for dropdown`);
      return dropdownItems;
    } catch (error) {
      console.error('Error fetching suppliers for dropdown:', error);
      return [];
    }
  }

  /**
   * Converts a backend supplier to frontend format
   * @param {Object} supplier The supplier from the API
   * @returns {Object} The formatted supplier for the frontend
   */
  static formatSupplierForFrontend(supplier) {
    // Extract address parts if it's a string
    let street = '', city = '', state = '', postalCode = '', country = '';
    
    if (typeof supplier.address === 'string') {
      const addressParts = supplier.address.split(',');
      street = addressParts[0]?.trim() || '';
      city = addressParts[1]?.trim() || '';
      
      // Handle state and postal code which might be in the same part
      if (addressParts[2]) {
        const stateZipParts = addressParts[2].trim().split(' ');
        state = stateZipParts[0] || '';
        postalCode = stateZipParts[1] || '';
      }
      
      country = addressParts[3]?.trim() || '';
    }

    // Return formatted supplier
    return {
      id: supplier.id,
      companyName: supplier.name,
      contactPerson: supplier.contact_person,
      email: supplier.email,
      phone: supplier.phone,
      website: supplier.website,
      street,
      city,
      state,
      postalCode,
      country,
      taxId: supplier.tax_id,
      paymentTerms: supplier.payment_terms,
      status: supplier.status,
      category: supplier.category || 'general',
      notes: supplier.notes,
      // Include original data in case we need it
      originalData: supplier
    };
  }

  /**
   * Syncs suppliers from device inventory
   * This pulls manufacturer information from existing devices
   * @returns {Promise<Object>} A promise that resolves to a success message
   */
  static async syncFromInventory() {
    try {
      console.log('Initiating supplier sync from inventory...');
      
      // Fix: Use the right endpoint path that matches our backend route
      const response = await api.post('/suppliers/sync');
      
      console.log('Supplier sync completed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error syncing suppliers from inventory:', error);
      throw error;
    }
  }
}

export default SupplierService; 