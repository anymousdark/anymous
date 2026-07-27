#!/usr/bin/env bun

const { $ } = await import("bun")
const { existsSync } = await import("fs")
const path = await import("path")

console.log("\n  Installing Anymous globally...\n")

// Step 1: Install dependencies
if (!existsSync(path.join(import.meta.dir, "..", "node_modules"))) {
  console.log("  [1/3] Installing dependencies...")
  await $`bun install`.cwd(path.join(import.meta.dir, ".."))
} else {
  console.log("  [1/3] Dependencies already installed ✓")
}

// Step 2: Register with bun link
console.log("  [2/3] Registering global command...")
await $`bun link`.cwd(path.join(import.meta.dir, ".."))

// Step 3: Test
console.log("  [3/3] Testing installation...")
const result = await $`bunx anymous --version`.nothrow()
if (result.exitCode === 0) {
  console.log(`\n  ✅ Anymous v${result.text().trim()} installed globally!`)
  console.log("\n  Just type 'anymous' anywhere to start:\n")
  console.log("    anymous              # Open TUI interface")
  console.log('    anymous run "cmd"     # Run a command')
  console.log("    anymous --help        # Show help\n")
} else {
  console.log("\n  ❌ Installation failed. Check the errors above.\n")
}
