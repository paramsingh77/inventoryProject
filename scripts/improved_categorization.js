/**
 * Enhanced isServerPhysical function with more accurate categorization
 * Based on analysis of actual device data
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
 * Improved detectDeviceCategory function
 */
export const detectDeviceCategoryImproved = (device) => {
  // Check for null/undefined device
  if (!device) return 'Unknown';
  
  // VM detection has precedence
  if (isServerVM(device)) {
    return 'Server-VM';
  }
  
  // Then check for physical server
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
  
  // If no specific category detected, return unknown
  return 'Other';
};
