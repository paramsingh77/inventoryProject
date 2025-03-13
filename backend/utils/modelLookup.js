const axios = require('axios');

/**
 * Lookup vendor information for a model number using online resources
 * @param {string} modelNumber - The device model number to lookup
 * @returns {Promise<{vendor: string, category: string, description: string}>}
 */
const lookupModelInfo = async (modelNumber) => {
  try {
    if (!modelNumber) {
      return { vendor: 'Unknown', category: 'Unknown', description: '' };
    }
    
    // Clean the model number for search
    const cleanModel = modelNumber.replace(/[^\w\s-]/g, '').trim();
    
    // Try to lookup model info from multiple sources
    const results = await Promise.all([
      searchDuckDuckGo(cleanModel),
      searchTechSpecsAPI(cleanModel)
    ]);
    
    // Combine results, taking the first non-null response
    const combinedResults = results.filter(Boolean)[0] || { 
      vendor: detectVendorFromModel(cleanModel),
      category: detectCategoryFromModel(cleanModel),
      description: ''
    };
    
    console.log(`Found vendor for ${modelNumber}: ${combinedResults.vendor}`);
    return combinedResults;
  } catch (error) {
    console.error(`Error looking up model ${modelNumber}:`, error);
    return { 
      vendor: detectVendorFromModel(modelNumber) || 'Unknown', 
      category: 'Unknown',
      description: ''
    };
  }
};

/**
 * Search DuckDuckGo for model information
 * @param {string} modelNumber - The model to search for
 * @returns {Promise<object|null>}
 */
const searchDuckDuckGo = async (modelNumber) => {
  try {
    const response = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(modelNumber + ' specs')}&format=json`);
    
    if (response.data && response.data.AbstractText) {
      const abstract = response.data.AbstractText;
      
      // Extract vendor name - usually at the beginning of the abstract
      let vendor = 'Unknown';
      const knownVendors = [
        'Dell', 'HP', 'Lenovo', 'Apple', 'Asus', 'Acer', 'Microsoft', 
        'Samsung', 'LG', 'Cisco', 'Juniper', 'Intel', 'AMD', 'IBM',
        'Sony', 'Toshiba', 'Fujitsu', 'Huawei', 'Google', 'Alienware',
        'MSI', 'Razer', 'Nvidia', 'Canon', 'Epson', 'Brother', 'Xerox'
      ];
      
      for (const v of knownVendors) {
        if (abstract.includes(v)) {
          vendor = v;
          break;
        }
      }
      
      // Extract category
      let category = 'Unknown';
      const categoryKeywords = {
        'laptop': ['laptop', 'notebook', 'portable computer'],
        'desktop': ['desktop', 'tower', 'computer', 'workstation'],
        'server': ['server', 'rack', 'blade'],
        'printer': ['printer', 'multifunction', 'all-in-one', 'inkjet', 'laser'],
        'network': ['router', 'switch', 'access point', 'firewall', 'networking'],
        'tablet': ['tablet', 'ipad'],
        'phone': ['phone', 'smartphone', 'mobile', 'iphone'],
        'monitor': ['monitor', 'display', 'screen'],
        'peripheral': ['keyboard', 'mouse', 'webcam', 'headset']
      };
      
      for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (keywords.some(keyword => abstract.toLowerCase().includes(keyword))) {
          category = cat;
          break;
        }
      }
      
      return { vendor, category, description: abstract };
    }
    
    return null;
  } catch (error) {
    console.warn('DuckDuckGo search failed:', error.message);
    return null;
  }
};

/**
 * Search TechSpecs API for model information (simulation)
 * @param {string} modelNumber - The model to search for
 * @returns {Promise<object|null>}
 */
const searchTechSpecsAPI = async (modelNumber) => {
  try {
    // Simulating API call to a tech specs service
    // In a real implementation, this would call an actual API
    const vendorMapping = {
      'latitude': 'Dell',
      'inspiron': 'Dell',
      'xps': 'Dell',
      'precision': 'Dell',
      'optiplex': 'Dell',
      'thinkpad': 'Lenovo',
      'thinkcentre': 'Lenovo',
      'ideapad': 'Lenovo',
      'probook': 'HP',
      'elitebook': 'HP',
      'pavilion': 'HP',
      'envy': 'HP',
      'spectre': 'HP',
      'macbook': 'Apple',
      'imac': 'Apple',
      'mac': 'Apple',
      'ipad': 'Apple',
      'iphone': 'Apple',
      'surface': 'Microsoft',
      'galaxy': 'Samsung',
      'zenbook': 'Asus',
      'vivobook': 'Asus',
      'aspire': 'Acer',
      'predator': 'Acer',
      'gram': 'LG',
      'catalyst': 'Cisco',
      'nexus': 'Cisco'
    };
    
    const lowerModel = modelNumber.toLowerCase();
    let vendor = 'Unknown';
    
    // Find matching vendor
    for (const [keyword, vendorName] of Object.entries(vendorMapping)) {
      if (lowerModel.includes(keyword)) {
        vendor = vendorName;
        break;
      }
    }
    
    // If no vendor found but has a model number pattern, infer from that
    if (vendor === 'Unknown') {
      if (/^[A-Z]\d{3,4}/.test(modelNumber)) vendor = 'Dell'; // E.g., E6420
      else if (/^T\d{3}/.test(modelNumber)) vendor = 'Lenovo'; // E.g., T420
      else if (/^[A-Z][A-Z]\d{4}/.test(modelNumber)) vendor = 'HP'; // E.g., HP8460
    }
    
    if (vendor !== 'Unknown') {
      return { 
        vendor, 
        category: detectCategoryFromModel(modelNumber),
        description: `${vendor} ${modelNumber} device`
      };
    }
    
    return null;
  } catch (error) {
    console.warn('Tech specs API search failed:', error.message);
    return null;
  }
};

/**
 * Attempt to detect vendor from model number based on patterns
 * @param {string} modelNumber - The model number to analyze
 * @returns {string} - Detected vendor name or "Unknown"
 */
const detectVendorFromModel = (modelNumber) => {
  if (!modelNumber) return 'Unknown';
  
  const lowerModel = modelNumber.toLowerCase();
  
  // Common vendor patterns
  const vendorPatterns = {
    'Dell': /(dell|latitude|inspiron|xps|precision|optiplex)/i,
    'HP': /(hp|hewlett[- ]?packard|pavilion|envy|elitebook|probook|compaq)/i,
    'Lenovo': /(lenovo|thinkpad|ideapad|thinkcentre)/i,
    'Apple': /(apple|mac|macbook|imac|iphone|ipad)/i,
    'Asus': /(asus|zenbook|vivobook|tuf|rog)/i,
    'Acer': /(acer|aspire|predator|nitro)/i,
    'Microsoft': /(microsoft|surface)/i,
    'Samsung': /(samsung|galaxy)/i,
    'LG': /(lg|gram)/i,
    'Cisco': /(cisco|catalyst|nexus)/i,
    'Juniper': /(juniper)/i,
    'IBM': /(ibm)/i,
    'Sony': /(sony|vaio)/i,
    'Toshiba': /(toshiba|satellite|portege)/i,
    'Intel': /(intel|nuc)/i,
    'AMD': /(amd)/i
  };
  
  for (const [vendor, pattern] of Object.entries(vendorPatterns)) {
    if (pattern.test(lowerModel)) {
      return vendor;
    }
  }
  
  // Try to extract from specific model number patterns
  if (/^[A-Z]\d{3,4}/.test(modelNumber)) return 'Dell';
  if (/^T\d{3}/.test(modelNumber)) return 'Lenovo';
  if (/^[A-Z][A-Z]\d{4}/.test(modelNumber)) return 'HP';
  
  return 'Unknown';
};

/**
 * Attempt to detect device category from model number based on patterns
 * @param {string} modelNumber - The model number to analyze
 * @returns {string} - Detected category or "Unknown"
 */
const detectCategoryFromModel = (modelNumber) => {
  if (!modelNumber) return 'Unknown';
  
  const lowerModel = modelNumber.toLowerCase();
  
  // Common category patterns
  const categoryPatterns = {
    'laptop': /(laptop|notebook|macbook|thinkpad|elitebook|probook|inspiron|latitude|xps)/i,
    'desktop': /(desktop|tower|workstation|optiplex|thinkcentre|imac)/i,
    'server': /(server|rack|blade|poweredge|proliant)/i,
    'printer': /(printer|laserjet|officejet|inkjet|mfp)/i,
    'network': /(router|switch|access point|firewall|catalyst|nexus)/i,
    'tablet': /(tablet|ipad|surface)/i,
    'phone': /(phone|iphone|galaxy|smartphone)/i,
    'monitor': /(monitor|display|screen)/i,
    'peripheral': /(keyboard|mouse|webcam|headset)/i
  };
  
  for (const [category, pattern] of Object.entries(categoryPatterns)) {
    if (pattern.test(lowerModel)) {
      return category;
    }
  }
  
  return 'Unknown';
};

/**
 * Get unique vendor names for the given model numbers
 * @param {string[]} modelNumbers - Array of model numbers to lookup
 * @returns {Promise<string[]>} - Array of unique vendor names
 */
const getUniqueVendorsForModels = async (modelNumbers) => {
  try {
    const vendorSet = new Set();
    
    // Process in chunks to avoid overloading APIs
    const chunkSize = 10;
    for (let i = 0; i < modelNumbers.length; i += chunkSize) {
      const chunk = modelNumbers.slice(i, i + chunkSize);
      
      // Process models in parallel within the chunk
      const results = await Promise.all(
        chunk.map(model => lookupModelInfo(model))
      );
      
      // Add vendors to set
      results.forEach(result => {
        if (result.vendor && result.vendor !== 'Unknown') {
          vendorSet.add(result.vendor);
        }
      });
    }
    
    return Array.from(vendorSet);
  } catch (error) {
    console.error('Error getting unique vendors:', error);
    return [];
  }
};

module.exports = {
  lookupModelInfo,
  getUniqueVendorsForModels,
  detectVendorFromModel,
  detectCategoryFromModel
}; 