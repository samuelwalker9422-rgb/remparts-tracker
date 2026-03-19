import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // In dev, /api/scores → LeagueStat directly (avoids CORS)
      '/api/scores': {
        target: 'https://cluster.leaguestat.com',
        changeOrigin: true,
        rewrite: () =>
          '/feed/?feed=modulekit&view=scorebar' +
          '&key=f1aa699db3d81487&client_code=lhjmq&site_id=2&lang_id=1',
      },
    },
  },
})
