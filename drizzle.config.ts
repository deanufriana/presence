import { defineConfig } from 'drizzle-kit'
import os from 'os'
import path from 'path'

const getDbPath = () => {
  const home = os.homedir()
  switch (os.platform()) {
    case 'win32':
      return path.join(home, 'AppData', 'Roaming', 'com.presence', 'presence.db')
    case 'darwin':
      return path.join(home, 'Library', 'Application Support', 'com.presence', 'presence.db')
    default:
      return path.join(home, '.local', 'share', 'com.presence', 'presence.db')
  }
}

const dbPath = getDbPath()

export default defineConfig({
  schema: './app/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbPath,
  },
})
