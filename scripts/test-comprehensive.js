#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Comprehensive App Store Compliance Testing...\n');

// Test categories
const testCategories = {
  unit: 'npm run test',
  integration: 'npm run test:integration',
  security: 'npm run test:security',
  performance: 'npm run test:performance',
  accessibility: 'npm run test:accessibility',
  compliance: 'npm run test:compliance',
};

// Compliance checklist
const complianceChecklist = {
  'Privacy Policy': fs.existsSync('docs/PRIVACY_POLICY.md'),
  'Terms of Service': fs.existsSync('docs/TERMS_OF_SERVICE.md'),
  'App Store Compliance': fs.existsSync('utils/appStoreCompliance.ts'),
  'Firebase Security Rules': fs.existsSync('firestore.rules'),
  'ESLint Configuration': fs.existsSync('.eslintrc.js'),
  'TypeScript Configuration': fs.existsSync('tsconfig.json'),
  'Package.json Dependencies': fs.existsSync('package.json'),
  'App Configuration': fs.existsSync('app.json'),
  'Comprehensive Tests': fs.existsSync('__tests__/comprehensive/'),
  'Security Tests': fs.existsSync('__tests__/comprehensive/Security.test.tsx'),
  'Performance Tests': fs.existsSync('__tests__/comprehensive/Performance.test.tsx'),
  'Compliance Tests': fs.existsSync('__tests__/comprehensive/AppStoreCompliance.test.tsx'),
};

// Run tests and collect results
const testResults = {};
let allTestsPassed = true;

console.log('📋 Running Compliance Checklist...\n');

Object.entries(complianceChecklist).forEach(([item, exists]) => {
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${item}`);
  if (!exists) allTestsPassed = false;
});

console.log('\n🧪 Running Test Suites...\n');

Object.entries(testCategories).forEach(([category, command]) => {
  try {
    console.log(`Running ${category} tests...`);
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    testResults[category] = { passed: true, output: result };
    console.log(`✅ ${category} tests passed`);
  } catch (error) {
    testResults[category] = { passed: false, output: error.stdout || error.message };
    console.log(`❌ ${category} tests failed`);
    allTestsPassed = false;
  }
});

// Generate comprehensive report
const report = {
  timestamp: new Date().toISOString(),
  compliance: complianceChecklist,
  testResults,
  summary: {
    totalTests: Object.keys(testResults).length,
    passedTests: Object.values(testResults).filter((r) => r.passed).length,
    failedTests: Object.values(testResults).filter((r) => !r.passed).length,
    allPassed: allTestsPassed,
  },
  recommendations: [],
};

// Add recommendations based on results
if (!allTestsPassed) {
  report.recommendations.push('Fix failing tests before app store submission');
}

if (!complianceChecklist['Privacy Policy']) {
  report.recommendations.push('Create Privacy Policy document');
}

if (!complianceChecklist['Terms of Service']) {
  report.recommendations.push('Create Terms of Service document');
}

// Save report
const reportPath = path.join(__dirname, '../test-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

console.log('\n📊 Test Summary:');
console.log(`Total Test Categories: ${report.summary.totalTests}`);
console.log(`Passed: ${report.summary.passedTests}`);
console.log(`Failed: ${report.summary.failedTests}`);
console.log(`Overall Status: ${allTestsPassed ? '✅ PASSED' : '❌ FAILED'}`);

if (report.recommendations.length > 0) {
  console.log('\n💡 Recommendations:');
  report.recommendations.forEach((rec) => console.log(`- ${rec}`));
}

console.log(`\n📄 Detailed report saved to: ${reportPath}`);

// Exit with appropriate code
process.exit(allTestsPassed ? 0 : 1);
