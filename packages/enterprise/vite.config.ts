import type { PluginOption } from "vite"
import { defineConfig } from "vite"
import { solidStart } from "@solidjs/start/config"
import { nitro } from "nitro/vite"
import tailwindcss from "@tailwindcss/vite"
import solidPlugin from "vite-plugin-solid"
import { compression } from "vite-plugin-compression"
import { tanstackVirtual } from "@tanstack/virtual-plugin"

const nitroConfig: any = (() => {
  const target = process.env.ANYMOUS_DEPLOYMENT_TARGET
  if (target === "cloudflare") {
    return {
      compatibilityDate: "2024-09-19",
      preset: "cloudflare-module",
      cloudflare: {
        nodeCompat: true,
      },
    }
  }
  return {}
})()

export default defineConfig({
  plugins: [
    tailwindcss(),
    solidPlugin({
      reactivity: "fine-grained",
    }),
    tanstackVirtual(),
    compression({
      algorithm: "gzip",
      threshold: 1024,
    }),
  ],
  build: {
    target: "esnext",
    minify: "esbuild",
    esbuild: {
      drop: ["console", "debugger"],
    },
    sourcemap: "hidden",
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true,
    port: 3002,
  },
  worker: {
    format: "es",
  },
})
