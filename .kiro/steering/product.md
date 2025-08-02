# Product Overview

This project is a GitHub Action called "Kiro Task Badge Generator" that automatically scans Kiro task files in repositories and generates Shields.io-compatible JSON badges to display task completion status.

## Core Functionality

- Scans `.kiro/specs/*/tasks.md` files to count completed vs total tasks
- Generates JSON files compatible with Shields.io dynamic badge service
- Creates both global badges (all specs) and individual spec badges
- Automatically commits badge data to repository when task files change
- Enables developers to display live task completion status in README files and documentation

## Key Features

- **Automated Badge Generation**: Triggers on task file changes via GitHub Actions
- **Multiple Badge Types**: Global repository badges and per-spec badges
- **Shields.io Integration**: Uses standard dynamic JSON badge format
- **Zero Configuration**: Minimal setup required, works with GitHub token
- **Error Resilient**: Gracefully handles missing files and malformed content

## Target Users

Developers using Kiro for project management who want to display task completion progress in their repository documentation through visual badges.