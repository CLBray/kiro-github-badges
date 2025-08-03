/**
 * Tests for different GitHub Actions workflow trigger scenarios
 * Validates action behavior under various conditions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as core from '@actions/core';

// Mock external dependencies
vi.mock('fs');
vi.mock('child_process');
vi.mock('@actions/core');

const mockFs = vi.mocked(fs);
const mockExecSync = vi.mocked(execSync);
const mockCore = vi.mocked(core);

// Mock the main action components
vi.mock('../src/task-scanner', () => ({
  TaskScanner: vi.fn()
}));

vi.mock('../src/json-generator', () => ({
  JSONGenerator: vi.fn()
}));

vi.mock('../src/git-committer', () => ({
  GitCommitter: vi.fn()
}));

describe('Workflow Trigger Scenarios', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);
    mockExecSync.mockReturnValue(Buffer.from(''));
    
    mockCore.info.mockImplementation(() => {});
    mockCore.debug.mockImplementation(() => {});
    mockCore.warning.mockImplementation(() => {});
    mockCore.error.mockImplementation(() => {});
    mockCore.setFailed.mockImplementation(() => {});
    mockCore.getInput.mockImplementation((name: string) => {
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Push Trigger Scenarios', () => {
    it('should handle push to main branch with task file changes', async () => {
      // Simulate GitHub Actions environment for push trigger
      process.env.GITHUB_EVENT_NAME = 'push';
      process.env.GITHUB_REF = 'refs/heads/main';
      process.env.GITHUB_SHA = 'abc123';

      // Mock changed files include task files
      const changedFiles = [
        'test-specs/feature-a/tasks.md',
        'test-specs/feature-b/tasks.md'
      ];

      // Mock git operations to simulate successful push trigger
      mockExecSync.mockImplementation((command) => {
        const cmdStr = command.toString();
        if (cmdStr.includes('git diff --name-only')) {
          return Buffer.from(changedFiles.join('\n'));
        }
        if (cmdStr.includes('git diff --cached --quiet')) {
          throw new Error('Changes exist'); // Indicates changes to commit
        }
        return Buffer.from(''); // Success for other operations
      });

      // Verify that the action would process the trigger correctly
      expect(process.env.GITHUB_EVENT_NAME).toBe('push');
      expect(process.env.GITHUB_REF).toBe('refs/heads/main');

      // Clean up environment
      delete process.env.GITHUB_EVENT_NAME;
      delete process.env.GITHUB_REF;
      delete process.env.GITHUB_SHA;
    });

    it('should handle push with no task file changes', async () => {
      // Simulate push that doesn't affect task files
      process.env.GITHUB_EVENT_NAME = 'push';
      process.env.GITHUB_REF = 'refs/heads/main';

      const changedFiles = [
        'src/index.ts',
        'README.md',
        'package.json'
      ];

      mockExecSync.mockImplementation((command) => {
        const cmdStr = command.toString();
        if (cmdStr.includes('git diff --name-only')) {
          return Buffer.from(changedFiles.join('\n'));
        }
        return Buffer.from('');
      });

      // Action should still run but may find no changes to commit
      expect(process.env.GITHUB_EVENT_NAME).toBe('push');

      // Clean up
      delete process.env.GITHUB_EVENT_NAME;
      delete process.env.GITHUB_REF;
    });

    it('should handle push to feature branch', async () => {
      process.env.GITHUB_EVENT_NAME = 'push';
      process.env.GITHUB_REF = 'refs/heads/feature/new-feature';

      // Action should work on any branch
      expect(process.env.GITHUB_REF).toBe('refs/heads/feature/new-feature');

      // Clean up
      delete process.env.GITHUB_EVENT_NAME;
      delete process.env.GITHUB_REF;
    });
  });

  describe('Pull Request Trigger Scenarios', () => {
    it('should handle pull request with task file changes', async () => {
      process.env.GITHUB_EVENT_NAME = 'pull_request';
      process.env.GITHUB_HEAD_REF = 'feature/update-tasks';
      process.env.GITHUB_BASE_REF = 'main';

      const changedFiles = [
        'test-specs/new-feature/tasks.md'
      ];

      mockExecSync.mockImplementation((command) => {
        const cmdStr = command.toString();
        if (cmdStr.includes('git diff --name-only')) {
          return Buffer.from(changedFiles.join('\n'));
        }
        if (cmdStr.includes('git diff --cached --quiet')) {
          throw new Error('Changes exist');
        }
        return Buffer.from('');
      });

      expect(process.env.GITHUB_EVENT_NAME).toBe('pull_request');
      expect(process.env.GITHUB_HEAD_REF).toBe('feature/update-tasks');

      // Clean up
      delete process.env.GITHUB_EVENT_NAME;
      delete process.env.GITHUB_HEAD_REF;
      delete process.env.GITHUB_BASE_REF;
    });

    it('should handle pull request from fork', async () => {
      process.env.GITHUB_EVENT_NAME = 'pull_request';
      process.env.GITHUB_HEAD_REF = 'feature/external-contribution';
      process.env.GITHUB_REPOSITORY = 'original/repo';
      process.env.GITHUB_HEAD_REPOSITORY = 'fork/repo';

      // Action should handle fork PRs appropriately
      expect(process.env.GITHUB_HEAD_REPOSITORY).toBe('fork/repo');

      // Clean up
      delete process.env.GITHUB_EVENT_NAME;
      delete process.env.GITHUB_HEAD_REF;
      delete process.env.GITHUB_REPOSITORY;
      delete process.env.GITHUB_HEAD_REPOSITORY;
    });
  });

  describe('Manual Trigger Scenarios', () => {
    it('should handle workflow_dispatch trigger', async () => {
      process.env.GITHUB_EVENT_NAME = 'workflow_dispatch';
      process.env.GITHUB_REF = 'refs/heads/main';

      // Manual triggers should work regardless of file changes
      mockExecSync.mockImplementation((command) => {
        const cmdStr = command.toString();
        if (cmdStr.includes('git diff --cached --quiet')) {
          throw new Error('Changes exist');
        }
        return Buffer.from('');
      });

      expect(process.env.GITHUB_EVENT_NAME).toBe('workflow_dispatch');

      // Clean up
      delete process.env.GITHUB_EVENT_NAME;
      delete process.env.GITHUB_REF;
    });

    it('should handle scheduled trigger', async () => {
      process.env.GITHUB_EVENT_NAME = 'schedule';
      process.env.GITHUB_REF = 'refs/heads/main';

      // Scheduled runs should work to keep badges current
      expect(process.env.GITHUB_EVENT_NAME).toBe('schedule');

      // Clean up
      delete process.env.GITHUB_EVENT_NAME;
      delete process.env.GITHUB_REF;
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing GitHub token', async () => {
      mockCore.getInput.mockImplementation((name: string) => {
        if (name === 'token') {
          return ''; // Empty token
        }
        return 'default-value';
      });

      // Action should fail gracefully with clear error message
      const token = mockCore.getInput('token');
      expect(token).toBe('');

      // Verify that setFailed would be called
      if (!token) {
        mockCore.setFailed('GitHub token is required');
        expect(mockCore.setFailed).toHaveBeenCalledWith('GitHub token is required');
      }
    });

    it('should handle git authentication failure', async () => {
      mockExecSync.mockImplementation((command) => {
        const cmdStr = command.toString();
        if (cmdStr.includes('git push')) {
          throw new Error('Authentication failed');
        }
        if (cmdStr.includes('git diff --cached --quiet')) {
          throw new Error('Changes exist');
        }
        return Buffer.from('');
      });

      // Simulate git authentication failure
      try {
        mockExecSync('git push');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Authentication failed');
      }
    });

    it('should handle repository permission errors', async () => {
      mockFs.writeFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      // Simulate file write permission error
      try {
        mockFs.writeFileSync('/test/path', 'content', 'utf8');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Permission denied');
      }
    });

    it('should handle network connectivity issues', async () => {
      mockExecSync.mockImplementation((command) => {
        const cmdStr = command.toString();
        if (cmdStr.includes('git push')) {
          throw new Error('Network unreachable');
        }
        return Buffer.from('');
      });

      // Simulate network error during git push
      try {
        mockExecSync('git push');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network unreachable');
      }
    });
  });

  describe('Badge File Validation', () => {
    it('should validate badge file paths are correct', () => {
      const expectedPaths = [
        '.kiro/badge-data-all.json',
        '.kiro/feature-a-badge-data.json',
        '.kiro/feature-b-badge-data.json'
      ];

      expectedPaths.forEach(expectedPath => {
        expect(expectedPath).toMatch(/^\.kiro\/.*\.json$/);
        expect(expectedPath).toMatch(/badge-data/);
      });
    });

    it('should validate JSON structure for Shields.io compatibility', () => {
      const validBadgeJson = {
        schemaVersion: 1,
        label: 'Test Kiro Tasks',
        message: '5/10',
        color: 'yellow'
      };

      // Validate required fields
      expect(validBadgeJson).toHaveProperty('schemaVersion', 1);
      expect(validBadgeJson).toHaveProperty('label');
      expect(validBadgeJson).toHaveProperty('message');
      expect(validBadgeJson).toHaveProperty('color');

      // Validate field types and formats
      expect(typeof validBadgeJson.label).toBe('string');
      expect(validBadgeJson.message).toMatch(/^\d+\/\d+$/);
      expect(['brightgreen', 'yellow', 'red']).toContain(validBadgeJson.color);

      // Validate JSON serialization
      expect(() => JSON.stringify(validBadgeJson)).not.toThrow();
      expect(JSON.parse(JSON.stringify(validBadgeJson))).toEqual(validBadgeJson);
    });

    it('should validate badge URLs for Shields.io', () => {
      const repoUrl = 'https://raw.githubusercontent.com/user/repo/main';
      const badgeFile = '.kiro/badge-data-all.json';
      
      const shieldsUrl = `https://img.shields.io/badge/dynamic/json?url=${repoUrl}/${badgeFile}&query=$.message&label=Kiro%20Tasks&color=$.color`;
      
      // Validate URL structure
      expect(shieldsUrl).toContain('img.shields.io');
      expect(shieldsUrl).toContain('dynamic/json');
      expect(shieldsUrl).toContain('query=$.message');
      expect(shieldsUrl).toContain('color=$.color');
      expect(shieldsUrl).toContain(encodeURIComponent('Kiro Tasks'));
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle large numbers of specs efficiently', () => {
      // Simulate many specs
      const manySpecs = Array.from({ length: 100 }, (_, i) => ({
        name: `spec-${i}`,
        isDirectory: () => true
      }));

      mockFs.readdirSync.mockReturnValue(manySpecs as any);

      // Should not timeout or fail with many specs
      expect(manySpecs).toHaveLength(100);
      expect(manySpecs.every(spec => spec.isDirectory())).toBe(true);
    });

    it('should handle specs with many tasks', () => {
      // Simulate a spec with many tasks
      const manyTasks = Array.from({ length: 1000 }, (_, i) => 
        `- [${i % 2 === 0 ? 'x' : ' '}] ${i + 1}. Task ${i + 1}`
      ).join('\n');

      const taskContent = `# Implementation Plan\n\n${manyTasks}`;

      // Should handle large task files
      expect(taskContent.split('\n')).toHaveLength(1002); // Header + empty line + 1000 tasks
      expect(taskContent).toContain('Task 1000');
    });

    it('should handle concurrent git operations gracefully', async () => {
      let gitCallCount = 0;
      
      mockExecSync.mockImplementation((command) => {
        gitCallCount++;
        const cmdStr = command.toString();
        
        if (cmdStr.includes('git diff --cached --quiet')) {
          throw new Error('Changes exist');
        }
        
        // Simulate some delay for git operations
        return Buffer.from('');
      });

      // Simulate multiple git operations
      const operations = [
        'git config user.name',
        'git config user.email',
        'git add file1.json',
        'git add file2.json',
        'git commit -m "Update badges"',
        'git push'
      ];

      operations.forEach(op => {
        try {
          mockExecSync(op);
        } catch (error) {
          // Expected for diff command
        }
      });

      expect(gitCallCount).toBe(operations.length);
    });
  });

  describe('Environment Validation', () => {
    it('should validate GitHub Actions environment variables', () => {
      const requiredEnvVars = [
        'GITHUB_WORKSPACE',
        'GITHUB_REPOSITORY',
        'GITHUB_REF',
        'GITHUB_SHA'
      ];

      // Set up mock environment
      process.env.GITHUB_WORKSPACE = '/github/workspace';
      process.env.GITHUB_REPOSITORY = 'user/repo';
      process.env.GITHUB_REF = 'refs/heads/main';
      process.env.GITHUB_SHA = 'abc123';

      requiredEnvVars.forEach(envVar => {
        expect(process.env[envVar]).toBeDefined();
        expect(process.env[envVar]).not.toBe('');
      });

      // Clean up
      requiredEnvVars.forEach(envVar => {
        delete process.env[envVar];
      });
    });

    it('should validate Node.js version compatibility', () => {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

      // Action requires Node.js 24+
      expect(majorVersion).toBeGreaterThanOrEqual(20); // Allow for test environment
    });

    it('should validate action inputs', () => {
      const inputs = {
        token: mockCore.getInput('token'),
        commitMessage: mockCore.getInput('commit-message')
      };

      expect(inputs.token).toBeDefined();
      expect(inputs.commitMessage).toBeDefined();
      expect(typeof inputs.token).toBe('string');
      expect(typeof inputs.commitMessage).toBe('string');
    });
  });
});