import { fileURLToPath, URL } from "node:url"
import { quasar, transformAssetUrls } from "@quasar/vite-plugin"
import Vue from "@vitejs/plugin-vue"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

// https://vite.dev/config/
export default defineConfig({
  // TM: important when deploying not into the webserver root dir
  base: "/timer/",
  build: {
    chunkSizeWarningLimit: 600,
    // match browserslist (iOS/Safari >= 15); Vite default is safari16.4
    target: ["chrome111", "edge111", "firefox114", "safari15", "ios15"],
  },
  plugins: [
    Vue({ template: { transformAssetUrls } }),
    quasar(),
    VitePWA({
      registerType: "prompt",
      workbox: { globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"] },
      manifest: {
        name: "Timer: Anticipation, Workout, ETA, Multi-Timer, Stopwatch, Pomodoro",
        short_name: "Timer",
        description:
          "Timer toolbox: countdown to events, interval workout, ETA estimation, multiple countdown timers, multi-athlete lap stopwatch, meeting cost meter and Pomodoro timer.",
        icons: [
          {
            src: "icons/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
          },
          { src: "icons/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        theme_color: "#1976d2",
      },
    }),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  preview: { host: true, port: 4173, strictPort: true },
  server: { host: true, port: 5173, strictPort: true },
})
