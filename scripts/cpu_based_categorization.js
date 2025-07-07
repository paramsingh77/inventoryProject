/**
 * Enhanced device categorization based on CPU analysis
 * Generated on 2025-05-02 09:45:58
 */

// Server CPU patterns
const SERVER_CPU_PATTERNS = [
  /xeon/i, /epyc/i, /opteron/i, /e5-\d/i, /e7-\d/i, 
  /gold \d{4}/i, /silver \d{4}/i, /platinum \d{4}/i, /\d{4}v\d/i, 
  /itanium/i, /power\d/i
];

// Desktop CPU patterns
const DESKTOP_CPU_PATTERNS = [
  /i\d-\d{4}(?![uqmy])/i, /i\d-\d{5}(?![uqmy])/i, 
  /ryzen \d(?! \d{3}[0-9u])/i, /ryzen \d{1,2} \d{4}(?![uqmy])/i,
  /fx-\d{4}/i, /athlon/i, /pentium/i, /celeron/i
];

// Laptop CPU patterns
const LAPTOP_CPU_PATTERNS = [
  /i\d-\d{4}[uqmy]/i, /i\d-\d{5}[uqmy]/i, /\d{4}u/i, /mobile/i,
  /ryzen \d \d{3}[0-9u]/i, /m1/i, /m2/i
];

// VM CPU patterns
const VM_CPU_PATTERNS = [
  /virtual/i, /vm/i, /vcpu/i, /vmware/i, /hypervisor/i
];

/**
 * Determine CPU type based on model name
 */
export const determineCpuType = (cpuModel) => {
  if (!cpuModel || typeof cpuModel !== 'string') return 'Unknown';
  
  const cpuLower = cpuModel.toLowerCase();
  
  // Check for VMs first
  if (VM_CPU_PATTERNS.some(pattern => pattern.test(cpuLower))) {
    return 'VM';
  }
  
  // Check for server CPUs
  if (SERVER_CPU_PATTERNS.some(pattern => pattern.test(cpuLower))) {
    return 'Server';
  }
  
  // Check for laptop CPUs
  if (LAPTOP_CPU_PATTERNS.some(pattern => pattern.test(cpuLower))) {
    return 'Laptop';
  }
  
  // Check for desktop CPUs
  if (DESKTOP_CPU_PATTERNS.some(pattern => pattern.test(cpuLower))) {
    return 'Desktop';
  }
  
  // Unknown CPU type
  return 'Unknown';
};

/**
 * Improved categorizeDeviceExclusive function
 */
export const categorizeDeviceExclusive = (device) => {
  if (!device) return 'Unknown';
  
  const hostname = (device.device_hostname || '').toLowerCase();
  const model = (device.device_model || '').toLowerCase();
  const deviceType = (device.device_type || '').toLowerCase();
  const cpu = device.device_cpu || '';
  const os = (device.operating_system || '').toLowerCase();
  
  // First check for VMs
  if (hostname.includes('vm') || 
      hostname.includes('virtual') || 
      hostname.startsWith('aamdt') ||
      model.includes('virtual') || 
      model.includes('vmware') ||
      cpu.toLowerCase().includes('virtual') || 
      cpu.toLowerCase().includes('vcpu') ||
      cpu.toLowerCase().includes('vmware') ||
      os.includes('esxi') ||
      os.includes('hypervisor')) {
    return 'Server-VM';
  }
  
  // CPU-based categorization
  const cpuType = determineCpuType(cpu);
  
  // Check for phones
  if (deviceType.includes('phone') || deviceType.includes('mobile')) {
    if (hostname.includes('att') || hostname.includes('at&t')) {
      return 'Cell-phones-ATT';
    } else if (hostname.includes('verizon') || hostname.includes('vzw')) {
      return 'Cell-phones-Verizon';
    }
    return 'Other';
  }
  
  // Check for licenses
  if (hostname.includes('licen') || hostname.includes('lic') || deviceType.includes('licen') ||
      hostname.includes('dlalion') || deviceType.includes('dlalion')) {
    return 'DLALION-License';
  }
  
  // Server detection
  if (cpuType === 'Server' || deviceType.includes('server') || hostname.startsWith('srv')) {
    return 'Server-Physical';
  }
  
  // Laptop detection
  if (cpuType === 'Laptop' || 
      deviceType.includes('laptop') || 
      deviceType.includes('notebook') ||
      model.includes('thinkpad') || 
      model.includes('latitude') || 
      model.includes('macbook') || 
      model.includes('probook') || 
      model.includes('elitebook')) {
    return 'Laptop';
  }
  
  // Desktop detection
  if (cpuType === 'Desktop' || 
      deviceType.includes('desktop') || 
      deviceType.includes('workstation') ||
      model.includes('optiplex') || 
      model.includes('thinkcentre') || 
      model.includes('prodesk') || 
      model.includes('elitedesk')) {
    return 'Desktop';
  }
  
  // OS-based hints (only as last resort)
  if (os.includes('server') && !os.includes('workstation')) {
    return 'Server-Physical';
  }
  
  // Default to Other if no category could be determined
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
