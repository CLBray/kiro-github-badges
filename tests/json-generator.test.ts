/**
 * Unit tests for JSONGenerator class
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { JSONGenerator } from '../src/json-generator';
import { SpecTaskData, TaskData } from '../src/types';

describe('JSONGenerator', () => {
    let generator: JSONGenerator;

    beforeEach(() => {
        generator = new JSONGenerator();
    });

    describe('generateGlobalBadge', () => {
        it('should generate correct JSON for empty specs array', () => {
            const result = generator.generateGlobalBadge([]);

            expect(result).toEqual({
                schemaVersion: 1,
                label: 'All Kiro Tasks',
                message: '0/0',
                color: 'red'
            });
        });

        it('should generate correct JSON for single spec with all tasks completed', () => {
            const specs: SpecTaskData[] = [{
                specName: 'test-spec',
                taskData: { totalTasks: 5, completedTasks: 5, completionRate: 1.0 }
            }];

            const result = generator.generateGlobalBadge(specs);

            expect(result).toEqual({
                schemaVersion: 1,
                label: 'All Kiro Tasks',
                message: '5/5',
                color: 'brightgreen'
            });
        });

        it('should generate correct JSON for single spec with partial completion', () => {
            const specs: SpecTaskData[] = [{
                specName: 'test-spec',
                taskData: { totalTasks: 10, completedTasks: 3, completionRate: 0.3 }
            }];

            const result = generator.generateGlobalBadge(specs);

            expect(result).toEqual({
                schemaVersion: 1,
                label: 'All Kiro Tasks',
                message: '3/10',
                color: 'yellow'
            });
        });

        it('should generate correct JSON for single spec with no tasks completed', () => {
            const specs: SpecTaskData[] = [{
                specName: 'test-spec',
                taskData: { totalTasks: 8, completedTasks: 0, completionRate: 0.0 }
            }];

            const result = generator.generateGlobalBadge(specs);

            expect(result).toEqual({
                schemaVersion: 1,
                label: 'All Kiro Tasks',
                message: '0/8',
                color: 'red'
            });
        });

        it('should aggregate multiple specs correctly', () => {
            const specs: SpecTaskData[] = [
                {
                    specName: 'spec1',
                    taskData: { totalTasks: 5, completedTasks: 5, completionRate: 1.0 }
                },
                {
                    specName: 'spec2',
                    taskData: { totalTasks: 10, completedTasks: 3, completionRate: 0.3 }
                },
                {
                    specName: 'spec3',
                    taskData: { totalTasks: 2, completedTasks: 1, completionRate: 0.5 }
                }
            ];

            const result = generator.generateGlobalBadge(specs);

            expect(result).toEqual({
                schemaVersion: 1,
                label: 'All Kiro Tasks',
                message: '9/17', // 5+3+1 / 5+10+2
                color: 'yellow'
            });
        });

        it('should handle specs with zero tasks', () => {
            const specs: SpecTaskData[] = [
                {
                    specName: 'spec1',
                    taskData: { totalTasks: 0, completedTasks: 0, completionRate: 0 }
                },
                {
                    specName: 'spec2',
                    taskData: { totalTasks: 5, completedTasks: 2, completionRate: 0.4 }
                }
            ];

            const result = generator.generateGlobalBadge(specs);

            expect(result).toEqual({
                schemaVersion: 1,
                label: 'All Kiro Tasks',
                message: '2/5',
                color: 'yellow'
            });
        });
    });

    describe('generateSpecBadge', () => {
        it('should generate correct JSON for spec with all tasks completed', () => {
            const taskData: TaskData = { totalTasks: 7, completedTasks: 7, completionRate: 1.0 };

            const result = generator.generateSpecBadge('my-feature', taskData);

            expect(result).toEqual({
                schemaVersion: 1,
                label: 'my-feature Kiro Tasks',
                message: '7/7',
                color: 'brightgreen'
            });
        });

        it('should generate correct JSON for spec with partial completion', () => {
            const taskData: TaskData = { totalTasks: 12, completedTasks: 4, completionRate: 0.33 };

            const result = generator.generateSpecBadge('another-spec', taskData);

            expect(result).toEqual({
                schemaVersion: 1,
                label: 'another-spec Kiro Tasks',
                message: '4/12',
                color: 'yellow'
            });
        });

        it('should generate correct JSON for spec with no tasks completed', () => {
            const taskData: TaskData = { totalTasks: 6, completedTasks: 0, completionRate: 0.0 };

            const result = generator.generateSpecBadge('incomplete-spec', taskData);

            expect(result).toEqual({
                schemaVersion: 1,
                label: 'incomplete-spec Kiro Tasks',
                message: '0/6',
                color: 'red'
            });
        });

        it('should generate correct JSON for spec with no tasks', () => {
            const taskData: TaskData = { totalTasks: 0, completedTasks: 0, completionRate: 0 };

            const result = generator.generateSpecBadge('empty-spec', taskData);

            expect(result).toEqual({
                schemaVersion: 1,
                label: 'empty-spec Kiro Tasks',
                message: '0/0',
                color: 'red'
            });
        });

        it('should handle spec names with special characters', () => {
            const taskData: TaskData = { totalTasks: 3, completedTasks: 2, completionRate: 0.67 };

            const result = generator.generateSpecBadge('github-kiro-static-badge', taskData);

            expect(result).toEqual({
                schemaVersion: 1,
                label: 'github-kiro-static-badge Kiro Tasks',
                message: '2/3',
                color: 'yellow'
            });
        });
    });

    describe('color logic', () => {
        it('should return brightgreen for 100% completion', () => {
            const taskData: TaskData = { totalTasks: 1, completedTasks: 1, completionRate: 1.0 };
            const result = generator.generateSpecBadge('test', taskData);
            expect(result.color).toBe('brightgreen');
        });

        it('should return yellow for 99% completion', () => {
            const taskData: TaskData = { totalTasks: 100, completedTasks: 99, completionRate: 0.99 };
            const result = generator.generateSpecBadge('test', taskData);
            expect(result.color).toBe('yellow');
        });

        it('should return yellow for 1% completion', () => {
            const taskData: TaskData = { totalTasks: 100, completedTasks: 1, completionRate: 0.01 };
            const result = generator.generateSpecBadge('test', taskData);
            expect(result.color).toBe('yellow');
        });

        it('should return red for 0% completion', () => {
            const taskData: TaskData = { totalTasks: 5, completedTasks: 0, completionRate: 0.0 };
            const result = generator.generateSpecBadge('test', taskData);
            expect(result.color).toBe('red');
        });

        it('should return red for no tasks', () => {
            const taskData: TaskData = { totalTasks: 0, completedTasks: 0, completionRate: 0 };
            const result = generator.generateSpecBadge('test', taskData);
            expect(result.color).toBe('red');
        });
    });

    describe('JSON structure validation', () => {
        it('should always include required fields', () => {
            const taskData: TaskData = { totalTasks: 5, completedTasks: 3, completionRate: 0.6 };
            const result = generator.generateSpecBadge('test', taskData);

            expect(result).toHaveProperty('schemaVersion');
            expect(result).toHaveProperty('label');
            expect(result).toHaveProperty('message');
            expect(result).toHaveProperty('color');

            expect(result.schemaVersion).toBe(1);
            expect(typeof result.label).toBe('string');
            expect(typeof result.message).toBe('string');
            expect(typeof result.color).toBe('string');
        });

        it('should format message as X/Y pattern', () => {
            const taskData: TaskData = { totalTasks: 15, completedTasks: 7, completionRate: 0.47 };
            const result = generator.generateSpecBadge('test', taskData);

            expect(result.message).toMatch(/^\d+\/\d+$/);
            expect(result.message).toBe('7/15');
        });

        it('should use valid color values', () => {
            const validColors = ['brightgreen', 'yellow', 'red'];

            // Test all completion scenarios
            const scenarios = [
                { totalTasks: 5, completedTasks: 5 }, // 100%
                { totalTasks: 5, completedTasks: 3 }, // 60%
                { totalTasks: 5, completedTasks: 0 }, // 0%
                { totalTasks: 0, completedTasks: 0 }  // No tasks
            ];

            scenarios.forEach(scenario => {
                const taskData: TaskData = {
                    totalTasks: scenario.totalTasks,
                    completedTasks: scenario.completedTasks,
                    completionRate: scenario.totalTasks > 0 ? scenario.completedTasks / scenario.totalTasks : 0
                };
                const result = generator.generateSpecBadge('test', taskData);
                expect(validColors).toContain(result.color);
            });
        });
    });
});