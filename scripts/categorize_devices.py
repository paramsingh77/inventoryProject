#!/usr/bin/env python3
"""
Device Categorization Script

This script analyzes device information from your database, focusing on CPU information,
to categorize devices into:
1. Server - Physical
2. Server-VM
3. Cell-phones - ATT/Verizon
4. DLALION - License

It will connect to your database, analyze the data, and produce a report of the categorization.
"""

import psycopg2
import json
import re
import os
import sys
import csv
from collections import Counter
import requests
from bs4 import BeautifulSoup
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database connection parameters (from environment or defaults)
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_NAME = os.getenv('DB_NAME', 'inventory_db')
DB_USER = os.getenv('DB_USER', 'postgres')
DB_PASS = os.getenv('DB_PASS', 'password')
DB_PORT = os.getenv('DB_PORT', '5432')

# CPU model pattern categorization
SERVER_CPU_PATTERNS = [
    # Intel Xeon
    r'xeon', r'e5-\d', r'e7-\d', r'gold', r'silver', r'platinum', r'e3-\d', 
    r'e\d-\d', r'w-\d', r'd-\d', r'scalable',
    # AMD EPYC
    r'epyc', r'threadripper', r'opteron'
]

VM_CPU_PATTERNS = [
    r'virtual', r'vm', r'hypervisor', r'vcpu', r'virt', r'kvm', r'vmware'
]

DESKTOP_CPU_PATTERNS = [
    # Intel Desktop
    r'i\d-\d', r'core i\d', r'pentium', r'celeron', r'intel core', 
    # AMD Desktop
    r'ryzen \d', r'a\d-\d', r'fx-', r'athlon', r'phenom',
    # Common desktop patterns
    r'ghz quad[\s-]core', r'dual[\s-]core', r'quad[\s-]core'
]

MOBILE_CPU_PATTERNS = [
    # Mobile CPUs
    r'snapdragon', r'exynos', r'bionic', r'mobile', r'm\d-\d',
    r'helio', r'dimensity', r'kirin', r'mediatek',
    # Low power Intel
    r'intel atom', r'celeron n\d', r'pentium n\d', r'intel m\d',
    # AMD Mobile 
    r'ryzen.*mobile', r'ryzen.*u'
]

def connect_to_db():
    """Connect to the PostgreSQL database"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        return conn
    except psycopg2.Error as e:
        print(f"Database connection error: {e}")
        return None

def extract_device_data(conn):
    """Extract device data from the database"""
    data = []
    try:
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
                    SELECT id, device_hostname, device_model, device_type, device_cpu, operating_system
                    FROM {table}
                    WHERE device_cpu IS NOT NULL
                """)
                rows = cur.fetchall()
                for row in rows:
                    id, hostname, model, device_type, cpu, os = row
                    data.append({
                        'id': id,
                        'hostname': hostname,
                        'model': model,
                        'device_type': device_type,
                        'cpu': cpu,
                        'os': os,
                        'source_table': table
                    })
        return data
    except psycopg2.Error as e:
        print(f"Data extraction error: {e}")
        return []

def export_to_csv(data, filename="device_data.csv"):
    """Export the data to a CSV file"""
    try:
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = data[0].keys() if data else []
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            for row in data:
                writer.writerow(row)
        print(f"Data exported to {filename}")
        return True
    except Exception as e:
        print(f"CSV export error: {e}")
        return False

def search_google_for_cpu(cpu_model):
    """Search Google for information about a CPU model"""
    try:
        query = f"{cpu_model} processor type server or desktop or mobile"
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
        response = requests.get(url, headers=headers)
        
        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')
            # Extract the search results text
            search_results = soup.get_text()
            
            # Look for keywords in the search results
            server_keywords = ['server', 'datacenter', 'enterprise', 'rack', 'xeon']
            desktop_keywords = ['desktop', 'consumer', 'gaming', 'workstation']
            mobile_keywords = ['mobile', 'phone', 'smartphone', 'tablet', 'low power']
            vm_keywords = ['virtual', 'hypervisor', 'vm', 'cloud']
            
            # Count occurrences of keywords
            server_count = sum(search_results.lower().count(keyword) for keyword in server_keywords)
            desktop_count = sum(search_results.lower().count(keyword) for keyword in desktop_keywords)
            mobile_count = sum(search_results.lower().count(keyword) for keyword in mobile_keywords)
            vm_count = sum(search_results.lower().count(keyword) for keyword in vm_keywords)
            
            # Determine the most likely category
            counts = {
                'Server-Physical': server_count,
                'Desktop': desktop_count,
                'Mobile': mobile_count,
                'Server-VM': vm_count
            }
            
            max_category = max(counts, key=counts.get)
            confidence = counts[max_category] / (sum(counts.values()) or 1)
            
            return {
                'category': max_category,
                'confidence': confidence,
                'counts': counts
            }
        else:
            return {'category': 'Unknown', 'confidence': 0, 'counts': {}}
            
    except Exception as e:
        print(f"Google search error: {e}")
        return {'category': 'Unknown', 'confidence': 0, 'counts': {}}

def categorize_by_cpu(device):
    """Categorize a device based on its CPU information"""
    if not device.get('cpu'):
        return 'Unknown'
        
    cpu = device['cpu'].lower()
    hostname = device.get('hostname', '').lower()
    model = device.get('model', '').lower()
    os = device.get('os', '').lower()
    
    # Check server patterns
    for pattern in SERVER_CPU_PATTERNS:
        if re.search(pattern, cpu):
            return 'Server-Physical'
            
    # Check VM patterns
    for pattern in VM_CPU_PATTERNS:
        if re.search(pattern, cpu) or re.search(pattern, hostname) or re.search(pattern, os):
            return 'Server-VM'
            
    # Check mobile patterns
    for pattern in MOBILE_CPU_PATTERNS:
        if re.search(pattern, cpu):
            # Check if it's ATT or Verizon
            if 'att' in hostname or 'att' in model:
                return 'Cell-phones-ATT'
            elif 'verizon' in hostname or 'vzw' in model or 'verizon' in model:
                return 'Cell-phones-Verizon'
            else:
                return 'Cell-phones-Other'
                
    # Check desktop patterns
    for pattern in DESKTOP_CPU_PATTERNS:
        if re.search(pattern, cpu):
            return 'Desktop'
            
    # If hostname contains 'lic' or 'license'
    if 'lic' in hostname or 'dlalion' in hostname or 'license' in hostname:
        return 'DLALION-License'
            
    # If we couldn't categorize with patterns, try online search
    # (commented out to avoid making too many requests in testing)
    # search_result = search_google_for_cpu(cpu)
    # if search_result['confidence'] > 0.6:
    #     return search_result['category']
        
    return 'Unknown'

def analyze_and_categorize():
    """Main function to analyze and categorize devices"""
    # Connect to database
    conn = connect_to_db()
    if not conn:
        print("Failed to connect to database. Using sample data for testing.")
        # Sample data for testing without database
        data = [
            {'id': 1, 'hostname': 'srv001', 'model': 'PowerEdge R740', 'device_type': None, 'cpu': 'Intel Xeon Gold 6248R', 'os': 'Windows Server 2019'},
            {'id': 2, 'hostname': 'desktop001', 'model': 'OptiPlex 7080', 'device_type': None, 'cpu': 'Intel Core i7-10700', 'os': 'Windows 10 Pro'},
            {'id': 3, 'hostname': 'vm-web01', 'model': 'VMware Virtual Platform', 'device_type': None, 'cpu': 'Intel(R) Xeon(R) CPU E5-2670 0 @ 2.60GHz (4 vCPUs)', 'os': 'Ubuntu 20.04 LTS'},
            {'id': 4, 'hostname': 'att-phone1', 'model': 'iPhone 13', 'device_type': None, 'cpu': 'Apple A15 Bionic', 'os': 'iOS 15'},
            {'id': 5, 'hostname': 'license-srv1', 'model': 'License Server', 'device_type': None, 'cpu': 'Intel Xeon E3-1270 v6', 'os': 'Windows Server 2016'}
        ]
    else:
        data = extract_device_data(conn)
        
    if not data:
        print("No data found. Exiting.")
        if conn:
            conn.close()
        return
        
    # Export raw data
    export_to_csv(data)
    
    # Categorize devices
    categories = {
        'Server-Physical': [],
        'Server-VM': [],
        'Cell-phones-ATT': [],
        'Cell-phones-Verizon': [],
        'Cell-phones-Other': [],
        'Desktop': [],
        'Laptop': [],
        'DLALION-License': [],
        'Unknown': []
    }
    
    cpu_category_map = {}  # To store CPU -> category mapping
    
    for device in data:
        category = categorize_by_cpu(device)
        categories[category].append(device)
        
        # Store CPU to category mapping
        cpu = device.get('cpu', '').lower()
        if cpu:
            cpu_category_map[cpu] = category
    
    # Print category statistics
    print("\n=== Device Categorization Results ===")
    total_devices = len(data)
    for category, devices in categories.items():
        count = len(devices)
        percentage = (count / total_devices) * 100 if total_devices > 0 else 0
        print(f"{category}: {count} devices ({percentage:.2f}%)")
    
    # Export results
    with open('categorization_results.json', 'w') as f:
        json.dump({
            'summary': {category: len(devices) for category, devices in categories.items()},
            'details': {category: [d['hostname'] for d in devices] for category, devices in categories.items()},
            'cpu_mapping': cpu_category_map
        }, f, indent=2)
    
    # Export categorized data
    categorized_data = []
    for device in data:
        device_copy = device.copy()
        device_copy['detected_category'] = categorize_by_cpu(device)
        categorized_data.append(device_copy)
    
    export_to_csv(categorized_data, "categorized_devices.csv")
    
    # Generate JavaScript code for frontend use
    js_mapping = """
// CPU categorization mappings for frontend use
const cpuCategoryMap = {
"""
    
    for cpu, category in cpu_category_map.items():
        js_mapping += f"  '{cpu}': '{category}',\n"
    
    js_mapping += """};

// Category detection function
function detectDeviceCategory(device) {
  // First check if we have an exact CPU match
  if (device.device_cpu && cpuCategoryMap[device.device_cpu.toLowerCase()]) {
    return cpuCategoryMap[device.device_cpu.toLowerCase()];
  }
  
  const cpu = (device.device_cpu || '').toLowerCase();
  const hostname = (device.device_hostname || '').toLowerCase();
  const model = (device.device_model || '').toLowerCase();
  const os = (device.operating_system || '').toLowerCase();
  
  // Server-Physical detection
  if (
    hostname.startsWith('srv') ||
    /xeon|epyc|opteron|threadripper|e5-\\d|e7-\\d|gold|silver|platinum/.test(cpu) ||
    (os.includes('server') && !hostname.includes('vm'))
  ) {
    return 'Server-Physical';
  }
  
  // Server-VM detection
  if (
    hostname.startsWith('vm') ||
    hostname.includes('virtual') ||
    cpu.includes('virtual') ||
    cpu.includes('vcpu') ||
    os.includes('hypervisor')
  ) {
    return 'Server-VM';
  }
  
  // Phone detection
  if (
    /snapdragon|exynos|bionic|mobile|helio|dimensity|kirin|mediatek/.test(cpu) ||
    hostname.includes('phone') ||
    model.includes('iphone') ||
    model.includes('galaxy')
  ) {
    if (hostname.includes('att') || model.includes('att')) {
      return 'Cell-phones-ATT';
    } else if (hostname.includes('verizon') || hostname.includes('vzw') || 
               model.includes('verizon') || model.includes('vzw')) {
      return 'Cell-phones-Verizon';
    } else {
      return 'Cell-phones-Other';
    }
  }
  
  // License detection
  if (
    hostname.includes('lic') ||
    hostname.includes('license') ||
    hostname.includes('dlalion')
  ) {
    return 'DLALION-License';
  }
  
  // Desktop detection
  if (
    /i\\d-\\d|core i\\d|pentium|celeron|ryzen \\d|athlon|ghz quad[-\\s]core/.test(cpu) ||
    hostname.includes('desktop') ||
    model.includes('optiplex') ||
    model.includes('thinkcentre')
  ) {
    return 'Desktop';
  }
  
  return 'Unknown';
}
"""
    
    with open('device_categorization.js', 'w') as f:
        f.write(js_mapping)
    
    print("\nJS code generated in device_categorization.js")
    
    # Close database connection
    if conn:
        conn.close()
    
if __name__ == "__main__":
    analyze_and_categorize() 