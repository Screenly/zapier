'use strict';

require('./setup.visual');
const puppeteer = require('puppeteer');

// Skip all visual tests if not in CI environment
const describeVisual = process.env.CI ? describe : describe.skip;

describeVisual('Zapier Visual Tests', () => {
  /** @type {import('puppeteer').Browser} */
  let browser;
  /** @type {import('puppeteer').Page} */
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1280,800',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
      ],
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 1280,
        height: 800,
        deviceScaleFactor: 1,
      },
    });
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  beforeEach(async () => {
    if (!browser) {
      throw new Error('Browser not initialized');
    }
    page = await browser.newPage();
    await page.setDefaultNavigationTimeout(5000);
    await page.setDefaultTimeout(5000);
  });

  afterEach(async () => {
    if (page) {
      await page.close();
    }
  });

  test('Upload Asset Form', async () => {
    // Mock Zapier's form rendering
    await page.setContent(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; }
            input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            button { padding: 10px 20px; background: #136bf5; color: white; border: none; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h2>Upload Asset to Screenly</h2>
          <div class="form-group">
            <label for="file">File URL</label>
            <input type="text" id="file" placeholder="https://example.com/image.jpg" />
          </div>
          <div class="form-group">
            <label for="title">Title</label>
            <input type="text" id="title" placeholder="Asset Title" />
          </div>
          <div class="form-group">
            <label for="duration">Duration (seconds)</label>
            <input type="number" id="duration" value="10" />
          </div>
          <div class="form-group">
            <label for="playlist">Playlist</label>
            <select id="playlist">
              <option value="">Select a playlist...</option>
              <option value="playlist-1">Main Playlist</option>
              <option value="playlist-2">Marketing Campaign</option>
            </select>
          </div>
          <button type="submit">Upload to Screenly</button>
        </body>
      </html>
    `);

    // Take a screenshot of the form
    const screenshot = await page.screenshot({
      type: 'png',
      encoding: null,
      omitBackground: true,
      fullPage: true,
    });
    expect(Buffer.from(screenshot)).toMatchImageSnapshot();
  });

  test('Complete Workflow Form', async () => {
    await page.setContent(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; }
            input, select { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
            button { padding: 10px 20px; background: #136bf5; color: white; border: none; border-radius: 4px; }
            .schedule-group { border: 1px solid #eee; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h2>Complete Digital Signage Workflow</h2>
          <div class="form-group">
            <label for="file">File URL</label>
            <input type="text" id="file" placeholder="https://example.com/image.jpg" />
          </div>
          <div class="form-group">
            <label for="title">Title</label>
            <input type="text" id="title" placeholder="Asset Title" />
          </div>
          <div class="schedule-group">
            <h3>Scheduling</h3>
            <div class="form-group">
              <label for="start_date">Start Date</label>
              <input type="datetime-local" id="start_date" />
            </div>
            <div class="form-group">
              <label for="end_date">End Date</label>
              <input type="datetime-local" id="end_date" />
            </div>
          </div>
          <div class="form-group">
            <label for="playlist">Playlist</label>
            <select id="playlist">
              <option value="">Create New Playlist</option>
              <option value="playlist-1">Main Playlist</option>
              <option value="playlist-2">Marketing Campaign</option>
            </select>
          </div>
          <div class="form-group">
            <label for="screen">Target Screen</label>
            <select id="screen">
              <option value="">Select a screen...</option>
              <option value="screen-1">Lobby Display</option>
              <option value="screen-2">Meeting Room</option>
              <option value="screen-3">Cafeteria</option>
            </select>
          </div>
          <button type="submit">Start Workflow</button>
        </body>
      </html>
    `);

    // Take a screenshot of the complete workflow form
    const screenshot = await page.screenshot({
      type: 'png',
      encoding: null,
      omitBackground: true,
      fullPage: true,
    });
    expect(Buffer.from(screenshot)).toMatchImageSnapshot();
  });

  test('Cleanup Confirmation Form', async () => {
    await page.setContent(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .form-group { margin-bottom: 15px; }
            label { display: block; margin-bottom: 5px; }
            .warning { color: #d73a49; margin-bottom: 20px; }
            button { padding: 10px 20px; background: #d73a49; color: white; border: none; border-radius: 4px; }
            .checkbox-group { display: flex; align-items: center; gap: 10px; }
            input[type="checkbox"] { width: auto; }
          </style>
        </head>
        <body>
          <h2>Clean Up Zapier Content</h2>
          <p class="warning">⚠️ Warning: This action will remove all content created by Zapier</p>
          <div class="form-group">
            <div class="checkbox-group">
              <input type="checkbox" id="confirm" />
              <label for="confirm">I understand this will permanently delete Zapier-created content</label>
            </div>
          </div>
          <button type="submit">Clean Up Content</button>
        </body>
      </html>
    `);

    // Take a screenshot of the cleanup confirmation form
    const screenshot = await page.screenshot({
      type: 'png',
      encoding: null,
      omitBackground: true,
      fullPage: true,
    });
    expect(Buffer.from(screenshot)).toMatchImageSnapshot();
  });
});
