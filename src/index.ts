/**
 * Main entry point for the Kiro Task Badge Generator GitHub Action
 */

import * as core from '@actions/core';
import { TaskScanner } from './task-scanner';
import { JSONGenerator } from './json-generator';
import { GitCommitter } from './git-committer';
import { BadgeFile, SpecTaskData, BadgeJSON } from './types';

async function run(): Promise<void> {
  let taskScanner: TaskScanner | null = null;
  let jsonGenerator: JSONGenerator | null = null;
  let gitCommitter: GitCommitter | null = null;

  try {
    core.info('🚀 Kiro Task Badge Generator starting...');
    core.debug(`Running in directory: ${process.cwd()}`);
    core.debug(`Node.js version: ${process.version}`);

    // Validate environment
    await validateEnvironment();

    // Parse GitHub Actions inputs
    const inputs = parseActionInputs();
    core.info(`📝 Using commit message: "${inputs.commitMessage}"`);

    // Set up authentication if token is provided
    if (inputs.token) {
      process.env['GITHUB_TOKEN'] = inputs.token;
      core.debug('✅ GitHub token configured');
    } else {
      core.warning('⚠️  No GitHub token provided - using default GITHUB_TOKEN from environment');
    }

    // Initialize components with error handling
    try {
      taskScanner = new TaskScanner();
      jsonGenerator = new JSONGenerator();
      gitCommitter = new GitCommitter(process.cwd(), inputs.commitMessage);
      core.debug('✅ All components initialized successfully');
    } catch (initError) {
      const errorMessage = initError instanceof Error ? initError.message : String(initError);
      throw new Error(`Failed to initialize components: ${errorMessage}`);
    }

    core.info('🔍 Scanning Kiro task files...');

    // Scan all specs for task data with comprehensive error handling
    let allSpecs: SpecTaskData[] = [];
    try {
      allSpecs = await taskScanner.scanAllSpecs();
      core.info(`📊 Found ${allSpecs.length} specs with task files`);

      if (allSpecs.length === 0) {
        core.warning('⚠️  No Kiro specs found with task files. This may be normal for new repositories.');
        core.info('💡 To create badges, add task files at .kiro/specs/{spec-name}/tasks.md');
      }

    } catch (scanError) {
      const errorMessage = scanError instanceof Error ? scanError.message : String(scanError);
      core.error(`❌ Critical error during task scanning: ${errorMessage}`);

      // For critical scanning errors, still try to generate empty badges
      core.warning('⚠️  Generating empty badges due to scanning failure');
      allSpecs = [];
    }

    // Log individual spec statistics with error handling
    for (const spec of allSpecs) {
      try {
        const { specName, taskData } = spec;
        const completionPercent = taskData.totalTasks > 0
          ? Math.round(taskData.completionRate * 100)
          : 0;
        core.info(`  📋 ${specName}: ${taskData.completedTasks}/${taskData.totalTasks} tasks (${completionPercent}%)`);
      } catch (logError) {
        core.warning(`⚠️  Error logging stats for spec: ${logError}`);
      }
    }

    // Generate badge JSON files with error handling
    core.info('🎨 Generating badge JSON files...');
    const badgeFiles: BadgeFile[] = [];

    try {
      // Generate global badge
      const globalBadge = jsonGenerator.generateGlobalBadge(allSpecs);
      const globalBadgePath = GitCommitter.getBadgeFilePath();

      // Validate generated badge
      validateBadgeJSON(globalBadge, 'global');

      badgeFiles.push({
        path: globalBadgePath,
        content: JSON.stringify(globalBadge, null, 2)
      });
      core.info(`  🌍 Global badge: ${globalBadge.message} (${globalBadge.color})`);

      // Generate individual spec badges
      const specBadgePaths: string[] = [];
      for (const spec of allSpecs) {
        try {
          const specBadge = jsonGenerator.generateSpecBadge(spec.specName, spec.taskData);
          const specBadgePath = GitCommitter.getBadgeFilePath(spec.specName);

          // Validate generated badge
          validateBadgeJSON(specBadge, spec.specName);

          badgeFiles.push({
            path: specBadgePath,
            content: JSON.stringify(specBadge, null, 2)
          });
          specBadgePaths.push(specBadgePath);
          core.info(`  📦 ${spec.specName} badge: ${specBadge.message} (${specBadge.color})`);

        } catch (specBadgeError) {
          const errorMessage = specBadgeError instanceof Error ? specBadgeError.message : String(specBadgeError);
          core.error(`❌ Failed to generate badge for spec ${spec.specName}: ${errorMessage}`);
          // Continue with other specs
        }
      }

      // Set action outputs early in case commit fails
      core.setOutput('global-badge-path', globalBadgePath);
      core.setOutput('spec-badge-paths', specBadgePaths.join(','));

    } catch (badgeError) {
      const errorMessage = badgeError instanceof Error ? badgeError.message : String(badgeError);
      throw new Error(`Badge generation failed: ${errorMessage}`);
    }

    // Commit badge files to repository with comprehensive error handling
    core.info('💾 Committing badge files to repository...');
    try {
      await gitCommitter.commitBadgeFiles(badgeFiles);
    } catch (commitError) {
      const errorMessage = commitError instanceof Error ? commitError.message : String(commitError);

      // Provide specific guidance for commit failures
      if (errorMessage.includes('authentication') || errorMessage.includes('permission')) {
        core.error('💡 Commit failed due to authentication/permission issues.');
        core.error('💡 Ensure your workflow has: permissions: { contents: write }');
        core.error('💡 And uses: token: ${{ secrets.GITHUB_TOKEN }} or a personal access token');
      }

      throw new Error(`Failed to commit badge files: ${errorMessage}`);
    }

    // Report completion status
    const totalTasks = allSpecs.reduce((sum, spec) => sum + spec.taskData.totalTasks, 0);
    const completedTasks = allSpecs.reduce((sum, spec) => sum + spec.taskData.completedTasks, 0);
    const overallCompletion = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    core.info(`✅ Kiro Task Badge Generator completed successfully!`);
    core.info(`📈 Overall progress: ${completedTasks}/${totalTasks} tasks (${overallCompletion}%)`);
    core.info(`📁 Generated ${badgeFiles.length} badge files`);

    // Log badge URLs for easy access
    if (badgeFiles.length > 0) {
      core.info('🔗 Badge files created:');
      for (const file of badgeFiles) {
        core.info(`  📄 ${file.path}`);
      }
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Enhanced error logging (Requirement 4.4)
    core.error(`❌ Action failed: ${errorMessage}`);

    // Log additional error details for debugging
    if (error instanceof Error && error.stack) {
      core.debug(`Error stack trace: ${error.stack}`);
    }

    // Log environment information for debugging
    core.debug(`Environment info: Node ${process.version}, Platform: ${process.platform}, Arch: ${process.arch}`);
    core.debug(`Working directory: ${process.cwd()}`);
    core.debug(`Environment variables: GITHUB_ACTIONS=${process.env['GITHUB_ACTIONS']}, GITHUB_WORKSPACE=${process.env['GITHUB_WORKSPACE']}`);

    // Provide actionable error guidance
    logActionableErrorGuidance(errorMessage);

    // Set failed status with clear message
    core.setFailed(`Kiro Task Badge Generator failed: ${errorMessage}`);
  }
}

/**
 * Validate the GitHub Actions environment
 */
async function validateEnvironment(): Promise<void> {
  try {
    core.debug('🔍 Validating GitHub Actions environment...');

    // Check if we're running in GitHub Actions
    if (!process.env['GITHUB_ACTIONS']) {
      core.warning('⚠️  Not running in GitHub Actions environment');
    }

    // Check for required environment variables
    const requiredEnvVars = ['GITHUB_WORKSPACE', 'GITHUB_REPOSITORY'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        core.warning(`⚠️  Missing environment variable: ${envVar}`);
      }
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const versionParts = nodeVersion.slice(1).split('.');
    if (versionParts.length > 0 && versionParts[0]) {
      const majorVersion = parseInt(versionParts[0]);
      if (majorVersion < 18) {
        core.warning(`⚠️  Node.js version ${nodeVersion} may not be fully supported. Recommended: Node.js 18+`);
      }
    }

    core.debug('✅ Environment validation completed');

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.warning(`⚠️  Environment validation warning: ${errorMessage}`);
    // Don't fail the action for environment validation issues
  }
}

/**
 * Parse and validate GitHub Actions inputs
 */
function parseActionInputs(): ActionInputs {
  try {
    core.debug('📝 Parsing GitHub Actions inputs...');

    const token = core.getInput('token');
    const commitMessage = core.getInput('commit-message') || 'Update Kiro task completion badges';

    // Validate commit message
    if (!commitMessage || !commitMessage.trim()) {
      throw new Error('Commit message cannot be empty');
    }

    const trimmedMessage = commitMessage.trim();

    // Validate commit message length (Git has practical limits)
    if (trimmedMessage.length > 500) {
      core.warning('⚠️  Commit message is very long and may be truncated by Git');
    }

    // Validate commit message doesn't contain problematic characters
    if (trimmedMessage.includes('\n') || trimmedMessage.includes('\r')) {
      throw new Error('Commit message cannot contain newline characters');
    }

    core.debug(`✅ Parsed inputs: token=${token ? 'provided' : 'not provided'}, message="${trimmedMessage}"`);

    return {
      token,
      commitMessage: trimmedMessage
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Input validation failed: ${errorMessage}`);
  }
}

/**
 * Validate a generated badge JSON object
 */
function validateBadgeJSON(badge: BadgeJSON, context: string): void {
  try {
    // Check required fields
    if (badge.schemaVersion !== 1) {
      throw new Error(`Invalid schemaVersion: expected 1, got ${badge.schemaVersion}`);
    }

    if (!badge.label || typeof badge.label !== 'string') {
      throw new Error(`Invalid label: expected non-empty string, got ${typeof badge.label}`);
    }

    if (!badge.message || typeof badge.message !== 'string') {
      throw new Error(`Invalid message: expected non-empty string, got ${typeof badge.message}`);
    }

    if (!badge.color || typeof badge.color !== 'string') {
      throw new Error(`Invalid color: expected non-empty string, got ${typeof badge.color}`);
    }

    // Validate message format (should be "X/Y")
    if (!/^\d+\/\d+$/.test(badge.message)) {
      throw new Error(`Invalid message format: expected "X/Y", got "${badge.message}"`);
    }

    // Validate color values
    const validColors = ['brightgreen', 'yellow', 'red'];
    if (!validColors.includes(badge.color)) {
      throw new Error(`Invalid color: expected one of ${validColors.join(', ')}, got "${badge.color}"`);
    }

    core.debug(`✅ Badge validation passed for ${context}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Badge validation failed for ${context}: ${errorMessage}`);
  }
}

/**
 * Log actionable error guidance based on error message
 */
function logActionableErrorGuidance(errorMessage: string): void {
  const lowerErrorMessage = errorMessage.toLowerCase();

  core.info('💡 Troubleshooting guidance:');

  if (lowerErrorMessage.includes('permission') || lowerErrorMessage.includes('authentication')) {
    core.info('  🔐 Authentication/Permission Issues:');
    core.info('    - Ensure your workflow has: permissions: { contents: write }');
    core.info('    - Use: token: ${{ secrets.GITHUB_TOKEN }} in your action configuration');
    core.info('    - For private repos, verify token has appropriate scope');
  }

  if (lowerErrorMessage.includes('not found') || lowerErrorMessage.includes('enoent')) {
    core.info('  📁 File/Directory Issues:');
    core.info('    - Ensure your workflow includes actions/checkout step');
    core.info('    - Verify .kiro/specs directory structure exists');
    core.info('    - Check that task files are named tasks.md');
  }

  if (lowerErrorMessage.includes('network') || lowerErrorMessage.includes('timeout')) {
    core.info('  🌐 Network Issues:');
    core.info('    - This may be a temporary network issue - try re-running the action');
    core.info('    - Check GitHub status page for any ongoing issues');
  }

  if (lowerErrorMessage.includes('space') || lowerErrorMessage.includes('enospc')) {
    core.info('  💾 Disk Space Issues:');
    core.info('    - The runner has run out of disk space');
    core.info('    - Consider cleaning up unnecessary files in your workflow');
    core.info('    - Use a different runner type if available');
  }

  if (lowerErrorMessage.includes('git') || lowerErrorMessage.includes('repository')) {
    core.info('  🔧 Git Repository Issues:');
    core.info('    - Ensure you are running in a valid git repository');
    core.info('    - Check that actions/checkout is properly configured');
    core.info('    - Verify git remotes are configured correctly');
  }

  // Always provide general guidance
  core.info('  📚 General Help:');
  core.info('    - Check the action logs above for more specific error details');
  core.info('    - Ensure your repository has the correct .kiro/specs structure');
  core.info('    - Verify your workflow YAML configuration matches the documentation');
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