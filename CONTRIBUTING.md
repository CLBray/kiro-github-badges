# Contributing to Kiro Task Badge Generator

Thank you for your interest in contributing to the Kiro Task Badge Generator! This document provides guidelines and information for contributors.

## Development Setup

### Prerequisites

- Node.js 24 or higher
- npm or yarn package manager
- Git

### Getting Started

1. **Fork and clone the repository**:
   ```bash
   git clone https://github.com/CLBray/kiro-github-badges.git
   cd kiro-github-badges
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run tests to ensure everything works**:
   ```bash
   npm test
   ```

## Development Workflow

### Project Structure

```
├── src/                     # TypeScript source code
│   ├── index.ts            # Main entry point
│   ├── task-scanner.ts     # Task file scanning logic
│   ├── json-generator.ts   # Badge JSON generation
│   ├── git-committer.ts    # Git operations
│   └── types.ts            # Type definitions
├── tests/                  # Test files
├── dist/                   # Compiled output (auto-generated)
├── action.yml              # GitHub Action metadata
└── package.json            # Dependencies and scripts
```

### Available Scripts

```bash
# Development
npm run build          # Compile TypeScript
npm run package        # Bundle for GitHub Actions distribution
npm test              # Run tests
npm run test:coverage # Run tests with coverage report
npm run test:watch    # Run tests in watch mode

# Code Quality
npm run lint          # Check code style
npm run lint:fix      # Fix linting issues
npm run format        # Format code with Prettier

# Complete workflow
npm run all           # Build, package, test, and lint
```

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** in the `src/` directory

3. **Add or update tests** in the `tests/` directory

4. **Run the test suite**:
   ```bash
   npm test
   ```

5. **Build and package**:
   ```bash
   npm run build
   npm run package
   ```

6. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

### Testing

We use Vitest for testing. Tests should:

- Cover new functionality with unit tests
- Include integration tests for complex workflows
- Test error conditions and edge cases
- Maintain or improve code coverage

**Test file naming**: `*.test.ts` in the `tests/` directory

**Running specific tests**:
```bash
npm test -- task-scanner.test.ts
```

### Code Style

We use ESLint and Prettier for code formatting:

- **ESLint**: Enforces code quality rules
- **Prettier**: Handles code formatting
- **TypeScript**: Provides type safety

Run `npm run lint:fix` and `npm run format` before committing.

## Submitting Changes

### Pull Request Process

1. **Ensure your branch is up to date**:
   ```bash
   git checkout main
   git pull origin main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run the complete test suite**:
   ```bash
   npm run all
   ```

3. **Push your branch**:
   ```bash
   git push origin your-feature-branch
   ```

4. **Create a Pull Request** with:
   - Clear title describing the change
   - Detailed description of what was changed and why
   - Reference to any related issues
   - Screenshots or examples if applicable

### Pull Request Guidelines

- **One feature per PR**: Keep changes focused and atomic
- **Update documentation**: Include relevant documentation updates
- **Add tests**: Ensure new code is properly tested
- **Follow commit conventions**: Use conventional commit messages
- **Update changelog**: Add entry to CHANGELOG.md if applicable

### Commit Message Format

We follow the [Conventional Commits](https://conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer]
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(scanner): add support for nested task hierarchies
fix(git): handle authentication errors gracefully
docs(readme): update badge usage examples
test(integration): add end-to-end workflow tests
```

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs actual behavior
4. **Environment details**:
   - Node.js version
   - GitHub Actions runner OS
   - Repository structure
5. **Relevant logs** from GitHub Actions
6. **Example files** (task files, workflow YAML, etc.)

### Feature Requests

For feature requests, please provide:

1. **Use case description**: What problem does this solve?
2. **Proposed solution**: How should it work?
3. **Alternatives considered**: Other approaches you've thought about
4. **Additional context**: Screenshots, examples, etc.

## Code Guidelines

### TypeScript Best Practices

- Use strict TypeScript configuration
- Define interfaces for all data structures
- Avoid `any` type - use proper typing
- Use async/await for asynchronous operations
- Handle errors explicitly with try/catch blocks

### Error Handling

- Always handle potential errors gracefully
- Provide meaningful error messages
- Log errors with appropriate context
- Don't fail silently - surface issues to users

### Performance Considerations

- Minimize file system operations
- Use efficient algorithms for task parsing
- Cache results when appropriate
- Avoid blocking operations in the main thread

### Security Guidelines

- Never log sensitive information (tokens, credentials)
- Validate all inputs from external sources
- Use GitHub's security best practices for Actions
- Keep dependencies updated

## Release Process

Releases are handled by maintainers:

1. **Version bump** in package.json
2. **Update CHANGELOG.md** with release notes
3. **Create GitHub release** with tag
4. **Publish to GitHub Marketplace** (if applicable)

## Getting Help

- **Documentation**: Check README.md and this guide first
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Code Review**: Maintainers will review PRs and provide feedback

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold this code.

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- README acknowledgments section

Thank you for contributing to Kiro Task Badge Generator! 🎉