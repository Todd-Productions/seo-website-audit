/**
 * Simple test script for the SEO Audit Server
 * 
 * Usage:
 *   node test-server.js
 * 
 * This script will:
 * 1. Check if the server is running
 * 2. Submit a test audit job
 * 3. Connect to WebSocket for real-time updates
 * 4. Poll for job status
 * 5. Display results when complete
 */

import WebSocket from 'ws';

const SERVER_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkHealth() {
  log('\n1. Checking server health...', 'cyan');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/health`);
    const data = await response.json();
    
    if (data.status === 'ok') {
      log('✓ Server is healthy', 'green');
      return true;
    } else {
      log('✗ Server returned unexpected status', 'red');
      return false;
    }
  } catch (error) {
    log(`✗ Server is not running: ${error.message}`, 'red');
    log('  Please start the server with: pnpm run server', 'yellow');
    return false;
  }
}

async function submitJob(domain = 'example.com') {
  log(`\n2. Submitting audit job for ${domain}...`, 'cyan');
  
  try {
    const response = await fetch(`${SERVER_URL}/api/audit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain,
        outputFormat: 'by-page',
        doLighthouse: false,
      }),
    });
    
    const data = await response.json();
    
    if (data.status === 'queued') {
      log(`✓ Job queued successfully`, 'green');
      log(`  Job ID: ${data.jobId}`, 'blue');
      return data.jobId;
    } else if (data.status === 'redirect') {
      log(`⚠ Domain redirects to: ${data.redirectUrl}`, 'yellow');
      log('  Please confirm and resubmit', 'yellow');
      return null;
    } else {
      log(`✗ Failed to submit job: ${data.message}`, 'red');
      return null;
    }
  } catch (error) {
    log(`✗ Error submitting job: ${error.message}`, 'red');
    return null;
  }
}

function connectWebSocket(jobId) {
  log(`\n3. Connecting to WebSocket for real-time updates...`, 'cyan');
  
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`${WS_URL}/ws/audit/${jobId}`);
    
    ws.on('open', () => {
      log('✓ WebSocket connected', 'green');
    });
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      
      if (message.type === 'status') {
        const progress = message.progress !== undefined ? `${message.progress}%` : 'N/A';
        log(`  [${progress}] ${message.message || message.status}`, 'blue');
      } else if (message.type === 'complete') {
        log('\n✓ Audit completed!', 'green');
        ws.close();
        resolve(message.results);
      } else if (message.type === 'error') {
        log(`\n✗ Audit failed: ${message.error}`, 'red');
        ws.close();
        reject(new Error(message.error));
      }
    });
    
    ws.on('error', (error) => {
      log(`✗ WebSocket error: ${error.message}`, 'red');
      reject(error);
    });
    
    ws.on('close', () => {
      log('  WebSocket disconnected', 'yellow');
    });
  });
}

async function pollJobStatus(jobId) {
  log(`\n4. Polling job status...`, 'cyan');
  
  let attempts = 0;
  const maxAttempts = 60; // 5 minutes max
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${SERVER_URL}/api/audit/${jobId}`);
      const data = await response.json();
      
      log(`  Status: ${data.status} (${data.progress}%)`, 'blue');
      
      if (data.status === 'COMPLETED') {
        log('\n✓ Job completed successfully!', 'green');
        return data.results;
      } else if (data.status === 'FAILED') {
        log(`\n✗ Job failed: ${data.error}`, 'red');
        return null;
      }
      
      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    } catch (error) {
      log(`✗ Error polling status: ${error.message}`, 'red');
      return null;
    }
  }
  
  log('\n✗ Job timed out', 'red');
  return null;
}

function displayResults(results) {
  if (!results) {
    log('\nNo results to display', 'yellow');
    return;
  }
  
  log('\n5. Audit Results:', 'cyan');
  log(`  Website: ${results.website}`, 'blue');
  log(`  Overall Score: ${results.overallScore}/100`, results.overallScore >= 80 ? 'green' : results.overallScore >= 60 ? 'yellow' : 'red');
  log(`  Total URLs: ${results.totalUrls}`, 'blue');
  log(`  Total Pages: ${results.totalPages}`, 'blue');
  log(`  Indexed Pages: ${results.indexedPages}`, 'blue');
  
  if (results.pages && results.pages.length > 0) {
    log(`\n  Sample Pages (first 3):`, 'cyan');
    results.pages.slice(0, 3).forEach((page, index) => {
      log(`    ${index + 1}. ${page.url}`, 'blue');
      log(`       Score: ${page.score}/100`, page.score >= 80 ? 'green' : page.score >= 60 ? 'yellow' : 'red');
    });
  }
  
  log('\n✓ Test completed successfully!', 'green');
}

async function main() {
  log('='.repeat(60), 'cyan');
  log('SEO Audit Server - Test Script', 'cyan');
  log('='.repeat(60), 'cyan');
  
  // Check if server is running
  const isHealthy = await checkHealth();
  if (!isHealthy) {
    process.exit(1);
  }
  
  // Get domain from command line or use default
  const domain = process.argv[2] || 'example.com';
  
  // Submit job
  const jobId = await submitJob(domain);
  if (!jobId) {
    process.exit(1);
  }
  
  // Choose between WebSocket or polling
  const useWebSocket = true; // Change to false to test polling
  
  let results;
  if (useWebSocket) {
    try {
      results = await connectWebSocket(jobId);
    } catch (error) {
      log(`\nFalling back to polling...`, 'yellow');
      results = await pollJobStatus(jobId);
    }
  } else {
    results = await pollJobStatus(jobId);
  }
  
  // Display results
  displayResults(results);
  
  log('\n' + '='.repeat(60), 'cyan');
}

main().catch((error) => {
  log(`\nUnexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});

