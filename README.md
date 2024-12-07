# Screenly Zapier Integration

[![Test](
  https://github.com/screenly/zapier/actions/workflows/test.yml/badge.svg?branch=master
)](
  https://github.com/screenly/zapier/actions/workflows/test.yml
)

A Zapier integration for automating Screenly digital signage operations. Connect your
Screenly displays with 5000+ apps.

## Quick Start

1. **Install the Integration**

   * Go to [Zapier's Screenly Integration](
     https://zapier.com/apps/screenly/integrations
     ) page
   * Click "Connect Screenly"
   * When prompted, enter your Screenly API key from
     [Screenly Settings](https://app.screenlyapp.com/settings/api-keys)

2. **Create Your First Zap**

   * Click "Make a Zap"
   * Choose your trigger app (e.g., Dropbox, SharePoint, Google Drive)
   * Choose Screenly as your action app
   * Select one of these actions:
     * Upload Asset - Add new content to your Screenly library
     * Add to Playlist - Add content to a specific playlist
     * Complete Workflow - Upload, add to playlist, and assign to screens

3. **Example: Auto-Upload from Dropbox**

   * Trigger: New file in Dropbox folder
   * Action: Screenly - Upload Asset
   * Test your Zap and turn it on

## Available Actions

### 1. Upload Asset

Upload files to your Screenly account:

* Supports images, videos, and URLs
* Set custom titles and durations
* Accepts files via URL or direct upload

### 2. Add to Playlist

Add content to your playlists:

* Choose from your existing playlists
* Set display duration
* Schedule content with start/end dates
* Select target screens

### 3. Complete Workflow

Do everything in one step:

* Upload new content
* Add to playlist
* Assign to screens
* Set schedule
* Perfect for automated content management

### 4. Cleanup

Maintain your content library:

* Remove Zapier-created content
* Automatic cleanup based on rules
* Safe deletion with confirmation

### 5. Enable/Disable Playlist

Control playlist visibility dynamically:

* Enable or disable playlists based on conditions
* Schedule playlist activation periods
* Perfect for:
  * Weather-based content
  * Time-sensitive promotions
  * Event-driven displays
  * Seasonal campaigns

## Common Use Cases

1. **Automated Content Updates**
   * Connect Dropbox/Google Drive/SharePoint
   * New files automatically appear on screens
   * Perfect for marketing teams

2. **Scheduled Displays**
   * Show content during specific times
   * Automate weekly/monthly updates
   * Event-based content management

3. **Multi-Screen Management**
   * Different content for different locations
   * Department-specific displays
   * Emergency broadcast system

4. **Content Library Management**
   * Automatic file organization
   * Scheduled content rotation
   * Cleanup old content

5. **Weather-Based Dynamic Content**
   * **Example: Smart Weather-Driven Displays**
     * Use Weather API as trigger (hourly check)
     * **Temperature-Based Content:**
       * When temperature > 20°C:
         * Enable "Summer Treats" playlist (ice cream, cold drinks)
         * Disable "Winter Warmers" playlist
       * When temperature < 0°C:
         * Enable "Winter Warmers" playlist (hot chocolate, soups)
         * Disable "Summer Treats" playlist
     * **Rain-Based Content:**
       * When it's raining:
         * Enable "Rainy Day Specials" playlist (umbrellas, raincoats)
         * Show "Stay Dry" promotions
       * When rain stops:
         * Return to default seasonal playlist
         * Disable rain-specific promotions
   * **Setup Steps:**
     1. Create weather-specific playlists in Screenly:
        * "Summer Treats" - cold items
        * "Winter Warmers" - hot items
        * "Rainy Day Specials" - weather protection items
     2. In Zapier:
        * Trigger: Weather by Zapier (check every hour)
        * Filter 1: Temperature conditions
        * Filter 2: Precipitation conditions
        * Actions:
          * Enable/Disable appropriate playlists
          * Update content based on current conditions
   * **Benefits:**
     * Automatically adapt to multiple weather conditions
     * Increase sales with contextual promotions
     * Show relevant products at the right time
     * Create urgency with weather-specific offers
     * No manual playlist management needed

## Security

* API keys are stored securely by Zapier
* All API requests are made over HTTPS
* The integration follows Zapier's security best practices

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

---

## Developer Documentation

### Prerequisites

* Node.js 20.x
* npm
* A Screenly account with API access

### Installation

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
   * Get your API key from [Screenly Settings](https://app.screenlyapp.com/settings/api-keys)
   * When setting up the Zapier integration, you'll be prompted to enter this API key

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
* **markdownlint** - For markdown formatting

These run automatically on commit, but you can also run them manually:

```bash
npm run lint    # Check code style
npm run format  # Fix code formatting
```

### Git Hooks

Pre-commit hooks are set up to:

* Run unit tests
* Lint JavaScript files
* Format code with Prettier
* Check markdown formatting
* Run tests

The hooks are configured in:

* `.husky/pre-commit` - Hook scripts
* `package.json` - lint-staged configuration
* `.eslintrc.js` - ESLint rules
* `.prettierrc` - Prettier configuration
* `.markdownlint.json` - Markdown linting rules

### Visual Testing

Visual tests are automatically run in CI and generate screenshots of:

* Upload Asset Form
* Complete Workflow Form
* Cleanup Confirmation Form

These tests are skipped locally to avoid environment-specific issues.

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

### License

See [LICENSE](LICENSE) file for details.
