/**
 * This script helps clean up Netlify-specific files when migrating to Vercel
 * Run with: node cleanup-netlify.js
 */

const fs = require('fs');
const path = require('path');

// Files to be removed
const filesToRemove = [
  'netlify.toml',
  'netlify.js',
  'netlify/functions/server.js',
  'netlify/functions/simple-server.js',
  'netlify/functions/api.js',
  'netlify/functions/test.js',
  'netlify/functions/hello.js'
];

// Function to remove a file
function removeFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ Removed: ${filePath}`);
    } else {
      console.log(`⚠️ File not found: ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Error removing ${filePath}:`, err.message);
  }
}

// Function to remove a directory
function removeDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      // Check if directory is empty
      const files = fs.readdirSync(dirPath);
      if (files.length === 0) {
        fs.rmdirSync(dirPath);
        console.log(`✅ Removed directory: ${dirPath}`);
      } else {
        console.log(`⚠️ Directory not empty: ${dirPath}`);
      }
    } else {
      console.log(`⚠️ Directory not found: ${dirPath}`);
    }
  } catch (err) {
    console.error(`❌ Error removing directory ${dirPath}:`, err.message);
  }
}

// Main function
function cleanup() {
  console.log('Starting Netlify cleanup...');
  
  // Remove files
  filesToRemove.forEach(file => {
    removeFile(path.join(__dirname, file));
  });
  
  // Try to remove netlify/functions directory if empty
  removeDirectory(path.join(__dirname, 'netlify/functions'));
  removeDirectory(path.join(__dirname, 'netlify'));
  
  console.log('Cleanup complete!');
  console.log('Note: Only run this script after you have successfully deployed to Vercel.');
}

// Run the cleanup
cleanup();
