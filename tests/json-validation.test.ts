/**
 * Tests for JSON file generation, validation, and commit verification
 * Ensures generated badge files meet Shields.io requirements and are properly committed
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { TaskScanner } from '../src/task-scanner';
import { JSONGenerator } from '../src/json-generator';
import { GitCommitter } from '../src/git-committer';

// Mock external dependencies
vi.mock('fs');
vi.mock('child_process');

const mockFs = vi.mocked(fs);
const mockExecSync = vi.mocked(execSync);

describe('JSON File Generation and Validation', () => {
  const testWorkspaceRoot = '/test/workspace';
  const testSpecsDir = '.kiro/specs';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default successful mocks
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);
    mockExecSync.mockReturnValue(Buffer.from(''));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Shields.io JSON Format Validation', () => {
    it('should generate JSON that matches Shields.io schema exactly', async () => {
      const jsonGenerator = new JSONGenerator();
      
      const testTaskData = {
        totalTasks: 10,
        completedTasks: 7,
        completionRate: 0.7
      };

      const badge = jsonGenerator.generateSpecBadge('test-spec', testTaskData);

      // Validate exact Shields.io schema
      expect(badge).toEqual({
        schemaVersion: 1,
        label: 'test-spec Kiro Tasks',
        message: '7/10',
        color: 'yellow'
      });

      // Validate field types
      expect(typeof badge.schemaVersion).toBe('number');
      expect(typeof badge.label).toBe('string');
      expect(typeof badge.message).toBe('string');
      expect(typeof badge.color).toBe('string');

      // Validate field constraints
      expect(badge.schemaVersion).toBe(1);
      expect(badge.message).toMatch(/^\d+\/\d+$/);
      expect(['brightgreen', 'yellow', 'red']).toContain(badge.color);
    });

    it('should generate valid JSON for all completion percentages', () => {
      const jsonGenerator = new JSONGenerator();
      
      const testCases = [
        { completed: 0, total: 10, expectedColor: 'red' },
        { completed: 1, total: 10, expectedColor: 'yellow' },
        { completed: 5, total: 10, expectedColor: 'yellow' },
        { completed: 9, total: 10, expectedColor: 'yellow' },
        { completed: 10, total: 10, expectedColor: 'brightgreen' },
        { completed: 0, total: 0, expectedColor: 'red' }
      ];

      testCases.forEach(({ completed, total, expectedColor }) => {
        const taskData = {
          totalTasks: total,
          completedTasks: completed,
          completionRate: total > 0 ? completed / total : 0
        };

        const badge = jsonGenerator.generateSpecBadge('test', taskData);

        expect(badge.schemaVersion).toBe(1);
        expect(badge.message).toBe(`${completed}/${total}`);
        expect(badge.color).toBe(expectedColor);
        expect(badge.label).toBe('test Kiro Tasks');

        // Validate JSON serialization
        const jsonString = JSON.stringify(badge);
        expect(() => JSON.parse(jsonString)).not.toThrow();
        expect(JSON.parse(jsonString)).toEqual(badge);
      });
    });

    it('should generate valid global badge JSON aggregating multiple specs', () => {
      const jsonGenerator = new JSONGenerator();
      
      const specs = [
        {
          specName: 'spec-a',
          taskData: { totalTasks: 5, completedTasks: 5, completionRate: 1.0 }
        },
        {
          specName: 'spec-b', 
          taskData: { totalTasks: 8, completedTasks: 3, completionRate: 0.375 }
        },
        {
          specName: 'spec-c',
          taskData: { totalTasks: 2, completedTasks: 0, completionRate: 0.0 }
        }
      ];

      const globalBadge = jsonGenerator.generateGlobalBadge(specs);

      expect(globalBadge).toEqual({
        schemaVersion: 1,
        label: 'All Kiro Tasks',
        message: '8/15', // 5+3+0 completed / 5+8+2 total
        color: 'yellow'
      });

      // Validate JSON structure
      const jsonString = JSON.stringify(globalBadge, null, 2);
      const parsed = JSON.parse(jsonString);
      expect(parsed).toEqual(globalBadge);

      // Validate pretty-printed JSON format (for readability in files)
      expect(jsonString).toContain('{\n');
      expect(jsonString).toContain('  "schemaVersion": 1');
      expect(jsonString).toContain('\n}');
    });

    it('should handle special characters in spec names', () => {
      const jsonGenerator = new JSONGenerator();
      
      const specialNames = [
        { input: 'github-kiro-static-badge', expected: 'github-kiro-static-badge' },
        { input: 'feature_with_underscores', expected: 'feature_with_underscores' },
        { input: 'feature.with.dots', expected: 'featurewithdots' }, // Dots are sanitized out
        { input: 'feature123', expected: 'feature123' },
        { input: 'UPPERCASE-FEATURE', expected: 'UPPERCASE-FEATURE' }
      ];

      specialNames.forEach(({ input, expected }) => {
        const taskData = { totalTasks: 5, completedTasks: 3, completionRate: 0.6 };
        const badge = jsonGenerator.generateSpecBadge(input, taskData);

        expect(badge.label).toBe(`${expected} Kiro Tasks`);
        expect(badge.schemaVersion).toBe(1);
        expect(badge.message).toBe('3/5');
        expect(badge.color).toBe('yellow');

        // Validate JSON serialization with special characters
        expect(() => JSON.stringify(badge)).not.toThrow();
      });
    });
  });

  describe('File Writing and Path Validation', () => {
    it('should write badge files to correct paths', async () => {
      const gitCommitter = new GitCommitter(testWorkspaceRoot, 'Test commit');
      
      const badgeFiles = [
        {
          path: '.kiro/badge-data-all.json',
          content: '{"schemaVersion":1,"label":"All Kiro Tasks","message":"5/10","color":"yellow"}'
        },
        {
          path: '.kiro/feature-a-badge-data.json',
          content: '{"schemaVersion":1,"label":"feature-a Kiro Tasks","message":"3/5","color":"yellow"}'
        },
        {
          path: '.kiro/feature-b-badge-data.json',
          content: '{"schemaVersion":1,"label":"feature-b Kiro Tasks","message":"2/2","color":"brightgreen"}'
        }
      ];

      // Mock git operations to skip commit (no changes)
      mockExecSync.mockReturnValue(Buffer.from(''));

      await gitCommitter.commitBadgeFiles(badgeFiles);

      // Verify files were written to correct absolute paths
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        path.resolve(testWorkspaceRoot, '.kiro/badge-data-all.json'),
        badgeFiles[0].content,
        'utf8'
      );

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        path.resolve(testWorkspaceRoot, '.kiro/feature-a-badge-data.json'),
        badgeFiles[1].content,
        'utf8'
      );

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        path.resolve(testWorkspaceRoot, '.kiro/feature-b-badge-data.json'),
        badgeFiles[2].content,
        'utf8'
      );
    });

    it('should create directories if they do not exist', async () => {
      const gitCommitter = new GitCommitter(testWorkspaceRoot, 'Test commit');
      
      // Mock directories don't exist
      mockFs.existsSync.mockReturnValue(false);

      const badgeFiles = [{
        path: '.kiro/nested/deep/badge-data.json',
        content: '{"schemaVersion":1,"label":"Test","message":"1/1","color":"brightgreen"}'
      }];

      mockExecSync.mockReturnValue(Buffer.from(''));

      await gitCommitter.commitBadgeFiles(badgeFiles);

      // Verify directory creation
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.dirname(path.resolve(testWorkspaceRoot, '.kiro/nested/deep/badge-data.json')),
        { recursive: true }
      );
    });

    it('should validate badge file naming convention', () => {
      const testCases = [
        { specName: '', expected: '.kiro/badge-data-all.json' },
        { specName: undefined, expected: '.kiro/badge-data-all.json' },
        { specName: 'simple-spec', expected: '.kiro/simple-spec-badge-data.json' },
        { specName: 'complex_spec-name.v2', expected: '.kiro/complex_spec-name.v2-badge-data.json' }
      ];

      testCases.forEach(({ specName, expected }) => {
        const result = GitCommitter.getBadgeFilePath(specName);
        expect(result).toBe(expected);
      });
    });
  });

  describe('Git Commit Validation', () => {
    it('should commit badge files with proper git operations', async () => {
      const gitCommitter = new GitCommitter(testWorkspaceRoot, 'Update Kiro badges');
      
      const badgeFiles = [{
        path: '.kiro/badge-data-all.json',
        content: '{"schemaVersion":1,"label":"All Kiro Tasks","message":"1/1","color":"brightgreen"}'
      }];

      // Mock git operations sequence
      let gitCallSequence: string[] = [];
      mockExecSync.mockImplementation((command) => {
        const cmdStr = command.toString();
        gitCallSequence.push(cmdStr);
        
        if (cmdStr.includes('git diff --cached --quiet')) {
          throw new Error('Changes exist'); // Indicates changes to commit
        }
        return Buffer.from('');
      });

      await gitCommitter.commitBadgeFiles(badgeFiles);

      // Verify essential git operations were called (order may vary due to implementation)
      const hasUserConfig = gitCallSequence.some(cmd => cmd.includes('git config user.name') || cmd.includes('git config user.email'));
      const hasAdd = gitCallSequence.some(cmd => cmd.includes('git add'));
      const hasCommit = gitCallSequence.some(cmd => cmd.includes('git commit'));
      const hasPush = gitCallSequence.some(cmd => cmd.includes('git push'));

      expect(hasUserConfig).toBe(true);
      expect(hasAdd).toBe(true);
      expect(hasCommit).toBe(true);
      expect(hasPush).toBe(true);

      // Verify commit message is included
      const commitCall = gitCallSequence.find(cmd => cmd.includes('git commit'));
      expect(commitCall).toContain('Update Kiro badges');
    }, 10000);

    it('should skip commit when no changes exist', async () => {
      const gitCommitter = new GitCommitter(testWorkspaceRoot, 'No changes');
      
      const badgeFiles = [{
        path: '.kiro/badge-data-all.json',
        content: '{"schemaVersion":1,"label":"All Kiro Tasks","message":"0/0","color":"red"}'
      }];

      // Mock git diff to indicate no changes
      mockExecSync.mockReturnValue(Buffer.from(''));

      await gitCommitter.commitBadgeFiles(badgeFiles);

      // Verify files were written but no commit/push occurred
      expect(mockFs.writeFileSync).toHaveBeenCalled();
      
      // Check that commit and push were NOT called
      const gitCalls = mockExecSync.mock.calls.map(call => call[0].toString());
      expect(gitCalls.some(call => call.includes('git commit'))).toBe(false);
      expect(gitCalls.some(call => call.includes('git push'))).toBe(false);
    });

    it('should handle git push retries', async () => {
      const gitCommitter = new GitCommitter(testWorkspaceRoot, 'Test retries');
      
      // Mock the sleep method to avoid delays
      vi.spyOn(gitCommitter as any, 'sleep').mockResolvedValue(undefined);
      
      const badgeFiles = [{
        path: '.kiro/badge-data-all.json',
        content: '{"schemaVersion":1,"label":"Test","message":"1/1","color":"brightgreen"}'
      }];

      let pushAttempts = 0;
      mockExecSync.mockImplementation((command) => {
        const cmdStr = command.toString();
        
        if (cmdStr.includes('git push')) {
          pushAttempts++;
          if (pushAttempts <= 2) {
            throw new Error('Push failed - retry needed');
          }
          return Buffer.from(''); // Third attempt succeeds
        }
        
        if (cmdStr.includes('git diff --cached --quiet')) {
          throw new Error('Changes exist');
        }
        
        return Buffer.from('');
      });

      await gitCommitter.commitBadgeFiles(badgeFiles);

      expect(pushAttempts).toBe(3); // Should retry twice then succeed
    }, 10000);
  });

  describe('End-to-End JSON Workflow', () => {
    it('should complete full JSON generation and commit workflow', async () => {
      // Setup test data
      const mockDirents = [
        { name: 'spec-1', isDirectory: () => true },
        { name: 'spec-2', isDirectory: () => true }
      ];

      mockFs.readdirSync.mockReturnValue(mockDirents as any);
      mockFs.readFileSync
        .mockReturnValueOnce('- [x] 1. Task 1\n- [ ] 2. Task 2\n- [x] 3. Task 3') // spec-1: 2/3
        .mockReturnValueOnce('- [x] 1. Task A\n- [x] 2. Task B'); // spec-2: 2/2

      // Mock git operations for successful commit
      mockExecSync.mockImplementation((command) => {
        const cmdStr = command.toString();
        if (cmdStr.includes('git diff --cached --quiet')) {
          throw new Error('Changes exist');
        }
        return Buffer.from('');
      });

      // Execute workflow
      const taskScanner = new TaskScanner(testSpecsDir);
      const jsonGenerator = new JSONGenerator();
      const gitCommitter = new GitCommitter(testWorkspaceRoot, 'Update badges');

      const allSpecs = await taskScanner.scanAllSpecs();
      const globalBadge = jsonGenerator.generateGlobalBadge(allSpecs);
      const specBadges = allSpecs.map(spec => ({
        path: `.kiro/${spec.specName}-badge-data.json`,
        content: JSON.stringify(jsonGenerator.generateSpecBadge(spec.specName, spec.taskData), null, 2)
      }));

      const allBadgeFiles = [
        {
          path: '.kiro/badge-data-all.json',
          content: JSON.stringify(globalBadge, null, 2)
        },
        ...specBadges
      ];

      await gitCommitter.commitBadgeFiles(allBadgeFiles);

      // Verify all JSON files were written with correct content
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        path.resolve(testWorkspaceRoot, '.kiro/badge-data-all.json'),
        JSON.stringify({
          schemaVersion: 1,
          label: 'All Kiro Tasks',
          message: '4/5', // 2+2 completed / 3+2 total
          color: 'yellow'
        }, null, 2),
        'utf8'
      );

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        path.resolve(testWorkspaceRoot, '.kiro/spec-1-badge-data.json'),
        JSON.stringify({
          schemaVersion: 1,
          label: 'spec-1 Kiro Tasks',
          message: '2/3',
          color: 'yellow'
        }, null, 2),
        'utf8'
      );

      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        path.resolve(testWorkspaceRoot, '.kiro/spec-2-badge-data.json'),
        JSON.stringify({
          schemaVersion: 1,
          label: 'spec-2 Kiro Tasks',
          message: '2/2',
          color: 'brightgreen'
        }, null, 2),
        'utf8'
      );

      // Verify git operations
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git commit'),
        expect.any(Object)
      );
      expect(mockExecSync).toHaveBeenCalledWith('git push', expect.any(Object));
    });

    it('should validate generated URLs work with Shields.io format', () => {
      const baseUrl = 'https://raw.githubusercontent.com/user/repo/main';
      const badgeFiles = [
        '.kiro/badge-data-all.json',
        '.kiro/feature-a-badge-data.json',
        '.kiro/feature-b-badge-data.json'
      ];

      badgeFiles.forEach(badgeFile => {
        const shieldsUrl = `https://img.shields.io/badge/dynamic/json?url=${baseUrl}/${badgeFile}&query=$.message&label=${encodeURIComponent('Kiro Tasks')}&color=$.color`;
        
        // Validate URL structure
        expect(shieldsUrl).toContain('img.shields.io/badge/dynamic/json');
        expect(shieldsUrl).toContain(`url=${baseUrl}/${badgeFile}`);
        expect(shieldsUrl).toContain('query=$.message');
        expect(shieldsUrl).toContain('color=$.color');
        
        // Validate URL is properly encoded
        expect(shieldsUrl).toContain('Kiro%20Tasks');
        
        // Validate URL is a valid HTTP URL
        expect(() => new URL(shieldsUrl)).not.toThrow();
      });
    });
  });
});