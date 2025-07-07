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
  
  const hostname = (device.device_hostname || '').toLowerCase();
  const model = (device.device_model || '').toLowerCase();
  const deviceType = (device.device_type || '').toLowerCase();
  const cpu = (device.device_cpu || '').toLowerCase();
  const os = (device.operating_system || '').toLowerCase();
  
  // Server-Physical detection
  if (
    isServerPhysical(device)
  ) {
    return 'Server-Physical';
  }
  
  // Server-VM detection
  if (
    isServerVM(device)
  ) {
    return 'Server-VM';
  }
  
  // Cell Phone - ATT detection
  if (
    isCellPhoneATT(device)
  ) {
    return 'Cell-phones-ATT';
  }
  
  // Cell Phone - Verizon detection
  if (
    isCellPhoneVerizon(device)
  ) {
    return 'Cell-phones-Verizon';
  }
  
  // DLALION License detection
  if (
    isDLALIONLicense(device)
  ) {
    return 'DLALION-License';
  }
  
  // Desktop Computer detection
  if (
    isDesktop(device)
  ) {
    return 'Desktop';
  }
  
  // Laptop detection
  if (
    isLaptop(device)
  ) {
    return 'Laptop';
  }
  
  // If no specific category detected, return unknown
  return 'Other';
};

/**
 * Checks if a device is a physical server
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
      filter: isServerPhysical
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
      filter: (device) => !isServerPhysical(device) && 
                          !isServerVM(device) && 
                          !isCellPhoneATT(device) && 
                          !isCellPhoneVerizon(device) && 
                          !isDLALIONLicense(device) && 
                          !isDesktop(device) && 
                          !isLaptop(device)
    }
  };
}; 