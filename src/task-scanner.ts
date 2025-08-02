/**
 * TaskScanner - Scans and parses Kiro task files to extract completion data
 */

import * as fs from 'fs';
import * as path from 'path';
import { TaskData, SpecTaskData, TaskScanResult } from './types';

export class TaskScanner {
  private readonly specsDirectory: string;

  constructor(specsDirectory: string = '.kiro/specs') {
    this.specsDirectory = specsDirectory;
  }

  /**
   * Scan all specs in the .kiro/specs directory
   */
  async scanAllSpecs(): Promise<SpecTaskData[]> {
    const results: SpecTaskData[] = [];
    
    try {
      if (!fs.existsSync(this.specsDirectory)) {
        return results;
      }

      const specDirs = fs.readdirSync(this.specsDirectory, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const specName of specDirs) {
        const scanResult = await this.scanSingleSpec(specName);
        if (scanResult.success && scanResult.taskData) {
          results.push({
            specName,
            taskData: scanResult.taskData
          });
        }
      }
    } catch (error) {
      // Log error but continue - we want to be resilient
      console.warn(`Error scanning specs directory: ${error instanceof Error ? error.message : String(error)}`);
    }

    return results;
  }

  /**
   * Scan a single spec directory for task completion data
   */
  async scanSingleSpec(specName: string): Promise<TaskScanResult> {
    const specPath = path.join(this.specsDirectory, specName);
    const tasksFilePath = path.join(specPath, 'tasks.md');

    try {
      if (!fs.existsSync(tasksFilePath)) {
        return {
          success: true,
          taskData: {
            totalTasks: 0,
            completedTasks: 0,
            completionRate: 0
          }
        };
      }

      const content = fs.readFileSync(tasksFilePath, 'utf-8');
      const taskData = this.parseTaskFile(content);

      return {
        success: true,
        taskData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Parse a task file content and extract completion statistics
   */
  private parseTaskFile(content: string): TaskData {
    const lines = content.split('\n');
    let totalTasks = 0;
    let completedTasks = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Match checkbox patterns: - [x], - [ ], - [-] (in progress)
      // Must have dash, optional whitespace, then [x], [ ], or [-]
      const checkboxMatch = trimmedLine.match(/^-\s*\[([ x-])\]/i);
      
      if (checkboxMatch) {
        totalTasks++;
        const checkboxState = checkboxMatch[1]?.toLowerCase();
        
        // Count [x] as completed, [ ] and [-] as incomplete
        if (checkboxState === 'x') {
          completedTasks++;
        }
      }
    }

    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate
    };
  }

  /**
   * Get aggregated task data across all specs
   */
  async getGlobalTaskData(): Promise<TaskData> {
    const allSpecs = await this.scanAllSpecs();
    
    let totalTasks = 0;
    let completedTasks = 0;

    for (const spec of allSpecs) {
      totalTasks += spec.taskData.totalTasks;
      completedTasks += spec.taskData.completedTasks;
    }

    const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate
    };
  }
}