import type { Page } from '@playwright/test'

/**
 * Mocks Tauri APIs for the given page.
 * This allows the frontend to run in a standard browser environment
 * without the actual Tauri backend.
 */
declare global {
  interface Window {
    __TAURI__?: {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
    }
    __TAURI_PLUGIN_FS__?: Record<string, unknown>
    __TAURI_PLUGIN_DIALOG__?: Record<string, unknown>
  }
}

export async function mockTauri(page: Page) {
  await page.addInitScript(() => {
    // Mock the __TAURI__ global object
    window.__TAURI__ = {
      invoke: (cmd: string, args?: Record<string, unknown>) => {
        console.log(`[Tauri Mock] Invoke: ${cmd}`, args)
        // Default responses for common commands
        if (cmd === 'plugin:sql|execute' || cmd === 'plugin:sql|select') {
          return Promise.resolve([])
        }
        return Promise.resolve(null)
      },
    }

    // Mock specific plugins if needed
    window.__TAURI_PLUGIN_FS__ = {
      readTextFile: () => Promise.resolve(''),
      writeTextFile: () => Promise.resolve(),
    }

    window.__TAURI_PLUGIN_DIALOG__ = {
      save: () => Promise.resolve('/mock/path/file.txt'),
      open: () => Promise.resolve('/mock/path/file.txt'),
    }
  })
}
