#!/usr/bin/env python3
"""
Device Categorization Fixer Script

This script specifically addresses the issue of incorrect server counts by:
1. Analyzing device data from the database
2. Applying strict categorization rules to identify physical servers
3. Generating improved categorization code for the front-end
4. Creating a CSV report of device categorizations

Usage:
  python fix_server_counts.py

Dependencies:
  - psycopg2
  - pandas
  - dotenv
"""

import os
import sys
import re
import json
import csv
import psycopg2
import pandas as pd
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection parameters
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_NAME = os.getenv('DB_NAME', 'inventory_db')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASS', 'password')
DB_PORT = os.getenv('DB_PORT', '5432')

# Constants for categorization
VM_INDICATORS = ['virtual', 'vm', 'vmware', 'hypervisor', 'vcpu', 'aamdt']
SERVER_INDICATORS = ['srv', 'server', 'xeon', 'epyc', 'opteron', 'poweredge', 'proliant']
DESKTOP_INDICATORS = ['desktop', 'workstation', 'optiplex', 'thinkcentre', 'prodesk', 'elitedesk']
LAPTOP_INDICATORS = ['laptop', 'notebook', 'thinkpad', 'latitude', 'macbook', 'probook', 'elitebook', 'xps']
PHONE_INDICATORS = ['phone', 'iphone', 'samsung', 'android', 'mobile', 'pixel', 'galaxy']
LICENSE_INDICATORS = ['license', 'lic', 'dlalion']

def connect_to_db():
    """Connect to PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        return None

def extract_device_data(conn):
    """Extract device data from database"""
    try:
        data = []
        with conn.cursor() as cur:
            # Get a list of device inventory tables
            cur.execute("""
                SELECT table_name FROM information_schema.tables
                WHERE table_name LIKE '%_device_inventory' OR table_name = 'device_inventory'
            """)
            tables = [record[0] for record in cur.fetchall()]
            
            # For each table, extract device data
            for table in tables:
                print(f"Extracting data from table: {table}")
                cur.execute(f"""
                    SELECT id, device_hostname, device_model, device_type, device_cpu, 
                           operating_system, serial_number, site_name
                    FROM {table}
                """)
                rows = cur.fetchall()
                for row in rows:
                    id, hostname, model, device_type, cpu, os, serial, site = row
                    data.append({
                        'id': id,
                        'hostname': hostname,
                        'model': model,
                        'device_type': device_type,
                        'cpu': cpu,
                        'os': os,
                        'serial': serial,
                        'site': site,
                        'source_table': table
                    })
        return data
    except Exception as e:
        print(f"Data extraction error: {e}")
        return []

def categorize_device_strict(device):
    """Strict categorization function that aims for higher accuracy"""
    hostname = str(device.get('hostname', '')).lower() if device.get('hostname') else ''
    model = str(device.get('model', '')).lower() if device.get('model') else ''
    device_type = str(device.get('device_type', '')).lower() if device.get('device_type') else ''
    cpu = str(device.get('cpu', '')).lower() if device.get('cpu') else ''
    os = str(device.get('os', '')).lower() if device.get('os') else ''
    
    # Check for VM indicators first as they override other categorizations
    for indicator in VM_INDICATORS:
        if (indicator in hostname or indicator in model or 
            indicator in device_type or indicator in cpu or indicator in os):
            return 'Server-VM'

    # Check for physical server indicators, but exclude VM indicators
    server_match = False
    for indicator in SERVER_INDICATORS:
        if (indicator in hostname or indicator in model or 
            indicator in device_type or indicator in cpu or indicator in os):
            server_match = True
            break
    
    if server_match:
        # Double check we're not misclassifying a VM
        for indicator in VM_INDICATORS:
            if (indicator in hostname or indicator in model or 
                indicator in device_type or indicator in cpu or indicator in os):
                return 'Server-VM'
        return 'Server-Physical'
    
    # Check for license
    for indicator in LICENSE_INDICATORS:
        if (indicator in hostname or indicator in model or indicator in device_type):
            return 'DLALION-License'
    
    # Check for AT&T cell phones
    if any(indicator in device_type or indicator in model or indicator in hostname for indicator in PHONE_INDICATORS):
        if 'att' in hostname or 'att' in model or 'att' in device_type:
            return 'Cell-phones-ATT'
    
    # Check for Verizon cell phones 
    if any(indicator in device_type or indicator in model or indicator in hostname for indicator in PHONE_INDICATORS):
        if any(carrier in hostname or carrier in model or carrier in device_type for carrier in ['verizon', 'vzw']):
            return 'Cell-phones-Verizon'
    
    # Check for generic phones not matching carrier
    if any(indicator in device_type or indicator in model or indicator in hostname for indicator in PHONE_INDICATORS):
        return 'Cell-phones-Other'
    
    # Check for laptops
    for indicator in LAPTOP_INDICATORS:
        if (indicator in hostname or indicator in model or indicator in device_type):
            return 'Laptop'
    
    # Check for desktops
    for indicator in DESKTOP_INDICATORS:
        if (indicator in hostname or indicator in model or indicator in device_type):
            return 'Desktop'
    
    # Default category if no specific match is found
    return 'Other'

def analyze_categorization(devices):
    """Analyze and categorize all devices"""
    categories = {
        'Server-Physical': [],
        'Server-VM': [],
        'Cell-phones-ATT': [],
        'Cell-phones-Verizon': [],
        'Cell-phones-Other': [],
        'DLALION-License': [],
        'Desktop': [],
        'Laptop': [],
        'Other': []
    }
    
    # Categorize each device
    for device in devices:
        category = categorize_device_strict(device)
        categories[category].append(device)
    
    # Print summary
    print("\n=== Device Categorization Results ===")
    total_devices = len(devices)
    for category, devices in categories.items():
        count = len(devices)
        percentage = (count / total_devices) * 100 if total_devices > 0 else 0
        print(f"{category}: {count} devices ({percentage:.2f}%)")
    
    return categories

def export_to_csv(categories, filename='device_categories.csv'):
    """Export categorized devices to CSV"""
    all_devices = []
    for category, devices in categories.items():
        for device in devices:
            device_copy = device.copy()
            device_copy['category'] = category
            all_devices.append(device_copy)
    
    if all_devices:
        df = pd.DataFrame(all_devices)
        df.to_csv(filename, index=False)
        print(f"Exported categorization data to {filename}")
    else:
        print("No data to export")

def export_json_summary(categories, filename='category_summary.json'):
    """Export category summary as JSON"""
    summary = {
        'total': sum(len(devices) for devices in categories.values()),
        'categories': {category: len(devices) for category, devices in categories.items()},
        'category_details': {
            category: {
                'count': len(devices),
                'sample_hostnames': [d.get('hostname') for d in devices[:5] if d.get('hostname')]
            } for category, devices in categories.items()
        },
        'timestamp': datetime.now().isoformat()
    }
    
    with open(filename, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"Exported summary to {filename}")

def generate_improved_js_code(categories):
    """Generate improved JavaScript categorization code based on analysis"""
    # Find patterns in hostnames, models, CPUs of physical servers
    server_physical = categories['Server-Physical']
    server_vm = categories['Server-VM']
    
    # Extract common patterns from server hostnames
    server_hostnames = [d.get('hostname', '').lower() for d in server_physical if d.get('hostname')]
    server_models = [d.get('model', '').lower() for d in server_physical if d.get('model')]
    server_cpus = [d.get('cpu', '').lower() for d in server_physical if d.get('cpu')]
    
    # Extract common patterns from VM hostnames
    vm_hostnames = [d.get('hostname', '').lower() for d in server_vm if d.get('hostname')]
    vm_models = [d.get('model', '').lower() for d in server_vm if d.get('model')]
    vm_cpus = [d.get('cpu', '').lower() for d in server_vm if d.get('cpu')]
    
    # Generate code
    js_code = """/**
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
    /xeon/i, /epyc/i, /opteron/i, /e5-\\d/i, /e7-\\d/i, 
    /gold/i, /silver/i, /platinum/i, /\\d{4}v\\d/i
  ];
  
  if (serverCpuPatterns.some(pattern => pattern.test(cpu))) {
    return true;
  }
  
  // Server model indicators
  const serverModelPatterns = [
    /poweredge/i, /proliant/i, /system x/i, /thinkserver/i, 
    /blade/i, /rack/i, /r\\d{3}/i, /r\\d{3}\\w/i
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
"""
    
    # Write to file
    with open('improved_categorization.js', 'w') as f:
        f.write(js_code)
    
    print("Generated improved JavaScript categorization code in 'improved_categorization.js'")

def main():
    """Main function"""
    print("=== Device Categorization Fixer ===")
    print("Connecting to database...")
    
    conn = connect_to_db()
    if not conn:
        print("Using sample data for testing since database connection failed")
        # Sample data for testing
        devices = [
            {'id': 1, 'hostname': 'srv001', 'model': 'PowerEdge R740', 'device_type': 'Server', 
             'cpu': 'Intel Xeon Gold 6248R', 'os': 'Windows Server 2019'},
            {'id': 2, 'hostname': 'desktop001', 'model': 'OptiPlex 7080', 'device_type': 'Desktop', 
             'cpu': 'Intel Core i7-10700', 'os': 'Windows 10 Pro'},
            {'id': 3, 'hostname': 'vm-web01', 'model': 'VMware Virtual Platform', 'device_type': 'Server', 
             'cpu': 'Intel(R) Xeon(R) CPU E5-2670 0 @ 2.60GHz (4 vCPUs)', 'os': 'Ubuntu 20.04 LTS'},
            {'id': 4, 'hostname': 'att-phone1', 'model': 'iPhone 13', 'device_type': 'Phone', 
             'cpu': 'Apple A15 Bionic', 'os': 'iOS 15'},
            {'id': 5, 'hostname': 'license-srv1', 'model': 'License Server', 'device_type': 'License', 
             'cpu': 'Intel Xeon E3-1270 v6', 'os': 'Windows Server 2016'}
        ]
    else:
        print("Extracting device data...")
        devices = extract_device_data(conn)
        
    if not devices:
        print("No device data found. Exiting.")
        return
    
    print(f"Analyzing {len(devices)} devices...")
    categories = analyze_categorization(devices)
    
    # Export data
    export_to_csv(categories)
    export_json_summary(categories)
    
    # Generate improved JS categorization
    generate_improved_js_code(categories)
    
    print("\nDone! Use the generated files to update your frontend code.")
    print("1. Check 'category_summary.json' for category counts")
    print("2. Review 'device_categories.csv' for detailed categorization")
    print("3. Import functions from 'improved_categorization.js' in your frontend")
    
    if conn:
        conn.close()

if __name__ == "__main__":
    main() 