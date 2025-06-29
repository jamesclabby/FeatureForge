#!/usr/bin/env node

/**
 * Deployment Debug Script
 * Helps diagnose 500 errors from the deployed backend
 */

const https = require('https');

const API_BASE_URL = process.argv[2] || 'https://feature-forge-production.vercel.app';

console.log('🔍 Debugging Deployment Issues...');
console.log('📍 API Base URL:', API_BASE_URL);

/**
 * Make HTTP request with detailed error logging
 */
function makeRequest(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FeatureForge-Debug/1.0'
      }
    };

    console.log(`\n📡 Making request to: ${url}`);
    console.log(`   Method: ${method}`);
    console.log(`   Headers: ${JSON.stringify(options.headers, null, 2)}`);

    const req = https.request(options, (res) => {
      let body = '';
      
      console.log(`📥 Response Status: ${res.statusCode}`);
      console.log(`📥 Response Headers:`, JSON.stringify(res.headers, null, 2));
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        console.log(`📄 Raw Response Body:`, body);
        
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody,
            rawBody: body
          });
        } catch (e) {
          console.log(`⚠️  Failed to parse JSON:`, e.message);
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: null,
            rawBody: body
          });
        }
      });
    });

    req.on('error', (error) => {
      console.error(`❌ Request Error:`, error);
      reject(error);
    });

    req.setTimeout(10000, () => {
      console.error(`⏰ Request Timeout`);
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

/**
 * Debug tests
 */
async function runDebugTests() {
  const tests = [
    {
      name: 'Root Health Check',
      url: `${API_BASE_URL}/api/health`
    },
    {
      name: 'Simple GET Request',
      url: `${API_BASE_URL}/`
    },
    {
      name: 'Vercel Function Check',
      url: `${API_BASE_URL}/api`
    }
  ];

  for (const test of tests) {
    try {
      console.log(`\n🧪 Running: ${test.name}`);
      console.log(`   Testing URL: ${test.url}`);
      
      const response = await makeRequest(test.url);
      
      console.log(`\n📊 Summary for ${test.name}:`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers['content-type'] || 'Not specified'}`);
      console.log(`   Body Length: ${response.rawBody ? response.rawBody.length : 0} characters`);
      
      if (response.status >= 500) {
        console.log(`❌ Server Error Detected!`);
        if (response.rawBody) {
          console.log(`📄 Error Details: ${response.rawBody.substring(0, 500)}...`);
        }
      } else if (response.status >= 400) {
        console.log(`⚠️  Client Error`);
      } else {
        console.log(`✅ Request Successful`);
      }
      
    } catch (error) {
      console.log(`💥 Test Failed: ${error.message}`);
    }
    
    console.log(`\n${'='.repeat(60)}`);
  }

  console.log(`\n🔧 Troubleshooting Tips:`);
  console.log(`1. Check Vercel deployment logs`);
  console.log(`2. Verify all environment variables are set`);
  console.log(`3. Check if the build succeeded`);
  console.log(`4. Verify the vercel.json configuration`);
  console.log(`\n📋 Next Steps:`);
  console.log(`- Go to your Vercel dashboard`);
  console.log(`- Check the Functions tab for errors`);
  console.log(`- Review the deployment logs`);
  console.log(`- Verify environment variables match exactly`);
}

// Run debug tests
if (require.main === module) {
  if (!process.argv[2]) {
    console.log('Usage: node debug-deployment.js <API_BASE_URL>');
    console.log('Example: node debug-deployment.js https://feature-forge-production.vercel.app');
    process.exit(1);
  }

  runDebugTests()
    .then(() => {
      console.log('\n🏁 Debug complete!');
    })
    .catch(error => {
      console.error('💥 Debug failed:', error);
      process.exit(1);
    });
} 