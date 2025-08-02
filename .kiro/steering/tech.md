# Technology Stack

## Runtime Environment
- **Platform**: GitHub Actions (Node.js 24)
- **Language**: TypeScript
- **Target**: Node.js GitHub Actions runtime

## Build System
- **Compiler**: TypeScript compiler (tsc)
- **Bundling**: Required for GitHub Actions distribution
- **Output**: Single `dist/index.js` file with bundled dependencies

## Key Dependencies
- Node.js built-in modules (`fs`, `path`)
- GitHub Actions toolkit (@actions/core, @actions/github)
- Git operations for committing badge files
- Markdown parsing for task file analysis

## Common Commands
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Package for distribution
npm run package

# Lint code
npm run lint
```

## GitHub Actions Configuration
- **Metadata**: `action.yml` file defines inputs, outputs, and runtime
- **Main Entry**: Points to `dist/index.js`
- **Permissions**: Requires `contents: write` for committing badge files
- **Triggers**: Typically on push/PR to `.kiro/specs/**/tasks.md` files

## Output Format
- **Badge Data**: JSON files compatible with Shields.io dynamic badges
- **Schema**: `{schemaVersion: 1, label: string, message: string, color: string}`
- **Colors**: `brightgreen` (100%), `yellow` (1-99%), `red` (0%)