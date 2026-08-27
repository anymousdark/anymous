#!/usr/bin/env bun
// Syncs the version badge in site/index.html with the npm package version.
// Usage: bun run script/sync-site-version.ts

import path from "path"
import fs from "fs"

const root = path.resolve(import.meta.dir, "..")
const sitePath = path.resolve(root, "../..", "site", "index.html")

// Read version from the generated npm package (written by prepare-npm.ts)
const distPkgPath = path.join(root, "dist-npm", "package.json")
const distPkg = await Bun.file(distPkgPath).text()
const version = JSON.parse(distPkg).version as string

if (!(await Bun.file(sitePath).exists())) {
  console.warn(`site/index.html not found at ${sitePath} — skipping`)
  process.exit(0)
}

const html = await Bun.file(sitePath).text()

// Replace any version badge (vX.Y.Z, including preview like v0.0.0-...)
// with the current published version.
const updated = html.replace(/v\d+\.\d+\.\d+[^\s"<]*/g, `v${version}`)

if (updated === html) {
  console.log(`No badge update needed (already v${version})`)
} else {
  await Bun.write(sitePath, updated)
  console.log(`Updated site/index.html badge to v${version}`)
}
