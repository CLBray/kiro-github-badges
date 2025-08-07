# Project Structure

## Root Directory Layout
```
├── .kiro/                    # Kiro configuration and specs
│   ├── specs/               # Project specifications
│   └── steering/            # AI assistant guidance rules
├── .vscode/                 # VS Code configuration
├── src/                     # TypeScript source code
├── dist/                    # Compiled JavaScript for distribution
├── tests/                   # Test files
├── action.yml               # GitHub Action metadata
├── package.json             # Node.js dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Source Code Organization
```
src/
├── index.ts                 # Main entry point for GitHub Action
├── task-scanner.ts          # Scans and parses Kiro task files
├── json-generator.ts        # Generates Shields.io compatible JSON
├── git-committer.ts         # Handles git operations and commits
└── types.ts                 # TypeScript type definitions
```

## Kiro Specifications Structure
```
.kiro/specs/
└── github-kiro-static-badge/
    ├── requirements.md      # Feature requirements
    ├── design.md           # Technical design document
    └── tasks.md            # Implementation tasks (tracked by badges)
```

## Output Files
- **Global Badge**: `.kiro/badges/badge-data-all.json` (covers all specs)
- **Spec Badges**: `.kiro/badges/{spec-name}-badge-data.json` (per-spec)

## Key Conventions
- Task files must be named `tasks.md` within spec directories
- Checkbox syntax: `- [x]` (completed), `- [ ]` (incomplete)
- Badge files are auto-generated and should not be manually edited
- All source code in TypeScript, compiled to single bundled JS file
- Tests should mirror source structure in `tests/` directory