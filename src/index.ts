/**
 * Main entry point for the Kiro Task Badge Generator GitHub Action
 */

import * as core from '@actions/core';
import { TaskScanner } from './task-scanner';
import { JSONGenerator } from './json-generator';
import { GitCommitter } from './git-committer';
import { BadgeFile } from './types';

async function run(): Promise<void> {
  try {
    core.info('🚀 Kiro Task Badge Generator starting...');
    
    // Parse GitHub Actions inputs
    const inputs = parseActionInputs();
    core.info(`📝 Using commit message: "${inputs.commitMessage}"`);
    
    // Set up authentication if token is provided
    if (inputs.token) {
      process.env['GITHUB_TOKEN'] = inputs.token;
      core.debug('✅ GitHub token configured');
    }
    
    // Initialize components
    const taskScanner = new TaskScanner();
    const jsonGenerator = new JSONGenerator();
    const gitCommitter = new GitCommitter(process.cwd(), inputs.commitMessage);
    
    core.info('🔍 Scanning Kiro task files...');
    
    // Scan all specs for task data
    const allSpecs = await taskScanner.scanAllSpecs();
    core.info(`📊 Found ${allSpecs.length} specs with task files`);
    
    // Log individual spec statistics
    for (const spec of allSpecs) {
      const { specName, taskData } = spec;
      const completionPercent = taskData.totalTasks > 0 
        ? Math.round(taskData.completionRate * 100) 
        : 0;
      core.info(`  📋 ${specName}: ${taskData.completedTasks}/${taskData.totalTasks} tasks (${completionPercent}%)`);
    }
    
    // Generate badge JSON files
    core.info('🎨 Generating badge JSON files...');
    const badgeFiles: BadgeFile[] = [];
    
    // Generate global badge
    const globalBadge = jsonGenerator.generateGlobalBadge(allSpecs);
    const globalBadgePath = GitCommitter.getBadgeFilePath();
    badgeFiles.push({
      path: globalBadgePath,
      content: JSON.stringify(globalBadge, null, 2)
    });
    core.info(`  🌍 Global badge: ${globalBadge.message} (${globalBadge.color})`);
    
    // Generate individual spec badges
    const specBadgePaths: string[] = [];
    for (const spec of allSpecs) {
      const specBadge = jsonGenerator.generateSpecBadge(spec.specName, spec.taskData);
      const specBadgePath = GitCommitter.getBadgeFilePath(spec.specName);
      badgeFiles.push({
        path: specBadgePath,
        content: JSON.stringify(specBadge, null, 2)
      });
      specBadgePaths.push(specBadgePath);
      core.info(`  📦 ${spec.specName} badge: ${specBadge.message} (${specBadge.color})`);
    }
    
    // Commit badge files to repository
    core.info('💾 Committing badge files to repository...');
    await gitCommitter.commitBadgeFiles(badgeFiles);
    
    // Set action outputs
    core.setOutput('global-badge-path', globalBadgePath);
    core.setOutput('spec-badge-paths', specBadgePaths.join(','));
    
    // Report completion status
    const totalTasks = allSpecs.reduce((sum, spec) => sum + spec.taskData.totalTasks, 0);
    const completedTasks = allSpecs.reduce((sum, spec) => sum + spec.taskData.completedTasks, 0);
    const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    core.info(`✅ Kiro Task Badge Generator completed successfully!`);
    core.info(`📈 Overall progress: ${completedTasks}/${totalTasks} tasks (${overallCompletion}%)`);
    core.info(`📁 Generated ${badgeFiles.length} badge files`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.error(`❌ Action failed: ${errorMessage}`);
    
    // Log additional error details for debugging
    if (error instanceof Error && error.stack) {
      core.debug(`Error stack trace: ${error.stack}`);
    }
    
    core.setFailed(`Action failed with error: ${errorMessage}`);
  }
}

/**
 * Parse and validate GitHub Actions inputs
 */
function parseActionInputs(): ActionInputs {
  const token = core.getInput('token');
  const commitMessage = core.getInput('commit-message') || 'Update Kiro task completion badges';
  
  // Validate inputs
  if (!commitMessage.trim()) {
    throw new Error('Commit message cannot be empty');
  }
  
  return {
    token,
    commitMessage: commitMessage.trim()
  };
}

/**
 * Interface for parsed action inputs
 */
interface ActionInputs {
  token: string;
  commitMessage: string;
}

// Handle uncaught exceptions and unhandled rejections
process.on('uncaughtException', (error) => {
  core.error(`Uncaught exception: ${error.message}`);
  core.setFailed(`Uncaught exception: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  const message = reason instanceof Error ? reason.message : String(reason);
  core.error(`Unhandled rejection: ${message}`);
  core.setFailed(`Unhandled rejection: ${message}`);
  process.exit(1);
});

run();