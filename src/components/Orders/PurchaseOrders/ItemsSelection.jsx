import React, { useState, useEffect, useRef } from 'react';
import { Table, Button, Form, InputGroup, Alert, Badge, Spinner, Row, Col } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTrash, 
  faSearch, 
  faExclamationTriangle,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { products } from '../../../data/samplePOData';
import axios from 'axios';

const ItemsSelection = ({ formData, setFormData, vendorProducts = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allProducts, setAllProducts] = useState(products);
  const [loading, setLoading] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [vendorSpecificProducts, setVendorSpecificProducts] = useState([]);
  const [selectedVendorName, setSelectedVendorName] = useState('');
  // Use a ref to track if we've already loaded products to prevent repetitive loading
  const productsLoadedRef = useRef(false);

  // Added a helper function to save vendor products to localStorage
  const saveVendorProductsToLocalStorage = (vendor, products) => {
    if (vendor && products && products.length > 0) {
      try {
        localStorage.setItem('saved_vendor', vendor);
        localStorage.setItem('saved_vendor_products', JSON.stringify(products));
        console.log(`Saved ${products.length} products for ${vendor} to localStorage`);
      } catch (error) {
        console.warn('Error saving to localStorage:', error);
      }
    }
  };

  // Added a helper function to load vendor products from localStorage
  const loadVendorProductsFromLocalStorage = () => {
    try {
      const savedVendor = localStorage.getItem('saved_vendor');
      const savedProducts = localStorage.getItem('saved_vendor_products');
      
      if (savedVendor && savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        console.log(`Loaded ${parsedProducts.length} products for ${savedVendor} from localStorage`);
        return { vendor: savedVendor, products: parsedProducts };
      }
    } catch (error) {
      console.warn('Error loading from localStorage:', error);
    }
    return null;
  };

  // At the start of the component
  console.log('Current formData:', formData);
  console.log('Current supplier:', formData.supplier);
  console.log('Current vendor:', formData.vendor);
  console.log('Persisted vendor name:', selectedVendorName);

  // Fetch all products from the inventory API
  useEffect(() => {
    const fetchSiteProducts = async () => {
      try {
        setLoading(true);
        // Get the site name from localStorage if available
        const lastSelectedSite = localStorage.getItem('lastSelectedSite');
        let site = '';
        
        if (lastSelectedSite) {
          try {
            const siteData = JSON.parse(lastSelectedSite);
            site = siteData.siteName;
            setSiteName(site);
          } catch (e) {
            console.error("Error parsing stored site data:", e);
          }
        }
        
        if (site) {
          
          const response = await axios.get(`/api/devices/site/${site}`);
          if (response.data && Array.isArray(response.data)) {
            // Convert to format compatible with our component
            const formattedProducts = response.data.map(device => ({
              id: device.id || Math.random().toString(36).substring(2),
              name: device.device_hostname || device.device_model || 'Unknown Device',
              sku: device.mac_address || device.asset_tag || 'N/A',
              category: device.device_type || 'Other',
              price: device.estimated_value || calculatePriceByCategory(device.device_type),
              description: device.device_description || '',
              vendor: device.manufacturer || device.vendor || ''
            }));
            
            setAllProducts(formattedProducts);
          }
        }
      } catch (error) {
        console.warn('Error fetching site products, using sample data:', error);
        // Keep sample data if API fails
      } finally {
        setLoading(false);
      }
    };
    
    fetchSiteProducts();
  }, []);

  // When supplier changes or vendorProducts are provided, filter products by vendor
  useEffect(() => {
    // Check if we already have products loaded for this vendor in localStorage
    const savedData = loadVendorProductsFromLocalStorage();
    const currentVendorName = formData.vendor?.name || 
      (formData.supplier && formData.supplier.startsWith('vendor-') ? 
        formData.supplier.replace('vendor-', '').replace(/-/g, ' ') : null);
    
    // If we have saved data and it matches our current vendor, use it
    if (savedData && currentVendorName && 
        savedData.vendor.toLowerCase().includes(currentVendorName.toLowerCase()) && 
        !productsLoadedRef.current) {
      console.log(`Using ${savedData.products.length} saved products for ${savedData.vendor}`);
      setVendorSpecificProducts(savedData.products);
      setSelectedVendorName(savedData.vendor);
      productsLoadedRef.current = true;
      return;
    }

    // If we already processed this vendor and have products, don't reprocess
    if (productsLoadedRef.current && vendorSpecificProducts.length > 0 && vendorProducts.length === 0) {
      console.log('Already loaded vendor products, skipping reload');
      return;
    }
    
    // Process vendor products from props if provided
    if (vendorProducts.length > 0) {
      console.log('Using provided vendor products:', vendorProducts);
      setVendorSpecificProducts(vendorProducts);
      if (formData.vendor?.name) {
        setSelectedVendorName(formData.vendor.name);
        saveVendorProductsToLocalStorage(formData.vendor.name, vendorProducts);
        productsLoadedRef.current = true;
      }
    } else if ((formData.supplier || formData.vendor) && allProducts.length > 0) {
      // Try to get vendor information from either supplier or vendor field
      const selectedVendorId = formData.supplier || (formData.vendor && formData.vendor.id);
      const vendorName = formData.vendor && formData.vendor.name;
      
      console.log('Selected Vendor ID:', selectedVendorId);
      console.log('Vendor name from vendor object:', vendorName);
      
      // Determine the vendor name from either source
      let selectedVendor = '';
      
      if (vendorName) {
        // Use the name directly from vendor object if available
        selectedVendor = vendorName;
      } else if (selectedVendorId && selectedVendorId.startsWith('vendor-')) {
        // Process vendor ID string format
        selectedVendor = selectedVendorId.replace('vendor-', '')
            .replace(/-/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
      } else if (selectedVendorName) {
        // Use previously stored vendor name if available
        selectedVendor = selectedVendorName;
      }
      
      // Normalize the vendor name
      if (selectedVendor) {
        selectedVendor = selectedVendor.toLowerCase()
            .replace(/\b(hp|hewlett packard)\b/g, 'hp')
            .replace(/\b(dell|dell inc)\b/g, 'dell')
            .replace(/\b(lenovo|lenovo inc)\b/g, 'lenovo')
            .replace(/\b(apple|apple inc)\b/g, 'apple')
            .replace(/\b(microsoft|microsoft corp)\b/g, 'microsoft')
            .replace(/\b(cisco|cisco systems)\b/g, 'cisco');
            
        // Store this vendor name for future reference
        setSelectedVendorName(selectedVendor);
      }
      
      console.log('Processed Vendor Name:', selectedVendor);
      
      if (selectedVendor) {
        console.log(`Filtering products for vendor: ${selectedVendor}`);
        
        // Attempt to fetch vendor-specific products from the API first
        const fetchVendorProducts = async () => {
          try {
            setLoading(true);
            // Try to fetch products directly by vendor name
            const response = await axios.get(`/api/devices/vendor/${encodeURIComponent(selectedVendor)}`);
            
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
              console.log(`Fetched ${response.data.length} products for vendor ${selectedVendor} from API`);
              
              // Map API response to product format
              const formattedProducts = response.data.map(device => ({
                id: device.id || Math.random().toString(36).substring(2),
                name: device.device_hostname || device.device_model || 'Unknown Device',
                sku: device.mac_address || device.asset_tag || 'N/A',
                category: device.device_type || 'Other',
                price: device.estimated_value || calculatePriceByCategory(device.device_type),
                description: device.device_description || '',
                vendor: selectedVendor // Ensure vendor name is preserved
              }));
              
              setVendorSpecificProducts(formattedProducts);
              saveVendorProductsToLocalStorage(selectedVendor, formattedProducts);
              productsLoadedRef.current = true;
            } else {
              // Fallback to client-side filtering if API returns no results
              console.log(`No products returned from API for ${selectedVendor}, using client-side filtering`);
              
              // Improved matching algorithm for vendor names
              const vendorProducts = allProducts.filter(product => {
                const productVendor = (product.vendor || '').toLowerCase();
                const selectedVendorLower = selectedVendor.toLowerCase();
                
                // More robust matching to catch variations in vendor names
                return productVendor.includes(selectedVendorLower) || 
                       selectedVendorLower.includes(productVendor) ||
                       productVendor.split(' ').some(word => selectedVendorLower.includes(word)) ||
                       selectedVendorLower.split(' ').some(word => productVendor.includes(word));
              }).map(product => ({
                ...product,
                vendor: selectedVendor // Ensure vendor name is consistent
              }));
              
              console.log(`Found ${vendorProducts.length} products using client-side filtering`);
              setVendorSpecificProducts(vendorProducts);
              saveVendorProductsToLocalStorage(selectedVendor, vendorProducts);
              productsLoadedRef.current = true;
            }
          } catch (error) {
            console.warn(`Error fetching products for vendor ${selectedVendor}:`, error);
            
            // Fallback to client-side filtering
            console.log(`Falling back to client-side filtering for ${selectedVendor}`);
            const vendorProducts = allProducts.filter(product => {
              const productVendor = (product.vendor || '').toLowerCase();
              const selectedVendorLower = selectedVendor.toLowerCase();
              
              return productVendor.includes(selectedVendorLower) || 
                     selectedVendorLower.includes(productVendor);
            }).map(product => ({
              ...product,
              vendor: selectedVendor // Ensure vendor name is consistent
            }));
            
            setVendorSpecificProducts(vendorProducts);
            saveVendorProductsToLocalStorage(selectedVendor, vendorProducts);
            productsLoadedRef.current = true;
          } finally {
            setLoading(false);
          }
        };
        
        fetchVendorProducts();
      } else {
        setVendorSpecificProducts([]);
      }
    } else {
      setVendorSpecificProducts([]);
    }
  }, [formData.supplier, formData.vendor, vendorProducts, allProducts]);
  
  // Calculate price based on device category
  const calculatePriceByCategory = (category) => {
    const categoryPrices = {
      'laptop': 1200,
      'desktop': 800,
      'monitor': 300,
      'printer': 400,
      'server': 3000,
      'network': 500,
      'tablet': 600,
      'phone': 800,
      'peripheral': 100
    };
    
    return categoryPrices[category?.toLowerCase()] || 500; // Default price
  };

  const addItem = (product) => {
    // Check if item already exists in the order
    const existingItem = formData.items.find(item => item.id === product.id);
    
    if (existingItem) {
      // Update quantity if item already exists
      const newItems = formData.items.map(item => {
        if (item.id === product.id) {
          return { ...item, quantity: item.quantity + 1 };
        }
        return item;
      });
      setFormData({ ...formData, items: newItems });
    } else {
      setFormData({
        ...formData,
        items: [...formData.items, { ...product, quantity: 1 }]
      });
    }
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const updateQuantity = (index, quantity) => {
    const newItems = formData.items.map((item, i) => {
      if (i === index) {
        return { ...item, quantity: parseInt(quantity) || 0 };
      }
      return item;
    });
    setFormData({ ...formData, items: newItems });
  };

  // Filter products based on search
  const filteredProducts = vendorSpecificProducts.filter(product =>
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get vendor name for display
  const getVendorDisplayName = () => {
    if (vendorProducts.length > 0 && formData.vendor?.name) {
      return formData.vendor.name;
    }
    
    if (formData.vendor && formData.vendor.name) {
      return formData.vendor.name;
    }
    
    if (formData.supplier && formData.supplier.startsWith('vendor-')) {
      return formData.supplier.replace('vendor-', '').replace(/-/g, ' ');
    }
    
    if (selectedVendorName) {
      // Return capitalized vendor name
      return selectedVendorName.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }
    
    return siteName || 'Inventory';
  };

  return (
    <div className="mb-4">
      <Row className="g-4">
        <Col md={6}>
          <div>
            <h6 className="mb-3">
              {(formData.supplier || formData.vendor) 
                ? `Add Items from ${getVendorDisplayName()}` 
                : siteName 
                  ? `Add Items from ${siteName}` 
                  : 'Add Items'}
            </h6>
            
            {(formData.supplier || formData.vendor) && (
              <Alert variant="primary" className="d-flex align-items-center mb-3">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                <div>
                  Showing products from {getVendorDisplayName()} available at your site.
                </div>
              </Alert>
            )}
            
            <InputGroup className="mb-3">
              <InputGroup.Text>
                <FontAwesomeIcon icon={faSearch} />
              </InputGroup.Text>
              <Form.Control
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            {loading ? (
              <div className="text-center py-4">
                <Spinner animation="border" role="status" variant="primary">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-2">Loading products...</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <Alert variant="warning">
                <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
                {(formData.supplier || formData.vendor) 
                  ? `No products found from ${getVendorDisplayName()} matching your search criteria.`
                  : 'No products found matching your search criteria. Please select a supplier first.'}
              </Alert>
            ) : (
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <Table hover responsive>
                  <thead>
                    <tr>
                      <th style={{ width: '40%' }}>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProducts.map(product => (
                      <tr key={product.id}>
                        <td>
                          <div className="fw-bold">{product.name}</div>
                          <small className="text-muted">{product.sku}</small>
                        </td>
                        <td>
                          <Badge bg="secondary" className="rounded-pill">{product.category}</Badge>
                        </td>
                        <td>${product.price?.toFixed(2) || '0.00'}</td>
                        <td>
                          <Button 
                            variant="primary" 
                            size="sm"
                            onClick={() => addItem(product)}
                          >
                            <FontAwesomeIcon icon={faPlus} /> Add
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </div>
        </Col>
        
        <Col md={6}>
          <div>
            <h6 className="mb-3">Order Items</h6>
            {formData.items.length === 0 ? (
              <Alert variant="info">
                <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
                No items added to the order yet. Select products from the left panel.
              </Alert>
            ) : (
              <Table responsive>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div className="fw-bold">{item.name}</div>
                        <small className="text-muted">{item.category}</small>
                      </td>
                      <td>
                        <Form.Control
                          type="number"
                          min="1"
                          style={{ width: '70px' }}
                          value={item.quantity}
                          onChange={(e) => updateQuantity(index, e.target.value)}
                        />
                      </td>
                      <td>${item.price?.toFixed(2) || '0.00'}</td>
                      <td>${(item.quantity * item.price)?.toFixed(2) || '0.00'}</td>
                      <td>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-end fw-bold">Subtotal:</td>
                    <td colSpan="2" className="fw-bold">
                      ${formData.items.reduce((total, item) => total + (item.quantity * item.price), 0).toFixed(2)}
                    </td>
                  </tr>
                </tfoot>
              </Table>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ItemsSelection; 