#!/usr/bin/env bun
// Prepares the anymous npm wrapper package.
// The CLI is distributed as native binaries per platform (anymous-<os>-<arch>),
// each built by script/build.ts. This script creates the wrapper package that
// selects and copies the right binary via postinstall.mjs.

import { $ } from "bun"
import path from "path"
import fs from "fs"
import { Script } from "@anymous-ai/script"

const root = path.resolve(import.meta.dir, "..")
const repoRoot = path.resolve(root, "../..")
const dist = path.join(root, "dist-npm")

// Clean dist
if (await fs.existsSync(dist)) await fs.rmSync(dist, { recursive: true })
await fs.mkdirSync(dist, { recursive: true })

const version = Script.version
console.log("Preparing anymous npm wrapper for version:", version)

// Copy LICENSE and README
for (const file of ["LICENSE", "README.md"]) {
  const src = path.join(root, file)
  if (await fs.existsSync(src)) {
    await fs.copyFileSync(src, path.join(dist, file))
  }
}

// Copy postinstall script (copies the platform binary into bin/anymous.exe)
const postinstallSrc = path.join(root, "script", "postinstall.mjs")
await fs.copyFileSync(postinstallSrc, path.join(dist, "postinstall.mjs"))

// Create bin/ dir with a placeholder shim. The postinstall script overwrites
// this file with the real platform binary. If postinstall did not run (e.g.
// --ignore-scripts), the placeholder prints a helpful error instead of a
// cryptic "command not found".
const shim = `#!/usr/bin/env bash
echo "Error: anymous's postinstall script was not run." >&2
echo "" >&2
echo "This occurs when using --ignore-scripts during installation, or when using a" >&2
echo "package manager like pnpm that does not run postinstall scripts by default." >&2
echo "" >&2
exit 1
`
await fs.mkdirSync(path.join(dist, "bin"), { recursive: true })
await Bun.write(path.join(dist, "bin", "anymous.exe"), shim)

// Optional platform binary packages, matching the targets in script/build.ts
const platformPackages: Record<string, string> = {
  "anymous-linux-arm64-musl": version,
  "anymous-linux-x64": version,
  "anymous-darwin-x64-baseline": version,
  "anymous-windows-arm64": version,
  "anymous-linux-arm64": version,
  "anymous-darwin-arm64": version,
  "anymous-windows-x64-baseline": version,
  "anymous-linux-x64-baseline-musl": version,
  "anymous-linux-x64-baseline": version,
  "anymous-windows-x64": version,
  "anymous-darwin-x64": version,
  "anymous-linux-x64-musl": version,
}

const npmPkg = {
  name: "anymous",
  bin: { anymous: "./bin/anymous.exe" },
  scripts: { postinstall: "node ./postinstall.mjs" },
  version,
  description: "AI-powered reverse engineering platform",
  license: "MIT",
  homepage: "https://github.com/anymousdark/anymous",
  repository: { type: "git", url: "https://github.com/anymousdark/anymous" },
  os: ["darwin", "linux", "win32"],
  cpu: ["arm64", "x64"],
  optionalDependencies: platformPackages,
}

await Bun.write(path.join(dist, "package.json"), JSON.stringify(npmPkg, null, 2))
console.log("\nCreated npm wrapper package at:", dist)
console.log("Optional binary packages:", Object.keys(platformPackages).length)

// Sync site landing page badge with the published version
await $`bun run script/sync-site-version.ts`.cwd(root).catch((error) => {
  console.warn("Site version sync skipped:", error.message)
})
