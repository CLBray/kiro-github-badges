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
      core.info(`Starting to commit ${files.length} badge files`);
      
      // Configure git user credentials using GitHub Actions bot account
      this.configureGitUser();
      
      // Write all badge files to their respective paths
      await this.writeBadgeFiles(files);
      
      // Stage the files
      this.stageFiles(files);
      
      // Check if there are any changes to commit
      if (!this.hasChangesToCommit()) {
        core.info('No changes to commit - badge files are already up to date');
        return;
      }
      
      // Commit the changes
      this.commitChanges();
      
      // Push the changes
      this.pushChanges();
      
      core.info('Successfully committed and pushed badge files');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`Failed to commit badge files: ${errorMessage}`);
      throw new Error(`Git operations failed: ${errorMessage}`);
    }
  }

  /**
   * Write badge files to their respective paths
   * @param files Array of badge files to write
   */
  private async writeBadgeFiles(files: BadgeFile[]): Promise<void> {
    for (const file of files) {
      const fullPath = path.resolve(this.workspaceRoot, file.path);
      const directory = path.dirname(fullPath);
      
      // Ensure the directory exists
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
        core.debug(`Created directory: ${directory}`);
      }
      
      // Write the file
      fs.writeFileSync(fullPath, file.content, 'utf8');
      core.debug(`Wrote badge file: ${file.path}`);
    }
  }

  /**
   * Configure git user credentials using GitHub Actions bot account
   */
  private configureGitUser(): void {
    try {
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
      
      core.debug(`Configured git user: ${gitUserName} <${gitUserEmail}>`);
    } catch (error) {
      throw new Error(`Failed to configure git user: ${error}`);
    }
  }

  /**
   * Stage the badge files for commit
   * @param files Array of badge files to stage
   */
  private stageFiles(files: BadgeFile[]): void {
    try {
      for (const file of files) {
        execSync(`git add "${file.path}"`, { 
          cwd: this.workspaceRoot,
          stdio: 'pipe'
        });
        core.debug(`Staged file: ${file.path}`);
      }
    } catch (error) {
      throw new Error(`Failed to stage files: ${error}`);
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
  private commitChanges(): void {
    try {
      execSync(`git commit -m "${this.commitMessage}"`, { 
        cwd: this.workspaceRoot,
        stdio: 'pipe'
      });
      core.debug(`Committed changes with message: ${this.commitMessage}`);
    } catch (error) {
      throw new Error(`Failed to commit changes: ${error}`);
    }
  }

  /**
   * Push the committed changes to the remote repository
   */
  private pushChanges(): void {
    // Retry logic for push operations
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        execSync('git push', { 
          cwd: this.workspaceRoot,
          stdio: 'pipe',
          timeout: 30000 // 30 second timeout
        });
        core.debug('Successfully pushed changes to remote repository');
        return;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          throw new Error(`Failed to push changes after ${maxRetries} attempts: ${error}`);
        }
        core.warning(`Push attempt ${retryCount} failed, retrying...`);
        // Wait before retry (exponential backoff) - using synchronous sleep
        const sleepMs = Math.pow(2, retryCount) * 1000;
        execSync(`sleep ${sleepMs / 1000}`, { stdio: 'pipe' });
      }
    }
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