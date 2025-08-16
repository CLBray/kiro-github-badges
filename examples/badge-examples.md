# Badge Usage Examples

This document provides comprehensive examples of how to use the generated badge JSON files with Shields.io to create various types of badges for your documentation.

## Basic Badge Examples

### Global Repository Badge

Shows completion status for all Kiro specs in the repository:

```markdown
![All Kiro Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json)
```

**Result**: ![All Kiro Tasks](https://img.shields.io/badge/All%20Kiro%20Tasks-15%2F20-yellow)

### Individual Spec Badge

Shows completion status for a specific Kiro spec:

```markdown
![Feature Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/user-authentication-badge-data.json)
```

**Result**: ![Feature Tasks](https://img.shields.io/badge/Auth%20Feature-8%2F10-yellow)

## Styled Badge Examples

### Custom Colors

Override the automatic color with your own:

```markdown
![Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json&color=blue)
```

**Result**: ![Tasks](https://img.shields.io/badge/Progress-15%2F20-blue)

### Different Styles

Shields.io supports various badge styles:

**Flat (default)**:
```markdown
![Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json&style=flat)
```

**Flat Square**:
```markdown
![Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json&style=flat-square)
```

**For the Badge**:
```markdown
![Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json&style=for-the-badge)
```

**Plastic**:
```markdown
![Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json&style=plastic)
```

### With Logos

Add logos to make badges more visually appealing:

**GitHub Logo**:
```markdown
![Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json&logo=github&logoColor=white)
```

**Custom Logo**:
```markdown
![Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json&logo=data:image/svg+xml;base64,YOUR_BASE64_LOGO)
```

## Advanced Badge Configurations

### Cache Control

Control how often Shields.io refreshes the badge data:

```markdown
![Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json&cacheSeconds=300)
```

This refreshes the badge every 5 minutes instead of the default cache duration.

### Multiple Data Points

Use different parts of the JSON data:

**Basic Badge**:
```markdown
![Progress](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json)
```

**With Custom Style**:
```markdown
![Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json&style=flat-square)
```

## Documentation Integration Examples

### README Header Section

```markdown
# My Awesome Project

![All Kiro Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/badge-data-all.json&style=flat-square)
![Build Status](https://img.shields.io/github/actions/workflow/status/username/repo/ci.yml?branch=main)
![License](https://img.shields.io/github/license/username/repo)

A comprehensive project with tracked development progress using Kiro task management.
```

### Feature Progress Table

```markdown
## Development Progress

| Feature | Tasks | Progress |
|---------|-------|----------|
| Authentication | ![Auth Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/user-auth-badge-data.json&style=flat-square) | In Progress |
| API Integration | ![API Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/api-integration-badge-data.json&style=flat-square) | Complete |
| Frontend UI | ![UI Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/frontend-ui-badge-data.json&style=flat-square) | Not Started |
```

### Project Dashboard

```markdown
## Project Dashboard

### Overall Progress
![Overall Progress](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/badge-data-all.json&style=for-the-badge&logo=github)

### Feature Breakdown
- **Backend Services**: ![Backend](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/backend-services-badge-data.json)
- **Frontend Components**: ![Frontend](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/frontend-components-badge-data.json)
- **Testing Suite**: ![Testing](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/testing-suite-badge-data.json)
- **Documentation**: ![Docs](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/documentation-badge-data.json)
```

## Branch-Specific Badges

For repositories with multiple development branches:

### Main Branch (Production)
```markdown
![Production Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/badge-data-all.json)
```

### Development Branch
```markdown
![Development Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/develop/.kiro/badge-data-all.json)
```

### Feature Branch
```markdown
![Feature Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/feature/new-feature/.kiro/badge-data-all.json)
```

## Clickable Badges

Make badges clickable to link to relevant pages:

### Link to Project Board
```markdown
[![Kiro Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/badge-data-all.json)](https://github.com/username/repo/projects/1)
```

### Link to Spec Directory
```markdown
[![Feature Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/user-auth-badge-data.json)](https://github.com/username/repo/tree/main/.kiro/specs/user-auth)
```

### Link to Issues
```markdown
[![Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/badge-data-all.json)](https://github.com/username/repo/issues?q=is%3Aissue+is%3Aopen+label%3Akiro)
```

## Badge Collections

### Horizontal Layout
```markdown
![Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/badge-data-all.json) ![Build](https://img.shields.io/github/actions/workflow/status/username/repo/ci.yml) ![License](https://img.shields.io/github/license/username/repo)
```

### Vertical Layout
```markdown
![Tasks](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/username/repo/main/.kiro/badge-data-all.json)

![Build](https://img.shields.io/github/actions/workflow/status/username/repo/ci.yml)

![License](https://img.shields.io/github/license/username/repo)
```

## Troubleshooting Badge Display

### Common Issues

**Badge shows "invalid"**:
- Check that the JSON file exists at the specified URL
- Verify the JSON structure is correct
- Ensure the repository and file path are correct

**Badge doesn't update**:
- Wait 5-10 minutes for Shields.io cache to refresh
- Add `cacheSeconds=300` parameter to force more frequent updates
- Check that the GitHub Action ran successfully

**Badge shows 404**:
- Verify the raw GitHub URL is accessible
- Check repository visibility (private repos may not work)
- Ensure the file path is correct

### Testing Badge URLs

Before using in documentation, test the raw JSON URL:

```bash
curl "https://raw.githubusercontent.com/username/repo/main/.kiro/badge-data-all.json"
```

Expected response:
```json
{
  "schemaVersion": 1,
  "label": "All Kiro Tasks",
  "message": "15/20",
  "color": "yellow"
}
```

## URL Template

Use this template to create your badge URLs:

```
https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/[USERNAME]/[REPOSITORY]/[BRANCH]/.kiro/[BADGE-FILE]&style=[STYLE]&logo=[LOGO]
```

**Parameters**:
- `[USERNAME]`: Your GitHub username
- `[REPOSITORY]`: Repository name
- `[BRANCH]`: Branch name (usually `main`)
- `[BADGE-FILE]`: Badge JSON file name
- `[LABEL]`: Badge label text
- `[STYLE]`: Badge style (flat, flat-square, for-the-badge, plastic)
- `[COLOR]`: Override color (optional)
- `[LOGO]`: Logo name or base64 data (optional)

## Best Practices

1. **Use descriptive labels**: Make it clear what the badge represents
2. **Choose appropriate styles**: Match your project's visual style
3. **Link badges to relevant pages**: Make them functional, not just decorative
4. **Group related badges**: Organize badges logically in your documentation
5. **Test badge URLs**: Verify they work before publishing
6. **Consider mobile users**: Some badge styles work better on small screens
7. **Update documentation**: Keep badge examples current with your actual URLs