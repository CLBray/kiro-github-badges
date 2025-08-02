/**
 * Unit tests for TaskScanner class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { TaskScanner } from '../src/task-scanner';

// Mock fs module
vi.mock('fs');
const mockFs = vi.mocked(fs);

describe('TaskScanner', () => {
  let taskScanner: TaskScanner;
  const testSpecsDir = '.kiro/specs';

  beforeEach(() => {
    taskScanner = new TaskScanner(testSpecsDir);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('parseTaskFile', () => {
    it('should parse completed and incomplete tasks correctly', async () => {
      const taskContent = `# Implementation Plan

- [x] 1. First completed task
  - This task is done
  - _Requirements: 1.1_

- [ ] 2. Second incomplete task
  - This task is not done
  - _Requirements: 1.2_

- [x] 3. Another completed task
  - _Requirements: 1.3_

- [-] 4. Task in progress
  - This task is in progress
  - _Requirements: 1.4_`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(taskContent);

      const result = await taskScanner.scanSingleSpec('test-spec');

      expect(result.success).toBe(true);
      expect(result.taskData).toEqual({
        totalTasks: 4,
        completedTasks: 2,
        completionRate: 0.5
      });
    });

    it('should handle nested task hierarchies correctly', async () => {
      const taskContent = `# Implementation Plan

- [x] 1. Parent task completed
  - Description
  - _Requirements: 1.1_

- [ ] 2. Parent task incomplete
  - Description
  - _Requirements: 1.2_

- [x] 2.1 Sub-task completed
  - Sub-task description
  - _Requirements: 2.1_

- [ ] 2.2 Sub-task incomplete
  - Sub-task description
  - _Requirements: 2.2_

- [-] 3. Another parent in progress
  - _Requirements: 3.1_`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(taskContent);

      const result = await taskScanner.scanSingleSpec('test-spec');

      expect(result.success).toBe(true);
      expect(result.taskData).toEqual({
        totalTasks: 5,
        completedTasks: 2,
        completionRate: 0.4
      });
    });

    it('should handle empty task file', async () => {
      const taskContent = `# Implementation Plan

This is just a header with no tasks.`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(taskContent);

      const result = await taskScanner.scanSingleSpec('test-spec');

      expect(result.success).toBe(true);
      expect(result.taskData).toEqual({
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0
      });
    });

    it('should handle malformed checkbox syntax gracefully', async () => {
      const taskContent = `# Implementation Plan

- [x] 1. Valid completed task
- [ ] 2. Valid incomplete task
- [invalid] 3. Invalid checkbox (should be ignored)
- 4. No checkbox at all
- [x] 5. Another valid completed task
-[x] 6. No space after dash (should still work)
  - [x] 7. Indented task (should still work)`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(taskContent);

      const result = await taskScanner.scanSingleSpec('test-spec');

      expect(result.success).toBe(true);
      expect(result.taskData).toEqual({
        totalTasks: 5, // Valid patterns: [x], [ ], [x], [x] (no space), [x] (indented)
        completedTasks: 4, // All [x] patterns
        completionRate: 0.8
      });
    });

    it('should handle missing task file', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const result = await taskScanner.scanSingleSpec('test-spec');

      expect(result.success).toBe(true);
      expect(result.taskData).toEqual({
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0
      });
    });

    it('should handle file read errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = await taskScanner.scanSingleSpec('test-spec');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('scanAllSpecs', () => {
    it('should scan multiple spec directories', async () => {
      const mockDirents = [
        { name: 'spec1', isDirectory: () => true },
        { name: 'spec2', isDirectory: () => true },
        { name: 'file.txt', isDirectory: () => false } // Should be ignored
      ];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockDirents as any);
      
      // Mock task files for each spec
      mockFs.readFileSync
        .mockReturnValueOnce('- [x] 1. Task 1\n- [ ] 2. Task 2') // spec1
        .mockReturnValueOnce('- [x] 1. Task A\n- [x] 2. Task B\n- [ ] 3. Task C'); // spec2

      const results = await taskScanner.scanAllSpecs();

      expect(results).toHaveLength(2);
      expect(results[0]).toEqual({
        specName: 'spec1',
        taskData: {
          totalTasks: 2,
          completedTasks: 1,
          completionRate: 0.5
        }
      });
      expect(results[1]).toEqual({
        specName: 'spec2',
        taskData: {
          totalTasks: 3,
          completedTasks: 2,
          completionRate: 2/3
        }
      });
    });

    it('should handle missing specs directory', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const results = await taskScanner.scanAllSpecs();

      expect(results).toEqual([]);
    });

    it('should handle specs directory read errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockImplementation(() => {
        throw new Error('Permission denied');
      });

      // Should not throw, but return empty array
      const results = await taskScanner.scanAllSpecs();

      expect(results).toEqual([]);
    });

    it('should skip specs with task file errors', async () => {
      const mockDirents = [
        { name: 'good-spec', isDirectory: () => true },
        { name: 'bad-spec', isDirectory: () => true }
      ];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockDirents as any);
      
      mockFs.readFileSync
        .mockReturnValueOnce('- [x] 1. Good task') // good-spec
        .mockImplementationOnce(() => { throw new Error('Read error'); }); // bad-spec

      const results = await taskScanner.scanAllSpecs();

      expect(results).toHaveLength(1);
      expect(results[0].specName).toBe('good-spec');
    });
  });

  describe('getGlobalTaskData', () => {
    it('should aggregate task data across all specs', async () => {
      const mockDirents = [
        { name: 'spec1', isDirectory: () => true },
        { name: 'spec2', isDirectory: () => true }
      ];

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockDirents as any);
      
      mockFs.readFileSync
        .mockReturnValueOnce('- [x] 1. Task 1\n- [ ] 2. Task 2\n- [x] 3. Task 3') // spec1: 2/3
        .mockReturnValueOnce('- [x] 1. Task A\n- [ ] 2. Task B'); // spec2: 1/2

      const globalData = await taskScanner.getGlobalTaskData();

      expect(globalData).toEqual({
        totalTasks: 5,
        completedTasks: 3,
        completionRate: 0.6
      });
    });

    it('should handle no specs', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const globalData = await taskScanner.getGlobalTaskData();

      expect(globalData).toEqual({
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0
      });
    });
  });

  describe('edge cases', () => {
    it('should handle various checkbox formats', async () => {
      const taskContent = `# Implementation Plan

- [x] Standard completed
- [ ] Standard incomplete  
- [-] In progress (treated as incomplete)
- [X] Uppercase X (should work)
- [ x] Space before x (should not match)
- [x ] Space after x (should not match)
-[x] No space after dash (should work)
  - [x] Indented task (should work)
    - [ ] Double indented (should work)`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(taskContent);

      const result = await taskScanner.scanSingleSpec('test-spec');

      expect(result.success).toBe(true);
      // Should match: [x], [ ], [-], [X], [x] (no space), [x] (indented), [ ] (double indented)
      expect(result.taskData?.totalTasks).toBe(7);
      expect(result.taskData?.completedTasks).toBe(4); // [x], [X], [x] (no space), [x] (indented)
    });

    it('should handle Windows line endings', async () => {
      const taskContent = `# Implementation Plan\r\n\r\n- [x] 1. Task with CRLF\r\n- [ ] 2. Another task\r\n`;

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(taskContent);

      const result = await taskScanner.scanSingleSpec('test-spec');

      expect(result.success).toBe(true);
      expect(result.taskData).toEqual({
        totalTasks: 2,
        completedTasks: 1,
        completionRate: 0.5
      });
    });
  });
});