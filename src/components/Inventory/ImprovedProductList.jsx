import React, { useState, useEffect } from 'react';
import ProductList from './ProductList';
import { categorizeDeviceExclusive } from '../../scripts/cpu_based_categorization';

/**
 * ImprovedProductList - A wrapper component that pre-processes devices with CPU-based categorization
 * before passing them to the original ProductList component
 */
const ImprovedProductList = ({ data, ...otherProps }) => {
  const [processedData, setProcessedData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (data && data.length > 0) {
      console.log("Processing data with CPU-based categorization...");
      
      // Add CPU categorization to each device
      const enhancedData = data.map(device => {
        const category = categorizeDeviceExclusive(device);
        return {
          ...device,
          cpu_category: category,
          // Add a more accurate device_type based on CPU analysis
          // This helps the original component's filters work better
          device_type: getCategoryDeviceType(category, device.device_type)
        };
      });

      // Log category counts for verification
      logCategoryCounts(enhancedData);
      
      setProcessedData(enhancedData);
      setLoading(false);
    } else {
      setProcessedData(data || []);
      setLoading(false);
    }
  }, [data]);

  // Convert our category to a device_type that the original component understands
  const getCategoryDeviceType = (category, originalType) => {
    switch (category) {
      case 'Server-Physical': 
        return 'Server-Physical';
      case 'Server-VM': 
        return 'Server-VM';
      case 'Laptop': 
        return 'Laptop';
      case 'Desktop': 
        return 'Desktop';
      case 'Cell-phones-ATT':
      case 'Cell-phones-Verizon': 
        return 'Mobile Phone';
      case 'DLALION-License': 
        return 'License';
      default:
        // Keep original type if we can't determine a better one
        return originalType || 'Unknown';
    }
  };

  // Log category counts for debugging
  const logCategoryCounts = (devices) => {
    const counts = devices.reduce((acc, device) => {
      const category = device.cpu_category;
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    console.log("=== CPU-BASED CATEGORY COUNTS ===");
    Object.entries(counts).forEach(([category, count]) => {
      console.log(`${category}: ${count} devices`);
    });
    console.log("Total devices:", devices.length);
    console.log("Sum of categories:", Object.values(counts).reduce((a, b) => a + b, 0));
  };

  return <ProductList data={processedData} loading={loading} {...otherProps} />;
};

export default ImprovedProductList; 