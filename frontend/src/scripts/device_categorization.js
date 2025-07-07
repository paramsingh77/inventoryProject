// Device categorization utility functions
// This file provides standardized category detection for devices across the application

/**
 * Categorizes a device into one of the predefined categories based on its properties
 * @param {Object} device - Device object with properties like hostname, model, cpu, etc.
 * @returns {String} The detected category
 */
export const detectDeviceCategory = (device) => {
  // Check for null/undefined device
  if (!device) return 'Unknown';
  
  // VM detection has precedence
  if (isServerVM(device)) {
    return 'Server-VM';
  }
  
  // Then check for physical server with strict rules
  if (isServerPhysicalStrict(device)) {
    return 'Server-Physical';
  }
  
  // Other categories follow
  if (isCellPhoneATT(device)) {
    return 'Cell-phones-ATT';
  }
  
  if (isCellPhoneVerizon(device)) {
    return 'Cell-phones-Verizon';
  }
  
  if (isDLALIONLicense(device)) {
    return 'DLALION-License';
  }
  
  if (isLaptop(device)) {
    return 'Laptop';
  }
  
  if (isDesktop(device)) {
    return 'Desktop';
  }
  
  // If no specific category detected, return Other
  return 'Other';
};

/**
 * Enhanced isServerPhysical function with more accurate categorization
 */
export const isServerPhysicalStrict = (device) => {
  if (!device) return false;
  
  const hostname = (device.device_hostname || '').toLowerCase();
  const model = (device.device_model || '').toLowerCase();
  const deviceType = (device.device_type || '').toLowerCase();
  const cpu = (device.device_cpu || '').toLowerCase();
  const os = (device.operating_system || '').toLowerCase();
  
  // Check for VM indicators first - these override server classification
  if (hostname.includes('vm') || 
      hostname.includes('virtual') || 
      hostname.startsWith('aamdt') ||
      model.includes('virtual') || 
      model.includes('vmware') ||
      cpu.includes('virtual') || 
      cpu.includes('vcpu') ||
      os.includes('esxi') ||
      os.includes('hypervisor')) {
    return false;
  }
  
  // Exact device_type match
  if (deviceType === 'server-physical' || deviceType === 'server') {
    return true;
  }
  
  // Check hostname patterns
  if (hostname.startsWith('srv')) {
    return true;
  }
  
  // Server CPU indicators
  const serverCpuPatterns = [
    /xeon/i, /epyc/i, /opteron/i, /e5-\d/i, /e7-\d/i, 
    /gold/i, /silver/i, /platinum/i, /\d{4}v\d/i
  ];
  
  if (serverCpuPatterns.some(pattern => pattern.test(cpu))) {
    return true;
  }
  
  // Server model indicators
  const serverModelPatterns = [
    /poweredge/i, /proliant/i, /system x/i, /thinkserver/i, 
    /blade/i, /rack/i, /r\d{3}/i, /r\d{3}\w/i
  ];
  
  if (serverModelPatterns.some(pattern => pattern.test(model))) {
    return true;
  }
  
  // Server OS indicators
  if ((os.includes('server') || os.includes('enterprise')) && 
      !os.includes('workstation')) {
    return true;
  }
  
  return false;
};

/**
 * Checks if a device is a physical server (ORIGINAL LESS STRICT VERSION)
 */
export const isServerPhysical = (device) => {
  if (!device) return false;
  
  const hostname = (device.device_hostname || '').toLowerCase();
  const model = (device.device_model || '').toLowerCase();
  const deviceType = (device.device_type || '').toLowerCase();
  const cpu = (device.device_cpu || '').toLowerCase();
  const os = (device.operating_system || '').toLowerCase();
  
  // Check device_type field first
  if (deviceType === 'server-physical' || deviceType === 'server') return true;
  
  // Check hostname patterns
  if (hostname.startsWith('srv') && !hostname.includes('vm')) return true;
  
  // Check CPU model for server CPUs
  if (/xeon|epyc|opteron|threadripper|e5-\d|e7-\d|gold|silver|platinum/.test(cpu)) return true;
  
  // Check model for server hardware
  if (/poweredge|proliant|system x|thinkserver|blade/.test(model)) return true;
  
  // Check OS for server OS
  if ((os.includes('server') || os.includes('enterprise')) && !hostname.includes('vm')) return true;
  
  return false;
};

/**
 * Checks if a device is a virtual machine
 */
export const isServerVM = (device) => {
  if (!device) return false;
  
  const hostname = (device.device_hostname || '').toLowerCase();
  const model = (device.device_model || '').toLowerCase();
  const deviceType = (device.device_type || '').toLowerCase();
  const cpu = (device.device_cpu || '').toLowerCase();
  const os = (device.operating_system || '').toLowerCase();
  
  // Check device_type field first
  if (deviceType === 'server-vm' || deviceType === 'virtual machine') return true;
  
  // Check hostname patterns
  if (hostname.startsWith('vm') || hostname.includes('virtual')) return true;
  if (hostname.startsWith('aamdt')) return true;
  
  // Check for VM indicators in model or CPU
  if (model.includes('vmware') || model.includes('virtual')) return true;
  if (cpu.includes('virtual') || cpu.includes('vcpu') || cpu.includes('vmware')) return true;
  
  // Check OS for hypervisor mentions
  if (os.includes('hypervisor') || os.includes('esxi')) return true;
  
  return false;
};

/**
 * Checks if a device is an ATT cell phone
 */
export const isCellPhoneATT = (device) => {
  if (!device) return false;
  
  const hostname = (device.device_hostname || '').toLowerCase();
  const model = (device.device_model || '').toLowerCase();
  const deviceType = (device.device_type || '').toLowerCase();
  const vendor = (device.vendor || '').toLowerCase();
  
  // Check device_type field first
  if (deviceType === 'cell-phones-att') return true;
  
  // Check if it's a phone and related to ATT
  if (deviceType.includes('phone') && (vendor.includes('att') || hostname.includes('att') || model.includes('att'))) return true;
  
  // Check hostname patterns
  if (hostname.includes('phone') && hostname.includes('att')) return true;
  
  return false;
};

/**
 * Checks if a device is a Verizon cell phone
 */
export const isCellPhoneVerizon = (device) => {
  if (!device) return false;
  
  const hostname = (device.device_hostname || '').toLowerCase();
  const model = (device.device_model || '').toLowerCase();
  const deviceType = (device.device_type || '').toLowerCase();
  const vendor = (device.vendor || '').toLowerCase();
  
  // Check device_type field first
  if (deviceType === 'cell-phones-verizon') return true;
  
  // Check if it's a phone and related to Verizon
  if (deviceType.includes('phone') && (
    vendor.includes('verizon') || 
    hostname.includes('verizon') || 
    model.includes('verizon') ||
    vendor.includes('vzw') || 
    hostname.includes('vzw') || 
    model.includes('vzw')
  )) return true;
  
  // Check hostname patterns
  if (hostname.includes('phone') && (hostname.includes('verizon') || hostname.includes('vzw'))) return true;
  
  return false;
};

/**
 * Checks if a device is a DLALION License
 */
export const isDLALIONLicense = (device) => {
  if (!device) return false;
  
  const hostname = (device.device_hostname || '').toLowerCase();
  const deviceType = (device.device_type || '').toLowerCase();
  
  // Check device_type field first
  if (deviceType === 'dlalion-license') return true;
  
  // Check hostname patterns
  if (hostname.includes('lic') || hostname.includes('license') || hostname.includes('dlalion')) return true;
  
  // Check if device type includes license
  if (deviceType.includes('license')) return true;
  
  return false;
};

/**
 * Checks if a device is a desktop computer
 */
export const isDesktop = (device) => {
  if (!device) return false;
  
  const hostname = (device.device_hostname || '').toLowerCase();
  const model = (device.device_model || '').toLowerCase();
  const deviceType = (device.device_type || '').toLowerCase();
  const cpu = (device.device_cpu || '').toLowerCase();
  
  // Check device_type field first
  if (deviceType.includes('desktop') || deviceType === 'all-in-one' || 
      deviceType.includes('sff') || deviceType.includes('tower')) return true;
  
  // Check model patterns
  if (model.includes('optiplex') || model.includes('thinkcentre') || 
      model.includes('prodesk') || model.includes('elitedesk')) return true;
  
  // Check CPU for desktop indicators
  if (/i\d-\d|core i\d|pentium|celeron|ryzen \d|athlon/.test(cpu) && !isLaptop(device)) return true;
  
  // AAM pattern that's not a DT
  if (hostname.includes('aam') && !hostname.includes('dt') && !isServerVM(device)) return true;
  
  return false;
};

/**
 * Checks if a device is a laptop
 */
export const isLaptop = (device) => {
  if (!device) return false;
  
  const hostname = (device.device_hostname || '').toLowerCase();
  const model = (device.device_model || '').toLowerCase();
  const deviceType = (device.device_type || '').toLowerCase();
  
  // Check device_type field first
  if (deviceType.includes('laptop') || deviceType.includes('notebook')) return true;
  
  // Check model patterns for common laptop models
  if (model.includes('thinkpad') || model.includes('latitude') || 
      model.includes('probook') || model.includes('macbook') ||
      model.includes('elitebook') || model.includes('xps')) return true;
  
  // Check hostname patterns
  if (hostname.includes('laptop') || hostname.includes('note')) return true;
  
  return false;
};

/**
 * Get all available device categories with their display names
 */
export const getDeviceCategories = () => {
  return {
    'Server-Physical': {
      name: 'Server - Physical',
      filter: isServerPhysicalStrict
    },
    'Server-VM': {
      name: 'Server - VM',
      filter: isServerVM
    },
    'Cell-phones-ATT': {
      name: 'Cell Phones - ATT',
      filter: isCellPhoneATT
    },
    'Cell-phones-Verizon': {
      name: 'Cell Phones - Verizon',
      filter: isCellPhoneVerizon
    },
    'DLALION-License': {
      name: 'DLALION - License',
      filter: isDLALIONLicense
    },
    'Desktop': {
      name: 'Desktop Computers',
      filter: isDesktop
    },
    'Laptop': {
      name: 'Laptops',
      filter: isLaptop
    },
    'Other': {
      name: 'Other Devices',
      filter: (device) => !isServerPhysicalStrict(device) &&
                          !isServerVM(device) &&
                          !isCellPhoneATT(device) &&
                          !isCellPhoneVerizon(device) &&
                          !isDLALIONLicense(device) &&
                          !isDesktop(device) &&
                          !isLaptop(device)
    }
  };
};

/**
 * Categorizes a device using a priority-based approach to ensure each device
 * is only counted in one category
 * @param {Object} device - Device object with properties
 * @returns {String} The category key ('Server-Physical', 'Desktop', etc.)
 */
export const categorizeDeviceExclusive = (device) => {
  if (!device) return 'Other';
  
  const deviceType = (device.device_type || '').trim();
  
  // Exact matches with the form dropdown values
  if (deviceType === 'Server - Physical') return 'Server-Physical';
  if (deviceType === 'Server - VM') return 'Server-VM';
  if (deviceType === 'Cell Phones - ATT') return 'Cell-phones-ATT';
  if (deviceType === 'Cell Phones - Verizon') return 'Cell-phones-Verizon';
  if (deviceType === 'DLALION - License') return 'DLALION-License';
  if (deviceType === 'Desktop Computers') return 'Desktop';
  if (deviceType === 'Laptops') return 'Laptop';
  if (deviceType === 'Other Devices') return 'Other';
  
  // If no exact match, use heuristic rules
  if (isServerVM(device)) return 'Server-VM';
  if (isServerPhysicalStrict(device)) return 'Server-Physical';
  if (isCellPhoneATT(device)) return 'Cell-phones-ATT';
  if (isCellPhoneVerizon(device)) return 'Cell-phones-Verizon';
  if (isDLALIONLicense(device)) return 'DLALION-License';
  if (isLaptop(device)) return 'Laptop';
  if (isDesktop(device)) return 'Desktop';
  
  // Fallback
  return 'Other';
};

/**
 * Get mutually exclusive device categories with their display names
 */
export const getExclusiveDeviceCategories = () => {
  return {
    'Server-Physical': {
      name: 'Server - Physical',
      filter: (device) => categorizeDeviceExclusive(device) === 'Server-Physical'
    },
    'Server-VM': {
      name: 'Server - VM',
      filter: (device) => categorizeDeviceExclusive(device) === 'Server-VM'
    },
    'Cell-phones-ATT': {
      name: 'Cell Phones - ATT',
      filter: (device) => categorizeDeviceExclusive(device) === 'Cell-phones-ATT'
    },
    'Cell-phones-Verizon': {
      name: 'Cell Phones - Verizon',
      filter: (device) => categorizeDeviceExclusive(device) === 'Cell-phones-Verizon'
    },
    'DLALION-License': {
      name: 'DLALION - License',
      filter: (device) => categorizeDeviceExclusive(device) === 'DLALION-License'
    },
    'Desktop': {
      name: 'Desktop Computers',
      filter: (device) => categorizeDeviceExclusive(device) === 'Desktop'
    },
    'Laptop': {
      name: 'Laptops',
      filter: (device) => categorizeDeviceExclusive(device) === 'Laptop'
    },
    'Other': {
      name: 'Other Devices',
      filter: (device) => categorizeDeviceExclusive(device) === 'Other'
    }
  };
};

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || '/api';
// Use ${API_BASE_URL}/your-endpoint in fetch calls 