#!/usr/bin/env bun
// Prepares the anymous package for npm publishing.
// Bundles workspace dependencies and creates a standalone package.

import { $ } from "bun"
import path from "path"
import fs from "fs"

const root = path.resolve(import.meta.dir, "..")
const repoRoot = path.resolve(root, "../..")
const dist = path.join(root, "dist-npm")
const pkg = JSON.parse(await Bun.file(path.join(root, "package.json")).text())

// Clean dist
if (await fs.existsSync(dist)) await fs.rmSync(dist, { recursive: true })
await fs.mkdirSync(dist, { recursive: true })

// Get workspace package versions
const workspaces: Record<string, string> = {
  core: "packages/core",
  codemode: "packages/codemode",
  llm: "packages/llm",
  plugin: "packages/plugin",
  protocol: "packages/protocol",
  schema: "packages/schema",
  script: "packages/script",
  sdk: "packages/sdk/js",
  server: "packages/server",
  tui: "packages/tui",
}
const versions: Record<string, string> = {}
for (const [name, dir] of Object.entries(workspaces)) {
  const wsPkg = JSON.parse(await Bun.file(path.join(repoRoot, dir, "package.json")).text())
  versions[name] = wsPkg.version
}

console.log("Workspace versions:", versions)

// Helper: resolve catalog: entries to actual versions from node_modules
function resolveCatalogVersion(depName: string): string | null {
  const parts = depName.split("/")
  const nm = path.join(repoRoot, "node_modules")
  const pkgJson = depName.startsWith("@")
    ? path.join(nm, parts[0], parts[1], "package.json")
    : path.join(nm, parts[0], "package.json")
  try {
    const ver = JSON.parse(fs.readFileSync(pkgJson, "utf-8")).version
    return ver
  } catch {
    // try bun's flat cache
    const cacheDir = path.join(nm, ".bun")
    if (!fs.existsSync(cacheDir)) return null
    const entries = fs.readdirSync(cacheDir)
    const suffix = depName.replace("/", "+")
    for (const entry of entries) {
      if (entry.includes(suffix)) {
        const cachedPkg = path.join(cacheDir, entry, "node_modules", depName, "package.json")
        if (fs.existsSync(cachedPkg)) {
          return JSON.parse(fs.readFileSync(cachedPkg, "utf-8")).version
        }
      }
    }
    return null
  }
}

function resolveDeps(deps: Record<string, string>): Record<string, string> {
  const resolved: Record<string, string> = {}
  for (const [name, version] of Object.entries(deps)) {
    if (version === "catalog:") {
      const actual = resolveCatalogVersion(name)
      if (actual) {
        resolved[name] = `^${actual}`
      } else {
        console.warn(`WARN: could not resolve catalog: for "${name}", keeping as-is`)
        resolved[name] = version
      }
    } else {
      resolved[name] = version
    }
  }
  return resolved
}

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
  version: "1.1.3",
  description: "AI-powered reverse engineering platform",
  type: "module",
  license: "MIT",
  homepage: "https://github.com/anymousdark/anymous",
  repository: { type: "git", url: "https://github.com/anymousdark/anymous" },
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

// Resolve catalog: entries in dependencies
npmPkg.dependencies = resolveDeps(npmPkg.dependencies)

for (const [name, version] of Object.entries(pkg.devDependencies ?? {})) {
  if (version.startsWith("workspace:*")) continue
  npmPkg.devDependencies[name] = version
}

// Resolve catalog: entries in devDependencies too
npmPkg.devDependencies = resolveDeps(npmPkg.devDependencies)

// Add bun as dependency
npmPkg.dependencies["bun"] = "^1.0.0"

// Overrides
if (pkg.overrides) npmPkg.overrides = resolveDeps({ ...pkg.overrides })

await Bun.write(path.join(dist, "package.json"), JSON.stringify(npmPkg, null, 2))
console.log("\nCreated npm package at:", dist)
console.log("\nTo publish:")
console.log("  cd dist-npm")
console.log("  npm publish --access public")
console.log("\nOr test locally:")
console.log("  cd dist-npm && bun link")
