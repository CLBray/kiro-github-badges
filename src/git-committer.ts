import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { BadgeFile } from './types';

/**
 * GitCommitter handles writing badge files and committing them to the repository
 */
export class GitCommitter {
  private readonly workspaceRoot: string;
  private readonly commitMessage: string;

  constructor(workspaceRoot: string = process.cwd(), commitMessage: string = 'Update Kiro task completion badges') {
    this.workspaceRoot = workspaceRoot;
    this.commitMessage = commitMessage;
  }

  /**
   * Commit badge files to the repository
   * @param files Array of badge files to commit
   */
  async commitBadgeFiles(files: BadgeFile[]): Promise<void> {
    try {
      core.info(`💾 Starting to commit ${files.length} badge files`);
      
      // Validate inputs
      if (!files || files.length === 0) {
        core.warning('⚠️  No badge files to commit');
        return;
      }

      // Perform core operations with error handling
      await this.performGitOperations(files);
      
      core.info('✅ Successfully committed and pushed badge files');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`❌ Git operations failed: ${errorMessage}`);
      
      // Provide specific guidance for common errors
      this.logErrorGuidance(errorMessage);
      
      throw new Error(`Git operations failed: ${errorMessage}`);
    }
  }

  /**
   * Perform the core git operations with error handling
   * @param files Array of badge files to commit
   */
  private async performGitOperations(files: BadgeFile[]): Promise<void> {
    // Configure git user credentials using GitHub Actions bot account
    await this.configureGitUser();
    
    // Write all badge files to their respective paths
    await this.writeBadgeFiles(files);
    
    // Stage the files
    await this.stageFiles(files);
    
    // Check if there are any changes to commit
    if (!this.hasChangesToCommit()) {
      core.info('✅ No changes to commit - badge files are already up to date');
      return;
    }
    
    // Commit the changes
    await this.commitChanges();
    
    // Push the changes with retry logic
    await this.pushChangesWithRetry();
  }

  /**
   * Write badge files to their respective paths
   * @param files Array of badge files to write
   */
  private async writeBadgeFiles(files: BadgeFile[]): Promise<void> {
    core.debug(`📝 Writing ${files.length} badge files...`);
    
    for (const file of files) {
      const fullPath = path.resolve(this.workspaceRoot, file.path);
      const directory = path.dirname(fullPath);
      
      // Ensure the directory exists
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
        core.debug(`📁 Created directory: ${directory}`);
      }
      
      // Write the file
      fs.writeFileSync(fullPath, file.content, 'utf8');
      core.debug(`✅ Successfully wrote badge file: ${file.path}`);
    }
    
    core.debug(`✅ Successfully wrote all ${files.length} badge files`);
  }

  /**
   * Configure git user credentials using GitHub Actions bot account
   */
  private async configureGitUser(): Promise<void> {
    try {
      core.debug('🔧 Configuring git user credentials...');
      
      // Use GitHub Actions bot credentials
      const gitUserName = 'github-actions[bot]';
      const gitUserEmail = '41898282+github-actions[bot]@users.noreply.github.com';
      
      execSync(`git config user.name "${gitUserName}"`, { 
        cwd: this.workspaceRoot,
        stdio: 'pipe'
      });
      
      execSync(`git config user.email "${gitUserEmail}"`, { 
        cwd: this.workspaceRoot,
        stdio: 'pipe'
      });
      
      core.debug(`✅ Configured git user: ${gitUserName} <${gitUserEmail}>`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`❌ Failed to configure git user: ${errorMessage}`);
      throw new Error(`Failed to configure git user: ${errorMessage}`);
    }
  }

  /**
   * Stage the badge files for commit
   * @param files Array of badge files to stage
   */
  private async stageFiles(files: BadgeFile[]): Promise<void> {
    try {
      core.debug(`📋 Staging ${files.length} badge files...`);
      
      for (const file of files) {
        execSync(`git add "${file.path}"`, { 
          cwd: this.workspaceRoot,
          stdio: 'pipe'
        });
        core.debug(`✅ Staged file: ${file.path}`);
      }
      
      core.debug(`✅ Successfully staged all ${files.length} badge files`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`❌ Failed to stage files: ${errorMessage}`);
      throw new Error(`Failed to stage files: ${errorMessage}`);
    }
  }

  /**
   * Check if there are any changes to commit
   * @returns true if there are changes to commit
   */
  private hasChangesToCommit(): boolean {
    try {
      execSync('git diff --cached --quiet', { 
        cwd: this.workspaceRoot,
        stdio: 'pipe'
      });
      return false; // No changes if command succeeds
    } catch (error) {
      return true; // Changes exist if command fails
    }
  }

  /**
   * Commit the staged changes
   */
  private async commitChanges(): Promise<void> {
    try {
      core.debug(`💾 Committing changes with message: "${this.commitMessage}"`);
      
      execSync(`git commit -m "${this.commitMessage}"`, { 
        cwd: this.workspaceRoot,
        stdio: 'pipe'
      });
      
      core.debug(`✅ Successfully committed changes`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Handle specific git commit errors
      if (errorMessage.includes('nothing to commit')) {
        core.info('✅ No changes to commit - files are already up to date');
        return;
      }
      
      core.error(`❌ Failed to commit changes: ${errorMessage}`);
      throw new Error(`Failed to commit changes: ${errorMessage}`);
    }
  }

  /**
   * Push the committed changes to the remote repository with retry logic
   */
  private async pushChangesWithRetry(): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        core.debug(`🚀 Pushing changes to remote repository (attempt ${attempt}/${maxRetries})`);
        
        // Simple push with basic error handling
        execSync('git push', { 
          cwd: this.workspaceRoot,
          stdio: 'pipe',
          timeout: 60000 // 60 second timeout for push
        });
        
        core.info(`🚀 Successfully pushed changes to remote repository`);
        return; // Success - exit retry loop
        
      } catch (pushError) {
        const errorMessage = pushError instanceof Error ? pushError.message : String(pushError);
        lastError = new Error(errorMessage);
        
        // Handle specific push errors
        if (errorMessage.includes('Permission denied') || errorMessage.includes('authentication failed')) {
          throw new Error('Git push authentication failed. Please ensure the GitHub token has write permissions to the repository.');
        }
        
        if (errorMessage.includes('repository not found')) {
          throw new Error('Repository not found. Please ensure the GitHub token has access to the correct repository.');
        }
        
        core.warning(`⚠️  Push attempt ${attempt} failed: ${errorMessage}`);
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          throw new Error(`Failed to push changes after ${maxRetries} attempts: ${errorMessage}`);
        }
        
        // Wait before retry with exponential backoff
        const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        core.warning(`⏳ Retrying push in ${delayMs}ms...`);
        await this.sleep(delayMs);
      }
    }
    
    // This should never be reached, but just in case
    throw lastError || new Error('Push failed for unknown reason');
  }





  /**
   * Log specific error guidance for common issues
   */
  private logErrorGuidance(errorMessage: string): void {
    const lowerErrorMessage = errorMessage.toLowerCase();
    
    if (lowerErrorMessage.includes('authentication') || lowerErrorMessage.includes('permission denied')) {
      core.error('💡 Troubleshooting: Ensure your GitHub token has write permissions to the repository.');
      core.error('💡 Check that the token is correctly set in your workflow with: token: ${{ secrets.GITHUB_TOKEN }}');
      core.error('💡 Verify the workflow has permissions: write for contents in the job permissions.');
    }
    
    if (lowerErrorMessage.includes('repository not found')) {
      core.error('💡 Troubleshooting: Verify the repository exists and the token has access to it.');
      core.error('💡 For private repositories, ensure the token has appropriate scope.');
    }
    
    if (lowerErrorMessage.includes('no space left')) {
      core.error('💡 Troubleshooting: The runner has run out of disk space. This is a system resource issue.');
      core.error('💡 Consider cleaning up unnecessary files or using a different runner.');
    }
    
    if (lowerErrorMessage.includes('not a git repository')) {
      core.error('💡 Troubleshooting: Ensure your workflow includes actions/checkout to set up the repository.');
      core.error('💡 The action must run in a properly initialized git repository.');
    }
  }

  /**
   * Sleep for the specified number of milliseconds
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate the correct file path for a badge file
   * @param specName The spec name (empty string for global badge)
   * @returns The file path for the badge
   */
  static getBadgeFilePath(specName: string = ''): string {
    if (specName === '') {
      return '.kiro/badge-data-all.json';
    }
    return `.kiro/${specName}-badge-data.json`;
  }
}