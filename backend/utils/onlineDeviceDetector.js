const axios = require('axios');

/**
 * Search device information using multiple online sources
 * @param {Object} deviceInfo - Device information object
 * @param {string} deviceInfo.device_model - Device model name
 * @param {string} deviceInfo.vendor - Vendor name (optional)
 * @returns {Promise<Object>} Device type and additional information
 */
const searchDeviceOnline = async (deviceInfo) => {
    const { device_model, vendor } = deviceInfo;
    
    try {
        // Try multiple APIs in sequence until we get a match
        const apis = [
            searchSnykVulnDb,
            searchNvdDatabase,
            searchTechSpecs
        ];

        for (const searchApi of apis) {
            try {
                const result = await searchApi(deviceInfo);
                if (result && result.type !== 'unknown') {
                    return result;
                }
            } catch (error) {
                console.warn(`API search failed for ${searchApi.name}:`, error.message);
                continue;
            }
        }

        return { type: 'unknown', confidence: 0 };
    } catch (error) {
        console.error('Error in online device search:', error);
        return { type: 'unknown', confidence: 0, error: error.message };
    }
};

/**
 * Search device in Snyk Vulnerability Database
 * @param {Object} deviceInfo - Device information
 * @returns {Promise<Object>} Device information
 */
const searchSnykVulnDb = async (deviceInfo) => {
    try {
        const response = await axios.get('https://security.snyk.io/api/vuln/search', {
            params: {
                q: `${deviceInfo.vendor || ''} ${deviceInfo.device_model}`,
                type: 'hardware'
            }
        });

        if (response.data && response.data.results) {
            // Analyze results to determine device type
            const types = response.data.results
                .filter(result => result.package)
                .map(result => analyzeDescription(result.description));

            if (types.length > 0) {
                const mostCommonType = findMostCommon(types);
                return {
                    type: mostCommonType,
                    confidence: 0.8,
                    source: 'snyk'
                };
            }
        }

        return { type: 'unknown', confidence: 0 };
    } catch (error) {
        console.warn('Snyk API search failed:', error.message);
        return { type: 'unknown', confidence: 0 };
    }
};

/**
 * Search device in NVD (National Vulnerability Database)
 * @param {Object} deviceInfo - Device information
 * @returns {Promise<Object>} Device information
 */
const searchNvdDatabase = async (deviceInfo) => {
    try {
        const response = await axios.get('https://services.nvd.nist.gov/rest/json/cpes/2.0', {
            params: {
                keywordSearch: `${deviceInfo.vendor || ''} ${deviceInfo.device_model}`
            }
        });

        if (response.data && response.data.products) {
            const products = response.data.products
                .filter(product => product.cpe.includes(deviceInfo.device_model.toLowerCase()));

            if (products.length > 0) {
                const deviceType = determineTypeFromCpe(products[0].cpe);
                return {
                    type: deviceType,
                    confidence: 0.7,
                    source: 'nvd'
                };
            }
        }

        return { type: 'unknown', confidence: 0 };
    } catch (error) {
        console.warn('NVD API search failed:', error.message);
        return { type: 'unknown', confidence: 0 };
    }
};

/**
 * Search device specifications in TechSpecs API
 * @param {Object} deviceInfo - Device information
 * @returns {Promise<Object>} Device information
 */
const searchTechSpecs = async (deviceInfo) => {
    try {
        // Note: This is a mock implementation as TechSpecs requires an API key
        // In production, you would need to sign up for an API key
        const response = await axios.get('https://api.techspecs.io/v4/product/search', {
            headers: {
                'Authorization': process.env.TECHSPECS_API_KEY
            },
            params: {
                query: `${deviceInfo.vendor || ''} ${deviceInfo.device_model}`
            }
        });

        if (response.data && response.data.items) {
            const item = response.data.items[0];
            return {
                type: item.category.toLowerCase(),
                confidence: 0.9,
                source: 'techspecs',
                specifications: item.specifications
            };
        }

        return { type: 'unknown', confidence: 0 };
    } catch (error) {
        console.warn('TechSpecs API search failed:', error.message);
        return { type: 'unknown', confidence: 0 };
    }
};

/**
 * Analyze text description to determine device type
 * @param {string} description - Device description
 * @returns {string} Detected device type
 */
const analyzeDescription = (description) => {
    const typePatterns = {
        laptop: /(laptop|notebook|portable computer)/i,
        desktop: /(desktop|workstation|computer)/i,
        server: /(server|rack|blade)/i,
        printer: /(printer|mfp|scanner)/i,
        network: /(router|switch|firewall|access point)/i,
        monitor: /(monitor|display|screen)/i,
        tablet: /(tablet|pad)/i,
        phone: /(phone|smartphone|mobile device)/i,
        peripheral: /(keyboard|mouse|webcam|peripheral)/i
    };

    for (const [type, pattern] of Object.entries(typePatterns)) {
        if (pattern.test(description)) {
            return type;
        }
    }

    return 'unknown';
};

/**
 * Determine device type from CPE (Common Platform Enumeration)
 * @param {string} cpe - CPE string
 * @returns {string} Device type
 */
const determineTypeFromCpe = (cpe) => {
    const parts = cpe.split(':');
    if (parts.length >= 5) {
        const category = parts[4];
        
        const categoryMap = {
            'laptop': 'laptop',
            'notebook': 'laptop',
            'desktop': 'desktop',
            'server': 'server',
            'printer': 'printer',
            'router': 'network',
            'switch': 'network',
            'monitor': 'monitor',
            'tablet': 'tablet',
            'phone': 'phone',
            'peripheral': 'peripheral'
        };

        return categoryMap[category] || 'unknown';
    }
    return 'unknown';
};

/**
 * Find most common item in an array
 * @param {Array} arr - Array of items
 * @returns {*} Most common item
 */
const findMostCommon = (arr) => {
    const counts = arr.reduce((acc, val) => {
        acc[val] = (acc[val] || 0) + 1;
        return acc;
    }, {});
    
    return Object.entries(counts)
        .sort(([,a], [,b]) => b - a)[0][0];
};

module.exports = {
    searchDeviceOnline
}; 