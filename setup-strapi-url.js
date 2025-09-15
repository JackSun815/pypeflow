#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔧 PypeFlow Strapi URL Setup\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExamplePath = path.join(__dirname, '.env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from .env.example...');
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envPath);
    console.log('✅ .env file created!');
  } else {
    console.log('❌ .env.example not found. Creating basic .env file...');
    fs.writeFileSync(envPath, '# Environment Variables\n\n# Strapi Configuration\nVITE_STRAPI_URL=\n\n# Google Analytics\nVITE_GA_MEASUREMENT_ID=\n\n# Site Configuration\nVITE_SITE_URL=https://pypeflow.com\n');
  }
}

// Read current .env file
let envContent = fs.readFileSync(envPath, 'utf8');

// Check if VITE_STRAPI_URL is already set
if (envContent.includes('VITE_STRAPI_URL=') && !envContent.includes('VITE_STRAPI_URL=\n')) {
  const currentUrl = envContent.match(/VITE_STRAPI_URL=(.+)/)?.[1];
  if (currentUrl && currentUrl.trim()) {
    console.log(`✅ Strapi URL is already configured: ${currentUrl}`);
    console.log('\n🚀 Your blog should now load real content from Strapi!');
    console.log('   If you\'re still seeing mock data, check:');
    console.log('   1. Your Strapi server is running');
    console.log('   2. The URL is correct and accessible');
    console.log('   3. Your content is published in Strapi');
    console.log('   4. API permissions are set correctly');
    process.exit(0);
  }
}

console.log('📋 Please provide your Strapi URL:');
console.log('   Examples:');
console.log('   - http://localhost:1337 (local development)');
console.log('   - https://your-project.strapi.app (Strapi Cloud)');
console.log('   - https://your-domain.com (custom domain)');
console.log('');

// Get Strapi URL from command line argument or prompt
const strapiUrl = process.argv[2];

if (strapiUrl) {
  // Update .env file with provided URL
  if (envContent.includes('VITE_STRAPI_URL=')) {
    envContent = envContent.replace(/VITE_STRAPI_URL=.*/, `VITE_STRAPI_URL=${strapiUrl}`);
  } else {
    envContent += `\nVITE_STRAPI_URL=${strapiUrl}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Strapi URL configured: ${strapiUrl}`);
  console.log('\n🚀 Restart your development server to see the changes!');
  console.log('   Run: npm run dev');
} else {
  console.log('💡 To set your Strapi URL, run:');
  console.log('   node setup-strapi-url.js YOUR_STRAPI_URL');
  console.log('');
  console.log('   Or manually edit the .env file and add:');
  console.log('   VITE_STRAPI_URL=your-strapi-url-here');
}
