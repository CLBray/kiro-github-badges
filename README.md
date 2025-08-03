# Kiro Task Badge Generator

A GitHub Action that automatically scans Kiro task files in your repository and generates Shields.io-compatible JSON badges to display task completion status in your documentation.

![Kiro Tasks](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/CLBray/kiro-github-badges/main/.kiro/badge-data-all.json&query=$.message&label=Kiro%20Tasks&color=brightgreen)

## Features

- 🔄 **Automatic Badge Generation**: Triggers when task files change
- 📊 **Multiple Badge Types**: Global repository badges and individual spec badges  
- 🎨 **Visual Progress Indicators**: Color-coded badges (green=100%, yellow=1-99%, red=0%)
- 🔗 **Shields.io Integration**: Uses standard dynamic JSON badge format
- ⚙️ **Zero Configuration**: Minimal setup required, works with GitHub token
- 🛡️ **Error Resilient**: Gracefully handles missing files and malformed content

## Quick Start

### 1. Add the Action to Your Workflow

Create `.github/workflows/kiro-badges.yml`:

```yaml
name: Update Kiro Task Badges

on:
  push:
    paths:
      - '.kiro/specs/**/tasks.md'
  pull_request:
    paths:
      - '.kiro/specs/**/tasks.md'
  workflow_dispatch:

jobs:
  update-badges:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
        
      - name: Generate Kiro task badges
        uses: kiro/kiro-task-badge-generator@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

### 2. Add Badges to Your README

**Global Badge (All Specs)**:
```markdown
![Kiro Tasks](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json&query=$.message&label=Kiro%20Tasks&color=brightgreen)
```

**Individual Spec Badge**:
```markdown
![Feature Tasks](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/SPEC_NAME-badge-data.json&query=$.message&label=Feature%20Tasks&color=yellow)
```

Replace `YOUR_USERNAME`, `YOUR_REPO`, and `SPEC_NAME` with your actual values.

## Installation & Configuration

### Prerequisites

- Repository with Kiro task files in `.kiro/specs/*/tasks.md`
- GitHub Actions enabled
- Write permissions for the action (see [Permissions](#permissions))

### Basic Setup

1. **Create the workflow file** in `.github/workflows/kiro-badges.yml` (see [Quick Start](#quick-start))

2. **Ensure proper permissions** are set in your workflow:
   ```yaml
   permissions:
     contents: write  # Required to commit badge files
   ```

3. **Commit and push** the workflow file to trigger the action

### Advanced Configuration

#### Custom Commit Messages

```yaml
- name: Generate Kiro task badges
  uses: kiro/kiro-task-badge-generator@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    commit-message: "🏷️ Update task completion badges [skip ci]"
```

#### Custom GitHub Token

For enhanced security or cross-repository access:

```yaml
- name: Generate Kiro task badges  
  uses: kiro/kiro-task-badge-generator@v1
  with:
    token: ${{ secrets.CUSTOM_GITHUB_TOKEN }}
```

## Workflow Examples

### Trigger on Task File Changes Only

```yaml
name: Update Kiro Task Badges

on:
  push:
    paths:
      - '.kiro/specs/**/tasks.md'
    branches: [main, develop]

jobs:
  update-badges:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: kiro/kiro-task-badge-generator@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

### Scheduled Updates

```yaml
name: Update Kiro Task Badges

on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
  workflow_dispatch:

jobs:
  update-badges:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: kiro/kiro-task-badge-generator@v1
```

### Multi-Branch Support

```yaml
name: Update Kiro Task Badges

on:
  push:
    paths:
      - '.kiro/specs/**/tasks.md'
    branches: [main, develop, 'feature/*']

jobs:
  update-badges:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: kiro/kiro-task-badge-generator@v1
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          commit-message: "Update badges for ${{ github.ref_name }} branch"
```

## Badge Usage Examples

### Basic Badges

**Global Progress**:
```markdown
![All Kiro Tasks](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/user/repo/main/.kiro/badge-data-all.json&query=$.message&label=All%20Tasks)
```

**Specific Feature**:
```markdown
![Auth Feature](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/user/repo/main/.kiro/user-auth-badge-data.json&query=$.message&label=Auth%20Feature)
```

### Styled Badges

**Custom Colors**:
```markdown
![Tasks](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/user/repo/main/.kiro/badge-data-all.json&query=$.message&label=Progress&color=blue&style=flat-square)
```

**With Logo**:
```markdown
![Tasks](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/user/repo/main/.kiro/badge-data-all.json&query=$.message&label=Kiro&logo=github&logoColor=white)
```

### Badge Tables

Create organized progress displays:

```markdown
## Project Progress

| Feature | Status | Progress |
|---------|--------|----------|
| Authentication | ![Auth](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/user/repo/main/.kiro/auth-badge-data.json&query=$.message&label=Tasks) | ![Auth Progress](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/user/repo/main/.kiro/auth-badge-data.json&query=$.color&label=&color=brightgreen) |
| API Integration | ![API](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/user/repo/main/.kiro/api-badge-data.json&query=$.message&label=Tasks) | ![API Progress](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/user/repo/main/.kiro/api-badge-data.json&query=$.color&label=&color=yellow) |
```

## Permissions

### Required GitHub Token Permissions

The action requires the following permissions:

```yaml
permissions:
  contents: write  # To commit badge JSON files to repository
```

### Repository Settings

1. **Actions Permissions**: Ensure GitHub Actions can write to your repository
   - Go to Settings → Actions → General
   - Under "Workflow permissions", select "Read and write permissions"

2. **Branch Protection**: If using branch protection rules, ensure the action can push to protected branches:
   - Add `github-actions[bot]` to bypass restrictions, or
   - Use a personal access token with appropriate permissions

### Personal Access Token (Optional)

For enhanced security or cross-repository access, create a PAT with:
- `repo` scope (for private repositories)
- `public_repo` scope (for public repositories)

Add it as a repository secret and reference it in your workflow:
```yaml
with:
  token: ${{ secrets.CUSTOM_GITHUB_TOKEN }}
```

## Generated Files

The action creates JSON files in your repository:

### Global Badge
- **Path**: `.kiro/badge-data-all.json`
- **Content**: Aggregated stats from all specs
- **Example**:
  ```json
  {
    "schemaVersion": 1,
    "label": "All Kiro Tasks",
    "message": "15/20",
    "color": "yellow"
  }
  ```

### Individual Spec Badges
- **Path**: `.kiro/{spec-name}-badge-data.json`
- **Content**: Stats for specific spec
- **Example**:
  ```json
  {
    "schemaVersion": 1,
    "label": "user-auth Kiro Tasks", 
    "message": "8/10",
    "color": "yellow"
  }
  ```

### Color Logic
- 🟢 **brightgreen**: 100% completion (all tasks done)
- 🟡 **yellow**: 1-99% completion (some tasks remaining)
- 🔴 **red**: 0% completion (no tasks completed)

## Troubleshooting

### Common Issues

#### Badge Not Updating
**Problem**: Badge shows old data or doesn't change
**Solutions**:
1. Check if the action ran successfully in Actions tab
2. Verify the JSON file was committed to your repository
3. Clear browser cache or wait for Shields.io cache to expire (~5 minutes)
4. Ensure the raw GitHub URL is accessible

#### Action Fails with Permission Error
**Problem**: `Error: Resource not accessible by integration`
**Solutions**:
1. Add `contents: write` permission to your workflow
2. Check repository settings for Actions permissions
3. Verify branch protection rules allow the action to push

#### No Badge Files Generated
**Problem**: Action runs but no JSON files appear
**Solutions**:
1. Verify `.kiro/specs/*/tasks.md` files exist
2. Check task file format uses proper checkbox syntax: `- [x]` or `- [ ]`
3. Review action logs for parsing errors

#### Badge Shows "invalid"
**Problem**: Shields.io displays "invalid" instead of task count
**Solutions**:
1. Verify the raw GitHub URL returns valid JSON
2. Check JSON structure matches Shields.io requirements
3. Ensure the file path in the badge URL is correct

### Debug Steps

1. **Check Action Logs**:
   - Go to Actions tab in your repository
   - Click on the latest workflow run
   - Review logs for error messages

2. **Verify JSON Files**:
   - Navigate to `.kiro/` directory in your repository
   - Confirm badge JSON files exist and contain valid data
   - Test raw GitHub URLs directly in browser

3. **Test Badge URL**:
   ```
   https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json
   ```
   Should return valid JSON, not 404 error

4. **Validate Task Files**:
   - Ensure task files use correct checkbox syntax
   - Check for malformed markdown that might cause parsing issues

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ENOENT: no such file or directory` | Missing .kiro/specs directory | Create directory structure with task files |
| `Resource not accessible by integration` | Insufficient permissions | Add `contents: write` to workflow permissions |
| `fatal: could not read Username` | Git authentication issue | Verify GitHub token is valid |
| `JSON.parse error` | Malformed task file | Check task file markdown syntax |

### Getting Help

If you encounter issues not covered here:

1. **Check existing issues**: [GitHub Issues](https://github.com/kiro/kiro-task-badge-generator/issues)
2. **Create a new issue** with:
   - Your workflow YAML
   - Action logs
   - Example task files
   - Expected vs actual behavior

## API Reference

### Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `token` | GitHub token for committing files | No | `${{ github.token }}` |
| `commit-message` | Commit message for badge updates | No | `"Update Kiro task completion badges"` |

### Outputs

| Output | Description |
|--------|-------------|
| `global-badge-path` | Path to the generated global badge JSON file |
| `spec-badge-paths` | Comma-separated paths to generated spec badge JSON files |

### Task File Format

The action expects Kiro task files (`tasks.md`) with this format:

```markdown
# Implementation Plan

- [ ] 1. First task
  - Task description
  - _Requirements: 1.1, 2.3_

- [x] 2. Completed task
  - This task is done
  - _Requirements: 1.2_

- [ ] 2.1 Sub-task
  - Sub-tasks are counted separately
  - _Requirements: 2.1_
```

**Supported checkbox formats**:
- `- [ ]` - Incomplete task
- `- [x]` - Completed task
- `- [X]` - Completed task (uppercase)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Make changes to TypeScript files in `src/`
4. Run tests: `npm test`
5. Build: `npm run build`
6. Package: `npm run package`

### Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## License

This project is licensed under the Apache 2.0 License - see the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.