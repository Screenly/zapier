# Screenly Zapier Integration

[![Test](https://github.com/screenly/zapier/actions/workflows/test.yml/badge.svg?branch=master)](https://github.com/screenly/zapier/actions/workflows/test.yml)

A Zapier integration for automating Screenly operations.

## Features

* Upload assets to your Screenly account
* Add assets to playlists with optional scheduling
* Assign screens to playlists
* Dynamic dropdowns for playlists, assets, and screens
* Automatic cleanup of Zapier-created content

## Prerequisites

* Node.js 16.x or 18.x
* npm
* A Screenly account with API access

## Installation

1. Install dependencies:

```bash
npm install
```

2. Configure your Screenly API key:
   * Get your API key from [Screenly Settings](https://app.screenlyapp.com/settings/api-keys)
   * When setting up the Zapier integration, you'll be prompted to enter this API key

## Development

### Available Scripts

* `npm test` - Run unit tests with coverage
* `npm run test:watch` - Run tests in watch mode
* `npm run lint` - Run ESLint
* `npm run format` - Format code with Prettier
* `npm run clean` - Clean up generated files
* `npm run prepare` - Install git hooks (runs automatically after npm install)

Visual tests are only run in CI environment:
* `npm run test:visual` - Displays information about visual tests
* `npm run test:visual:ci` - Runs visual tests (CI only)

### Code Quality

The project uses several tools to ensure code quality:

* **ESLint** - For code linting
* **Prettier** - For code formatting
* **Jest** - For testing
* **Husky** - For git hooks
* **lint-staged** - For running checks on staged files

These run automatically on commit, but you can also run them manually:

```bash
npm run lint    # Check code style
npm run format  # Fix code formatting
```

### Git Hooks

Pre-commit hooks are set up to:
* Lint JavaScript files
* Format code with Prettier
* Run tests

### Visual Testing

Visual tests are automatically run in CI and generate screenshots of:
* Upload Asset Form
* Complete Workflow Form
* Cleanup Confirmation Form

These tests are skipped locally to avoid environment-specific issues.

### SharePoint Integration Guide

### File Storage Setup

#### Document Libraries
1. **Digital Signage Root Library**
   * Create a dedicated SharePoint document library for digital signage content
   * Example structure: `Digital-Signage-Content`

2. **Playlist-Specific Libraries**
   * Separate libraries for different content types
   * Examples:
     * `DS-Announcements`
     * `DS-Marketing`
     * `DS-Events`
     * `DS-Emergency`

3. **Location-Based Libraries**
   * Organize by physical location
   * Examples:
     * `DS-HeadOffice`
     * `DS-Branches`
     * `DS-RetailStores`

### SharePoint Column Configuration

1. **Required Columns**
   * `Duration` (Number) - Asset display duration in seconds
   * `TargetScreen` (Choice) - Screen identifier
   * `StartDate` (DateTime) - When to start displaying
   * `EndDate` (DateTime) - When to stop displaying

2. **Optional Columns**
   * `ContentType` (Choice) - Image, Video, URL
   * `Priority` (Number) - Display priority
   * `Department` (Choice) - Content owner
   * `Location` (Choice) - Target location

### Zap Templates

1. **Basic File Upload**
yaml
Trigger: SharePoint - New file in Digital-Signage-Content
Action: Screenly - Upload Asset
```

2. **Scheduled Content**
```yaml
Trigger: SharePoint - New file with metadata
Action 1: Screenly - Upload Asset
Action 2: Screenly - Add to Playlist (using SharePoint columns)
```

3. **Location-Based Distribution**
```yaml
Trigger: SharePoint - New file in location folder
Filter: Location column matches target
Action: Screenly - Complete Workflow
```

4. **Emergency Broadcast**
```yaml
Trigger: SharePoint - New file in DS-Emergency
Action: Screenly - Complete Workflow (high priority)
```

### Best Practices for SharePoint Storage

1. **File Organization**
   * Use consistent folder structures
   * Implement clear naming conventions
   * Set up content types for different media

2. **Permission Management**
   * Create dedicated SharePoint groups for content managers
   * Use view-only permissions for general staff
   * Set up approval workflows for sensitive content

3. **Content Lifecycle**
   * Configure version history
   * Set up retention policies
   * Use SharePoint workflows for content approval

4. **Metadata Management**
   * Use managed metadata for consistent tagging
   * Set up default values for common fields
   * Make important fields required

### Example SharePoint Views

1. **Content Calendar View**
   * Group by start date
   * Filter by active content
   * Show duration and target screens

2. **Location Manager View**
   * Group by location
   * Filter by department
   * Show status and schedule

3. **Expiration Monitor View**
   * Sort by end date
   * Filter for content ending soon
   * Highlight expired content

### Automation Tips

1. **Power Automate Integration**
   * Auto-tag files based on library
   * Set default metadata
   * Trigger cleanup workflows

2. **Content Validation**
   * Check file types
   * Verify required metadata
   * Validate scheduling conflicts

3. **Reporting**
   * Track content usage
   * Monitor screen assignments
   * Audit content changes

### Best Practices

1. **Dependency Management**
   * Never edit package-lock.json manually
   * Use npm commands to manage dependencies:
     ```bash
     npm install <package>        # Add dependency
     npm install -D <package>     # Add dev dependency
     npm update <package>         # Update package
     npm uninstall <package>      # Remove package
     ```

2. **Code Style**
   * ESLint and Prettier are configured
   * Formatting is automatically handled on commit
   * Run `npm run format` to manually format code

3. **Testing**
   * Maintain test coverage above 80%
   * Write tests for new features
   * Visual tests are CI-only

4. **Git Workflow**
   * Commits are automatically linted
   * Visual tests run on pull requests
   * CI checks must pass before merge

## Available Actions

### Upload Asset

Upload a new asset to your Screenly account:

* File upload via URL
* Custom title
* Duration setting (optional, defaults to 10 seconds)

### Add Asset to Playlist

Add an asset to a playlist with optional scheduling:

* Select from existing playlists
* Select from existing assets
* Set asset duration
* Optional date range scheduling (start/end dates)

### Assign Screen to Playlist

Assign a screen to play a specific playlist:

* Select from available screens
* Select from available playlists
* Instant updates to screen assignments

## Security

* API keys are stored securely by Zapier
* All API requests are made over HTTPS
* The integration follows Zapier's security best practices

## License

See [LICENSE](LICENSE) file for details.

## Example Integrations

### Cloud Storage Integrations

#### Dropbox
1. **Simple Asset Upload**
   * Trigger: New file in Dropbox folder
   * Action: Upload to Screenly
   * Use Case: Quickly add new content to your Screenly library

2. **Automated Playlist Management**
   * Trigger: New file in specific Dropbox folder
   * Action: Complete Workflow (Upload + Playlist + Screen)
   * Use Case: Different folders map to different screens/playlists

#### Box
1. **Content Library Management**
   * Trigger: New file in Box folder
   * Action: Upload to Screenly with metadata
   * Use Case: Use Box metadata for asset scheduling

2. **Multi-Screen Campaign**
   * Trigger: New file with specific tag in Box
   * Action: Complete Workflow
   * Use Case: Marketing campaigns across multiple screens

#### SharePoint
1. **Corporate Communications**
   * Trigger: New file in SharePoint document library
   * Action: Complete Workflow
   * Use Case: Display company announcements on office screens

2. **Department-Specific Content**
   * Trigger: New file in department SharePoint folder
   * Action: Upload + Add to Department Playlist
   * Use Case: Each department manages their own digital signage content

3. **Event Display Management**
   * Trigger: New item in SharePoint Events list
   * Action: Complete Workflow with scheduling
   * Use Case: Automatically display event information during relevant times

4. **Multi-Location Content Distribution**
   * Trigger: New file in SharePoint with location metadata
   * Action: Complete Workflow with screen selection
   * Use Case: Distribute content to specific office locations based on SharePoint metadata

### Automated Maintenance

1. **Content Cleanup**
   * Trigger: Schedule (e.g., weekly)
   * Action: Cleanup Zapier Content
   * Use Case: Maintain a clean asset library by removing old content

2. **Content Rotation**
   * Trigger: Schedule or SharePoint/Dropbox/Box update
   * Action: Complete Workflow with end dates
   * Use Case: Automatically rotate content based on schedules