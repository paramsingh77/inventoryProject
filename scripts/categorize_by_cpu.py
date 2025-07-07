#!/usr/bin/env python3
"""
Device Categorization by CPU Analysis

This script categorizes devices by analyzing CPU information, potentially using
web searches for unknown CPU models to determine if they belong to server, desktop,
or laptop categories.

Usage:
  python categorize_by_cpu.py

Dependencies:
  - requests
  - pandas
  - dotenv
  - beautifulsoup4
"""

import os
import sys
import re
import json
import csv
import time
import requests
from bs4 import BeautifulSoup
import pandas as pd
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Constants for categorization
SERVER_CPU_PATTERNS = [
    r'xeon', r'epyc', r'opteron', r'threadripper', r'e5-\d', r'e7-\d', 
    r'gold \d{4}', r'silver \d{4}', r'platinum \d{4}', r'\d{4}v\d', 
    r'itanium', r'power\d'
]

DESKTOP_CPU_PATTERNS = [
    r'i\d-\d{4}', r'i\d-\d{5}', r'ryzen \d', r'ryzen \d{1,2} \d{4}',
    r'fx-\d{4}', r'athlon', r'pentium', r'celeron'
]

LAPTOP_CPU_PATTERNS = [
    r'i\d-\d{4}[uqmy]', r'i\d-\d{5}[uqmy]', r'\d{4}u', r'mobile',
    r'ryzen \d \d{3}[0-9u]', r'm1', r'm2'
]

VM_CPU_PATTERNS = [
    r'virtual', r'vm', r'vcpu', r'vmware', r'hypervisor'
]

# Path to save data
DATA_DIR = Path("./data")
DATA_DIR.mkdir(exist_ok=True)

def fetch_device_data(input_file=None):
    """Fetch device data from a file or mock data if file not found"""
    if input_file and os.path.exists(input_file):
        try:
            df = pd.read_csv(input_file)
            return df.to_dict('records')
        except Exception as e:
            print(f"Error reading file: {e}")
    
    # If no file or error reading, use mock data
    print("Using sample data for testing")
    return [
        {
            'id': 1, 
            'device_hostname': 'srv001', 
            'device_model': 'PowerEdge R740', 
            'device_type': 'Server', 
            'device_cpu': 'Intel Xeon Gold 6248R', 
            'operating_system': 'Windows Server 2019'
        },
        {
            'id': 2, 
            'device_hostname': 'desktop001', 
            'device_model': 'OptiPlex 7080', 
            'device_type': 'Desktop', 
            'device_cpu': 'Intel Core i7-10700', 
            'operating_system': 'Windows 10 Pro'
        },
        {
            'id': 3, 
            'device_hostname': 'vm-web01', 
            'device_model': 'VMware Virtual Platform', 
            'device_type': 'Server', 
            'device_cpu': 'Intel(R) Xeon(R) CPU E5-2670 0 @ 2.60GHz (4 vCPUs)', 
            'operating_system': 'Ubuntu 20.04 LTS'
        },
        {
            'id': 4, 
            'device_hostname': 'laptop001', 
            'device_model': 'ThinkPad X1', 
            'device_type': 'Laptop', 
            'device_cpu': 'Intel Core i7-1165G7', 
            'operating_system': 'Windows 11'
        }
    ]

def determine_cpu_type(cpu_model):
    """Determine CPU type based on model name using regex patterns"""
    if not cpu_model or not isinstance(cpu_model, str):
        return 'Unknown'
    
    cpu_lower = cpu_model.lower()
    
    # Check for VMs first
    for pattern in VM_CPU_PATTERNS:
        if re.search(pattern, cpu_lower):
            return 'VM'
    
    # Check for server CPUs
    for pattern in SERVER_CPU_PATTERNS:
        if re.search(pattern, cpu_lower):
            return 'Server'
    
    # Check for laptop CPUs
    for pattern in LAPTOP_CPU_PATTERNS:
        if re.search(pattern, cpu_lower):
            return 'Laptop'
    
    # Check for desktop CPUs
    for pattern in DESKTOP_CPU_PATTERNS:
        if re.search(pattern, cpu_lower):
            return 'Desktop'
    
    # Unknown CPU type
    return 'Unknown'

def search_cpu_info(cpu_model):
    """Search for CPU information online and determine if it's a server, desktop, or laptop CPU"""
    if not cpu_model or not isinstance(cpu_model, str):
        return 'Unknown'
    
    try:
        # Clean the CPU model for search
        search_term = f"{cpu_model} cpu server or desktop"
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        
        # This would normally use a search API but we'll just log what we would search for
        print(f"Would search for: {search_term}")
        
        # For production, you would implement a real search using an API like:
        # response = requests.get(f"https://api.search.com?q={search_term}", headers=headers)
        
        # For now, use the pattern matching as fallback
        return determine_cpu_type(cpu_model)
    except Exception as e:
        print(f"Error searching for CPU info: {e}")
        return 'Unknown'

def categorize_device(device):
    """Categorize a device based on its properties and CPU information"""
    if not device:
        return 'Unknown'
    
    hostname = (device.get('device_hostname', '') or '').lower()
    model = (device.get('device_model', '') or '').lower()
    device_type = (device.get('device_type', '') or '').lower()
    cpu = device.get('device_cpu', '') or ''
    os = (device.get('operating_system', '') or '').lower()
    
    # First check for VMs
    if any(pattern in hostname or pattern in model or pattern in device_type or pattern in cpu.lower() 
           for pattern in ['vm', 'virtual', 'vmware', 'vcpu']):
        return 'Server-VM'
    
    # CPU-based categorization
    cpu_type = determine_cpu_type(cpu)
    
    if cpu_type == 'VM':
        return 'Server-VM'
    
    # Check for phones
    if 'phone' in device_type or 'mobile' in device_type:
        if 'att' in hostname or 'at&t' in hostname:
            return 'Cell-phones-ATT'
        elif 'verizon' in hostname or 'vzw' in hostname:
            return 'Cell-phones-Verizon'
        return 'Other'
    
    # Check for licenses
    if 'licen' in hostname or 'lic' in hostname or 'licen' in device_type:
        return 'DLALION-License'
    
    # Server detection
    if cpu_type == 'Server' or 'server' in device_type or 'srv' in hostname:
        # Double check not a VM
        if any(vm_pattern in cpu.lower() for vm_pattern in ['virtual', 'vm', 'vcpu']):
            return 'Server-VM'
        return 'Server-Physical'
    
    # Laptop detection
    if cpu_type == 'Laptop' or 'laptop' in device_type or 'notebook' in device_type:
        return 'Laptop'
    
    # Desktop detection
    if cpu_type == 'Desktop' or 'desktop' in device_type or 'workstation' in device_type:
        return 'Desktop'
    
    # Device type based fallbacks
    if 'server' in device_type and not any(vm_pattern in cpu.lower() for vm_pattern in ['virtual', 'vm', 'vcpu']):
        return 'Server-Physical'
    
    if 'laptop' in device_type or 'notebook' in device_type:
        return 'Laptop'
    
    if 'desktop' in device_type or 'workstation' in device_type:
        return 'Desktop'
    
    # Check model
    if any(server_model in model for server_model in ['poweredge', 'proliant', 'system x', 'thinkserver']):
        return 'Server-Physical'
    
    if any(laptop_model in model for laptop_model in ['thinkpad', 'latitude', 'macbook', 'probook', 'elitebook']):
        return 'Laptop'
    
    if any(desktop_model in model for desktop_model in ['optiplex', 'thinkcentre', 'prodesk', 'elitedesk']):
        return 'Desktop'
    
    # OS-based hints
    if 'server' in os and not 'workstation' in os:
        return 'Server-Physical'
    
    # Default to Other if no category could be determined
    return 'Other'

def analyze_devices(devices):
    """Analyze and categorize all devices"""
    categories = {
        'Server-Physical': [],
        'Server-VM': [],
        'Cell-phones-ATT': [],
        'Cell-phones-Verizon': [],
        'DLALION-License': [],
        'Desktop': [],
        'Laptop': [],
        'Other': []
    }
    
    # Process each device
    for device in devices:
        # First try to categorize using CPU info
        category = categorize_device(device)
        categories[category].append(device)
    
    # Print summary
    print("\n=== Device Categorization Results ===")
    total_devices = len(devices)
    for category, devices_list in categories.items():
        count = len(devices_list)
        percentage = (count / total_devices) * 100 if total_devices > 0 else 0
        print(f"{category}: {count} devices ({percentage:.2f}%)")
    
    # Show CPU types for unknown devices
    print("\n=== CPU Analysis for 'Other' Category ===")
    for device in categories['Other']:
        cpu = device.get('device_cpu', 'N/A')
        hostname = device.get('device_hostname', 'N/A')
        print(f"{hostname}: {cpu} - CPU Type: {determine_cpu_type(cpu)}")
    
    return categories

def generate_js_code(categories):
    """Generate improved JavaScript code for device categorization"""
    js_code = """/**
 * Enhanced device categorization based on CPU analysis
 * Generated on {date}
 */

// Server CPU patterns
const SERVER_CPU_PATTERNS = [
  /xeon/i, /epyc/i, /opteron/i, /e5-\\d/i, /e7-\\d/i, 
  /gold \\d{{4}}/i, /silver \\d{{4}}/i, /platinum \\d{{4}}/i, /\\d{{4}}v\\d/i, 
  /itanium/i, /power\\d/i
];

// Desktop CPU patterns
const DESKTOP_CPU_PATTERNS = [
  /i\\d-\\d{{4}}(?![uqmy])/i, /i\\d-\\d{{5}}(?![uqmy])/i, 
  /ryzen \\d(?! \\d{{3}}[0-9u])/i, /ryzen \\d{{1,2}} \\d{{4}}(?![uqmy])/i,
  /fx-\\d{{4}}/i, /athlon/i, /pentium/i, /celeron/i
];

// Laptop CPU patterns
const LAPTOP_CPU_PATTERNS = [
  /i\\d-\\d{{4}}[uqmy]/i, /i\\d-\\d{{5}}[uqmy]/i, /\\d{{4}}u/i, /mobile/i,
  /ryzen \\d \\d{{3}}[0-9u]/i, /m1/i, /m2/i
];

// VM CPU patterns
const VM_CPU_PATTERNS = [
  /virtual/i, /vm/i, /vcpu/i, /vmware/i, /hypervisor/i
];

/**
 * Determine CPU type based on model name
 */
export const determineCpuType = (cpuModel) => {{
  if (!cpuModel || typeof cpuModel !== 'string') return 'Unknown';
  
  const cpuLower = cpuModel.toLowerCase();
  
  // Check for VMs first
  if (VM_CPU_PATTERNS.some(pattern => pattern.test(cpuLower))) {{
    return 'VM';
  }}
  
  // Check for server CPUs
  if (SERVER_CPU_PATTERNS.some(pattern => pattern.test(cpuLower))) {{
    return 'Server';
  }}
  
  // Check for laptop CPUs
  if (LAPTOP_CPU_PATTERNS.some(pattern => pattern.test(cpuLower))) {{
    return 'Laptop';
  }}
  
  // Check for desktop CPUs
  if (DESKTOP_CPU_PATTERNS.some(pattern => pattern.test(cpuLower))) {{
    return 'Desktop';
  }}
  
  // Unknown CPU type
  return 'Unknown';
}};

/**
 * Improved categorizeDeviceExclusive function
 */
export const categorizeDeviceExclusive = (device) => {{
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
      os.includes('hypervisor')) {{
    return 'Server-VM';
  }}
  
  // CPU-based categorization
  const cpuType = determineCpuType(cpu);
  
  // Check for phones
  if (deviceType.includes('phone') || deviceType.includes('mobile')) {{
    if (hostname.includes('att') || hostname.includes('at&t')) {{
      return 'Cell-phones-ATT';
    }} else if (hostname.includes('verizon') || hostname.includes('vzw')) {{
      return 'Cell-phones-Verizon';
    }}
    return 'Other';
  }}
  
  // Check for licenses
  if (hostname.includes('licen') || hostname.includes('lic') || deviceType.includes('licen') ||
      hostname.includes('dlalion') || deviceType.includes('dlalion')) {{
    return 'DLALION-License';
  }}
  
  // Server detection
  if (cpuType === 'Server' || deviceType.includes('server') || hostname.startsWith('srv')) {{
    return 'Server-Physical';
  }}
  
  // Laptop detection
  if (cpuType === 'Laptop' || 
      deviceType.includes('laptop') || 
      deviceType.includes('notebook') ||
      model.includes('thinkpad') || 
      model.includes('latitude') || 
      model.includes('macbook') || 
      model.includes('probook') || 
      model.includes('elitebook')) {{
    return 'Laptop';
  }}
  
  // Desktop detection
  if (cpuType === 'Desktop' || 
      deviceType.includes('desktop') || 
      deviceType.includes('workstation') ||
      model.includes('optiplex') || 
      model.includes('thinkcentre') || 
      model.includes('prodesk') || 
      model.includes('elitedesk')) {{
    return 'Desktop';
  }}
  
  // OS-based hints (only as last resort)
  if (os.includes('server') && !os.includes('workstation')) {{
    return 'Server-Physical';
  }}
  
  // Default to Other if no category could be determined
  return 'Other';
}};

/**
 * Get mutually exclusive device categories with their display names
 */
export const getExclusiveDeviceCategories = () => {{
  return {{
    'Server-Physical': {{
      name: 'Server - Physical',
      filter: (device) => categorizeDeviceExclusive(device) === 'Server-Physical'
    }},
    'Server-VM': {{
      name: 'Server - VM',
      filter: (device) => categorizeDeviceExclusive(device) === 'Server-VM'
    }},
    'Cell-phones-ATT': {{
      name: 'Cell Phones - ATT',
      filter: (device) => categorizeDeviceExclusive(device) === 'Cell-phones-ATT'
    }},
    'Cell-phones-Verizon': {{
      name: 'Cell Phones - Verizon',
      filter: (device) => categorizeDeviceExclusive(device) === 'Cell-phones-Verizon'
    }},
    'DLALION-License': {{
      name: 'DLALION - License',
      filter: (device) => categorizeDeviceExclusive(device) === 'DLALION-License'
    }},
    'Desktop': {{
      name: 'Desktop Computers',
      filter: (device) => categorizeDeviceExclusive(device) === 'Desktop'
    }},
    'Laptop': {{
      name: 'Laptops',
      filter: (device) => categorizeDeviceExclusive(device) === 'Laptop'
    }},
    'Other': {{
      name: 'Other Devices',
      filter: (device) => categorizeDeviceExclusive(device) === 'Other'
    }}
  }};
}};
""".format(date=datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    
    # Write to file
    with open('cpu_based_categorization.js', 'w') as f:
        f.write(js_code)
    
    print("\nGenerated CPU-based categorization code in 'cpu_based_categorization.js'")

def export_to_csv(categories, filename='device_categories_cpu.csv'):
    """Export categorized devices to CSV"""
    all_devices = []
    for category, devices in categories.items():
        for device in devices:
            device_copy = device.copy()
            device_copy['category'] = category
            device_copy['cpu_type'] = determine_cpu_type(device.get('device_cpu', ''))
            all_devices.append(device_copy)
    
    if all_devices:
        df = pd.DataFrame(all_devices)
        df.to_csv(filename, index=False)
        print(f"Exported categorization data to {filename}")
    else:
        print("No data to export")

def main():
    """Main function"""
    print("=== Device Categorization by CPU Analysis ===")
    
    # Get devices from CSV or use mock data
    print("Fetching device data...")
    devices = fetch_device_data(input_file="./devices.csv")
    
    if not devices:
        print("No device data found. Exiting.")
        return
    
    print(f"Analyzing {len(devices)} devices...")
    categories = analyze_devices(devices)
    
    # Export data
    export_to_csv(categories)
    
    # Generate improved JS categorization
    generate_js_code(categories)
    
    print("\nDone! Use the generated files to update your frontend code.")
    print("1. Import the new categorization functions from 'cpu_based_categorization.js'")
    print("2. Replace existing categorization with the CPU-based approach")
    print("3. Review 'device_categories_cpu.csv' for details on how devices were categorized")

if __name__ == "__main__":
    main() 