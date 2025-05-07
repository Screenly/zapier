# Contributing to Screenly Zapier Integration

Thank you for your interest in contributing to the Screenly Zapier Integration! This document provides guidelines and steps for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/zapier
   cd zapier
   ```
3. Install dependencies:
   ```bash
   npm install
   ```

## Development Environment

- Node.js (LTS version recommended)
- npm (comes with Node.js)
- Zapier CLI:
  ```bash
  npm install -g zapier-platform-cli
  ```

## Development Workflow

1. Create a new branch for your feature/fix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

1. Make your changes and ensure:

   - All tests pass: `npm test`
   - Code is properly linted: `npm run lint`
   - Security audit passes: `npm audit`

1. Commit your changes:
   ```bash
   git commit -m "feat: add new feature"
   ```
   Please follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

## Testing

- Write unit tests for new features
- Ensure existing tests pass
- Run tests: `npm test`

## Code Style

- Follow JavaScript Standard Style
- Use ES6+ features
- Keep code modular and reusable

## Pull Request Process

1. Update the `README.md` with details of changes if applicable
1. Update the documentation if needed
1. Ensure all tests pass and coverage requirements are met
1. Create a Pull Request with a clear title and description
1. Link any relevant issues
1. Link the pull request to at least one of the following labels:
   - `bug`
   - `enhancement`
   - `documentation`
   - `chore`

## Working with the Screenly API

- Reference the [Screenly API documentation](https://developer.screenly.io/api_v4/)
- Follow API best practices and rate limiting guidelines

## Release Process

1. The maintainers will review your PR
1. Once approved, it will be merged to main
1. Releases are created following semantic versioning

## Questions or Problems?

- Open an issue in the repository
- Tag it appropriately (bug, enhancement, question, etc.)
- Provide as much context as possible
