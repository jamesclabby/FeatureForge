#!/usr/bin/env node

/**
 * Production API Test Script
 * Tests the deployed backend API endpoints
 */

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.argv[2] || 'https://your-backend-url.vercel.app';

console.log('🧪 Testing Production API...');
console.log('📍 API Base URL:', API_BASE_URL);

/**
 * Make HTTP request
 */
function makeRequest(url, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'FeatureForge-Test/1.0'
      }
    };

    if (data) {
      const postData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = client.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Test suite
 */
async function runTests() {
  const tests = [
    {
      name: 'Health Check',
      url: `${API_BASE_URL}/api/health`,
      expectedStatus: 200
    },
    {
      name: 'Email Health Check',
      url: `${API_BASE_URL}/api/email/analytics`,
      expectedStatus: [200, 401] // 401 is ok - means auth is working
    },
    {
      name: 'CORS Headers',
      url: `${API_BASE_URL}/api/health`,
      expectedStatus: 200,
      checkCors: true
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`\n🔍 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await makeRequest(test.url);
      
      // Check status
      const expectedStatuses = Array.isArray(test.expectedStatus) 
        ? test.expectedStatus 
        : [test.expectedStatus];
        
      if (expectedStatuses.includes(response.status)) {
        console.log(`   ✅ Status: ${response.status} (Expected: ${test.expectedStatus})`);
      } else {
        console.log(`   ❌ Status: ${response.status} (Expected: ${test.expectedStatus})`);
        failed++;
        continue;
      }

      // Check CORS if requested
      if (test.checkCors) {
        const corsHeader = response.headers['access-control-allow-origin'];
        if (corsHeader) {
          console.log(`   ✅ CORS: ${corsHeader}`);
        } else {
          console.log(`   ⚠️  CORS: No Access-Control-Allow-Origin header`);
        }
      }

      // Show response body (limited)
      if (response.body && typeof response.body === 'object') {
        const keys = Object.keys(response.body).slice(0, 3);
        console.log(`   📄 Response: {${keys.join(', ')}...}`);
      }

      passed++;
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log(`\n🎉 All tests passed! Your API is ready for production.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Check your deployment configuration.`);
  }

  return failed === 0;
}

// Run tests
if (require.main === module) {
  if (!process.argv[2]) {
    console.log('Usage: node test-production.js <API_BASE_URL>');
    console.log('Example: node test-production.js https://your-backend.vercel.app');
    process.exit(1);
  }

  runTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('💥 Test suite failed:', error);
      process.exit(1);
    });
} 