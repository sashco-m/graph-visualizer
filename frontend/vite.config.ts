import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // crash if port 3000 is not available
    strictPort: true,
    // make the host available outside of the docker container
    host: true,
  }
})
