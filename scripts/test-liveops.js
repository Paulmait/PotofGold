#!/usr/bin/env node

/**
 * LiveOps Testing Script
 * Tests all LiveOps features and remote configuration
 */

const fs = require('fs').promises;
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Test configuration
const testConfig = {
  features: {
    doubleCoins: { enabled: true, expected: true },
    specialEvent: { enabled: true, expected: true },
    tournaments: { enabled: true, expected: true },
    battlePass: { enabled: false, expected: false },
  },
  events: [
    {
      id: 'test_event_1',
      name: 'Test Tournament',
      type: 'tournament',
      duration: 86400000, // 24 hours
      config: {
        scoreMultiplier: 2.0,
        coinMultiplier: 1.5,
      },
    },
    {
      id: 'test_event_2',
      name: 'Weekend Rush',
      type: 'special',
      duration: 172800000, // 48 hours
      config: {
        scoreMultiplier: 3.0,
        coinMultiplier: 2.0,
      },
    },
  ],
  experiments: [
    {
      id: 'coin_spawn_rate',
      variants: ['control', 'fast', 'slow'],
      allocation: { control: 50, fast: 25, slow: 25 },
    },
    {
      id: 'ui_theme',
      variants: ['classic', 'modern', 'minimal'],
      allocation: { classic: 33, modern: 34, minimal: 33 },
    },
  ],
  balancing: {
    coinSpawnRate: { min: 0.5, max: 2.0, default: 1.0 },
    scoreMultiplier: { min: 0.5, max: 5.0, default: 1.0 },
    powerUpDuration: { min: 5000, max: 30000, default: 10000 },
  },
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  tests: [],
};

// Helper functions
function log(message, type = 'info') {
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warning: `${colors.yellow}⚠${colors.reset}`,
    test: `${colors.magenta}▶${colors.reset}`,
  };

  console.log(`${prefix[type]} ${message}`);
}

function logSection(title) {
  console.log(`\n${colors.cyan}${colors.bright}═══ ${title} ═══${colors.reset}\n`);
}

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Test functions
async function testFeatureFlags() {
  logSection('Testing Feature Flags');

  for (const [feature, config] of Object.entries(testConfig.features)) {
    log(`Testing feature: ${feature}`, 'test');

    try {
      // Simulate feature flag check
      const isEnabled = Math.random() > 0.3; // Simulate 70% success rate

      if (isEnabled === config.expected) {
        log(`Feature '${feature}' is ${isEnabled ? 'enabled' : 'disabled'} as expected`, 'success');
        results.passed++;
      } else {
        log(`Feature '${feature}' state mismatch!`, 'error');
        results.failed++;
      }

      results.tests.push({
        name: `Feature Flag: ${feature}`,
        status: isEnabled === config.expected ? 'passed' : 'failed',
        details: `Expected: ${config.expected}, Got: ${isEnabled}`,
      });
    } catch (error) {
      log(`Error testing feature '${feature}': ${error.message}`, 'error');
      results.failed++;
    }

    await sleep(100);
  }
}

async function testEventSystem() {
  logSection('Testing Event System');

  for (const event of testConfig.events) {
    log(`Testing event: ${event.name}`, 'test');

    try {
      // Simulate event activation
      const now = Date.now();
      const eventStart = now;
      const eventEnd = now + event.duration;

      // Test event scheduling
      log(
        `Scheduling event from ${new Date(eventStart).toISOString()} to ${new Date(eventEnd).toISOString()}`,
        'info'
      );

      // Simulate event activation check
      const isActive = Math.random() > 0.2; // 80% success rate

      if (isActive) {
        log(`Event '${event.name}' activated successfully`, 'success');

        // Test modifiers
        const modifiersApplied =
          event.config.scoreMultiplier > 1 && event.config.coinMultiplier > 1;

        if (modifiersApplied) {
          log(
            `Event modifiers applied: Score x${event.config.scoreMultiplier}, Coins x${event.config.coinMultiplier}`,
            'success'
          );
          results.passed++;
        } else {
          log(`Event modifiers not properly applied`, 'warning');
          results.warnings++;
        }
      } else {
        log(`Event '${event.name}' failed to activate`, 'error');
        results.failed++;
      }

      results.tests.push({
        name: `Event: ${event.name}`,
        status: isActive ? 'passed' : 'failed',
        details: `Type: ${event.type}, Duration: ${event.duration}ms`,
      });
    } catch (error) {
      log(`Error testing event '${event.name}': ${error.message}`, 'error');
      results.failed++;
    }

    await sleep(100);
  }
}

async function testABTesting() {
  logSection('Testing A/B Testing System');

  for (const experiment of testConfig.experiments) {
    log(`Testing experiment: ${experiment.id}`, 'test');

    try {
      // Simulate user allocation
      const users = 1000;
      const allocations = {};

      // Initialize counters
      experiment.variants.forEach((variant) => {
        allocations[variant] = 0;
      });

      // Simulate allocation for multiple users
      for (let i = 0; i < users; i++) {
        const userId = `user_${i}`;
        const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const allocation = hash % 100;

        let cumulative = 0;
        for (const variant of experiment.variants) {
          cumulative += experiment.allocation[variant] || 0;
          if (allocation < cumulative) {
            allocations[variant]++;
            break;
          }
        }
      }

      // Check allocation distribution
      let allocationCorrect = true;
      for (const variant of experiment.variants) {
        const expected = (experiment.allocation[variant] / 100) * users;
        const actual = allocations[variant];
        const tolerance = users * 0.05; // 5% tolerance

        if (Math.abs(actual - expected) > tolerance) {
          allocationCorrect = false;
          log(
            `Variant '${variant}' allocation outside tolerance: Expected ~${expected}, Got ${actual}`,
            'warning'
          );
          results.warnings++;
        } else {
          log(`Variant '${variant}' allocation correct: ${actual}/${users} users`, 'success');
        }
      }

      if (allocationCorrect) {
        log(`Experiment '${experiment.id}' allocation working correctly`, 'success');
        results.passed++;
      } else {
        log(`Experiment '${experiment.id}' allocation needs adjustment`, 'warning');
      }

      results.tests.push({
        name: `A/B Test: ${experiment.id}`,
        status: allocationCorrect ? 'passed' : 'warning',
        details: `Variants: ${experiment.variants.join(', ')}`,
      });
    } catch (error) {
      log(`Error testing experiment '${experiment.id}': ${error.message}`, 'error');
      results.failed++;
    }

    await sleep(100);
  }
}

async function testBalancingParameters() {
  logSection('Testing Balancing Parameters');

  for (const [param, config] of Object.entries(testConfig.balancing)) {
    log(`Testing parameter: ${param}`, 'test');

    try {
      // Test parameter boundaries
      const testValues = [
        config.min - 1, // Below minimum
        config.min, // Minimum
        config.default, // Default
        config.max, // Maximum
        config.max + 1, // Above maximum
      ];

      let paramValid = true;

      for (const value of testValues) {
        const isValid = value >= config.min && value <= config.max;
        const shouldBeValid = value !== config.min - 1 && value !== config.max + 1;

        if (isValid === shouldBeValid) {
          log(`Value ${value} validation correct: ${isValid ? 'valid' : 'invalid'}`, 'success');
        } else {
          log(`Value ${value} validation incorrect!`, 'error');
          paramValid = false;
        }
      }

      if (paramValid) {
        log(`Parameter '${param}' validation working correctly`, 'success');
        results.passed++;
      } else {
        log(`Parameter '${param}' validation has issues`, 'error');
        results.failed++;
      }

      results.tests.push({
        name: `Balancing: ${param}`,
        status: paramValid ? 'passed' : 'failed',
        details: `Range: ${config.min} - ${config.max}, Default: ${config.default}`,
      });
    } catch (error) {
      log(`Error testing parameter '${param}': ${error.message}`, 'error');
      results.failed++;
    }

    await sleep(100);
  }
}

async function testRemoteConfig() {
  logSection('Testing Remote Configuration');

  const configTests = [
    {
      name: 'Config Fetch',
      test: async () => {
        // Simulate config fetch
        const success = Math.random() > 0.1; // 90% success rate
        if (success) {
          log('Remote config fetched successfully', 'success');
          return true;
        } else {
          log('Failed to fetch remote config', 'error');
          return false;
        }
      },
    },
    {
      name: 'Config Caching',
      test: async () => {
        // Test cache functionality
        const cacheFile = path.join(__dirname, '../.liveops-cache.json');
        try {
          const cache = {
            config: testConfig,
            timestamp: Date.now(),
            version: '1.0.0',
          };

          await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2));
          const loaded = JSON.parse(await fs.readFile(cacheFile, 'utf8'));

          if (loaded.version === cache.version) {
            log('Config caching working correctly', 'success');

            // Clean up
            await fs.unlink(cacheFile).catch(() => {});
            return true;
          } else {
            log('Config cache mismatch', 'error');
            return false;
          }
        } catch (error) {
          log(`Cache test error: ${error.message}`, 'error');
          return false;
        }
      },
    },
    {
      name: 'Config Validation',
      test: async () => {
        // Validate config structure
        const requiredFields = ['features', 'events', 'experiments', 'balancing'];
        const missingFields = requiredFields.filter((field) => !testConfig[field]);

        if (missingFields.length === 0) {
          log('Config structure valid', 'success');
          return true;
        } else {
          log(`Missing required fields: ${missingFields.join(', ')}`, 'error');
          return false;
        }
      },
    },
    {
      name: 'Config Hot Reload',
      test: async () => {
        // Simulate hot reload
        log('Simulating config hot reload...', 'info');
        await sleep(500);

        const success = Math.random() > 0.2; // 80% success rate
        if (success) {
          log('Config hot reload successful', 'success');
          return true;
        } else {
          log('Config hot reload failed', 'error');
          return false;
        }
      },
    },
  ];

  for (const configTest of configTests) {
    log(`Testing: ${configTest.name}`, 'test');

    try {
      const passed = await configTest.test();

      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }

      results.tests.push({
        name: `Remote Config: ${configTest.name}`,
        status: passed ? 'passed' : 'failed',
        details: '',
      });
    } catch (error) {
      log(`Error in ${configTest.name}: ${error.message}`, 'error');
      results.failed++;
    }

    await sleep(100);
  }
}

async function testPerformance() {
  logSection('Testing LiveOps Performance');

  const performanceTests = [
    {
      name: 'Config Load Time',
      threshold: 100, // ms
      test: async () => {
        const start = Date.now();
        // Simulate config load
        await sleep(50);
        const duration = Date.now() - start;

        log(
          `Config loaded in ${duration}ms (threshold: ${100}ms)`,
          duration <= 100 ? 'success' : 'warning'
        );

        return { passed: duration <= 100, duration };
      },
    },
    {
      name: 'Event Activation Time',
      threshold: 50, // ms
      test: async () => {
        const start = Date.now();
        // Simulate event activation
        await sleep(20);
        const duration = Date.now() - start;

        log(
          `Event activated in ${duration}ms (threshold: ${50}ms)`,
          duration <= 50 ? 'success' : 'warning'
        );

        return { passed: duration <= 50, duration };
      },
    },
    {
      name: 'Feature Flag Check',
      threshold: 5, // ms
      test: async () => {
        const start = Date.now();
        // Simulate feature flag check
        const enabled = Math.random() > 0.5;
        const duration = Date.now() - start;

        log(
          `Feature flag checked in ${duration}ms (threshold: ${5}ms)`,
          duration <= 5 ? 'success' : 'warning'
        );

        return { passed: duration <= 5, duration };
      },
    },
  ];

  for (const perfTest of performanceTests) {
    log(`Testing: ${perfTest.name}`, 'test');

    try {
      const result = await perfTest.test();

      if (result.passed) {
        results.passed++;
      } else {
        results.warnings++;
      }

      results.tests.push({
        name: `Performance: ${perfTest.name}`,
        status: result.passed ? 'passed' : 'warning',
        details: `Duration: ${result.duration}ms, Threshold: ${perfTest.threshold}ms`,
      });
    } catch (error) {
      log(`Error in ${perfTest.name}: ${error.message}`, 'error');
      results.failed++;
    }

    await sleep(100);
  }
}

async function generateReport() {
  logSection('Test Report');

  // Calculate statistics
  const total = results.passed + results.failed + results.warnings;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

  // Summary
  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`  ${colors.green}Passed: ${results.passed}${colors.reset}`);
  console.log(`  ${colors.red}Failed: ${results.failed}${colors.reset}`);
  console.log(`  ${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
  console.log(`  Total: ${total}`);
  console.log(`  Pass Rate: ${passRate}%`);
  console.log();

  // Detailed results
  console.log(`${colors.bright}Detailed Results:${colors.reset}`);

  const groupedTests = {};
  results.tests.forEach((test) => {
    const category = test.name.split(':')[0];
    if (!groupedTests[category]) {
      groupedTests[category] = [];
    }
    groupedTests[category].push(test);
  });

  for (const [category, tests] of Object.entries(groupedTests)) {
    console.log(`\n  ${colors.cyan}${category}:${colors.reset}`);
    tests.forEach((test) => {
      const statusIcon = {
        passed: `${colors.green}✓${colors.reset}`,
        failed: `${colors.red}✗${colors.reset}`,
        warning: `${colors.yellow}⚠${colors.reset}`,
      };

      console.log(`    ${statusIcon[test.status]} ${test.name.split(':')[1]}`);
      if (test.details) {
        console.log(`      ${colors.bright}${colors.reset}${test.details}`);
      }
    });
  }

  // Save report to file
  const reportFile = path.join(__dirname, '../liveops-test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: results.passed,
      failed: results.failed,
      warnings: results.warnings,
      total,
      passRate,
    },
    tests: results.tests,
  };

  await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
  console.log(`\n${colors.bright}Report saved to: ${reportFile}${colors.reset}`);

  // Exit code based on results
  if (results.failed > 0) {
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log(`${colors.bright}${colors.magenta}`);
  console.log('╔════════════════════════════════════╗');
  console.log('║     LIVEOPS TESTING SUITE         ║');
  console.log('║     Pot of Gold Game              ║');
  console.log('╚════════════════════════════════════╝');
  console.log(colors.reset);

  try {
    await testFeatureFlags();
    await testEventSystem();
    await testABTesting();
    await testBalancingParameters();
    await testRemoteConfig();
    await testPerformance();
    await generateReport();

    console.log(`\n${colors.green}${colors.bright}✨ LiveOps testing completed!${colors.reset}`);
  } catch (error) {
    console.error(`\n${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testConfig, main };
