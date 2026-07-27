#!/usr/bin/env bun
// Prepares the anymous package for npm publishing.
// Bundles workspace dependencies and creates a standalone package.

import { $ } from "bun"
import path from "path"
import fs from "fs"

const root = path.resolve(import.meta.dir, "..")
const dist = path.join(root, "dist-npm")
const pkg = JSON.parse(await Bun.file(path.join(root, "package.json")).text())

// Clean dist
if (await fs.existsSync(dist)) await fs.rmSync(dist, { recursive: true })
await fs.mkdirSync(dist, { recursive: true })

// Get workspace package versions
const workspaces: Record<string, string> = {
  core: "core",
  codemode: "codemode",
  llm: "llm",
  plugin: "plugin",
  protocol: "protocol",
  schema: "schema",
  script: "script",
  sdk: "sdk/js",
  server: "server",
  tui: "tui",
}
const versions: Record<string, string> = {}
for (const [name, dir] of Object.entries(workspaces)) {
  const wsPkg = JSON.parse(await Bun.file(path.join(root, "..", dir, "package.json")).text())
  versions[name] = wsPkg.version
}

console.log("Workspace versions:", versions)

// Copy essential files
const copyDirs = ["bin", "src"]
for (const dir of copyDirs) {
  const src = path.join(root, dir)
  const dest = path.join(dist, dir)
  if (await fs.existsSync(src)) {
    await fs.cpSync(src, dest, { recursive: true })
    console.log(`Copied ${dir}/`)
  }
}

// Copy config files
for (const file of ["tsconfig.json", "LICENSE", "README.md"]) {
  const src = path.join(root, file)
  if (await fs.existsSync(src)) {
    await fs.copyFileSync(src, path.join(dist, file))
  }
}

// Create package.json for npm
const npmPkg: Record<string, any> = {
  name: "anymous",
  version: "1.1.0",
  description: "AI-powered reverse engineering platform",
  type: "module",
  license: "MIT",
  homepage: "https://github.com/anymous-ai/anymous",
  repository: { type: "git", url: "https://github.com/anymous-ai/anymous" },
  bin: { anymous: "./bin/anymous.cjs" },
  scripts: { postinstall: "node ./script/postinstall.mjs" },
  engines: { node: ">=18" },
  os: ["darwin", "linux", "win32"],
  cpu: ["arm64", "x64"],
  dependencies: {} as Record<string, string>,
  devDependencies: {},
}

// Resolve workspace deps to actual versions (map @anymous-ai/* -> @opencode-ai/* for npm)
const npmScope = "@opencode-ai"
const workspaceDeps = [
  "core", "codemode", "llm",
  "plugin", "protocol", "schema",
  "script", "sdk", "server", "tui",
]

for (const [name, version] of Object.entries(pkg.dependencies ?? {})) {
  if (version.startsWith("workspace:*")) {
    const wsName = name.replace("@anymous-ai/", "")
    if (workspaceDeps.includes(wsName)) {
      npmPkg.dependencies[`${npmScope}/${wsName}`] = `^${versions[wsName] ?? "1.0.0"}`
    } else {
      npmPkg.dependencies[name] = version
    }
  } else {
    npmPkg.dependencies[name] = version
  }
}

for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
  if (version.startsWith("workspace:*")) continue
  npmPkg.devDependencies[name] = version
}

// Add bun as dependency
npmPkg.dependencies["bun"] = "^1.0.0"

// Overrides
if (pkg.overrides) npmPkg.overrides = { ...pkg.overrides }

await Bun.write(path.join(dist, "package.json"), JSON.stringify(npmPkg, null, 2))
console.log("\nCreated npm package at:", dist)
console.log("\nTo publish:")
console.log("  cd dist-npm")
console.log("  npm publish --access public")
console.log("\nOr test locally:")
console.log("  cd dist-npm && bun link")
