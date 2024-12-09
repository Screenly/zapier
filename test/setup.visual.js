'use strict';

const { configureToMatchImageSnapshot } = require('jest-image-snapshot');

const toMatchImageSnapshot = configureToMatchImageSnapshot({
  // Increase threshold for CI environments where rendering might differ slightly
  failureThreshold: 0.01,
  failureThresholdType: 'percent',
  // Store snapshots in a dedicated directory
  customSnapshotsDir: '__image_snapshots__',
  // Add CI environment indicator to snapshot names
  customSnapshotIdentifier: ({ currentTestName, counter }) => {
    const ci = process.env.CI ? 'ci-' : '';
    return `${ci}${currentTestName}-${counter}`;
  },
  // Better error handling
  updatePassedSnapshot: false,
  blur: 2,
  allowSizeMismatch: true,
});

expect.extend({ toMatchImageSnapshot });

// Increase Jest timeout for visual tests
jest.setTimeout(30000);
