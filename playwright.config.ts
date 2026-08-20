import { defineConfig, devices } from '@playwright/test';

// Avoid common dev ports (3000/3015) because this repo may have long-running services.
const fallbackPort = 43000;
const envPort = process.env.PLAYWRIGHT_PORT;
const baseURL = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${envPort || fallbackPort}`;
const resolvedPort = Number(envPort || new URL(baseURL).port || fallbackPort);
const fleetFixturePort = 43001;
const smokeToken = process.env.VD_EDITOR_SMOKE_TOKEN || 'playwright';
const reuseExistingServer = process.env.PLAYWRIGHT_REUSE_SERVER === '1' && !process.env.CI;

export default defineConfig({
  testDir: 'tests/visual',
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFilePath}/{arg}-{projectName}{ext}',
  timeout: 60_000,
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0 }
  },
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    extraHTTPHeaders: {
      'x-vd-editor-smoke': smokeToken
    }
  },
  webServer: [
    {
      command: `bun run tests/fixtures/fleet-status-server.ts --port ${fleetFixturePort}`,
      url: `http://127.0.0.1:${fleetFixturePort}/admin/fleet/api/status`,
      reuseExistingServer,
      timeout: 30_000
    },
    {
      command:
        `MONGODB_URI= VD_EDITOR_SMOKE_TOKEN=${smokeToken} VD_ALLOW_EDITOR_SMOKE_IN_PRODUCTION=true ` +
        `VD_INSTALLER_ADMINS=editor-smoke@local ` +
        `VD_FLEET_STATUS_URL=http://127.0.0.1:${fleetFixturePort}/admin/fleet/api/status ` +
        `VD_DISABLE_ANALYTICS=true bun run start -- -p ${resolvedPort}`,
      port: resolvedPort,
      reuseExistingServer,
      timeout: 120_000
    }
  ],
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }
      }
    },
    {
      name: 'mobile',
      use: {
        ...devices['iPhone 13']
      }
    }
  ]
});
