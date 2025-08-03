# Testing Guide

This document describes how to test the Kiro Task Badge Generator GitHub Action project.

## Overview

The project includes comprehensive testing at multiple levels:
- **Unit Tests**: Test individual components in isolation
- **Integration Tests**: Test complete workflows end-to-end
- **GitHub Actions Tests**: Test the action in real GitHub environments

## Test Structure

```
tests/
├── fixtures/                    # Test data files
│   ├── valid-tasks.md          # Valid task file with mixed completion
│   ├── empty-tasks.md          # Task file with no tasks
│   ├── malformed-tasks.md      # Task file with malformed syntax
│   ├── nested-tasks.md         # Task file with nested task hierarchy
│   └── mixed-completion.md     # Task file with various completion states
├── index.test.ts               # Main action orchestration tests
├── task-scanner.test.ts        # Task file parsing and scanning tests
├── json-generator.test.ts      # Badge JSON generation tests
├── git-committer.test.ts       # Git operations and commit tests
├── integration.test.ts         # End-to-end workflow tests
├── workflow-scenarios.test.ts  # GitHub Actions trigger scenario tests
├── json-validation.test.ts     # JSON format and commit validation tests
└── setup.test.ts              # Test environment setup
```

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch

# Run specific test file
npm test -- tests/integration.test.ts

# Run tests matching a pattern
npm test -- --grep "JSON validation"
```

### Test Categories

#### 1. Unit Tests

Test individual components in isolation:

```bash
# Test task scanning logic
npm test -- tests/task-scanner.test.ts

# Test JSON badge generation
npm test -- tests/json-generator.test.ts

# Test git operations
npm test -- tests/git-committer.test.ts

# Test main action orchestration
npm test -- tests/index.test.ts
```

#### 2. Integration Tests

Test complete workflows end-to-end:

```bash
# Run all integration tests
npm test -- tests/integration.test.ts

# Test specific integration scenarios
npm test -- tests/integration.test.ts --grep "complete full workflow"
```

**Key Integration Test Scenarios:**
- Multiple specs with different completion rates
- Empty repositories (no specs)
- Mixed success/failure scenarios
- Git operation failures
- JSON file format validation
- File system operations

#### 3. Workflow Scenario Tests

Test different GitHub Actions trigger scenarios:

```bash
# Run workflow scenario tests
npm test -- tests/workflow-scenarios.test.ts
```

**Covered Scenarios:**
- Push triggers (main branch, feature branches)
- Pull request triggers (including forks)
- Manual triggers (workflow_dispatch, scheduled)
- Error scenarios (auth failures, permissions)
- Environment validation

#### 4. JSON Validation Tests

Test JSON generation and commit validation:

```bash
# Run JSON validation tests
npm test -- tests/json-validation.test.ts
```

**Validation Areas:**
- Shields.io JSON schema compliance
- File writing and path validation
- Git commit operations
- URL format compatibility

## GitHub Actions Testing

### Automated Testing Workflow

The project includes a comprehensive GitHub Actions workflow for testing:

```yaml
# .github/workflows/test-action.yml
```

#### Test Scenarios

1. **Standard Flow Test**
   - Creates test task files
   - Runs the action
   - Validates generated badge files
   - Checks JSON structure and format

2. **Force Commit Test**
   - Tests scenarios requiring commits
   - Validates git operations

3. **Dry Run Test**
   - Tests action components without commits
   - Validates action.yml structure

4. **Edge Cases Test**
   - Tests with no specs directory
   - Tests with malformed task files
   - Tests error handling

#### Running GitHub Actions Tests

```bash
# Trigger manual test run
gh workflow run test-action.yml

# Run specific test scenario
gh workflow run test-action.yml -f test_scenario=force_commit

# View test results
gh run list --workflow=test-action.yml
```

## Test Data and Fixtures

### Task File Fixtures

The test suite includes various task file scenarios:

#### Valid Tasks (`tests/fixtures/valid-tasks.md`)
```markdown
- [x] 1. Completed task
- [ ] 2. Incomplete task
- [-] 3. In-progress task
```

#### Malformed Tasks (`tests/fixtures/malformed-tasks.md`)
```markdown
- [x] 1. Valid task
- [ 2. Missing closing bracket
- [invalid] 3. Invalid checkbox state
```

#### Empty Tasks (`tests/fixtures/empty-tasks.md`)
```markdown
# No tasks, just content
```

### Creating Custom Test Data

To add new test scenarios:

1. Create fixture files in `tests/fixtures/`
2. Add corresponding test cases
3. Update integration tests if needed

```javascript
// Example test case
it('should handle custom scenario', async () => {
  const taskContent = `# Custom Test
- [x] 1. Custom completed task
- [ ] 2. Custom incomplete task`;
  
  mockFs.readFileSync.mockReturnValue(taskContent);
  // ... test implementation
});
```

## Testing Best Practices

### 1. Mocking External Dependencies

All tests use mocks for external dependencies:

```javascript
// Mock file system operations
vi.mock('fs');

// Mock git operations
vi.mock('child_process');

// Mock GitHub Actions core
vi.mock('@actions/core');
```

### 2. Test Isolation

Each test is isolated and doesn't affect others:

```javascript
beforeEach(() => {
  vi.clearAllMocks();
  // Setup clean state
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

### 3. Comprehensive Coverage

Tests cover:
- ✅ Happy path scenarios
- ✅ Error conditions
- ✅ Edge cases
- ✅ Performance scenarios
- ✅ Integration workflows

### 4. Realistic Test Data

Test fixtures mirror real-world usage:
- Various task completion states
- Different spec structures
- Malformed input handling
- Empty/missing files

## Debugging Tests

### Running Tests with Debug Output

```bash
# Enable debug logging
DEBUG=* npm test

# Run specific test with verbose output
npm test -- tests/integration.test.ts --reporter=verbose
```

### Common Issues and Solutions

#### 1. Test Timeouts
```bash
# Increase timeout for slow tests
npm test -- --testTimeout=10000
```

#### 2. Mock Issues
```javascript
// Ensure mocks are properly cleared
beforeEach(() => {
  vi.clearAllMocks();
});
```

#### 3. File System Mocking
```javascript
// Mock file existence
mockFs.existsSync.mockReturnValue(true);

// Mock file reading
mockFs.readFileSync.mockReturnValue('test content');
```

## Continuous Integration

### GitHub Actions CI

The project runs tests automatically on:
- Push to main/develop branches
- Pull requests
- Manual triggers

### Test Coverage

Coverage reports are generated and uploaded to Codecov:

```bash
# Generate coverage report
npm run test:coverage

# View coverage locally
open coverage/index.html
```

### Quality Gates

Tests must pass for:
- All unit tests (93 tests)
- Integration workflows
- JSON validation
- GitHub Actions scenarios

## Performance Testing

### Large Scale Scenarios

Tests include performance scenarios:

```javascript
// Test with many specs
const manySpecs = Array.from({ length: 100 }, (_, i) => ({
  name: `spec-${i}`,
  isDirectory: () => true
}));

// Test with many tasks
const manyTasks = Array.from({ length: 1000 }, (_, i) => 
  `- [${i % 2 === 0 ? 'x' : ' '}] ${i + 1}. Task ${i + 1}`
).join('\n');
```

### Memory and Timeout Considerations

- Tests include timeout handling
- Memory usage is monitored
- Large file scenarios are tested

## Contributing to Tests

### Adding New Tests

1. Identify the component/scenario to test
2. Create appropriate test file or add to existing
3. Follow naming conventions
4. Include both positive and negative test cases
5. Update this documentation

### Test Naming Convention

```javascript
describe('Component Name', () => {
  describe('method or feature', () => {
    it('should do something when condition', () => {
      // Test implementation
    });
    
    it('should handle error when invalid input', () => {
      // Error test implementation
    });
  });
});
```

### Pull Request Testing

Before submitting PRs:

1. Run full test suite: `npm test`
2. Check coverage: `npm run test:coverage`
3. Test GitHub Actions workflow
4. Verify no regressions

## Troubleshooting

### Common Test Failures

1. **Mock not working**: Ensure mocks are set up before imports
2. **Timeout errors**: Increase timeout or mock async operations
3. **File system errors**: Check mock setup for fs operations
4. **Git operation failures**: Verify git command mocks

### Getting Help

- Check existing test patterns in the codebase
- Review test fixtures for examples
- Run tests with verbose output for debugging
- Check GitHub Actions logs for integration issues

## Summary

The testing strategy ensures:
- ✅ **Comprehensive Coverage**: 93 tests covering all scenarios
- ✅ **Multiple Test Levels**: Unit, integration, and end-to-end tests
- ✅ **Real-world Scenarios**: GitHub Actions workflow testing
- ✅ **Quality Assurance**: JSON validation and format compliance
- ✅ **Performance Testing**: Large-scale scenario handling
- ✅ **Error Handling**: Comprehensive error scenario coverage

This testing approach ensures the Kiro Task Badge Generator is reliable, performant, and ready for production use.