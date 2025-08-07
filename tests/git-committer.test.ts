import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import * as core from '@actions/core';
import { GitCommitter } from '../src/git-committer';
import { BadgeFile } from '../src/types';

// Mock dependencies
vi.mock('fs');
vi.mock('child_process');
vi.mock('@actions/core');

const mockFs = vi.mocked(fs);
const mockExecSync = vi.mocked(execSync);
const mockCore = vi.mocked(core);

describe('GitCommitter', () => {
    let gitCommitter: GitCommitter;
    const mockWorkspaceRoot = '/mock/workspace';
    const mockCommitMessage = 'Test commit message';

    beforeEach(() => {
        vi.clearAllMocks();
        gitCommitter = new GitCommitter(mockWorkspaceRoot, mockCommitMessage);

        // Setup default mocks
        mockFs.existsSync.mockReturnValue(true);
        mockFs.mkdirSync.mockReturnValue(undefined);
        mockFs.writeFileSync.mockReturnValue(undefined);
        mockExecSync.mockReturnValue(Buffer.from(''));
        
        // Mock the sleep method to avoid actual delays in tests
        vi.spyOn(gitCommitter as any, 'sleep').mockResolvedValue(undefined);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('commitBadgeFiles', () => {
        const mockBadgeFiles: BadgeFile[] = [
            {
                path: '.kiro/badges/badge-data-all.json',
                content: '{"schemaVersion":1,"label":"All Kiro Tasks","message":"5/10","color":"yellow"}'
            },
            {
                path: '.kiro/badges/test-spec-badge-data.json',
                content: '{"schemaVersion":1,"label":"test-spec Kiro Tasks","message":"3/5","color":"yellow"}'
            }
        ];

        it('should successfully commit badge files', async () => {
            // Mock git operations in the simplified sequence
            mockExecSync
                .mockReturnValueOnce(Buffer.from('')) // git config user.name
                .mockReturnValueOnce(Buffer.from('')) // git config user.email
                .mockReturnValueOnce(Buffer.from('')) // git add first file
                .mockReturnValueOnce(Buffer.from('')) // git add second file
                .mockImplementationOnce(() => {
                    throw new Error('Changes exist'); // git diff --cached --quiet fails when changes exist
                })
                .mockReturnValueOnce(Buffer.from('')) // git commit
                .mockReturnValueOnce(Buffer.from('')); // git push

            await gitCommitter.commitBadgeFiles(mockBadgeFiles);

            // Verify files were written
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                path.resolve(mockWorkspaceRoot, '.kiro/badges/badge-data-all.json'),
                mockBadgeFiles[0].content,
                'utf8'
            );
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                path.resolve(mockWorkspaceRoot, '.kiro/badges/test-spec-badge-data.json'),
                mockBadgeFiles[1].content,
                'utf8'
            );

            // Verify that essential git operations were called
            expect(mockExecSync).toHaveBeenCalledWith(
                expect.stringContaining('git config user.name'),
                expect.any(Object)
            );
            expect(mockExecSync).toHaveBeenCalledWith(
                expect.stringContaining('git config user.email'),
                expect.any(Object)
            );
            expect(mockExecSync).toHaveBeenCalledWith(
                expect.stringContaining('git push'),
                expect.any(Object)
            );

            expect(mockCore.info).toHaveBeenCalledWith(expect.stringContaining('Starting to commit'));
            expect(mockCore.info).toHaveBeenCalledWith('✅ Successfully committed and pushed badge files');
        });

        it('should create directories if they do not exist', async () => {
            // Mock directories don't exist initially
            mockFs.existsSync
                .mockReturnValueOnce(false) // directory for first file doesn't exist
                .mockReturnValueOnce(false); // directory for second file doesn't exist

            // Mock git operations in the simplified sequence
            mockExecSync
                .mockReturnValueOnce(Buffer.from('')) // git config user.name
                .mockReturnValueOnce(Buffer.from('')) // git config user.email
                .mockReturnValueOnce(Buffer.from('')) // git add first file
                .mockReturnValueOnce(Buffer.from('')) // git add second file
                .mockImplementationOnce(() => {
                    throw new Error('Changes exist'); // git diff --cached --quiet fails when changes exist
                })
                .mockReturnValueOnce(Buffer.from('')) // git commit
                .mockReturnValueOnce(Buffer.from('')); // git push

            await gitCommitter.commitBadgeFiles(mockBadgeFiles);

            expect(mockFs.mkdirSync).toHaveBeenCalledWith(
                path.dirname(path.resolve(mockWorkspaceRoot, '.kiro/badges/badge-data-all.json')),
                { recursive: true }
            );
            expect(mockFs.mkdirSync).toHaveBeenCalledWith(
                path.dirname(path.resolve(mockWorkspaceRoot, '.kiro/badges/test-spec-badge-data.json')),
                { recursive: true }
            );
        });

        it('should skip commit if no changes exist', async () => {
            // Mock git diff to indicate no changes
            mockExecSync.mockReturnValue(Buffer.from(''));

            await gitCommitter.commitBadgeFiles(mockBadgeFiles);

            // Verify files were still written
            expect(mockFs.writeFileSync).toHaveBeenCalledTimes(2);

            // Verify git add was called
            expect(mockExecSync).toHaveBeenCalledWith(
                'git add ".kiro/badges/badge-data-all.json"',
                expect.any(Object)
            );

            // Verify commit and push were NOT called
            expect(mockExecSync).not.toHaveBeenCalledWith(
                expect.stringContaining('git commit'),
                expect.any(Object)
            );
            expect(mockExecSync).not.toHaveBeenCalledWith(
                'git push',
                expect.any(Object)
            );

            expect(mockCore.info).toHaveBeenCalledWith('✅ No changes to commit - badge files are already up to date');
        });

        it('should handle git user configuration errors', async () => {
            // First call succeeds (git rev-parse for workspace validation)
            // Second call fails (git config user.name)
            mockExecSync
                .mockReturnValueOnce(Buffer.from('')) // git rev-parse --git-dir (workspace validation)
                .mockImplementationOnce(() => {
                    throw new Error('Git config failed');
                });

            await expect(gitCommitter.commitBadgeFiles(mockBadgeFiles)).rejects.toThrow(
                'Git operations failed: Failed to configure git user: Git config failed'
            );

            expect(mockCore.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to configure git user')
            );
        });

        it('should handle file writing errors', async () => {
            mockFs.writeFileSync.mockImplementationOnce(() => {
                throw new Error('File write failed');
            });

            await expect(gitCommitter.commitBadgeFiles(mockBadgeFiles)).rejects.toThrow(
                'Git operations failed'
            );
        });

        it('should handle git add errors', async () => {
            // Mock git operations to fail at git add step
            mockExecSync.mockImplementation((command) => {
                if (command.toString().includes('git add')) {
                    throw new Error('Git add failed');
                }
                return Buffer.from(''); // Default success for other operations
            });

            await expect(gitCommitter.commitBadgeFiles(mockBadgeFiles)).rejects.toThrow(
                'Git operations failed: Failed to stage files: Git add failed'
            );
        });

        it('should handle git commit errors', async () => {
            // Mock git operations to fail at commit step
            mockExecSync.mockImplementation((command) => {
                if (command.toString().includes('git commit')) {
                    throw new Error('Git commit failed');
                }
                if (command.toString().includes('git diff --cached --quiet')) {
                    throw new Error('Changes exist'); // Indicates changes exist
                }
                return Buffer.from(''); // Default success for other operations
            });

            await expect(gitCommitter.commitBadgeFiles(mockBadgeFiles)).rejects.toThrow(
                'Git operations failed: Failed to commit changes: Git commit failed'
            );
        });

        it('should retry push operations on failure', async () => {
            let pushAttempts = 0;
            mockExecSync.mockImplementation((command) => {
                const cmdStr = command.toString();
                if (cmdStr.includes('git push')) {
                    pushAttempts++;
                    if (pushAttempts <= 2) {
                        throw new Error('Push failed');
                    }
                    return Buffer.from(''); // Third attempt succeeds
                }
                if (cmdStr.includes('git diff --cached --quiet')) {
                    throw new Error('Changes exist'); // Indicates changes exist
                }
                return Buffer.from(''); // Default success for other operations
            });

            await gitCommitter.commitBadgeFiles(mockBadgeFiles);

            expect(mockCore.warning).toHaveBeenCalledWith(expect.stringContaining('Push attempt 1 failed'));
            expect(mockCore.warning).toHaveBeenCalledWith(expect.stringContaining('Push attempt 2 failed'));
        });

        it('should fail after maximum push retries', async () => {
            mockExecSync.mockImplementation((command) => {
                const cmdStr = command.toString();
                if (cmdStr.includes('git push')) {
                    throw new Error('Push failed'); // All push attempts fail
                }
                if (cmdStr.includes('git diff --cached --quiet')) {
                    throw new Error('Changes exist'); // Indicates changes exist
                }
                return Buffer.from(''); // Default success for other operations
            });

            await expect(gitCommitter.commitBadgeFiles(mockBadgeFiles)).rejects.toThrow(
                'Git operations failed: Failed to push changes after 3 attempts: Push failed'
            );
        });
    });

    describe('getBadgeFilePath', () => {
        it('should return global badge path for empty spec name', () => {
            const path = GitCommitter.getBadgeFilePath('');
            expect(path).toBe('.kiro/badges/badge-data-all.json');
        });

        it('should return global badge path for no spec name', () => {
            const path = GitCommitter.getBadgeFilePath();
            expect(path).toBe('.kiro/badges/badge-data-all.json');
        });

        it('should return spec-specific badge path for spec name', () => {
            const path = GitCommitter.getBadgeFilePath('test-spec');
            expect(path).toBe('.kiro/badges/test-spec-badge-data.json');
        });

        it('should handle spec names with special characters', () => {
            const path = GitCommitter.getBadgeFilePath('my-awesome-spec-v2');
            expect(path).toBe('.kiro/badges/my-awesome-spec-v2-badge-data.json');
        });
    });

    describe('constructor', () => {
        it('should use default values when not provided', () => {
            const defaultCommitter = new GitCommitter();
            expect(defaultCommitter).toBeInstanceOf(GitCommitter);
        });

        it('should use provided values', () => {
            const customCommitter = new GitCommitter('/custom/path', 'Custom message');
            expect(customCommitter).toBeInstanceOf(GitCommitter);
        });
    });
});