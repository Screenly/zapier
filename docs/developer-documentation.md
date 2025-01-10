# Developer Documentation

## Prerequisites

- Node.js 20.x
- npm
- A Screenly account with API access

## Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up pre-commit hooks:

   ```bash
   # Install husky and lint-staged
   npm install -D husky lint-staged

   # Initialize husky
   npm run prepare

   # Add pre-commit hook
   npx husky add .husky/pre-commit "npm test && npm run lint"

   # Install linting tools
   npm install -D eslint prettier markdownlint-cli
   ```

3. Configure your Screenly API key:
   - Get your API key from Screenly. For instructions on how to get your API key,
     see this [guide](https://support.screenly.io/hc/en-us/articles/35897560148371-How-to-Generate-a-Screenly-API-Token).
   - When setting up the Zapier integration, you'll be prompted to enter this API key

## Available Scripts

- `npm test` - Run unit tests with coverage
- `npm run test:watch` - Run tests in watch mode
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run clean` - Clean up generated files
- `npm run prepare` - Install git hooks (runs automatically after npm install)

Visual tests are only run in CI environment:

- `npm run test:visual` - Displays information about visual tests
- `npm run test:visual:ci` - Runs visual tests (CI only)

## Code Quality

The project uses several tools to ensure code quality:

- **ESLint** - For code linting
- **Prettier** - For code formatting
- **Jest** - For testing
- **Husky** - For git hooks
- **lint-staged** - For running checks on staged files
- **markdownlint** - For markdown formatting

These run automatically on commit, but you can also run them manually:

```bash
npm run lint    # Check code style
npm run format  # Fix code formatting
```

## Git Hooks

Pre-commit hooks are set up to:

- Run unit tests
- Lint JavaScript files
- Format code with Prettier
- Check markdown formatting
- Run tests

The hooks are configured in:

- `.husky/pre-commit` - Hook scripts
- `package.json` - lint-staged configuration
- `.eslintrc.js` - ESLint rules
- `.prettierrc` - Prettier configuration
- `.markdownlint.json` - Markdown linting rules

## Visual Testing

Visual tests are automatically run in CI and generate screenshots of:

- Upload Asset Form
- Complete Workflow Form
- Cleanup Confirmation Form

These tests are skipped locally to avoid environment-specific issues.

## Best Practices

1. **Dependency Management**

   - Never edit package-lock.json manually
   - Use npm commands to manage dependencies:

   ```bash
   npm install <package>        # Add dependency
   npm install -D <package>     # Add dev dependency
   npm update <package>         # Update package
   npm uninstall <package>      # Remove package
   ```

2. **Code Style**

   - ESLint and Prettier are configured
   - Formatting is automatically handled on commit
   - Run `npm run format` to manually format code

3. **Testing**

   - Maintain test coverage above 80%
   - Write tests for new features
   - Visual tests are CI-only

4. **Git Workflow**
   - Commits are automatically linted
   - Visual tests run on pull requests
   - CI checks must pass before merge

## Deployment

The integration is automatically deployed to Zapier when a new version tag is pushed to GitHub.

1. Create and push a new version tag:

   ```bash
   git tag -a v0.4.0 -m "New release"
   git push origin v0.4.0
   ```

2. The GitHub Action will:
   - Run tests
   - Deploy to Zapier

## Setting up Zapier Deployment

1. Get your Zapier Deploy Key:

   ```bash
   zapier login
   zapier register "Screenly"  # Only needed for first-time setup
   ```

2. Add the deploy key to GitHub:
   - Go to your repository's Settings > Secrets > Actions
   - Add a new secret named `ZAPIER_DEPLOY_KEY`
   - Paste your deploy key as the value

## Version Management

- Use semantic versioning (MAJOR.MINOR.PATCH)
- Tag format: `v*.*.*` (e.g., v0.4.0, v1.0.0)
- Pre-release versions: Use `-beta`, `-alpha` suffixes

## License

See [LICENSE](/LICENSE) file for details.