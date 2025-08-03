/**
 * Integration tests for the complete GitHub Action workflow
 * Tests the end-to-end functionality including file scanning, JSON generation, and git operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as core from '@actions/core';
import { TaskScanner } from '../src/task-scanner';
import { JSONGenerator } from '../src/json-generator';
import { GitCommitter } from '../src/git-committer';

// Mock external dependencies
vi.mock('fs');
vi.mock('child_process');
vi.mock('@actions/core');

const mockFs = vi.mocked(fs);
const mockExecSync = vi.mocked(execSync);
const mockCore = vi.mocked(core);

describe('Integration Tests - Complete Workflow', () => {
  const testWorkspaceRoot = '/test/workspace';
  const testSpecsDir = '.kiro/specs';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mocks for successful operations
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockReturnValue(undefined);
    mockFs.writeFileSync.mockReturnValue(undefined);
    mockExecSync.mockReturnValue(Buffer.from(''));
    
    mockCore.info.mockImplementation(() => {});
    mockCore.debug.mockImplementation(() => {});
    mockCore.warning.mockImplementation(() => {});
    mockCore.error.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End Workflow Tests', () => {
    it('should complete full workflow with multiple specs', async () => {
      // Setup mock directory structure
      const mockDirents = [
        { name: 'feature-a', isDirectory: () => true },
        { name: 'feature-b', isDirectory: () => true },
        { name: 'feature-c', isDirectory: () => true }
      ];

      mockFs.readdirSync.mockReturnValue(mockDirents as any);

      // Setup mock task files with different completion states
      const taskFiles = [
        // feature-a: 3/5 tasks completed (60%)
        `# Implementation Plan
- [x] 1. Setup completed
- [x] 2. Core logic implemented  
- [x] 3. Basic tests written
- [ ] 4. Documentation pending
- [ ] 5. Final review needed`,

        // feature-b: 2/2 tasks completed (100%)
        `# Implementation Plan
- [x] 1. All work done
- [x] 2. Everything complete`,

        // feature-c: 0/3 tasks completed (0%)
        `# Implementation Plan
- [ ] 1. Not started yet
- [ ] 2. Still pending
- [ ] 3. Waiting for approval`
      ];

      mockFs.readFileSync
        .mockReturnValueOnce(taskFiles[0]) // feature-a
        .mockReturnValueOnce(taskFiles[1]) // feature-b  
        .mockReturnValueOnce(taskFiles[2]); // feature-c

      // Mock git operations for successful commit
      mockExecSync.mockImplementation((command) => {
        const cmdStr = command.toString();
        if (cmdStr.includes('git diff --cached --quiet')) {
          throw new Error('Changes exist'); // Indicates changes to commit
        }
        return Buffer.from(''); // Success for all other git operations
      });

      // Execute the complete workflow
      const taskScanner = new TaskScanner(testSpecsDir);
      const jsonGenerator = new JSONGenerator();
      const gitCommitter = new GitCommitter(testWorkspaceRoot, 'Update Kiro task completion badges');

      // Step 1: Scan all specs
      const allSpecs = await taskScanner.scanAllSpecs();
      expect(allSpecs).toHaveLength(3);

      // Verify individual spec data
      expect(allSpecs[0]).toEqual({
        specName: 'feature-a',
        taskData: { totalTasks: 5, completedTasks: 3, completionRate: 0.6 }
      });
      expect(allSpecs[1]).toEqual({
        specName: 'feature-b', 
        taskData: { totalTasks: 2, completedTasks: 2, completionRate: 1.0 }
      });
      expect(allSpecs[2]).toEqual({
        specName: 'feature-c',
        taskData: { totalTasks: 3, completedTasks: 0, completionRate: 0 }
      });

      // Step 2: Generate JSON badges
      const globalBadge = jsonGenerator.generateGlobalBadge(allSpecs);
      expect(globalBadge).toEqual({
        schemaVersion: 1,
        label: 'All Kiro Tasks',
        message: '5/10', // 3+2+0 completed / 5+2+3 total
        color: 'yellow'
      });

      const specBadges = allSpecs.map(spec => ({
        specName: spec.specName,
        badge: jsonGenerator.generateSpecBadge(spec.specName, spec.taskData)
      }));

      expect(specBadges[0].badge).toEqual({
        schemaVersion: 1,
        label: 'feature-a Kiro Tasks',
        message: '3/5',
        color: 'yellow'
      });

      expect(specBadges[1].badge).toEqual({
        schemaVersion: 1,
        label: 'feature-b Kiro Tasks', 
        message: '2/2',
        color: 'brightgreen'
      });

      expect(specBadges[2].badge).toEqual({
        schemaVersion: 1,
        label: 'feature-c Kiro Tasks',
        message: '0/3', 
        color: 'red'
      });

      // Step 3: Prepare badge files for commit
      const badgeFiles = [
        {
          path: '.kiro/badge-data-all.json',
          content: JSON.stringify(globalBadge, null, 2)
        },
        ...specBadges.map(({ specName, badge }) => ({
          path: `.kiro/${specName}-badge-data.json`,
          content: JSON.stringify(badge, null, 2)
        }))
      ];

      // Step 4: Commit badge files
      await gitCommitter.commitBadgeFiles(badgeFiles);

      // Verify all files were written
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        path.resolve(testWorkspaceRoot, '.kiro/badge-data-all.json'),
        JSON.stringify(globalBadge, null, 2),
        'utf8'
      );

      specBadges.forEach(({ specName, badge }) => {
        expect(mockFs.writeFileSync).toHaveBeenCalledWith(
          path.resolve(testWorkspaceRoot, `.kiro/${specName}-badge-data.json`),
          JSON.stringify(badge, null, 2),
          'utf8'
        );
      });

      // Verify git operations were performed
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git config user.name'),
        expect.any(Object)
      );
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git config user.email'),
        expect.any(Object)
      );
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git commit'),
        expect.any(Object)
      );
      expect(mockExecSync).toHaveBeenCalledWith(
        'git push',
        expect.any(Object)
      );

      expect(mockCore.info).toHaveBeenCalledWith('✅ Successfully committed and pushed badge files');
    });

    it('should handle workflow with no specs gracefully', async () => {
      // Mock empty specs directory
      mockFs.existsSync.mockReturnValue(false);

      const taskScanner = new TaskScanner(testSpecsDir);
      const jsonGenerator = new JSONGenerator();
      const gitCommitter = new GitCommitter(testWorkspaceRoot, 'Update Kiro task completion badges');

      // Execute workflow
      const allSpecs = await taskScanner.scanAllSpecs();
      expect(allSpecs).toEqual([]);

      const globalBadge = jsonGenerator.generateGlobalBadge(allSpecs);
      expect(globalBadge).toEqual({
        schemaVersion: 1,
        label: 'All Kiro Tasks',
        message: '0/0',
        color: 'red'
      });

      const badgeFiles = [{
        path: '.kiro/badge-data-all.json',
        content: JSON.stringify(globalBadge, null, 2)
      }];

      // Mock no changes to commit
      mockExecSync.mockReturnValue(Buffer.from(''));

      await gitCommitter.commitBadgeFiles(badgeFiles);

      expect(mockCore.info).toHaveBeenCalledWith('✅ No changes to commit - badge files are already up to date');
    });

    it('should handle mixed success/failure scenarios', async () => {
      // Setup specs where some have valid task files and others don't
      const mockDirents = [
        { name: 'good-spec', isDirectory: () => true },
        { name: 'bad-spec', isDirectory: () => true },
        { name: 'empty-spec', isDirectory: () => true }
      ];

      mockFs.readdirSync.mockReturnValue(mockDirents as any);

      // Mock file reading: good-spec succeeds, bad-spec fails, empty-spec has no tasks
      mockFs.readFileSync
        .mockReturnValueOnce('- [x] 1. Working task\n- [ ] 2. Pending task') // good-spec
        .mockImplementationOnce(() => { throw new Error('File read error'); }) // bad-spec
        .mockReturnValueOnce('# No tasks here'); // empty-spec

      const taskScanner = new TaskScanner(testSpecsDir);
      const allSpecs = await taskScanner.scanAllSpecs();

      // Should only include specs that were successfully processed
      expect(allSpecs).toHaveLength(2);
      expect(allSpecs[0].specName).toBe('good-spec');
      expect(allSpecs[0].taskData).toEqual({
        totalTasks: 2,
        completedTasks: 1,
        completionRate: 0.5
      });
      expect(allSpecs[1].specName).toBe('empty-spec');
      expect(allSpecs[1].taskData).toEqual({
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0
      });

      const jsonGenerator = new JSONGenerator();
      const globalBadge = jsonGenerator.generateGlobalBadge(allSpecs);
      
      expect(globalBadge).toEqual({
        schemaVersion: 1,
        label: 'All Kiro Tasks',
        message: '1/2', // Only counting successfully processed specs
        color: 'yellow'
      });
    });

    it('should handle git operation failures gracefully', async () => {
      // Setup successful scanning and JSON generation
      const mockDirents = [{ name: 'test-spec', isDirectory: () => true }];
      mockFs.readdirSync.mockReturnValue(mockDirents as any);
      mockFs.readFileSync.mockReturnValue('- [x] 1. Test task');

      const taskScanner = new TaskScanner(testSpecsDir);
      const jsonGenerator = new JSONGenerator();
      const gitCommitter = new GitCommitter(testWorkspaceRoot, 'Update badges');

      // Mock the sleep method to avoid delays
      vi.spyOn(gitCommitter as any, 'sleep').mockResolvedValue(undefined);

      const allSpecs = await taskScanner.scanAllSpecs();
      const globalBadge = jsonGenerator.generateGlobalBadge(allSpecs);
      const badgeFiles = [{
        path: '.kiro/badge-data-all.json',
        content: JSON.stringify(globalBadge, null, 2)
      }];

      // Mock git push failure
      mockExecSync.mockImplementation((command) => {
        const cmdStr = command.toString();
        if (cmdStr.includes('git push')) {
          throw new Error('Push failed - network error');
        }
        if (cmdStr.includes('git diff --cached --quiet')) {
          throw new Error('Changes exist');
        }
        return Buffer.from('');
      });

      // Should throw error due to git failure
      await expect(gitCommitter.commitBadgeFiles(badgeFiles)).rejects.toThrow(
        'Git operations failed: Failed to push changes after 3 attempts: Push failed - network error'
      );

      // Files should still be written locally
      expect(mockFs.writeFileSync).toHaveBeenCalledWith(
        path.resolve(testWorkspaceRoot, '.kiro/badge-data-all.json'),
        JSON.stringify(globalBadge, null, 2),
        'utf8'
      );
    }, 10000); // Increase timeout to 10 seconds
  });

  describe('JSON File Format Validation', () => {
    it('should generate correctly formatted JSON files', async () => {
      const mockDirents = [{ name: 'test-spec', isDirectory: () => true }];
      mockFs.readdirSync.mockReturnValue(mockDirents as any);
      mockFs.readFileSync.mockReturnValue('- [x] 1. Task 1\n- [ ] 2. Task 2\n- [x] 3. Task 3');

      const taskScanner = new TaskScanner(testSpecsDir);
      const jsonGenerator = new JSONGenerator();

      const allSpecs = await taskScanner.scanAllSpecs();
      const globalBadge = jsonGenerator.generateGlobalBadge(allSpecs);
      const specBadge = jsonGenerator.generateSpecBadge('test-spec', allSpecs[0].taskData);

      // Validate JSON structure matches Shields.io requirements
      expect(globalBadge).toMatchObject({
        schemaVersion: 1,
        label: expect.any(String),
        message: expect.stringMatching(/^\d+\/\d+$/),
        color: expect.stringMatching(/^(brightgreen|yellow|red)$/)
      });

      expect(specBadge).toMatchObject({
        schemaVersion: 1,
        label: expect.any(String),
        message: expect.stringMatching(/^\d+\/\d+$/),
        color: expect.stringMatching(/^(brightgreen|yellow|red)$/)
      });

      // Validate that JSON can be properly serialized and parsed
      const globalJson = JSON.stringify(globalBadge, null, 2);
      const parsedGlobal = JSON.parse(globalJson);
      expect(parsedGlobal).toEqual(globalBadge);

      const specJson = JSON.stringify(specBadge, null, 2);
      const parsedSpec = JSON.parse(specJson);
      expect(parsedSpec).toEqual(specBadge);
    });

    it('should generate valid JSON for edge cases', async () => {
      const jsonGenerator = new JSONGenerator();

      // Test with empty specs
      const emptyGlobalBadge = jsonGenerator.generateGlobalBadge([]);
      expect(emptyGlobalBadge.message).toBe('0/0');
      expect(emptyGlobalBadge.color).toBe('red');

      // Test with spec having no tasks
      const noTasksBadge = jsonGenerator.generateSpecBadge('empty-spec', {
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0
      });
      expect(noTasksBadge.message).toBe('0/0');
      expect(noTasksBadge.color).toBe('red');

      // Test with 100% completion
      const completeBadge = jsonGenerator.generateSpecBadge('complete-spec', {
        totalTasks: 5,
        completedTasks: 5,
        completionRate: 1.0
      });
      expect(completeBadge.message).toBe('5/5');
      expect(completeBadge.color).toBe('brightgreen');

      // Validate all generated JSON is valid
      [emptyGlobalBadge, noTasksBadge, completeBadge].forEach(badge => {
        expect(() => JSON.stringify(badge)).not.toThrow();
        expect(badge.schemaVersion).toBe(1);
        expect(typeof badge.label).toBe('string');
        expect(badge.message).toMatch(/^\d+\/\d+$/);
        expect(['brightgreen', 'yellow', 'red']).toContain(badge.color);
      });
    });
  });

  describe('File System Integration', () => {
    it('should handle various directory structures', async () => {
      // Test with nested directory structure
      const mockDirents = [
        { name: 'feature-1', isDirectory: () => true },
        { name: 'feature-2', isDirectory: () => true },
        { name: 'not-a-directory.txt', isDirectory: () => false }, // Should be ignored
        { name: '.hidden-dir', isDirectory: () => true } // Should be processed
      ];

      mockFs.readdirSync.mockReturnValue(mockDirents as any);
      mockFs.readFileSync
        .mockReturnValueOnce('- [x] 1. Feature 1 task')
        .mockReturnValueOnce('- [ ] 1. Feature 2 task')
        .mockReturnValueOnce('- [x] 1. Hidden feature task');

      const taskScanner = new TaskScanner(testSpecsDir);
      const allSpecs = await taskScanner.scanAllSpecs();

      expect(allSpecs).toHaveLength(3);
      expect(allSpecs.map(s => s.specName)).toEqual(['feature-1', 'feature-2', '.hidden-dir']);
    });

    it('should create badge directories when they do not exist', async () => {
      const mockDirents = [{ name: 'test-spec', isDirectory: () => true }];
      mockFs.readdirSync.mockReturnValue(mockDirents as any);
      mockFs.readFileSync.mockReturnValue('- [x] 1. Test task');

      // Mock directories don't exist
      mockFs.existsSync.mockReturnValue(false);

      const taskScanner = new TaskScanner(testSpecsDir);
      const jsonGenerator = new JSONGenerator();
      const gitCommitter = new GitCommitter(testWorkspaceRoot, 'Test commit');

      const allSpecs = await taskScanner.scanAllSpecs();
      const globalBadge = jsonGenerator.generateGlobalBadge(allSpecs);
      const badgeFiles = [{
        path: '.kiro/badge-data-all.json',
        content: JSON.stringify(globalBadge, null, 2)
      }];

      // Mock git operations to skip commit (no changes)
      mockExecSync.mockReturnValue(Buffer.from(''));

      await gitCommitter.commitBadgeFiles(badgeFiles);

      // Verify directory creation was attempted
      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        path.dirname(path.resolve(testWorkspaceRoot, '.kiro/badge-data-all.json')),
        { recursive: true }
      );
    });
  });
});