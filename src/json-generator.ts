/**
 * JSON Generator for Shields.io compatible badge data
 * Converts task completion data into Shields.io dynamic badge JSON format
 */

import * as core from '@actions/core';
import { BadgeJSON, TaskData, SpecTaskData } from './types';

export class JSONGenerator {
  /**
   * Generate a global badge JSON that aggregates all specs
   * @param allSpecs Array of all spec task data
   * @returns BadgeJSON for global badge
   */
  generateGlobalBadge(allSpecs: SpecTaskData[]): BadgeJSON {
    try {
      core.debug(`🎨 Generating global badge from ${allSpecs.length} specs`);
      
      // Validate input
      if (!Array.isArray(allSpecs)) {
        throw new Error('allSpecs must be an array');
      }
      
      // Calculate totals across all specs with error handling
      let totalTasks = 0;
      let completedTasks = 0;
      
      for (const spec of allSpecs) {
        try {
          if (!spec || !spec.taskData) {
            core.warning(`⚠️  Invalid spec data found, skipping: ${JSON.stringify(spec)}`);
            continue;
          }
          
          const { taskData } = spec;
          
          // Validate task data
          if (typeof taskData.totalTasks !== 'number' || taskData.totalTasks < 0) {
            core.warning(`⚠️  Invalid totalTasks for spec ${spec.specName}: ${taskData.totalTasks}`);
            continue;
          }
          
          if (typeof taskData.completedTasks !== 'number' || taskData.completedTasks < 0) {
            core.warning(`⚠️  Invalid completedTasks for spec ${spec.specName}: ${taskData.completedTasks}`);
            continue;
          }
          
          if (taskData.completedTasks > taskData.totalTasks) {
            core.warning(`⚠️  Completed tasks exceed total tasks for spec ${spec.specName}: ${taskData.completedTasks}/${taskData.totalTasks}`);
            continue;
          }
          
          totalTasks += taskData.totalTasks;
          completedTasks += taskData.completedTasks;
          
        } catch (specError) {
          const errorMessage = specError instanceof Error ? specError.message : String(specError);
          core.warning(`⚠️  Error processing spec data: ${errorMessage}`);
          continue;
        }
      }
      
      const message = `${completedTasks}/${totalTasks}`;
      const color = this.getColorForCompletion(completedTasks, totalTasks);
      
      core.debug(`🎨 Global badge generated: ${message} (${color})`);
      
      return {
        schemaVersion: 1,
        label: 'All Kiro Tasks',
        message,
        color
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`❌ Failed to generate global badge: ${errorMessage}`);
      
      // Return a safe fallback badge
      return {
        schemaVersion: 1,
        label: 'All Kiro Tasks',
        message: '0/0',
        color: 'red'
      };
    }
  }

  /**
   * Generate a badge JSON for a specific spec
   * @param specName Name of the spec
   * @param taskData Task completion data for the spec
   * @returns BadgeJSON for the spec badge
   */
  generateSpecBadge(specName: string, taskData: TaskData): BadgeJSON {
    try {
      core.debug(`🎨 Generating badge for spec: ${specName}`);
      
      // Validate inputs
      if (!specName || typeof specName !== 'string') {
        throw new Error(`Invalid spec name: expected non-empty string, got ${typeof specName}`);
      }
      
      if (!taskData) {
        throw new Error('Task data is required');
      }
      
      // Validate task data
      if (typeof taskData.totalTasks !== 'number' || taskData.totalTasks < 0) {
        throw new Error(`Invalid totalTasks: expected non-negative number, got ${taskData.totalTasks}`);
      }
      
      if (typeof taskData.completedTasks !== 'number' || taskData.completedTasks < 0) {
        throw new Error(`Invalid completedTasks: expected non-negative number, got ${taskData.completedTasks}`);
      }
      
      if (taskData.completedTasks > taskData.totalTasks) {
        throw new Error(`Completed tasks (${taskData.completedTasks}) cannot exceed total tasks (${taskData.totalTasks})`);
      }
      
      // Sanitize spec name for label (remove potentially problematic characters)
      const sanitizedSpecName = specName.replace(/[^\w\s-]/g, '').trim();
      if (!sanitizedSpecName) {
        throw new Error(`Spec name becomes empty after sanitization: "${specName}"`);
      }
      
      const message = `${taskData.completedTasks}/${taskData.totalTasks}`;
      const color = this.getColorForCompletion(taskData.completedTasks, taskData.totalTasks);
      
      core.debug(`🎨 Spec badge generated for ${specName}: ${message} (${color})`);
      
      return {
        schemaVersion: 1,
        label: `${sanitizedSpecName} Kiro Tasks`,
        message,
        color
      };
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`❌ Failed to generate badge for spec ${specName}: ${errorMessage}`);
      
      // Return a safe fallback badge
      return {
        schemaVersion: 1,
        label: `${specName || 'Unknown'} Kiro Tasks`,
        message: '0/0',
        color: 'red'
      };
    }
  }

  /**
   * Determine badge color based on completion rate
   * @param completed Number of completed tasks
   * @param total Total number of tasks
   * @returns Color string for Shields.io badge
   */
  private getColorForCompletion(completed: number, total: number): string {
    try {
      // Validate inputs
      if (typeof completed !== 'number' || completed < 0) {
        core.warning(`⚠️  Invalid completed tasks count: ${completed}, defaulting to red`);
        return 'red';
      }
      
      if (typeof total !== 'number' || total < 0) {
        core.warning(`⚠️  Invalid total tasks count: ${total}, defaulting to red`);
        return 'red';
      }
      
      if (completed > total) {
        core.warning(`⚠️  Completed tasks (${completed}) exceed total tasks (${total}), defaulting to red`);
        return 'red';
      }
      
      // Handle edge case of no tasks
      if (total === 0) {
        core.debug('🎨 No tasks found, using red color');
        return 'red'; // No tasks = red
      }
      
      const completionRate = completed / total;
      
      // Validate completion rate
      if (isNaN(completionRate) || completionRate < 0 || completionRate > 1) {
        core.warning(`⚠️  Invalid completion rate calculated: ${completionRate}, defaulting to red`);
        return 'red';
      }
      
      if (completionRate === 1.0) {
        core.debug('🎨 100% completion, using brightgreen color');
        return 'brightgreen'; // 100% completion
      } else if (completionRate > 0) {
        core.debug(`🎨 ${Math.round(completionRate * 100)}% completion, using yellow color`);
        return 'yellow'; // 1-99% completion
      } else {
        core.debug('🎨 0% completion, using red color');
        return 'red'; // 0% completion
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.warning(`⚠️  Error calculating badge color: ${errorMessage}, defaulting to red`);
      return 'red';
    }
  }
}