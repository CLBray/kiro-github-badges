#!/usr/bin/env node

/**
 * Simple test script to verify error handling functionality
 */

const { TaskScanner } = require('./dist/task-scanner');
const { JSONGenerator } = require('./dist/json-generator');

async function testErrorHandling() {
  console.log('🧪 Testing error handling functionality...\n');

  // Test 1: TaskScanner with missing directory
  console.log('Test 1: TaskScanner with missing directory');
  try {
    const scanner = new TaskScanner('.kiro/nonexistent');
    const results = await scanner.scanAllSpecs();
    console.log('✅ Handled missing directory gracefully:', results.length === 0);
  } catch (error) {
    console.log('❌ Should not throw for missing directory:', error.message);
  }

  // Test 2: JSONGenerator with invalid data
  console.log('\nTest 2: JSONGenerator with invalid data');
  try {
    const generator = new JSONGenerator();
    const badge = generator.generateGlobalBadge([
      { specName: 'test', taskData: { totalTasks: -1, completedTasks: 5, completionRate: 0 } }
    ]);
    console.log('✅ Generated fallback badge for invalid data:', badge.message === '0/0');
  } catch (error) {
    console.log('❌ Should not throw for invalid data:', error.message);
  }

  // Test 3: JSONGenerator with empty specs
  console.log('\nTest 3: JSONGenerator with empty specs');
  try {
    const generator = new JSONGenerator();
    const badge = generator.generateGlobalBadge([]);
    console.log('✅ Generated badge for empty specs:', badge.message === '0/0' && badge.color === 'red');
  } catch (error) {
    console.log('❌ Should not throw for empty specs:', error.message);
  }

  console.log('\n🎉 Error handling tests completed!');
}

testErrorHandling().catch(console.error);