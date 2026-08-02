#!/usr/bin/env bun
// Syncs the version badge in site/index.html with the npm package version.
// Usage: bun run script/sync-site-version.ts

import path from "path"
import fs from "fs"

const root = path.resolve(import.meta.dir, "..")
const preparePath = path.join(root, "script", "prepare-npm.ts")
const sitePath = path.resolve(root, "../..", "site", "index.html")

// Read version from prepare-npm.ts (single source of truth for npm version)
const prepare = await Bun.file(preparePath).text()
const match = prepare.match(/version:\s*"([^"]+)"/)
if (!match) {
  console.error("Could not find version in prepare-npm.ts")
  process.exit(1)
}
const version = match[1]

if (!(await Bun.file(sitePath).exists())) {
  console.warn(`site/index.html not found at ${sitePath} — skipping`)
  process.exit(0)
}

const html = await Bun.file(sitePath).text()

// Replace any v1.x.x badge with the current version
const updated = html.replace(/v1\.\d+\.\d+/g, `v${version}`)

if (updated === html) {
  console.log(`No badge update needed (already v${version})`)
} else {
  await Bun.write(sitePath, updated)
  console.log(`Updated site/index.html badge to v${version}`)
}
