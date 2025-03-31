const fs = require('fs');
const path = require('path');

// List of dependencies to check
const dependencies = [
  'pdf-parse',
  'imap',
  'mailparser',
  'winston'
];

console.log('Checking required dependencies for email processing...\n');

const missing = [];
const installed = [];

dependencies.forEach(dep => {
  try {
    require.resolve(dep);
    installed.push(dep);
  } catch (e) {
    missing.push(dep);
  }
});

console.log('✅ Installed dependencies:');
installed.forEach(dep => console.log(`  - ${dep}`));

if (missing.length > 0) {
  console.log('\n❌ Missing dependencies:');
  missing.forEach(dep => console.log(`  - ${dep}`));
  
  console.log('\nTo install missing dependencies, run:');
  console.log(`npm install ${missing.join(' ')}`);
} else {
  console.log('\nAll required dependencies are installed! 🎉');
} 