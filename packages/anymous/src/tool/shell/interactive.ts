/**
 * Interactive-command detection for the shell tool.
 *
 * Ported from Gitlawb/zero (MIT license) `internal/sandbox/safe_command.go`.
 * Detects programs that would hang a non-interactive agent (editors, pagers,
 * REPLs without scripts, DB shells, `tail -f`, ...) and returns actionable
 * guidance instead of letting the command block until timeout.
 *
 * Detection is conservative by design: it only fires on positive matches and
 * never hard-blocks on parse quirks.
 */

export interface InteractiveCommand {
  command: string
  reason: string
  suggestion: string
}

interface InteractiveProgram {
  reason: string
  suggestion: string
  windowsSuggestion?: string
  windowsOnly?: boolean
}

// Editors.
const interactivePrograms: Record<string, InteractiveProgram> = {
  vim: {
    reason: "vim is a full-screen editor that waits for keystrokes",
    suggestion: "Use a non-interactive edit (the edit tool) or `sed -i`/`printf` to modify files.",
  },
  vi: {
    reason: "vi is a full-screen editor that waits for keystrokes",
    suggestion: "Use a non-interactive edit (the edit tool) or `sed -i` to modify files.",
  },
  nvim: {
    reason: "nvim is a full-screen editor that waits for keystrokes",
    suggestion: "Use a non-interactive edit (the edit tool) or `sed -i` to modify files.",
  },
  nano: {
    reason: "nano is a full-screen editor that waits for keystrokes",
    suggestion: "Use the edit tool or `sed -i` to modify files.",
  },
  emacs: {
    reason: "emacs opens an interactive session",
    suggestion: "Use `emacs --batch` for scripting, or the edit tool.",
  },
  pico: {
    reason: "pico is a full-screen editor that waits for keystrokes",
    suggestion: "Use the edit tool or `sed -i`.",
  },
  // Pagers.
  less: {
    reason: "less is a pager that waits for navigation keys",
    suggestion: "Use `cat`, `head`, or `tail -n N` to print file contents non-interactively.",
    windowsSuggestion: "Use the read tool with offset/limit for a partial view.",
  },
  more: {
    reason: "more is a pager that waits for navigation keys",
    suggestion: "Use `cat`, `head`, or `tail -n N` to print file contents non-interactively.",
    windowsSuggestion: "Use the read tool with offset/limit for a partial view.",
  },
  most: {
    reason: "most is a pager that waits for navigation keys",
    suggestion: "Use `cat`, `head`, or `tail -n N` to print file contents non-interactively.",
    windowsSuggestion: "Use the read tool with offset/limit for a partial view.",
  },
  // Process/system monitors.
  top: {
    reason: "top runs a live full-screen dashboard until you quit it",
    suggestion: "Use `ps aux` (optionally `| head`) for a one-shot snapshot.",
    windowsSuggestion: "Use `tasklist` for a one-shot process snapshot.",
  },
  htop: {
    reason: "htop runs a live full-screen dashboard until you quit it",
    suggestion: "Use `ps aux` (optionally `| head`) for a one-shot snapshot.",
    windowsSuggestion: "Use `tasklist` for a one-shot process snapshot.",
  },
  btop: {
    reason: "btop runs a live full-screen dashboard until you quit it",
    suggestion: "Use `ps aux` (optionally `| head`) for a one-shot snapshot.",
    windowsSuggestion: "Use `tasklist` for a one-shot process snapshot.",
  },
  btm: {
    reason: "btm runs a live full-screen dashboard until you quit it",
    suggestion: "Use `ps aux` for a one-shot snapshot.",
    windowsSuggestion: "Use `tasklist` for a one-shot process snapshot.",
  },
  watch: {
    reason: "watch re-runs a command on a loop until interrupted",
    suggestion: "Run the underlying command once instead of wrapping it in `watch`.",
  },
  // Language REPLs (only interactive when invoked with no script/expression).
  python: {
    reason: "python with no script drops into an interactive REPL",
    suggestion: "Run `python script.py` or `python -c '<code>'`.",
  },
  python3: {
    reason: "python3 with no script drops into an interactive REPL",
    suggestion: "Run `python3 script.py` or `python3 -c '<code>'`.",
  },
  node: {
    reason: "node with no script drops into an interactive REPL",
    suggestion: "Run `node script.js` or `node -e '<code>'`.",
  },
  irb: {
    reason: "irb is the interactive Ruby REPL",
    suggestion: "Run `ruby script.rb` or `ruby -e '<code>'`.",
  },
  ruby: {
    reason: "ruby with no script may drop into an interactive session",
    suggestion: "Run `ruby script.rb` or `ruby -e '<code>'`.",
  },
  pry: {
    reason: "pry is an interactive Ruby REPL",
    suggestion: "Run `ruby script.rb` instead.",
  },
  php: {
    reason: "php with no script (-a) opens an interactive shell",
    suggestion: "Run `php script.php` or `php -r '<code>'`.",
  },
  ghci: {
    reason: "ghci is the interactive Haskell REPL",
    suggestion: "Use `runghc script.hs` instead.",
  },
  // Database / remote clients (interactive when no command/query is supplied).
  psql: {
    reason: "psql opens an interactive SQL prompt",
    suggestion: "Pass a query with `psql -c '<sql>'` or a file with `psql -f file.sql`.",
  },
  mysql: {
    reason: "mysql opens an interactive SQL prompt",
    suggestion: "Pass a query with `mysql -e '<sql>'` or a file with `mysql < file.sql`.",
  },
  sqlite3: {
    reason: "sqlite3 with no SQL opens an interactive prompt",
    suggestion: "Pass SQL inline: `sqlite3 db.sqlite '<sql>'`.",
  },
  "redis-cli": {
    reason: "redis-cli with no command opens an interactive prompt",
    suggestion: "Pass the command inline: `redis-cli GET key`.",
  },
  mongo: {
    reason: "mongo opens an interactive shell",
    suggestion: "Pass `--eval '<js>'` or a script file.",
  },
  mongosh: {
    reason: "mongosh opens an interactive shell",
    suggestion: "Pass `--eval '<js>'` or a script file.",
  },
  // Remote/terminal sessions (interactive when no remote command is supplied).
  ssh: {
    reason: "ssh with no remote command opens an interactive login shell",
    suggestion: "Append the command to run remotely: `ssh host 'command'`.",
  },
  telnet: {
    reason: "telnet opens an interactive session",
    suggestion: "Use `curl` with piped input for scripted access.",
  },
  ftp: {
    reason: "ftp opens an interactive session",
    suggestion: "Use `curl`/`wget` for scripted transfers.",
  },
  sftp: {
    reason: "sftp opens an interactive session",
    suggestion: "Use `scp` for scripted transfers.",
  },
  // Debuggers.
  gdb: {
    reason: "gdb opens an interactive debugger prompt",
    suggestion: "Use `gdb -batch -ex '<cmd>'` for scripted debugging.",
  },
  lldb: {
    reason: "lldb opens an interactive debugger prompt",
    suggestion: "Use `lldb --batch -o '<cmd>'` for scripted debugging.",
  },
  // Fuzzy finders / selectors.
  fzf: {
    reason: "fzf is an interactive fuzzy finder",
    suggestion: "Use `grep`/`rg` to filter non-interactively.",
  },
  peco: {
    reason: "peco is an interactive selector",
    suggestion: "Use `grep`/`rg` to filter non-interactively.",
  },
  // Windows-only interactive launchers.
  notepad: {
    reason: "notepad opens a GUI editor",
    suggestion: "Use the edit/write tools instead.",
    windowsOnly: true,
  },
}

// replPrograms only hang when no script/expression argument is provided. The
// listed flags switch them into non-interactive mode and suppress the guard.
const nonInteractiveREPLFlags: Record<string, string[]> = {
  python: ["-c", "-m"],
  python3: ["-c", "-m"],
  node: ["-e", "--eval", "-p", "--print", "-v", "--check", "-h"],
  ruby: ["-e"],
  php: ["-r", "-f"],
  psql: ["-c", "--command", "-f", "--file", "-l", "--list"],
  mysql: ["-e", "--execute"],
  mongo: ["--eval", "-f", "--file"],
  mongosh: ["--eval", "-f", "--file"],
}

// infoExitFlags make ANY repl/interactive program print a message and exit
// instead of opening a prompt (`--version`/`--help` are unambiguous across
// these programs), so they universally suppress the guard.
const infoExitFlags = new Set(["--version", "--help"])

interface InteractiveSegment {
  match: string
  command: string
  reason: string
  suggestion: string
  windowsSuggestion?: string
}

// Multi-word interactive invocations, matched at real command boundaries.
const interactiveSegments: InteractiveSegment[] = [
  {
    match: "git rebase -i",
    command: "git rebase -i",
    reason: "interactive rebase opens an editor for the todo list",
    suggestion: "Use a non-interactive rebase (`git rebase <base>`) or scripted `git rebase --onto`, and resolve via `git rebase --continue`.",
  },
  {
    match: "git rebase --interactive",
    command: "git rebase -i",
    reason: "interactive rebase opens an editor for the todo list",
    suggestion: "Use a non-interactive rebase (`git rebase <base>`).",
  },
  {
    match: "git add -i",
    command: "git add -i",
    reason: "interactive add opens a selection prompt",
    suggestion: "Stage paths explicitly: `git add <path>`.",
  },
  {
    match: "git add -p",
    command: "git add -p",
    reason: "interactive patch staging opens a prompt",
    suggestion: "Stage paths explicitly: `git add <path>`.",
  },
  {
    match: "git commit -p",
    command: "git commit -p",
    reason: "interactive patch commit opens a prompt",
    suggestion: "Stage with `git add <path>` then `git commit -m`.",
  },
  {
    match: "tail -f",
    command: "tail -f",
    reason: "tail -f follows a file forever",
    suggestion: "Use `tail -n N <file>` for a bounded read.",
    windowsSuggestion: "Read the file with the read tool (offset/limit).",
  },
  {
    match: "tail --follow",
    command: "tail -f",
    reason: "tail --follow follows a file forever",
    suggestion: "Use `tail -n N <file>` for a bounded read.",
    windowsSuggestion: "Read the file with the read tool (offset/limit).",
  },
  {
    match: "journalctl -f",
    command: "journalctl -f",
    reason: "journalctl -f streams logs forever",
    suggestion: "Use `journalctl -n N` for a bounded read.",
  },
  {
    match: "kubectl logs -f",
    command: "kubectl logs -f",
    reason: "kubectl logs -f streams logs forever",
    suggestion: "Drop -f and use `kubectl logs --tail=N`.",
  },
  {
    match: "docker logs -f",
    command: "docker logs -f",
    reason: "docker logs -f streams logs forever",
    suggestion: "Drop -f and use `docker logs --tail N`.",
  },
  {
    match: "docker attach",
    command: "docker attach",
    reason: "docker attach joins an interactive container session",
    suggestion: "Use `docker exec <id> <command>` for one-shot execution.",
  },
]

// Launcher prefixes that precede the real program.
const wrapperPrograms = new Set([
  "sudo", "command", "env", "nohup", "time", "exec", "doas", "nice", "timeout",
  "stdbuf", "setsid", "ionice", "xargs",
])

// Per-wrapper options consuming the FOLLOWING token as value.
const wrapperValueOptionsByProg: Record<string, Set<string>> = {
  sudo: new Set(["-u", "--user", "-g", "--group", "-p", "--prompt", "-C", "--close-from", "-r", "--role", "-T", "--command-timeout", "-U", "--other-user", "-h", "--host", "-D", "--chdir", "-R", "--chroot"]),
  doas: new Set(["-u", "-C"]),
  env: new Set(["-u", "--unset", "-S", "--split-string", "-C", "--chdir"]),
  timeout: new Set(["-s", "--signal", "-k", "--kill-after"]),
  nice: new Set(["-n", "--adjustment"]),
  ionice: new Set(["-c", "--class", "-n", "--classdata", "-p", "--pid"]),
  stdbuf: new Set(["-i", "--input", "-o", "--output", "-e", "--error"]),
  xargs: new Set(["-a", "--arg-file", "-d", "--delimiter", "-E", "-I", "--replace", "-L", "--max-lines", "-n", "--max-args", "-P", "--max-procs", "-s", "--max-chars"]),
}

function wrapperConsumesValue(wrapper: string, option: string): boolean {
  if (option.includes("=")) return false
  return wrapperValueOptionsByProg[wrapper]?.has(option) ?? false
}

function stripChars(s: string, cutset: string): string {
  return [...s].filter((r) => !cutset.includes(r)).join("")
}

function hasWindowsExecutableSuffix(token: string): boolean {
  const lower = token.toLowerCase()
  return [".exe", ".cmd", ".bat", ".com"].some((suffix) => lower.endsWith(suffix))
}

function windowsExecutablePathBasename(token: string): string | undefined {
  const drivePath = token.length >= 3 && /[a-zA-Z]/.test(token[0]) && token[1] === ":"
  const uncPath = token.startsWith("\\\\")
  const explicitRelativePath = token.startsWith(".\\") || token.startsWith("..\\")
  const backslashRelativePath = token.includes("\\") && hasWindowsExecutableSuffix(token)
  if (!drivePath && !uncPath && !explicitRelativePath && !backslashRelativePath) return undefined
  const index = Math.max(token.lastIndexOf("/"), token.lastIndexOf("\\"))
  if (index >= 0) {
    if (index + 1 >= token.length) return undefined
    return token.slice(index + 1)
  }
  if (drivePath && token.length > 2) return token.slice(2)
  return undefined
}

function normalizeProgramToken(field: string): string {
  let token = field.trim().replace(/^\$+/, "").replace(/\)+$/, "")
  const pathToken = stripChars(token, "\"'`")
  const windowsBase = windowsExecutablePathBasename(pathToken)
  if (windowsBase !== undefined) {
    token = windowsBase
  } else {
    token = stripChars(token, "\"'`\\")
    const slash = token.lastIndexOf("/")
    if (slash >= 0) token = token.slice(slash + 1)
  }
  token = token.toLowerCase()
  for (const suffix of [".exe", ".cmd", ".bat", ".com"]) {
    if (token.endsWith(suffix)) return token.slice(0, -suffix.length)
  }
  return token
}

function isNumericToken(field: string): boolean {
  return field !== "" && [...field].every((r) => r >= "0" && r <= "9")
}

function programIndex(program: string, fields: string[]): number {
  return fields.findIndex((field) => normalizeProgramToken(field) === program)
}

// Payload of `sh -c` / `bash -c` style invocations (plus PowerShell/cmd
// equivalents, a fork extension for Windows agents), with one layer of
// surrounding quotes stripped by the caller via joining raw fields.
function shellDashCPayload(program: string, fields: string[]): string {
  const posix = new Set(["sh", "bash", "zsh", "ksh", "dash"])
  const lower = program.toLowerCase()
  if (posix.has(lower)) {
    const start = programIndex(program, fields)
    if (start < 0) return ""
    const args = fields.slice(start + 1)
    for (let i = 0; i < args.length; i++) {
      if (args[i] === "-c" || args[i] === "--command") {
        return i + 1 < args.length ? args.slice(i + 1).join(" ") : ""
      }
    }
    return ""
  }
  if (lower === "powershell" || lower === "pwsh") {
    const start = programIndex(program, fields)
    if (start < 0) return ""
    const args = fields.slice(start + 1)
    for (let i = 0; i < args.length; i++) {
      const flag = args[i].toLowerCase()
      if (flag === "-c" || flag === "-command") {
        return i + 1 < args.length ? args.slice(i + 1).join(" ") : ""
      }
    }
    return ""
  }
  if (lower === "cmd") {
    const start = programIndex(program, fields)
    if (start < 0) return ""
    const args = fields.slice(start + 1)
    for (let i = 0; i < args.length; i++) {
      if (args[i].toLowerCase() === "/c") {
        return i + 1 < args.length ? args.slice(i + 1).join(" ") : ""
      }
    }
    return ""
  }
  return ""
}

// First executable name in a segment, skipping env assignments, wrapper
// prefixes and their option values.
function firstProgram(fields: string[]): string {
  let wrapper = ""
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index]
    if (field.includes("=") && !field.startsWith("=")) continue
    if (field.startsWith("-")) {
      if (wrapperConsumesValue(wrapper, field) && index + 1 < fields.length) index++
      continue
    }
    if (isNumericToken(field)) continue
    const token = normalizeProgramToken(field)
    if (wrapperPrograms.has(token)) {
      wrapper = token
      continue
    }
    return token
  }
  return ""
}

// Segment's command portion with env assignments and wrapper prefixes
// removed, so multi-word matches anchor on the real command boundary.
function commandBody(fields: string[]): string {
  let wrapper = ""
  for (let index = 0; index < fields.length; index++) {
    const field = fields[index]
    if (field.includes("=") && !field.startsWith("=")) continue
    if (field.startsWith("-")) {
      if (wrapperConsumesValue(wrapper, field) && index + 1 < fields.length) index++
      continue
    }
    if (isNumericToken(field)) continue
    if (wrapperPrograms.has(normalizeProgramToken(field))) {
      wrapper = normalizeProgramToken(field)
      continue
    }
    return fields.slice(index).join(" ")
  }
  return ""
}

function hasTrailingCommand(program: string, fields: string[]): boolean {
  const start = programIndex(program, fields)
  if (start < 0) return false
  const args = fields.slice(start + 1)
  switch (program) {
    case "ssh": {
      // ssh <host> <command...>: a host plus at least one more token.
      return args.filter((arg) => !arg.startsWith("-")).length >= 2
    }
    case "sqlite3": {
      // sqlite3 <db> <sql>: a db plus an SQL argument.
      return args.filter((arg) => !arg.startsWith("-")).length >= 2
    }
    case "redis-cli": {
      // redis-cli <command ...>: any positional command token.
      return args.some((arg) => !arg.startsWith("-"))
    }
    default:
      return false
  }
}

function hasNonInteractiveFlag(program: string, fields: string[]): boolean {
  const flags = nonInteractiveREPLFlags[program]
  if (!flags) {
    // ssh-like programs are interactive only with no trailing command.
    return hasTrailingCommand(program, fields)
  }
  const start = programIndex(program, fields)
  if (start < 0) return false
  for (const arg of fields.slice(start + 1)) {
    const base = arg.includes("=") ? arg.slice(0, arg.indexOf("=")) : arg
    if (infoExitFlags.has(base)) return true
    if (flags.some((flag) => arg === flag || arg.startsWith(flag + "="))) return true
    // A positional (non-flag) argument means a script path was supplied.
    if (!arg.startsWith("-")) return true
  }
  return false
}

function normalizeWhitespace(value: string): string {
  return value.split(/\s+/).filter(Boolean).join(" ")
}

interface SubstFrame {
  inSingle: boolean
  inDouble: boolean
  backtick: boolean
}

// Splits a command on shell operators (&&, ||, ;, |) and command-substitution
// boundaries, quote-aware so operators inside quotes stay literal.
function splitShellSegments(command: string): string[] {
  const segments: string[] = []
  let current = ""
  const flush = () => {
    const seg = current.trim()
    if (seg !== "") segments.push(seg)
    current = ""
  }
  let inSingle = false
  let inDouble = false
  const substStack: SubstFrame[] = []
  const runes = [...command]
  for (let i = 0; i < runes.length; i++) {
    const c = runes[i]
    if (inSingle) {
      current += c
      if (c === "'") inSingle = false
      continue
    }
    if (c === "\\" && i + 1 < runes.length) {
      current += c + runes[i + 1]
      i++
      continue
    }
    if (c === "'" && !inDouble) {
      inSingle = true
      current += c
      continue
    }
    if (c === '"') {
      inDouble = !inDouble
      current += c
      continue
    }
    if (c === "`") {
      const n = substStack.length
      if (n > 0 && substStack[n - 1].backtick) {
        const prev = substStack[n - 1]
        substStack.pop()
        inSingle = prev.inSingle
        inDouble = prev.inDouble
        flush()
        continue
      }
      flush()
      substStack.push({ inSingle, inDouble, backtick: true })
      inSingle = false
      inDouble = false
      continue
    }
    if (c === "$" && i + 1 < runes.length && runes[i + 1] === "(") {
      flush()
      substStack.push({ inSingle, inDouble, backtick: false })
      inSingle = false
      inDouble = false
      i++
      continue
    }
    const top = substStack[substStack.length - 1]
    if (c === ")" && substStack.length > 0 && !top.backtick && !inSingle && !inDouble) {
      const prev = substStack.pop()!
      inSingle = prev.inSingle
      inDouble = prev.inDouble
      flush()
      continue
    }
    if (!inDouble) {
      if (c === ";" || c === "|") {
        flush()
        continue
      }
      if (c === "&" && i + 1 < runes.length && runes[i + 1] === "&") {
        flush()
        i++
        continue
      }
    }
    current += c
  }
  flush()
  return segments
}

function fieldsOf(segment: string): string[] {
  return segment.match(/\S+/g) ?? []
}

function inspectFields(
  fields: string[],
  isWindows: boolean,
): { result: InteractiveCommand; matched: true } | { matched: false } {
  const body = commandBody(fields).toLowerCase()
  for (const seg of interactiveSegments) {
    if (body === seg.match || body.startsWith(seg.match + " ")) {
      return {
        matched: true,
        result: {
          command: seg.command,
          reason: seg.reason,
          suggestion: isWindows && seg.windowsSuggestion ? seg.windowsSuggestion : seg.suggestion,
        },
      }
    }
  }
  const first = firstProgram(fields)
  if (first === "") return { matched: false }
  const inner = shellDashCPayload(first, fields)
  if (inner !== "") {
    const nested = detectInteractiveCommand(inner, isWindows ? "win32" : "linux")
    if (nested) return { matched: true, result: nested }
    return { matched: false }
  }
  const program = interactivePrograms[first]
  if (!program || (program.windowsOnly && !isWindows)) return { matched: false }
  if (hasNonInteractiveFlag(first, fields)) return { matched: false }
  return {
    matched: true,
    result: {
      command: first,
      reason: program.reason,
      suggestion: isWindows && program.windowsSuggestion ? program.windowsSuggestion : program.suggestion,
    },
  }
}

/**
 * Inspects a shell command for interactive programs that would block a
 * non-interactive agent. Returns the match, or undefined when clean.
 */
export function detectInteractiveCommand(
  command: string,
  platform: NodeJS.Platform = process.platform,
): InteractiveCommand | undefined {
  if (normalizeWhitespace(command) === "") return undefined
  const isWindows = platform === "win32"
  const normalized = normalizeWhitespace(command)
  for (const segment of splitShellSegments(normalized)) {
    const outcome = inspectFields(fieldsOf(segment), isWindows)
    if (outcome.matched) return outcome.result
  }
  return undefined
}

export * as InteractiveCommandCheck from "./interactive"
