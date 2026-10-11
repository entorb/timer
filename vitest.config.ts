import { fileURLToPath } from "node:url"

import { configDefaults, defineConfig, mergeConfig } from "vitest/config"

import viteConfig from "./vite.config.ts"

// tests expect German local time, as in CI
process.env.TZ = "Europe/Berlin"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      environmentOptions: {
        jsdom: {
          url: "http://localhost/",
        },
      },
      setupFiles: ["./vitest.setup.ts"],
      server: {
        deps: {
          inline: ["quasar", "echarts", "vue-echarts"],
        },
      },
      exclude: [...configDefaults.exclude, "e2e/**"],
      root: fileURLToPath(new URL("./", import.meta.url)),
    },
  }),
)
