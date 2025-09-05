#!/usr/bin/env node

/**
 * Security Audit Script for Pot of Gold Game
 * Checks for common security issues and validates configuration
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔒 Running Security Audit for Pot of Gold Game...\n');

let issuesFound = 0;
const warnings = [];
const errors = [];
const successes = [];

// Check 1: Verify .env is not tracked in git
console.log('1️⃣ Checking if .env is tracked in git...');
try {
  const gitFiles = execSync('git ls-files', { encoding: 'utf8' });
  if (gitFiles.includes('.env\n') || gitFiles.includes('.env ')) {
    errors.push('❌ CRITICAL: .env file is tracked in git!');
    issuesFound++;
  } else {
    successes.push('✅ .env is not tracked in git');
  }
} catch (error) {
  warnings.push('⚠️ Could not check git files');
}

// Check 2: Verify .gitignore includes .env
console.log('2️⃣ Checking .gitignore configuration...');
try {
  const gitignore = fs.readFileSync('.gitignore', 'utf8');
  if (!gitignore.includes('.env')) {
    errors.push('❌ .env is not in .gitignore!');
    issuesFound++;
  } else {
    successes.push('✅ .env is properly gitignored');
  }
} catch (error) {
  errors.push('❌ .gitignore file not found!');
  issuesFound++;
}

// Check 3: Check for hardcoded secrets in source files
console.log('3️⃣ Scanning for hardcoded secrets...');
const secretPatterns = [
  /AIzaSy[a-zA-Z0-9_-]{33}/g, // Firebase API key pattern
  /sk_live_[a-zA-Z0-9]{24,}/g, // Stripe live key
  /sk_test_[a-zA-Z0-9]{24,}/g, // Stripe test key
  /password\s*[:=]\s*["'][^"']+["']/gi, // Hardcoded passwords
  /api[_-]?key\s*[:=]\s*["'][^"']+["']/gi, // API keys
];

const sourceFiles = [
  'firebase/firebase.ts',
  'App.tsx',
  'services/authService.ts',
];

let hardcodedSecretsFound = false;
sourceFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    secretPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches && matches.length > 0) {
        // Check if it's using environment variables
        const isEnvVar = matches.some(match => 
          content.includes(`process.env`) && 
          content.indexOf('process.env') < content.indexOf(match)
        );
        
        if (!isEnvVar) {
          warnings.push(`⚠️ Potential hardcoded secret in ${file}`);
          hardcodedSecretsFound = true;
        }
      }
    });
  } catch (error) {
    // File doesn't exist, skip
  }
});

if (!hardcodedSecretsFound) {
  successes.push('✅ No obvious hardcoded secrets found');
}

// Check 4: Verify Firebase configuration uses environment variables
console.log('4️⃣ Checking Firebase configuration...');
try {
  const firebaseConfig = fs.readFileSync('firebase/firebase.ts', 'utf8');
  if (firebaseConfig.includes('process.env.EXPO_PUBLIC_FIREBASE_')) {
    successes.push('✅ Firebase uses environment variables');
  } else {
    warnings.push('⚠️ Firebase may not be using environment variables properly');
  }
} catch (error) {
  errors.push('❌ Could not check Firebase configuration');
  issuesFound++;
}

// Check 5: Check for vulnerable dependencies
console.log('5️⃣ Checking for vulnerable dependencies...');
try {
  const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
  const audit = JSON.parse(auditOutput);
  
  if (audit.metadata.vulnerabilities.critical > 0) {
    errors.push(`❌ ${audit.metadata.vulnerabilities.critical} critical vulnerabilities found!`);
    issuesFound++;
  }
  if (audit.metadata.vulnerabilities.high > 0) {
    warnings.push(`⚠️ ${audit.metadata.vulnerabilities.high} high severity vulnerabilities`);
  }
  if (audit.metadata.vulnerabilities.moderate > 0) {
    warnings.push(`⚠️ ${audit.metadata.vulnerabilities.moderate} moderate severity vulnerabilities`);
  }
  
  if (audit.metadata.vulnerabilities.total === 0) {
    successes.push('✅ No vulnerabilities found');
  }
} catch (error) {
  // npm audit returns non-zero exit code when vulnerabilities found
  try {
    const auditSummary = execSync('npm audit', { encoding: 'utf8' });
    if (auditSummary.includes('critical')) {
      errors.push('❌ Critical vulnerabilities detected');
      issuesFound++;
    }
  } catch (auditError) {
    warnings.push('⚠️ Could not run npm audit');
  }
}

// Check 6: Verify security headers in Vercel config
console.log('6️⃣ Checking security headers configuration...');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  const requiredHeaders = [
    'X-Frame-Options',
    'X-Content-Type-Options',
    'Content-Security-Policy',
    'Strict-Transport-Security',
  ];
  
  let hasAllHeaders = false;
  if (vercelConfig.headers && vercelConfig.headers[0]) {
    const headers = vercelConfig.headers[0].headers.map(h => h.key);
    hasAllHeaders = requiredHeaders.every(h => headers.includes(h));
  }
  
  if (hasAllHeaders) {
    successes.push('✅ Security headers properly configured');
  } else {
    warnings.push('⚠️ Some security headers may be missing');
  }
} catch (error) {
  warnings.push('⚠️ Could not check Vercel configuration');
}

// Check 7: Verify .env.example exists
console.log('7️⃣ Checking for .env.example...');
if (fs.existsSync('.env.example')) {
  successes.push('✅ .env.example file exists');
} else {
  warnings.push('⚠️ .env.example file not found');
}

// Check 8: Check for admin credentials in code
console.log('8️⃣ Checking for admin credentials...');
const adminPatterns = [
  /ADMIN_PASSWORD\s*=\s*["'][^"']+["']/g,
  /ADMIN_PIN\s*=\s*["'][^"']+["']/g,
  /admin.*password/gi,
];

let adminCredsFound = false;
const filesToCheck = fs.readdirSync('.').filter(f => f.endsWith('.ts') || f.endsWith('.tsx') || f.endsWith('.js'));
filesToCheck.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    adminPatterns.forEach(pattern => {
      if (pattern.test(content)) {
        warnings.push(`⚠️ Potential admin credential in ${file}`);
        adminCredsFound = true;
      }
    });
  } catch (error) {
    // Skip files that can't be read
  }
});

if (!adminCredsFound) {
  successes.push('✅ No admin credentials found in code');
}

// Print results
console.log('\n' + '='.repeat(50));
console.log('📊 SECURITY AUDIT RESULTS');
console.log('='.repeat(50) + '\n');

if (successes.length > 0) {
  console.log('✅ PASSED CHECKS:');
  successes.forEach(s => console.log('  ' + s));
  console.log('');
}

if (warnings.length > 0) {
  console.log('⚠️ WARNINGS:');
  warnings.forEach(w => console.log('  ' + w));
  console.log('');
}

if (errors.length > 0) {
  console.log('❌ CRITICAL ISSUES:');
  errors.forEach(e => console.log('  ' + e));
  console.log('');
}

// Summary
console.log('='.repeat(50));
if (errors.length === 0 && warnings.length === 0) {
  console.log('🎉 All security checks passed! Your app is ready for deployment.');
} else if (errors.length === 0) {
  console.log('✅ No critical issues found, but please review the warnings.');
} else {
  console.log(`❌ Found ${errors.length} critical issue(s) that must be fixed before deployment!`);
}
console.log('='.repeat(50));

// Exit with error code if critical issues found
process.exit(errors.length > 0 ? 1 : 0);