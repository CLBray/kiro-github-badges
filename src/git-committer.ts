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
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        core.info(`💾 Starting to commit ${files.length} badge files (attempt ${attempt}/${maxRetries})`);
        
        // Validate inputs
        if (!files || files.length === 0) {
          core.warning('⚠️  No badge files to commit');
          return;
        }

        // Validate workspace
        await this.validateWorkspace();
        
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
        
        // Push the changes
        await this.pushChanges();
        
        core.info('✅ Successfully committed and pushed badge files');
        return; // Success - exit retry loop
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const errorMessage = lastError.message;
        
        core.error(`❌ Attempt ${attempt}/${maxRetries} failed: ${errorMessage}`);
        
        // Check if this is a retryable error
        const isRetryable = this.isRetryableError(errorMessage);
        
        if (!isRetryable || attempt === maxRetries) {
          // Don't retry for non-retryable errors or on final attempt
          core.error(`💥 Git operations failed after ${attempt} attempt(s): ${errorMessage}`);
          
          // Provide specific guidance for common errors
          this.logErrorGuidance(errorMessage);
          
          throw new Error(`Git operations failed: ${errorMessage}`);
        }
        
        // Wait before retry with exponential backoff
        const delayMs = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s
        core.warning(`⏳ Retrying in ${delayMs}ms...`);
        await this.sleep(delayMs);
      }
    }
  }

  /**
   * Write badge files to their respective paths
   * @param files Array of badge files to write
   */
  private async writeBadgeFiles(files: BadgeFile[]): Promise<void> {
    core.debug(`📝 Writing ${files.length} badge files...`);
    
    for (const file of files) {
      try {
        const fullPath = path.resolve(this.workspaceRoot, file.path);
        const directory = path.dirname(fullPath);
        
        core.debug(`📝 Writing badge file: ${file.path}`);
        
        // Validate file path to prevent directory traversal
        if (!fullPath.startsWith(this.workspaceRoot)) {
          throw new Error(`Invalid file path (outside workspace): ${file.path}`);
        }
        
        // Ensure the directory exists
        try {
          if (!fs.existsSync(directory)) {
            fs.mkdirSync(directory, { recursive: true });
            core.debug(`📁 Created directory: ${directory}`);
          }
        } catch (dirError) {
          const errorMessage = dirError instanceof Error ? dirError.message : String(dirError);
          
          if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
            throw new Error(`Permission denied creating directory ${directory}. Please ensure the GitHub Action has write permissions.`);
          }
          
          throw new Error(`Failed to create directory ${directory}: ${errorMessage}`);
        }
        
        // Validate file content
        if (typeof file.content !== 'string') {
          throw new Error(`Invalid file content for ${file.path}: content must be a string`);
        }
        
        // Write the file with error handling
        try {
          fs.writeFileSync(fullPath, file.content, 'utf8');
          core.debug(`✅ Successfully wrote badge file: ${file.path} (${file.content.length} bytes)`);
        } catch (writeError) {
          const errorMessage = writeError instanceof Error ? writeError.message : String(writeError);
          
          if (errorMessage.includes('EACCES') || errorMessage.includes('permission denied')) {
            throw new Error(`Permission denied writing file ${file.path}. Please ensure the GitHub Action has write permissions.`);
          }
          
          if (errorMessage.includes('ENOSPC') || errorMessage.includes('no space left')) {
            throw new Error(`No space left on device when writing ${file.path}. This is a system resource issue.`);
          }
          
          throw new Error(`Failed to write file ${file.path}: ${errorMessage}`);
        }
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.error(`❌ Failed to write badge file ${file.path}: ${errorMessage}`);
        throw error; // Re-throw to be handled by caller
      }
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
      
      // Configure git user name
      try {
        execSync(`git config user.name "${gitUserName}"`, { 
          cwd: this.workspaceRoot,
          stdio: 'pipe',
          timeout: 10000 // 10 second timeout
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to configure git user.name: ${errorMessage}`);
      }
      
      // Configure git user email
      try {
        execSync(`git config user.email "${gitUserEmail}"`, { 
          cwd: this.workspaceRoot,
          stdio: 'pipe',
          timeout: 10000 // 10 second timeout
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to configure git user.email: ${errorMessage}`);
      }
      
      core.debug(`✅ Configured git user: ${gitUserName} <${gitUserEmail}>`);
      
      // Verify git configuration
      try {
        const userName = execSync('git config user.name', { 
          cwd: this.workspaceRoot,
          stdio: 'pipe',
          encoding: 'utf8',
          timeout: 5000
        }).trim();
        
        const userEmail = execSync('git config user.email', { 
          cwd: this.workspaceRoot,
          stdio: 'pipe',
          encoding: 'utf8',
          timeout: 5000
        }).trim();
        
        if (userName !== gitUserName || userEmail !== gitUserEmail) {
          throw new Error(`Git configuration verification failed. Expected: ${gitUserName} <${gitUserEmail}>, Got: ${userName} <${userEmail}>`);
        }
        
        core.debug('✅ Git user configuration verified');
        
      } catch (verifyError) {
        const errorMessage = verifyError instanceof Error ? verifyError.message : String(verifyError);
        core.warning(`⚠️  Could not verify git configuration: ${errorMessage}`);
        // Don't fail here - the configuration commands succeeded
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`❌ Failed to configure git user: ${errorMessage}`);
      throw new Error(`Git user configuration failed: ${errorMessage}`);
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
        try {
          // Verify file exists before staging
          const fullPath = path.resolve(this.workspaceRoot, file.path);
          if (!fs.existsSync(fullPath)) {
            throw new Error(`File does not exist: ${file.path}`);
          }
          
          execSync(`git add "${file.path}"`, { 
            cwd: this.workspaceRoot,
            stdio: 'pipe',
            timeout: 10000 // 10 second timeout per file
          });
          
          core.debug(`✅ Staged file: ${file.path}`);
          
        } catch (fileError) {
          const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
          core.error(`❌ Failed to stage file ${file.path}: ${errorMessage}`);
          throw new Error(`Failed to stage file ${file.path}: ${errorMessage}`);
        }
      }
      
      // Verify staging was successful
      try {
        const stagedFiles = execSync('git diff --cached --name-only', { 
          cwd: this.workspaceRoot,
          stdio: 'pipe',
          encoding: 'utf8',
          timeout: 5000
        }).trim().split('\n').filter(f => f.length > 0);
        
        core.debug(`📋 Staged files: ${stagedFiles.join(', ')}`);
        
        // Check that all our files were staged
        const expectedFiles = files.map(f => f.path);
        const missingStagedFiles = expectedFiles.filter(f => !stagedFiles.includes(f));
        
        if (missingStagedFiles.length > 0) {
          core.warning(`⚠️  Some files may not have been staged properly: ${missingStagedFiles.join(', ')}`);
        }
        
      } catch (verifyError) {
        core.warning(`⚠️  Could not verify staged files: ${verifyError}`);
        // Don't fail here - the staging commands succeeded
      }
      
      core.debug(`✅ Successfully staged all ${files.length} badge files`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`❌ Failed to stage files: ${errorMessage}`);
      throw new Error(`Git staging failed: ${errorMessage}`);
    }
  }

  /**
   * Check if there are any changes to commit
   * @returns true if there are changes to commit
   */
  private hasChangesToCommit(): boolean {
    try {
      core.debug('🔍 Checking for staged changes...');
      
      execSync('git diff --cached --quiet', { 
        cwd: this.workspaceRoot,
        stdio: 'pipe',
        timeout: 10000 // 10 second timeout
      });
      
      core.debug('📋 No staged changes detected');
      return false; // No changes if command succeeds
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // If the command fails due to changes existing, that's expected
      if (errorMessage.includes('timeout')) {
        core.warning('⚠️  Timeout checking for changes - assuming changes exist');
      } else {
        core.debug('📋 Staged changes detected');
      }
      
      return true; // Changes exist if command fails
    }
  }

  /**
   * Commit the staged changes
   */
  private async commitChanges(): Promise<void> {
    try {
      core.debug(`💾 Committing changes with message: "${this.commitMessage}"`);
      
      // Validate commit message
      if (!this.commitMessage || this.commitMessage.trim().length === 0) {
        throw new Error('Commit message cannot be empty');
      }
      
      // Escape commit message to prevent injection
      const escapedMessage = this.commitMessage.replace(/"/g, '\\"');
      
      try {
        const result = execSync(`git commit -m "${escapedMessage}"`, { 
          cwd: this.workspaceRoot,
          stdio: 'pipe',
          encoding: 'utf8',
          timeout: 30000 // 30 second timeout
        });
        
        core.debug(`✅ Successfully committed changes: ${result.trim()}`);
        
        // Get commit hash for logging
        try {
          const commitHash = execSync('git rev-parse HEAD', { 
            cwd: this.workspaceRoot,
            stdio: 'pipe',
            encoding: 'utf8',
            timeout: 5000
          }).trim();
          
          core.info(`📝 Created commit: ${commitHash.substring(0, 8)}`);
          
        } catch (hashError) {
          core.debug(`Could not get commit hash: ${hashError}`);
        }
        
      } catch (commitError) {
        const errorMessage = commitError instanceof Error ? commitError.message : String(commitError);
        
        // Handle specific git commit errors
        if (errorMessage.includes('nothing to commit')) {
          core.info('✅ No changes to commit - files are already up to date');
          return;
        }
        
        if (errorMessage.includes('Please tell me who you are')) {
          throw new Error('Git user configuration is missing. This should have been configured automatically.');
        }
        
        if (errorMessage.includes('pathspec') && errorMessage.includes('did not match any files')) {
          throw new Error('No files were staged for commit. This indicates a staging issue.');
        }
        
        throw new Error(`Git commit failed: ${errorMessage}`);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`❌ Failed to commit changes: ${errorMessage}`);
      throw error; // Re-throw to be handled by caller
    }
  }

  /**
   * Push the committed changes to the remote repository
   */
  private async pushChanges(): Promise<void> {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        core.debug(`🚀 Pushing changes to remote repository (attempt ${attempt}/${maxRetries})`);
        
        // Check if we have a remote configured
        try {
          const remotes = execSync('git remote -v', { 
            cwd: this.workspaceRoot,
            stdio: 'pipe',
            encoding: 'utf8',
            timeout: 5000
          }).trim();
          
          if (!remotes) {
            throw new Error('No git remotes configured. Cannot push changes.');
          }
          
          core.debug(`📡 Available remotes: ${remotes.split('\n').join(', ')}`);
          
        } catch (remoteError) {
          throw new Error(`Failed to check git remotes: ${remoteError}`);
        }
        
        // Attempt to push
        try {
          const result = execSync('git push', { 
            cwd: this.workspaceRoot,
            stdio: 'pipe',
            encoding: 'utf8',
            timeout: 60000 // 60 second timeout for push
          });
          
          core.info(`🚀 Successfully pushed changes to remote repository`);
          core.debug(`Push result: ${result.trim()}`);
          return; // Success - exit retry loop
          
        } catch (pushError) {
          const errorMessage = pushError instanceof Error ? pushError.message : String(pushError);
          lastError = new Error(errorMessage);
          
          // Handle specific push errors
          if (errorMessage.includes('Permission denied') || errorMessage.includes('authentication failed')) {
            throw new Error('Git push authentication failed. Please ensure the GitHub token has write permissions to the repository.');
          }
          
          if (errorMessage.includes('non-fast-forward')) {
            core.warning(`⚠️  Non-fast-forward push detected on attempt ${attempt}. This may be due to concurrent updates.`);
            
            if (attempt < maxRetries) {
              // Try to pull and rebase before retrying
              try {
                core.debug('🔄 Attempting to pull and rebase...');
                execSync('git pull --rebase', { 
                  cwd: this.workspaceRoot,
                  stdio: 'pipe',
                  timeout: 30000
                });
                core.debug('✅ Successfully rebased');
              } catch (rebaseError) {
                core.warning(`⚠️  Rebase failed: ${rebaseError}`);
                // Continue to retry without rebase
              }
            }
          }
          
          if (errorMessage.includes('repository not found') || errorMessage.includes('does not exist')) {
            throw new Error('Repository not found. Please ensure the GitHub token has access to the correct repository.');
          }
          
          // For network-related errors, continue to retry
          if (errorMessage.includes('timeout') || errorMessage.includes('network') || errorMessage.includes('connection')) {
            core.warning(`⚠️  Network error on push attempt ${attempt}: ${errorMessage}`);
          } else {
            core.warning(`⚠️  Push attempt ${attempt} failed: ${errorMessage}`);
          }
          
          // If this is the last attempt, throw the error
          if (attempt === maxRetries) {
            throw lastError;
          }
        }
        
        // Wait before retry with exponential backoff
        const delayMs = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        core.warning(`⏳ Retrying push in ${delayMs}ms...`);
        await this.sleep(delayMs);
        
      } catch (error) {
        // If it's a non-retryable error, throw immediately
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes('authentication failed') || 
            errorMessage.includes('Permission denied') ||
            errorMessage.includes('repository not found') ||
            errorMessage.includes('No git remotes configured')) {
          throw error;
        }
        
        lastError = error instanceof Error ? error : new Error(errorMessage);
        
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }
    
    // This should never be reached, but just in case
    throw lastError || new Error('Push failed for unknown reason');
  }

  /**
   * Validate the workspace environment
   */
  private async validateWorkspace(): Promise<void> {
    try {
      core.debug('🔍 Validating workspace environment...');
      
      // Check if we're in a git repository
      try {
        execSync('git rev-parse --git-dir', { 
          cwd: this.workspaceRoot,
          stdio: 'pipe',
          timeout: 5000
        });
      } catch (error) {
        throw new Error('Not in a git repository. Please ensure this action runs in a repository with git initialized.');
      }
      
      // Check workspace permissions
      try {
        fs.accessSync(this.workspaceRoot, fs.constants.R_OK | fs.constants.W_OK);
      } catch (error) {
        throw new Error(`Insufficient permissions for workspace directory: ${this.workspaceRoot}`);
      }
      
      // Check if .kiro directory exists or can be created
      const kiroDir = path.join(this.workspaceRoot, '.kiro');
      try {
        if (!fs.existsSync(kiroDir)) {
          fs.mkdirSync(kiroDir, { recursive: true });
          core.debug('📁 Created .kiro directory');
        }
        fs.accessSync(kiroDir, fs.constants.R_OK | fs.constants.W_OK);
      } catch (error) {
        throw new Error(`Cannot access or create .kiro directory: ${error}`);
      }
      
      core.debug('✅ Workspace validation passed');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      core.error(`❌ Workspace validation failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(errorMessage: string): boolean {
    const retryablePatterns = [
      'timeout',
      'network',
      'connection',
      'temporary failure',
      'try again',
      'non-fast-forward',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND'
    ];
    
    const nonRetryablePatterns = [
      'authentication failed',
      'permission denied',
      'repository not found',
      'invalid',
      'malformed',
      'not a git repository',
      'no space left'
    ];
    
    const lowerErrorMessage = errorMessage.toLowerCase();
    
    // Check for non-retryable errors first
    for (const pattern of nonRetryablePatterns) {
      if (lowerErrorMessage.includes(pattern)) {
        return false;
      }
    }
    
    // Check for retryable errors
    for (const pattern of retryablePatterns) {
      if (lowerErrorMessage.includes(pattern)) {
        return true;
      }
    }
    
    // Default to non-retryable for unknown errors
    return false;
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