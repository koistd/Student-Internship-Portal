import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const requiredFirebaseVariables = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const missing = requiredFirebaseVariables.filter((name) => !env[name])
  if (missing.length) {
    throw new Error(`Missing Firebase configuration: ${missing.join(', ')}. Configure frontend/.env before building.`)
  }

  return {
    plugins: [react()],
    server: { port: 3000 },
  }
})
