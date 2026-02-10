import { defineConfig } from '@playwright/test'
import path from 'path'
import os from 'os'
import fs from 'fs'

const testDbPath = path.join(os.tmpdir(), 'lumina-e2e-test.sqlite')

function findBunPath(): string {
  const candidates = [
    path.join(os.homedir(), '.bun', 'bin', 'bun.exe'),
    path.join(os.homedir(), '.bun', 'bin', 'bun'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return 'bun'
}

const bunPath = findBunPath()

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `"${bunPath}" --bun next dev --turbopack`,
    port: 3000,
    reuseExistingServer: !process.env.CI,
    env: {
      DATABASE_PATH: testDbPath,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
})
