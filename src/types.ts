/**
 * TypeScript type definitions for the Kiro Task Badge Generator
 */

export interface TaskData {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

export interface SpecTaskData {
  specName: string;
  taskData: TaskData;
}

export interface BadgeJSON {
  schemaVersion: 1;
  label: string;
  message: string;
  color: string;
}

export interface BadgeFile {
  path: string;
  content: string;
}

export interface TaskScanResult {
  success: boolean;
  taskData?: TaskData;
  error?: string;
}

export interface SpecScanResult {
  specName: string;
  success: boolean;
  taskData?: TaskData;
  error?: string;
}