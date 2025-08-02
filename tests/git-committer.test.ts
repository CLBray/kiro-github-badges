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
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('commitBadgeFiles', () => {
        const mockBadgeFiles: BadgeFile[] = [
            {
                path: '.kiro/badge-data-all.json',
                content: '{"schemaVersion":1,"label":"All Kiro Tasks","message":"5/10","color":"yellow"}'
            },
            {
                path: '.kiro/test-spec-badge-data.json',
                content: '{"schemaVersion":1,"label":"test-spec Kiro Tasks","message":"3/5","color":"yellow"}'
            }
        ];

        it('should successfully commit badge files', async () => {
            // Mock git operations in sequence
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

            // Verify git user configuration
            expect(mockExecSync).toHaveBeenCalledWith(
                'git config user.name "github-actions[bot]"',
                expect.objectContaining({ cwd: mockWorkspaceRoot, stdio: 'pipe' })
            );
            expect(mockExecSync).toHaveBeenCalledWith(
                'git config user.email "41898282+github-actions[bot]@users.noreply.github.com"',
                expect.objectContaining({ cwd: mockWorkspaceRoot, stdio: 'pipe' })
            );

            // Verify files were written
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                path.resolve(mockWorkspaceRoot, '.kiro/badge-data-all.json'),
                mockBadgeFiles[0].content,
                'utf8'
            );
            expect(mockFs.writeFileSync).toHaveBeenCalledWith(
                path.resolve(mockWorkspaceRoot, '.kiro/test-spec-badge-data.json'),
                mockBadgeFiles[1].content,
                'utf8'
            );

            // Verify git operations
            expect(mockExecSync).toHaveBeenCalledWith(
                'git add ".kiro/badge-data-all.json"',
                expect.objectContaining({ cwd: mockWorkspaceRoot, stdio: 'pipe' })
            );
            expect(mockExecSync).toHaveBeenCalledWith(
                'git add ".kiro/test-spec-badge-data.json"',
                expect.objectContaining({ cwd: mockWorkspaceRoot, stdio: 'pipe' })
            );
            expect(mockExecSync).toHaveBeenCalledWith(
                `git commit -m "${mockCommitMessage}"`,
                expect.objectContaining({ cwd: mockWorkspaceRoot, stdio: 'pipe' })
            );
            expect(mockExecSync).toHaveBeenCalledWith(
                'git push',
                expect.objectContaining({ cwd: mockWorkspaceRoot, stdio: 'pipe', timeout: 30000 })
            );

            expect(mockCore.info).toHaveBeenCalledWith('Starting to commit 2 badge files');
            expect(mockCore.info).toHaveBeenCalledWith('Successfully committed and pushed badge files');
        });

        it('should create directories if they do not exist', async () => {
            mockFs.existsSync.mockReturnValue(false);

            // Mock git operations in sequence
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
                path.dirname(path.resolve(mockWorkspaceRoot, '.kiro/badge-data-all.json')),
                { recursive: true }
            );
            expect(mockFs.mkdirSync).toHaveBeenCalledWith(
                path.dirname(path.resolve(mockWorkspaceRoot, '.kiro/test-spec-badge-data.json')),
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
                'git add ".kiro/badge-data-all.json"',
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

            expect(mockCore.info).toHaveBeenCalledWith('No changes to commit - badge files are already up to date');
        });

        it('should handle git user configuration errors', async () => {
            mockExecSync.mockImplementationOnce(() => {
                throw new Error('Git config failed');
            });

            await expect(gitCommitter.commitBadgeFiles(mockBadgeFiles)).rejects.toThrow(
                'Git operations failed: Failed to configure git user: Error: Git config failed'
            );

            expect(mockCore.error).toHaveBeenCalledWith(
                expect.stringContaining('Failed to commit badge files')
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
            // Mock successful git config
            mockExecSync.mockReturnValueOnce(Buffer.from(''));
            mockExecSync.mockReturnValueOnce(Buffer.from(''));

            // Mock git add failure
            mockExecSync.mockImplementationOnce(() => {
                throw new Error('Git add failed');
            });

            await expect(gitCommitter.commitBadgeFiles(mockBadgeFiles)).rejects.toThrow(
                'Git operations failed: Failed to stage files: Error: Git add failed'
            );
        });

        it('should handle git commit errors', async () => {
            // Mock git operations in sequence
            mockExecSync
                .mockReturnValueOnce(Buffer.from('')) // git config user.name
                .mockReturnValueOnce(Buffer.from('')) // git config user.email
                .mockReturnValueOnce(Buffer.from('')) // git add first file
                .mockReturnValueOnce(Buffer.from('')) // git add second file
                .mockImplementationOnce(() => {
                    throw new Error('Changes exist'); // git diff --cached --quiet fails when changes exist
                })
                .mockImplementationOnce(() => {
                    throw new Error('Git commit failed'); // git commit fails
                });

            await expect(gitCommitter.commitBadgeFiles(mockBadgeFiles)).rejects.toThrow(
                'Git operations failed: Failed to commit changes: Error: Git commit failed'
            );
        });

        it('should retry push operations on failure', async () => {
            let callCount = 0;
            mockExecSync.mockImplementation((command) => {
                callCount++;
                if (callCount <= 2) {
                    return Buffer.from(''); // git config commands
                }
                if (callCount <= 4) {
                    return Buffer.from(''); // git add commands
                }
                if (callCount === 5) {
                    throw new Error('Changes exist'); // git diff indicates changes
                }
                if (callCount === 6) {
                    return Buffer.from(''); // git commit
                }
                if (command === 'git push') {
                    if (callCount === 7 || callCount === 9) { // First two push attempts fail
                        throw new Error('Push failed');
                    }
                    if (callCount === 8 || callCount === 10) { // sleep commands
                        return Buffer.from('');
                    }
                    return Buffer.from(''); // Third push attempt succeeds
                }
                if (command.startsWith('sleep')) {
                    return Buffer.from('');
                }
                return Buffer.from('');
            });

            await gitCommitter.commitBadgeFiles(mockBadgeFiles);

            expect(mockCore.warning).toHaveBeenCalledWith('Push attempt 1 failed, retrying...');
            expect(mockCore.warning).toHaveBeenCalledWith('Push attempt 2 failed, retrying...');
        });

        it('should fail after maximum push retries', async () => {
            let callCount = 0;
            mockExecSync.mockImplementation((command) => {
                callCount++;
                if (callCount <= 2) {
                    return Buffer.from(''); // git config commands
                }
                if (callCount <= 4) {
                    return Buffer.from(''); // git add commands
                }
                if (callCount === 5) {
                    throw new Error('Changes exist'); // git diff indicates changes
                }
                if (callCount === 6) {
                    return Buffer.from(''); // git commit
                }
                if (command === 'git push') {
                    throw new Error('Push failed'); // All push attempts fail
                }
                if (command.startsWith('sleep')) {
                    return Buffer.from('');
                }
                return Buffer.from('');
            });

            await expect(gitCommitter.commitBadgeFiles(mockBadgeFiles)).rejects.toThrow(
                'Git operations failed: Failed to push changes after 3 attempts'
            );
        });
    });

    describe('getBadgeFilePath', () => {
        it('should return global badge path for empty spec name', () => {
            const path = GitCommitter.getBadgeFilePath('');
            expect(path).toBe('.kiro/badge-data-all.json');
        });

        it('should return global badge path for no spec name', () => {
            const path = GitCommitter.getBadgeFilePath();
            expect(path).toBe('.kiro/badge-data-all.json');
        });

        it('should return spec-specific badge path for spec name', () => {
            const path = GitCommitter.getBadgeFilePath('test-spec');
            expect(path).toBe('.kiro/test-spec-badge-data.json');
        });

        it('should handle spec names with special characters', () => {
            const path = GitCommitter.getBadgeFilePath('my-awesome-spec-v2');
            expect(path).toBe('.kiro/my-awesome-spec-v2-badge-data.json');
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