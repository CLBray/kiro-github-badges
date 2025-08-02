/**
 * JSON Generator for Shields.io compatible badge data
 * Converts task completion data into Shields.io dynamic badge JSON format
 */

import { BadgeJSON, TaskData, SpecTaskData } from './types';

export class JSONGenerator {
  /**
   * Generate a global badge JSON that aggregates all specs
   * @param allSpecs Array of all spec task data
   * @returns BadgeJSON for global badge
   */
  generateGlobalBadge(allSpecs: SpecTaskData[]): BadgeJSON {
    // Calculate totals across all specs
    const totalTasks = allSpecs.reduce((sum, spec) => sum + spec.taskData.totalTasks, 0);
    const completedTasks = allSpecs.reduce((sum, spec) => sum + spec.taskData.completedTasks, 0);
    
    const message = `${completedTasks}/${totalTasks}`;
    const color = this.getColorForCompletion(completedTasks, totalTasks);
    
    return {
      schemaVersion: 1,
      label: 'All Kiro Tasks',
      message,
      color
    };
  }

  /**
   * Generate a badge JSON for a specific spec
   * @param specName Name of the spec
   * @param taskData Task completion data for the spec
   * @returns BadgeJSON for the spec badge
   */
  generateSpecBadge(specName: string, taskData: TaskData): BadgeJSON {
    const message = `${taskData.completedTasks}/${taskData.totalTasks}`;
    const color = this.getColorForCompletion(taskData.completedTasks, taskData.totalTasks);
    
    return {
      schemaVersion: 1,
      label: `${specName} Kiro Tasks`,
      message,
      color
    };
  }

  /**
   * Determine badge color based on completion rate
   * @param completed Number of completed tasks
   * @param total Total number of tasks
   * @returns Color string for Shields.io badge
   */
  private getColorForCompletion(completed: number, total: number): string {
    if (total === 0) {
      return 'red'; // No tasks = red
    }
    
    const completionRate = completed / total;
    
    if (completionRate === 1.0) {
      return 'brightgreen'; // 100% completion
    } else if (completionRate > 0) {
      return 'yellow'; // 1-99% completion
    } else {
      return 'red'; // 0% completion
    }
  }
}