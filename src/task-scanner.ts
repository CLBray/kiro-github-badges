/**
 * TaskScanner - Scans and parses Kiro task files to extract completion data
 */

import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { TaskData, SpecTaskData, TaskScanResult } from './types';

export class TaskScanner {
  private readonly specsDirectory: string;

  constructor(specsDirectory: string = '.kiro/specs') {
    this.specsDirectory = specsDirectory;
    core.debug(`TaskScanner initialized with specs directory: ${this.specsDirectory}`);
  }

  /**
   * Scan all specs in the .kiro/specs directory
   */
  async scanAllSpecs(): Promise<SpecTaskData[]> {
    const results: SpecTaskData[] = [];
    
    try {
      core.debug(`🔍 Scanning specs directory: ${this.specsDirectory}`);
      
      // Handle missing .kiro/specs directory gracefully (Requirement 3.6)
      if (!fs.existsSync(this.specsDirectory)) {
        core.warning(`⚠️  Specs directory not found: ${this.specsDirectory}. This is normal for repositories without Kiro specs.`);
        core.info('📊 No specs found - returning empty results');
        return results;
      }

      let specDirs: string[] = [];
      try {
        specDirs = fs.readdirSync(this.specsDirectory, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name);
        
        core.debug(`📁 Found ${specDirs.length} potential spec directories: ${specDirs.join(', ')}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.error(`❌ Failed to read specs directory ${this.specsDirectory}: ${errorMessage}`);
        
        // Check for common permission issues - log but continue with empty results
        if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
          core.warning(`⚠️  Permission denied accessing specs directory. Returning empty results to allow action to continue.`);
          return results;
        }
        
        // For other critical errors, log but return empty results to be resilient
        core.warning(`⚠️  Unable to read specs directory: ${errorMessage}. Returning empty results.`);
        return results;
      }

      // Handle empty specs directory
      if (specDirs.length === 0) {
        core.info('📊 No spec directories found - this is normal for new repositories');
        return results;
      }

      // Scan each spec directory
      for (const specName of specDirs) {
        core.debug(`🔍 Scanning spec: ${specName}`);
        
        try {
          const scanResult = await this.scanSingleSpec(specName);
          
          if (scanResult.success && scanResult.taskData) {
            results.push({
              specName,
              taskData: scanResult.taskData
            });
            core.debug(`✅ Successfully scanned spec ${specName}: ${scanResult.taskData.completedTasks}/${scanResult.taskData.totalTasks} tasks`);
          } else if (!scanResult.success) {
            // Log error but continue processing other specs (Requirement 3.5)
            core.warning(`⚠️  Failed to scan spec ${specName}: ${scanResult.error || 'Unknown error'}`);
            core.info(`📊 Continuing with other specs...`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          core.warning(`⚠️  Unexpected error scanning spec ${specName}: ${errorMessage}`);
          core.info(`📊 Continuing with other specs...`);
        }
      }
      
      core.info(`📊 Successfully scanned ${results.length} out of ${specDirs.length} spec directories`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`❌ Critical error scanning specs directory: ${errorMessage}`);
      
      // For any critical errors, log but return empty results to be resilient
      core.warning(`⚠️  Returning empty results due to scanning error. Badge will show 0/0 tasks.`);
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
      core.debug(`🔍 Checking for tasks file: ${tasksFilePath}`);
      
      // Handle missing tasks.md file gracefully (Requirement 3.6)
      if (!fs.existsSync(tasksFilePath)) {
        core.debug(`📄 No tasks.md file found in spec ${specName} - returning 0/0 tasks`);
        return {
          success: true,
          taskData: {
            totalTasks: 0,
            completedTasks: 0,
            completionRate: 0
          }
        };
      }

      // Check if spec directory exists
      if (!fs.existsSync(specPath)) {
        core.warning(`⚠️  Spec directory does not exist: ${specPath}`);
        return {
          success: false,
          error: `Spec directory not found: ${specPath}`
        };
      }

      let content: string;
      try {
        content = fs.readFileSync(tasksFilePath, 'utf-8');
        core.debug(`📄 Successfully read tasks file for spec ${specName} (${content.length} characters)`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Handle specific file system errors (Requirement 3.5)
        if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
          const permissionError = `Permission denied reading tasks file: ${tasksFilePath}. Please ensure the GitHub Action has read permissions.`;
          core.error(`❌ ${permissionError}`);
          return {
            success: false,
            error: permissionError
          };
        }
        
        if (errorMessage.includes('ENOENT')) {
          // File disappeared between existence check and read
          core.warning(`⚠️  Tasks file disappeared during read: ${tasksFilePath}`);
          return {
            success: true,
            taskData: {
              totalTasks: 0,
              completedTasks: 0,
              completionRate: 0
            }
          };
        }
        
        core.error(`❌ Failed to read tasks file ${tasksFilePath}: ${errorMessage}`);
        return {
          success: false,
          error: `Failed to read tasks file: ${errorMessage}`
        };
      }

      // Handle empty or whitespace-only files
      if (!content || content.trim().length === 0) {
        core.debug(`📄 Tasks file is empty for spec ${specName} - returning 0/0 tasks`);
        return {
          success: true,
          taskData: {
            totalTasks: 0,
            completedTasks: 0,
            completionRate: 0
          }
        };
      }

      // Parse the task file content
      let taskData: TaskData;
      try {
        taskData = this.parseTaskFile(content, specName);
        core.debug(`📊 Parsed tasks for spec ${specName}: ${taskData.completedTasks}/${taskData.totalTasks} (${Math.round(taskData.completionRate * 100)}%)`);
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : String(parseError);
        core.warning(`⚠️  Failed to parse tasks file for spec ${specName}: ${errorMessage}`);
        
        // Return 0/0 for malformed files to allow action to continue (Requirement 3.5)
        return {
          success: true,
          taskData: {
            totalTasks: 0,
            completedTasks: 0,
            completionRate: 0
          }
        };
      }

      return {
        success: true,
        taskData
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`❌ Unexpected error scanning spec ${specName}: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Parse a task file content and extract completion statistics
   */
  private parseTaskFile(content: string, specName?: string): TaskData {
    const lines = content.split('\n');
    let totalTasks = 0;
    let completedTasks = 0;
    let malformedLines = 0;

    try {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (!line) continue;
        const trimmedLine = line.trim();
        
        // Skip empty lines and non-task lines
        if (!trimmedLine || !trimmedLine.startsWith('-')) {
          continue;
        }
        
        try {
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
            
            core.debug(`📋 Line ${i + 1}: Found task [${checkboxState}] - ${checkboxState === 'x' ? 'completed' : 'incomplete'}`);
          } else if (trimmedLine.startsWith('- ') && (trimmedLine.includes('[') || trimmedLine.includes(']'))) {
            // Potential malformed checkbox - log but don't count
            malformedLines++;
            core.debug(`⚠️  Line ${i + 1}: Potential malformed checkbox: "${trimmedLine}"`);
          }
        } catch (lineError) {
          // Handle errors in individual line processing
          malformedLines++;
          const errorMessage = lineError instanceof Error ? lineError.message : String(lineError);
          core.debug(`⚠️  Line ${i + 1}: Error processing line "${trimmedLine}": ${errorMessage}`);
        }
      }

      // Log parsing summary
      if (specName) {
        core.debug(`📊 Parsing summary for ${specName}: ${totalTasks} tasks found, ${completedTasks} completed`);
        if (malformedLines > 0) {
          core.warning(`⚠️  Found ${malformedLines} potentially malformed task lines in ${specName}`);
        }
      }

      const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

      return {
        totalTasks,
        completedTasks,
        completionRate
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`❌ Critical error parsing task file${specName ? ` for ${specName}` : ''}: ${errorMessage}`);
      
      // Throw error to be handled by caller
      throw new Error(`Task file parsing failed: ${errorMessage}`);
    }
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