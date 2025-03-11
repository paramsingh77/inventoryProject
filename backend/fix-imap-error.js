/**
 * IMAP Error Fix Script
 * 
 * This script updates your .env file to disable the email checker service 
 * that's causing the IMAP search error.
 */
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const envPath = path.join(__dirname, '.env');

// Check if .env file exists
if (!fs.existsSync(envPath)) {
  console.error('❌ No .env file found in the backend directory!');
  console.log('Creating a new .env file with email checker disabled...');
  fs.writeFileSync(envPath, 'ENABLE_EMAIL_CHECKER=false\n');
  console.log('✅ Created new .env file with email checker disabled');
  process.exit(0);
}

async function updateEnvFile() {
  console.log('📝 Examining .env file...');
  
  const fileContents = fs.readFileSync(envPath, 'utf8');
  const lines = fileContents.split('\n');
  
  let hasEmailCheckerFlag = false;
  let updatedLines = [];
  
  // Look for the ENABLE_EMAIL_CHECKER flag
  for (const line of lines) {
    if (line.trim().startsWith('ENABLE_EMAIL_CHECKER=')) {
      hasEmailCheckerFlag = true;
      
      // Check if it's already disabled
      if (line.trim() === 'ENABLE_EMAIL_CHECKER=false') {
        console.log('✅ Email checker is already disabled');
        return false; // No changes needed
      }
      
      // Disable it
      updatedLines.push('ENABLE_EMAIL_CHECKER=false');
      console.log('🔄 Changing email checker setting from enabled to disabled');
    } else {
      updatedLines.push(line);
    }
  }
  
  // If the flag wasn't found, add it
  if (!hasEmailCheckerFlag) {
    updatedLines.push('ENABLE_EMAIL_CHECKER=false');
    console.log('➕ Adding ENABLE_EMAIL_CHECKER=false to .env file');
  }
  
  // Write the updated file
  fs.writeFileSync(envPath, updatedLines.join('\n'));
  return true; // Changes made
}

async function main() {
  console.log('🔧 Backend IMAP Error Fix\n');
  
  try {
    const changed = await updateEnvFile();
    
    if (changed) {
      console.log('\n✅ Successfully disabled email checker in .env file');
      console.log('\n📋 Next steps:');
      console.log('1. Restart your backend server with: npm run dev');
      console.log('2. The error about "Incorrect number of arguments for search option: SINCE" should be gone');
      console.log('3. Your backend should now start without crashing');
    } else {
      console.log('\n✅ No changes needed - email checker is already disabled');
    }
  } catch (error) {
    console.error('\n❌ Error updating .env file:', error.message);
    console.log('\nTry manually adding this line to your .env file:');
    console.log('ENABLE_EMAIL_CHECKER=false');
  }
}

main(); 