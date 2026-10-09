import type { Argv } from "yargs"
import { Effect } from "effect"
import { effectCmd } from "../effect-cmd"
import { UI } from "../ui"
import { Glob } from "@anymous-ai/core/util/glob"
import { Ignore } from "@anymous-ai/core/filesystem/ignore"
import path from "path"

// Language by file extension (compact map, ported from the repo-map idea in
// Gitlawb/zero (MIT): deterministic workspace scan for model context).
const LANGUAGE_BY_EXTENSION: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  mts: "TypeScript",
  cts: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  mjs: "JavaScript",
  cjs: "JavaScript",
  go: "Go",
  py: "Python",
  rs: "Rust",
  java: "Java",
  c: "C",
  h: "C",
  cpp: "C++",
  hpp: "C++",
  cc: "C++",
  cs: "C#",
  rb: "Ruby",
  php: "PHP",
  swift: "Swift",
  kt: "Kotlin",
  kts: "Kotlin",
  scala: "Scala",
  lua: "Lua",
  r: "R",
  jl: "Julia",
  sh: "Shell",
  bash: "Shell",
  ps1: "PowerShell",
  sql: "SQL",
  md: "Markdown",
  mdx: "Markdown",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  toml: "TOML",
  xml: "XML",
  html: "HTML",
  css: "CSS",
  scss: "CSS",
  vue: "Vue",
  svelte: "Svelte",
  astro: "Astro",
  tf: "Terraform",
  dockerfile: "Docker",
  zig: "Zig",
  ex: "Elixir",
  exs: "Elixir",
  hs: "Haskell",
  ml: "OCaml",
  dart: "Dart",
}

const IMPORTANT_FILES = new Set([
  "README.md",
  "README_ZH.md",
  "AGENTS.md",
  "LICENSE",
  "package.json",
  "go.mod",
  "Cargo.toml",
  "pyproject.toml",
  "requirements.txt",
  "Makefile",
  "Dockerfile",
  "docker-compose.yml",
  "pubspec.yaml",
  "build.gradle",
  "pom.xml",
  ".gitignore",
])

export const RepoMapCommand = effectCmd({
  command: "repo-map [dir]",
  describe: "print a compact deterministic map of a repository (files, languages, tree)",
  builder: (yargs: Argv) =>
    yargs
      .positional("dir", { describe: "directory to map (defaults to cwd)", type: "string" })
      .option("max-files", { describe: "maximum files to list", type: "number", default: 500 })
      .option("max-depth", { describe: "maximum directory depth", type: "number", default: 4 })
      .option("json", { describe: "print the map as JSON", type: "boolean", default: false }),
  instance: false,
  handler: Effect.fn("Cli.repoMap")(function* (args) {
    const root = path.resolve(args.dir ?? process.cwd())
    const maxFiles: number = args["max-files"] ?? 500
    const maxDepth: number = args["max-depth"] ?? 4

    const all = (yield* Effect.promise(() => Glob.scan("**/*", { cwd: root, dot: true }))).filter(
      (file) => !Ignore.match(file),
    )
    const withinDepth = all.filter((file) => file.split("/").length - 1 <= maxDepth)
    const truncated = withinDepth.length > maxFiles
    const files = withinDepth.slice(0, maxFiles)

    const languages = new Map<string, number>()
    const extensions = new Map<string, number>()
    const important: string[] = []
    for (const file of files) {
      const base = path.basename(file)
      if (IMPORTANT_FILES.has(base)) important.push(file)
      const dot = base.lastIndexOf(".")
      const ext = dot > 0 ? base.slice(dot + 1).toLowerCase() : ""
      if (ext) extensions.set(ext, (extensions.get(ext) ?? 0) + 1)
      const lang = LANGUAGE_BY_EXTENSION[ext]
      if (lang) languages.set(lang, (languages.get(lang) ?? 0) + 1)
    }

    // Deterministic shallow tree (dirs first, then files, alphabetical).
    const tree: string[] = []
    const seen = new Set<string>()
    for (const file of [...files].sort()) {
      const parts = file.split("/")
      for (let depth = 1; depth < parts.length; depth++) {
        const dir = parts.slice(0, depth).join("/")
        if (!seen.has(dir)) {
          seen.add(dir)
          tree.push(`${"  ".repeat(depth - 1)}${parts[depth - 1]}/`)
        }
      }
      if (parts.length <= maxDepth + 1) tree.push(`${"  ".repeat(parts.length - 1)}${parts[parts.length - 1]}`)
    }

    const sortCounts = (map: Map<string, number>) =>
      [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name, fileCount]) => ({ name, fileCount }))

    const map = {
      root,
      fileCount: files.length,
      truncated,
      languages: sortCounts(languages),
      extensions: sortCounts(extensions),
      importantFiles: important.sort(),
      tree,
    }

    if (args.json) {
      process.stdout.write(JSON.stringify(map, null, 2) + "\n")
      return
    }

    UI.empty()
    process.stdout.write(`${root} — ${map.fileCount} files${truncated ? " (truncated)" : ""}\n`)
    if (map.languages.length > 0) {
      process.stdout.write(`languages: ${map.languages.map((l) => `${l.name} ${l.fileCount}`).join(", ")}\n`)
    }
    if (important.length > 0) process.stdout.write(`important: ${important.join(", ")}\n`)
    for (const line of tree.slice(0, 120)) process.stdout.write(line + "\n")
    if (tree.length > 120) process.stdout.write(`... (${tree.length - 120} more lines, use --json for full map)\n`)
    UI.empty()
  }),
})

export * as RepoMapCli from "./repo-map"
