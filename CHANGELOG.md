# Changelog

All notable changes to the Kiro Task Badge Generator will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial release of Kiro Task Badge Generator
- Automatic scanning of `.kiro/specs/*/tasks.md` files
- Generation of Shields.io-compatible JSON badges
- Support for both global and per-spec badges
- GitHub Actions integration with minimal configuration
- Comprehensive documentation and usage examples

### Features
- **Task Scanning**: Recursively scans Kiro spec directories for task files
- **Badge Generation**: Creates JSON files compatible with Shields.io dynamic badges
- **Color Coding**: Automatic color assignment based on completion percentage
  - Green (100% complete)
  - Yellow (1-99% complete) 
  - Red (0% complete)
- **Multiple Badge Types**:
  - Global badge covering all specs in repository
  - Individual badges for each spec
- **Error Handling**: Graceful handling of missing files and malformed content
- **Git Integration**: Automatic committing of badge files to repository

### Technical Details
- Built with TypeScript and Node.js 24
- Uses GitHub Actions toolkit (@actions/core, @actions/github)
- Comprehensive test suite with Vitest
- ESLint and Prettier for code quality
- Bundled distribution for GitHub Actions

## [1.0.0] - TBD

### Added
- Initial stable release
- Complete documentation suite
- Production-ready GitHub Action
- Marketplace publication

---

## Release Notes Template

For future releases, use this template:

## [X.Y.Z] - YYYY-MM-DD

### Added
- New features and capabilities

### Changed
- Changes to existing functionality

### Deprecated
- Features that will be removed in future versions

### Removed
- Features that have been removed

### Fixed
- Bug fixes and corrections

### Security
- Security-related changes and fixes

---

## Version History

- **v1.0.0**: Initial stable release with core functionality
- **v0.1.0**: Development version with basic features

## Migration Guide

### From v0.x to v1.0

No breaking changes expected for the initial stable release.

## Support

For questions about releases or upgrade issues:
- Check the [README.md](README.md) for current documentation
- Review [GitHub Issues](https://github.com/kiro/kiro-task-badge-generator/issues) for known problems
- Create a new issue if you encounter problems during upgrade