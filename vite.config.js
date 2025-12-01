import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate', // Met à jour l'app automatiquement
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'LoL Guess The Item',
        short_name: 'LoL Quiz',
        description: 'Devine les stats des objets de League of Legends',
        theme_color: '#091428', // La couleur de la barre de statut (batterie/wifi)
        background_color: '#091428',
        display: 'standalone', // Enlève la barre d'URL du navigateur
        orientation: 'portrait', // Force le mode portrait sur mobile
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Pour les icônes rondes (Android)
          }
        ]
      }
    })
  ],
})