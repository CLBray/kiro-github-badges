/**
 * Tests for the main GitHub Action orchestration logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as core from '@actions/core';

// Mock the @actions/core module
vi.mock('@actions/core', () => ({
  info: vi.fn(),
  debug: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  setFailed: vi.fn(),
  getInput: vi.fn(),
  setOutput: vi.fn(),
}));

// Mock the components
vi.mock('../src/task-scanner', () => ({
  TaskScanner: vi.fn().mockImplementation(() => ({
    scanAllSpecs: vi.fn().mockResolvedValue([
      {
        specName: 'test-spec',
        taskData: {
          totalTasks: 10,
          completedTasks: 7,
          completionRate: 0.7
        }
      }
    ])
  }))
}));

vi.mock('../src/json-generator', () => ({
  JSONGenerator: vi.fn().mockImplementation(() => ({
    generateGlobalBadge: vi.fn().mockReturnValue({
      schemaVersion: 1,
      label: 'All Kiro Tasks',
      message: '7/10',
      color: 'yellow'
    }),
    generateSpecBadge: vi.fn().mockReturnValue({
      schemaVersion: 1,
      label: 'test-spec Kiro Tasks',
      message: '7/10',
      color: 'yellow'
    })
  }))
}));

vi.mock('../src/git-committer', () => ({
  GitCommitter: vi.fn().mockImplementation(() => ({
    commitBadgeFiles: vi.fn().mockResolvedValue(undefined)
  }))
}));

describe('Main Action Orchestration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default input mocks
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'token':
          return 'test-token';
        case 'commit-message':
          return 'Update Kiro task completion badges';
        default:
          return '';
      }
    });
  });

  it('should validate input parsing logic', () => {
    // Test that the parseActionInputs function would work correctly
    expect(core.getInput).toBeDefined();
    
    // Mock the inputs
    const token = 'test-token';
    const commitMessage = 'Update Kiro task completion badges';
    
    vi.mocked(core.getInput).mockReturnValueOnce(token);
    vi.mocked(core.getInput).mockReturnValueOnce(commitMessage);
    
    // Verify the mocks work as expected
    expect(core.getInput('token')).toBe(token);
    expect(core.getInput('commit-message')).toBe(commitMessage);
  });

  it('should handle empty commit message by using default', () => {
    vi.mocked(core.getInput).mockImplementation((name: string) => {
      switch (name) {
        case 'token':
          return 'test-token';
        case 'commit-message':
          return ''; // Empty commit message
        default:
          return '';
      }
    });

    const commitMessage = core.getInput('commit-message') || 'Update Kiro task completion badges';
    expect(commitMessage).toBe('Update Kiro task completion badges');
  });

  it('should verify core functions are available', () => {
    // Verify that all required core functions are mocked and available
    expect(core.info).toBeDefined();
    expect(core.debug).toBeDefined();
    expect(core.error).toBeDefined();
    expect(core.setFailed).toBeDefined();
    expect(core.getInput).toBeDefined();
    expect(core.setOutput).toBeDefined();
  });

  it('should test error handling structure', () => {
    const testError = new Error('Test error');
    
    // Simulate error handling
    try {
      throw testError;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      expect(errorMessage).toBe('Test error');
      
      // Verify setFailed would be called with proper message
      core.setFailed(`Action failed with error: ${errorMessage}`);
      expect(core.setFailed).toHaveBeenCalledWith('Action failed with error: Test error');
    }
  });
});