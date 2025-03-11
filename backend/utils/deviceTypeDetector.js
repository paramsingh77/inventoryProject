const { searchDeviceOnline } = require('./onlineDeviceDetector');

const deviceTypePatterns = {
    laptop: [
        /laptop/i,
        /notebook/i,
        /(thinkpad|elitebook|macbook|latitude|precision|probook|zbook)/i,
        /book\s*(air|pro)/i
    ],
    desktop: [
        /desktop/i,
        /(optiplex|prodesk|thinkcentre|workstation)/i,
        /\b(pc|computer)\b/i
    ],
    monitor: [
        /monitor/i,
        /display/i,
        /(screen|lcd|led)\b/i,
        /\d{2}(in|inch)/i
    ],
    printer: [
        /printer/i,
        /(laserjet|officejet|deskjet)/i,
        /\b(mfp|aio)\b/i
    ],
    server: [
        /server/i,
        /(poweredge|proliant|system x)/i,
        /\brack\b/i
    ],
    network: [
        /(switch|router|firewall|access\s*point)/i,
        /(cisco|juniper|aruba|meraki)/i,
        /\b(ap|wap)\b/i
    ],
    tablet: [
        /tablet/i,
        /(ipad|surface|galaxy\s*tab)/i
    ],
    phone: [
        /phone/i,
        /(iphone|galaxy|pixel)/i,
        /mobile/i
    ],
    peripheral: [
        /(keyboard|mouse|webcam|headset|dock|docking)/i,
        /\b(kbd|cam)\b/i
    ]
};

/**
 * Detect device type based on model name and other device information
 * @param {Object} deviceInfo - Device information object
 * @param {string} deviceInfo.device_model - Device model name
 * @param {string} deviceInfo.device_description - Device description (optional)
 * @param {string} deviceInfo.operating_system - Operating system (optional)
 * @returns {Promise<string>} Detected device type
 */
const detectDeviceType = async (deviceInfo) => {
    const { device_model, device_description, operating_system } = deviceInfo;
    
    // First try local detection
    const searchText = [
        device_model,
        device_description,
        operating_system
    ].filter(Boolean).join(' ');

    // Check each device type pattern
    for (const [type, patterns] of Object.entries(deviceTypePatterns)) {
        if (patterns.some(pattern => pattern.test(searchText))) {
            return type;
        }
    }

    // Special case for Apple devices
    if (searchText.toLowerCase().includes('mac')) {
        if (searchText.toLowerCase().includes('book')) {
            return 'laptop';
        }
        if (searchText.toLowerCase().includes('imac')) {
            return 'desktop';
        }
    }

    // If local detection fails, try online detection
    try {
        const vendor = detectVendor(device_model);
        const onlineResult = await searchDeviceOnline({
            device_model,
            vendor,
            description: device_description
        });

        if (onlineResult.type !== 'unknown') {
            // Cache the result for future use
            addToDeviceTypePatterns(device_model, onlineResult.type);
            return onlineResult.type;
        }
    } catch (error) {
        console.warn('Online device detection failed:', error.message);
    }

    // Default to 'unknown' if both local and online detection fail
    return 'unknown';
};

/**
 * Add new device pattern to local patterns
 * @param {string} model - Device model
 * @param {string} type - Device type
 */
const addToDeviceTypePatterns = (model, type) => {
    if (!deviceTypePatterns[type]) {
        deviceTypePatterns[type] = [];
    }
    
    // Create a pattern based on the model
    const pattern = new RegExp(
        model.replace(/[0-9]+/g, '[0-9]+')
            .replace(/[\[\]{}()*+?.,\\^$|#\s]/g, '\\$&'),
        'i'
    );
    
    // Add the pattern if it doesn't exist
    if (!deviceTypePatterns[type].some(p => p.toString() === pattern.toString())) {
        deviceTypePatterns[type].push(pattern);
    }
};

/**
 * Get vendor from device model
 * @param {string} device_model - Device model name
 * @returns {string} Detected vendor name
 */
const detectVendor = (device_model) => {
    if (!device_model) return 'Unknown';

    const vendorPatterns = {
        'HP': /(hp|hewlett[- ]?packard|compaq)/i,
        'Dell': /dell/i,
        'Lenovo': /(lenovo|thinkpad|thinkcentre)/i,
        'Apple': /(apple|mac|iphone|ipad)/i,
        'Cisco': /cisco/i,
        'Microsoft': /(microsoft|surface)/i,
        'Acer': /acer/i,
        'ASUS': /asus/i,
        'Samsung': /samsung/i,
        'LG': /\b(lg|life'?s good)\b/i
    };

    for (const [vendor, pattern] of Object.entries(vendorPatterns)) {
        if (pattern.test(device_model)) {
            return vendor;
        }
    }

    return 'Unknown';
};

module.exports = {
    detectDeviceType,
    detectVendor
}; 