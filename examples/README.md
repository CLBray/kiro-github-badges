# Kiro Task Badge Generator Examples

This directory contains comprehensive examples and templates for using the Kiro Task Badge Generator in various scenarios.

## Quick Start

1. **Choose a workflow** from the examples below
2. **Copy the YAML file** to `.github/workflows/kiro-badges.yml` in your repository
3. **Customize the configuration** for your needs
4. **Add badges to your README** using the badge examples

## Workflow Examples

### [Basic Workflow](basic-workflow.yml)
- Simple setup with minimal configuration
- Triggers on task file changes
- Perfect for getting started quickly

### [Advanced Workflow](advanced-workflow.yml)
- Multiple trigger conditions (push, PR, schedule, manual)
- Custom commit messages
- Debug logging enabled
- PR comments for badge updates

### [Multi-Environment Workflow](multi-environment.yml)
- Handles different environments (dev, staging, prod)
- Branch-based environment detection
- Environment-specific badge generation
- Deployment status integration

## Badge Examples

### [Badge Usage Examples](badge-examples.md)
Comprehensive guide covering:
- Basic badge implementations
- Styled badges with custom colors and logos
- Advanced configurations
- Documentation integration patterns
- Troubleshooting common issues

## File Structure

```
examples/
├── README.md                    # This file
├── basic-workflow.yml           # Simple GitHub Actions workflow
├── advanced-workflow.yml        # Feature-rich workflow
├── multi-environment.yml        # Multi-environment setup
├── badge-examples.md           # Comprehensive badge usage guide
└── task-file-examples/         # Sample task file formats
    ├── simple-tasks.md         # Basic task file
    ├── nested-tasks.md         # Complex hierarchy
    └── mixed-completion.md     # Partially completed tasks
```

## Usage Instructions

### 1. Copy Workflow File

Choose the workflow that best fits your needs and copy it to your repository:

```bash
# Create workflows directory if it doesn't exist
mkdir -p .github/workflows

# Copy the basic workflow (recommended for most users)
cp examples/basic-workflow.yml .github/workflows/kiro-badges.yml
```

### 2. Customize Configuration

Edit the workflow file to match your requirements:

- **Trigger conditions**: Modify `on:` section for when the action should run
- **Permissions**: Ensure `contents: write` is included
- **Commit messages**: Customize the commit message for badge updates
- **Branch restrictions**: Limit to specific branches if needed

### 3. Set Up Repository

Ensure your repository has the correct structure:

```
your-repository/
├── .github/workflows/kiro-badges.yml  # Your workflow file
├── .kiro/specs/                       # Kiro specifications
│   ├── feature-1/
│   │   └── tasks.md                   # Task file for feature 1
│   └── feature-2/
│       └── tasks.md                   # Task file for feature 2
└── README.md                          # Your project documentation
```

### 4. Add Badges to Documentation

Use the examples in [badge-examples.md](badge-examples.md) to add badges to your README:

```markdown
# My Project

![All Kiro Tasks](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json&query=$.message&label=All%20Tasks)

## Features

- ![Feature 1](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/feature-1-badge-data.json&query=$.message&label=Feature%201) Authentication system
- ![Feature 2](https://img.shields.io/badge/dynamic/json?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/feature-2-badge-data.json&query=$.message&label=Feature%202) API integration
```

## Common Customizations

### Trigger Conditions

**Only on main branch**:
```yaml
on:
  push:
    paths:
      - '.kiro/specs/**/tasks.md'
    branches: [main]
```

**Include pull requests**:
```yaml
on:
  push:
    paths:
      - '.kiro/specs/**/tasks.md'
  pull_request:
    paths:
      - '.kiro/specs/**/tasks.md'
```

**Scheduled updates**:
```yaml
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
```

### Custom Commit Messages

```yaml
- name: Generate Kiro task badges
  uses: CLBray/kiro-github-badges@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    commit-message: "🏷️ Update task completion badges [skip ci]"
```

### Debug Mode

```yaml
- name: Generate Kiro task badges
  uses: CLBray/kiro-github-badges@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
  env:
    ACTIONS_STEP_DEBUG: true
```

## Testing Your Setup

### 1. Verify Workflow Syntax

Use GitHub's workflow validator or run locally:

```bash
# Install act for local testing (optional)
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Test workflow locally
act -n  # Dry run to check syntax
```

### 2. Check File Paths

Ensure your task files are in the correct location:

```bash
find .kiro/specs -name "tasks.md" -type f
```

### 3. Validate Task File Format

Check that your task files use correct checkbox syntax:

```markdown
# ✅ Correct format
- [ ] Incomplete task
- [x] Completed task
- [X] Also completed (uppercase)

# ❌ Incorrect format
* [x] Wrong bullet type
- [] Missing space
- [y] Wrong completion marker
```

### 4. Test Badge URLs

Before adding badges to documentation, test the raw JSON URLs:

```bash
# Replace with your actual repository details
curl "https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json"
```

Expected response:
```json
{
  "schemaVersion": 1,
  "label": "All Kiro Tasks",
  "message": "5/10",
  "color": "yellow"
}
```

## Troubleshooting

### Common Issues

1. **Action doesn't trigger**: Check file paths in trigger conditions
2. **Permission denied**: Ensure `contents: write` permission is set
3. **Badge shows "invalid"**: Verify JSON file exists and is accessible
4. **Tasks not counted correctly**: Check task file markdown syntax

### Getting Help

- Review the [main README](../README.md) for detailed documentation
- Check the [troubleshooting guide](../TROUBLESHOOTING.md) for common issues
- Look at existing [GitHub Issues](https://github.com/CLBray/kiro-github-badges/issues)
- Create a new issue with your specific problem

## Contributing Examples

Have a useful workflow configuration or badge implementation? We'd love to include it!

1. Fork the repository
2. Add your example to this directory
3. Update this README with a description
4. Submit a pull request

Please ensure your examples:
- Are well-documented with comments
- Include a brief description of the use case
- Follow the existing naming conventions
- Are tested and working

## License

These examples are provided under the same Apache 2.0 license as the main project.