# Requirements Document

## Introduction

This feature will create a GitHub Action that scans Kiro task files in a repository, generates a JSON file with task completion data, and commits it to the repository. This static JSON file can then be consumed by Shields.io's dynamic JSON badge service to display task completion status in README files and other documentation.

## Requirements

### Requirement 1

**User Story:** As a developer, I want a GitHub Action that generates multiple JSON files with task completion data, so that I can use Shields.io dynamic badges to display both global and per-spec project progress in my documentation.

#### Acceptance Criteria

1. WHEN the GitHub Action runs THEN it SHALL generate multiple valid JSON files compatible with Shields.io dynamic badges
2. WHEN JSON files are generated THEN they SHALL include schemaVersion, label, message, and color fields
3. WHEN the global JSON file is generated THEN the label SHALL be "All Kiro Tasks" 
4. WHEN individual spec JSON files are generated THEN the label SHALL be based on the spec name (e.g., "github-kiro-static-badge Kiro Tasks")
5. WHEN there are no tasks in a scope THEN the JSON SHALL contain message "0/0" 
6. WHEN tasks exist in a scope THEN the JSON SHALL contain message in format "X/Y" where X is completed tasks and Y is total tasks
7. WHEN all tasks are complete in a scope THEN the JSON SHALL contain color "brightgreen"
8. WHEN some tasks are incomplete in a scope THEN the JSON SHALL contain color "yellow"
9. WHEN no tasks are complete in a scope THEN the JSON SHALL contain color "red"

### Requirement 2

**User Story:** As a developer, I want the GitHub Action to automatically run when task files change, so that the badge data stays current without manual intervention.

#### Acceptance Criteria

1. WHEN task files in .kiro/specs directories are modified THEN the GitHub Action SHALL trigger automatically
2. WHEN the Action runs THEN it SHALL scan all task files to generate current completion data
3. WHEN task completion status changes THEN the next Action run SHALL update the JSON file accordingly
4. WHEN new tasks are added to the project THEN the next Action run SHALL include them in the total count
5. WHEN tasks are removed from the project THEN the next Action run SHALL exclude them from the total count

### Requirement 3

**User Story:** As a developer, I want to scan all task files in my Kiro project to get accurate completion metrics for both global and per-spec badges, so that each badge reflects the true state of its respective scope.

#### Acceptance Criteria

1. WHEN scanning for global tasks THEN the system SHALL search for all tasks.md files in all subdirectories of .kiro/specs
2. WHEN scanning for individual spec tasks THEN the system SHALL search for tasks.md files only within that specific spec directory
3. WHEN parsing task files THEN the system SHALL correctly identify completed tasks marked with [x] or similar completion indicators
4. WHEN parsing task files THEN the system SHALL correctly identify incomplete tasks marked with [ ] or similar indicators
5. WHEN a task file is malformed or unreadable THEN the system SHALL handle the error gracefully and continue processing other files
6. WHEN no task files exist in a scope THEN the system SHALL return zero for both completed and total counts for that scope

### Requirement 4

**User Story:** As a developer, I want to easily install and configure the GitHub Action in my repository, so that I can set up task completion badges with minimal effort.

#### Acceptance Criteria

1. WHEN the GitHub Action is published THEN it SHALL be available in the GitHub Marketplace or as a reusable action
2. WHEN a developer adds the action to their workflow THEN it SHALL require minimal configuration parameters
3. WHEN the action runs THEN it SHALL have appropriate permissions to read task files and commit the JSON file
4. WHEN the action fails THEN it SHALL provide clear error messages and not break the workflow
5. WHEN the action is configured THEN it SHALL include example workflow YAML and usage documentation

### Requirement 5

**User Story:** As a developer, I want to easily configure Shields.io to use my committed JSON file, so that I can integrate task completion badges into my project documentation with minimal setup.

#### Acceptance Criteria

1. WHEN the GitHub Action completes THEN multiple JSON files SHALL be committed to the repository and accessible via raw GitHub URLs
2. WHEN the JSON files are committed THEN they SHALL be placed in predictable locations:
   - Global badge: .kiro/badge-data-all.json (covers all specs in the repository)
   - Individual spec badges: .kiro/<specname>-badge-data.json (one per spec)
3. WHEN the raw GitHub URL is used with Shields.io dynamic badges THEN it SHALL generate a properly formatted badge
4. WHEN the badge is embedded in markdown THEN it SHALL display correctly in GitHub README files
5. WHEN the Action is configured THEN it SHALL provide clear documentation on how to use the generated badge URL