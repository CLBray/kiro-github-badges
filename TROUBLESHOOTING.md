# Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Kiro Task Badge Generator.

## Quick Diagnostics

### 1. Check Action Status
- Go to your repository's **Actions** tab
- Look for the "Update Kiro Task Badges" workflow
- Check if the latest run succeeded or failed

### 2. Verify File Structure
Ensure your repository has the correct structure:
```
.kiro/
└── specs/
    └── your-spec-name/
        └── tasks.md
```

### 3. Test Badge URL
Replace placeholders and test in browser:
```
https://raw.githubusercontent.com/YOUR_USERNAME/YOUR_REPO/main/.kiro/badge-data-all.json
```

## Common Issues

### Badge Not Updating

#### Symptoms
- Badge shows old completion percentage
- Badge doesn't reflect recent task changes
- Badge appears unchanged after committing task updates

#### Causes & Solutions

**1. Action didn't trigger**
- **Check**: Workflow triggers in `.github/workflows/kiro-badges.yml`
- **Fix**: Ensure paths include `.kiro/specs/**/tasks.md`
```yaml
on:
  push:
    paths:
      - '.kiro/specs/**/tasks.md'
```

**2. Action failed silently**
- **Check**: Actions tab for failed runs
- **Fix**: Review error logs and address specific issues

**3. Shields.io cache delay**
- **Cause**: Shields.io caches badge data for ~5 minutes
- **Fix**: Wait 5-10 minutes or add cache-busting parameter:
```markdown
![Badge](https://img.shields.io/badge/dynamic/json?url=...&cacheSeconds=300)
```

**4. Browser cache**
- **Fix**: Hard refresh (Ctrl+F5) or open in incognito mode

### Permission Errors

#### Symptoms
- Action fails with "Resource not accessible by integration"
- Error: "Permission denied" in action logs
- Badge files not committed to repository

#### Solutions

**1. Add workflow permissions**
```yaml
jobs:
  update-badges:
    runs-on: ubuntu-latest
    permissions:
      contents: write  # Required!
    steps:
      # ... rest of workflow
```

**2. Check repository settings**
- Go to Settings → Actions → General
- Under "Workflow permissions", select "Read and write permissions"

**3. Branch protection rules**
- If using protected branches, either:
  - Add `github-actions[bot]` to bypass restrictions
  - Use a personal access token with appropriate permissions

### Badge Shows "Invalid"

#### Symptoms
- Shields.io displays "invalid" instead of task count
- Badge appears broken or malformed

#### Causes & Solutions

**1. JSON file doesn't exist**
- **Check**: Navigate to `.kiro/` in your repository
- **Fix**: Ensure action ran successfully and committed files

**2. Invalid JSON structure**
- **Check**: Open the JSON file directly in GitHub
- **Expected format**:
```json
{
  "schemaVersion": 1,
  "label": "Kiro Tasks",
  "message": "5/10",
  "color": "yellow"
}
```

**3. Wrong URL in badge**
- **Check**: Badge URL points to correct file path
- **Fix**: Verify username, repository, branch, and file path

**4. Private repository**
- **Cause**: Raw GitHub URLs for private repos require authentication
- **Fix**: Make repository public or use GitHub's badge service

### No Badge Files Generated

#### Symptoms
- Action runs successfully but no JSON files appear
- `.kiro/` directory remains empty
- No commit with badge updates

#### Causes & Solutions

**1. No task files found**
- **Check**: Ensure `.kiro/specs/*/tasks.md` files exist
- **Fix**: Create task files with proper structure

**2. Malformed task files**
- **Check**: Task files use correct checkbox syntax
- **Valid formats**: `- [ ]`, `- [x]`, `- [X]`
- **Invalid**: `* [ ]`, `+ [x]`, `- []`

**3. Empty task files**
- **Cause**: Task files exist but contain no checkbox items
- **Result**: Action creates JSON with "0/0" message

**4. Permission to create files**
- **Check**: Action has `contents: write` permission
- **Fix**: Add permission to workflow (see Permission Errors above)

### Git Authentication Issues

#### Symptoms
- "fatal: could not read Username for 'https://github.com'"
- "Authentication failed" in action logs
- Badge files not committed despite successful generation

#### Solutions

**1. Use default GitHub token**
```yaml
with:
  token: ${{ secrets.GITHUB_TOKEN }}
```

**2. Check token permissions**
- Default `GITHUB_TOKEN` should work for most cases
- For cross-repository access, use personal access token

**3. Custom token setup**
- Create PAT with `repo` scope
- Add as repository secret
- Reference in workflow:
```yaml
with:
  token: ${{ secrets.CUSTOM_GITHUB_TOKEN }}
```

### Task Parsing Issues

#### Symptoms
- Incorrect task counts in badges
- Tasks not recognized as completed/incomplete
- Unexpected completion percentages

#### Common Parsing Problems

**1. Incorrect checkbox syntax**
```markdown
# ❌ Wrong
* [x] Task with asterisk
+ [ ] Task with plus
- [] Missing space
- [y] Wrong completion marker

# ✅ Correct  
- [x] Completed task
- [ ] Incomplete task
- [X] Also completed (uppercase)
```

**2. Nested task counting**
```markdown
# Both parent and sub-tasks are counted
- [ ] 1. Parent task
- [ ] 1.1 Sub-task one
- [x] 1.2 Sub-task two (completed)
```
Result: 1/3 tasks completed

**3. Mixed markdown formats**
- Ensure consistent indentation
- Use either spaces or tabs, not mixed
- Follow standard markdown list syntax

### Workflow Trigger Issues

#### Symptoms
- Action doesn't run when task files change
- Manual trigger works but automatic doesn't
- Action runs on unrelated file changes

#### Solutions

**1. Check trigger paths**
```yaml
on:
  push:
    paths:
      - '.kiro/specs/**/tasks.md'  # Correct: recursive search
      # Not: '.kiro/specs/tasks.md'  # Wrong: only root level
```

**2. Branch restrictions**
```yaml
on:
  push:
    paths:
      - '.kiro/specs/**/tasks.md'
    branches: [main, develop]  # Specify branches if needed
```

**3. File path case sensitivity**
- Ensure exact case match: `tasks.md` not `Tasks.md`
- Check actual file paths in repository

## Advanced Troubleshooting

### Debug Mode

Enable debug logging in your workflow:

```yaml
- name: Generate Kiro task badges
  uses: CLBray/kiro-github-badges@v1
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
  env:
    ACTIONS_STEP_DEBUG: true
```

### Manual Testing

Test the action locally (requires Node.js):

```bash
# Clone the action repository
git clone https://github.com/CLBray/kiro-github-badges.git
cd kiro-github-badges

# Install dependencies
npm install

# Run tests
npm test

# Build the action
npm run build
npm run package
```

### Validate JSON Output

Check generated JSON files manually:

```bash
# View global badge data
cat .kiro/badge-data-all.json

# Validate JSON format
cat .kiro/badge-data-all.json | jq .
```

Expected output:
```json
{
  "schemaVersion": 1,
  "label": "All Kiro Tasks",
  "message": "15/20",
  "color": "yellow"
}
```

### Test Badge URL

Verify the raw GitHub URL works:

```bash
curl -s "https://raw.githubusercontent.com/USER/REPO/main/.kiro/badge-data-all.json" | jq .
```

## Error Reference

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `ENOENT: no such file or directory, scandir '.kiro/specs'` | Missing specs directory | Create `.kiro/specs/` directory structure |
| `Resource not accessible by integration` | Insufficient permissions | Add `contents: write` to workflow permissions |
| `fatal: could not read Username` | Git authentication failure | Verify GitHub token configuration |
| `JSON.parse error` | Malformed task file | Check task file markdown syntax |
| `Error: Cannot find module` | Missing dependencies | Run `npm install` in action development |
| `TypeError: Cannot read property` | Unexpected data structure | Check task file format and content |

### HTTP Status Codes

When testing badge URLs:

- **200**: Success - JSON file accessible
- **404**: File not found - check path and file existence  
- **403**: Forbidden - private repository or authentication issue
- **500**: Server error - temporary GitHub issue, retry later

## Getting Help

If these solutions don't resolve your issue:

### 1. Search Existing Issues
- [GitHub Issues](https://github.com/CLBray/kiro-github-badges/issues)
- Look for similar problems and solutions

### 2. Create a New Issue

Include the following information:

**Environment**:
- Repository URL (if public)
- GitHub Actions runner OS
- Node.js version (if relevant)

**Configuration**:
- Your workflow YAML file
- Example task files
- Badge URLs you're trying to use

**Logs**:
- Complete action logs from GitHub Actions
- Any error messages
- Screenshots of the issue

**Expected vs Actual**:
- What you expected to happen
- What actually happened
- Steps to reproduce

### 3. Community Support
- GitHub Discussions for questions
- Stack Overflow with tags: `github-actions`, `kiro`, `shields.io`

## Prevention Tips

### Best Practices
1. **Test workflows** in a separate branch first
2. **Use semantic commit messages** for easier debugging
3. **Keep task files simple** - avoid complex markdown
4. **Monitor action runs** regularly
5. **Update dependencies** periodically

### Monitoring
Set up notifications for failed workflows:
- Repository Settings → Notifications
- Enable "Actions" notifications
- Choose email or web notifications

This ensures you're alerted when badge generation fails.