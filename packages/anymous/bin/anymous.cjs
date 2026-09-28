#!/usr/bin/env node
const { spawnSync, spawn } = require("child_process")
const path = require("path")
const fs = require("fs")

function findBun() {
  try {
    const r = spawnSync("where", ["bun"], { shell: false, windowsHide: false, encoding: "utf8", timeout: 3000 })
    if (r.status === 0) return r.stdout.trim().split("\n")[0]
  } catch {}
  try {
    const r = spawnSync("which", ["bun"], { shell: false, windowsHide: false, encoding: "utf8", timeout: 3000 })
    if (r.status === 0) return r.stdout.trim()
  } catch {}
  return null
}

const scriptDir = path.dirname(__filename)
const pkgDir = path.resolve(scriptDir, "..")
const src = path.join(pkgDir, "src", "index.ts")

if (!fs.existsSync(src)) {
  console.error("Anymous source not found. Run 'bun install' in " + pkgDir)
  process.exit(1)
}

const bun = findBun()
if (!bun) {
  console.error("Anymous requires Bun. Install: https://bun.sh")
  process.exit(1)
}

const child = spawn(bun, ["run", "--conditions=browser", src, ...process.argv.slice(2)], {
  stdio: "inherit",
  cwd: pkgDir,
  env: { ...process.env, ANYMOUS: "1" },
})

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal)
  else process.exit(typeof code === "number" ? code : 0)
})

const signals = ["SIGINT", "SIGTERM", "SIGHUP"]
for (const sig of signals) process.on(sig, () => child.kill(sig))
