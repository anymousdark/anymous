import { Effect, Schema, pipe } from "effect"
import * as Tool from "./tool"
import { spawn } from "child_process"
import DESCRIPTION from "./computer.txt"

const platform = process.platform

const powershellScript = (script: string) =>
  Effect.promise<string>(
    () =>
      new Promise((resolve, reject) => {
        const enc = Buffer.from(script, "utf16le").toString("base64")
        const proc = spawn("powershell", [
          "-NoProfile",
          "-NonInteractive",
          "-EncodedCommand",
          enc,
        ])
        let stdout = ""
        let stderr = ""
        proc.stdout.on("data", (d: Buffer) => (stdout += d.toString()))
        proc.stderr.on("data", (d: Buffer) => (stderr += d.toString()))
        proc.on("close", (code) => {
          if (code === 0) resolve(stdout.trim())
          else reject(new Error(stderr.trim() || `exit code ${code}`))
        })
        proc.on("error", (e) => reject(e))
      }),
  )

const captureScreenshot = Effect.fn("Computer.screenshot")(function* () {
  if (platform === "win32") {
    const base64 = yield* powershellScript(`
Add-Type -AssemblyName System.Drawing
Add-Type -AssemblyName System.Windows.Forms
$bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
$bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
$gfx = [System.Drawing.Graphics]::FromImage($bmp)
$gfx.CopyFromScreen($bounds.X, $bounds.Y, 0, 0, $bounds.Size)
$ms = New-Object System.IO.MemoryStream
$bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
$bytes = $ms.ToArray()
[Convert]::ToBase64String($bytes)
$gfx.Dispose()
$bmp.Dispose()
$ms.Dispose()
`)
    return `data:image/png;base64,${base64}`
  }
  if (platform === "darwin") {
    const base64 = yield* Effect.promise<string>(
      () =>
        new Promise((resolve, reject) => {
          const proc = spawn("screencapture", ["-x", "-t", "png", "-"])
          const chunks: Buffer[] = []
          proc.stdout.on("data", (d: Buffer) => chunks.push(d))
          proc.on("close", (code) => {
            if (code === 0) resolve(Buffer.concat(chunks).toString("base64"))
            else reject(new Error(`screencapture exit code ${code}`))
          })
          proc.on("error", reject)
        }),
    )
    return `data:image/png;base64,${base64}`
  }
  if (platform === "linux") {
    const base64 = yield* Effect.promise<string>(
      () =>
        new Promise((resolve, reject) => {
          const proc = spawn("import", ["-window", "root", "png:-"])
          const chunks: Buffer[] = []
          proc.stdout.on("data", (d: Buffer) => chunks.push(d))
          proc.on("close", (code) => {
            if (code === 0) resolve(Buffer.concat(chunks).toString("base64"))
            else reject(new Error(`import exit code ${code}`))
          })
          proc.on("error", reject)
        }),
    )
    return `data:image/png;base64,${base64}`
  }
  return yield* Effect.fail(new Error(`Unsupported platform: ${platform}`))
})

const moveMouse = Effect.fn("Computer.moveMouse")(function* (x: number, y: number) {
  if (platform === "win32") {
    yield* powershellScript(`
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${Math.round(x)}, ${Math.round(y)})
`)
  } else if (platform === "darwin") {
    yield* Effect.promise(() =>
      new Promise<void>((resolve, reject) => {
        const proc = spawn("osascript", [
          "-e",
          `tell application "System Events" to set position of mouse to {${Math.round(x)}, ${Math.round(y)}}`,
        ])
        proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
        proc.on("error", reject)
      }),
    )
  } else if (platform === "linux") {
    yield* Effect.promise(() =>
      new Promise<void>((resolve, reject) => {
        const proc = spawn("xdotool", ["mousemove", String(Math.round(x)), String(Math.round(y))])
        proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
        proc.on("error", reject)
      }),
    )
  }
})

const clickMouse = Effect.fn("Computer.clickMouse")(function* (button: "left" | "right" | "middle") {
  if (platform === "win32") {
    const down = button === "left" ? "LEFTDOWN" : button === "right" ? "RIGHTDOWN" : "MIDDLEDOWN"
    const up = button === "left" ? "LEFTUP" : button === "right" ? "RIGHTUP" : "MIDDLEUP"
    yield* powershellScript(`
Add-Type -AssemblyName System.Windows.Forms
$c = Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class W32 {
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint x, uint y, uint d, int i);
  public const uint L=0x02,R=0x08,M=0x20,LU=0x04,RU=0x10,MU=0x40;
}
'@
[W32]::mouse_event([W32]::${down}, 0, 0, 0, 0); Start-Sleep -Milliseconds 50
[W32]::mouse_event([W32]::${up}, 0, 0, 0, 0); Write-Output OK
`)
  } else if (platform === "darwin") {
    const action = button === "left" ? "click" : button === "right" ? "click at (get position of mouse) using {button 2}" : "click at (get position of mouse) using {button 3}"
    yield* Effect.promise(() =>
      new Promise<void>((resolve, reject) => {
        const proc = spawn("osascript", [
          "-e",
          `tell application "System Events" to ${action}`,
        ])
        proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
        proc.on("error", reject)
      }),
    )
  } else if (platform === "linux") {
    const b = button === "left" ? "1" : button === "right" ? "3" : "2"
    yield* Effect.promise(() =>
      new Promise<void>((resolve, reject) => {
        const proc = spawn("xdotool", ["click", b])
        proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
        proc.on("error", reject)
      }),
    )
  }
})

const escapeSendKeys = (s: string) =>
  s
    .replace(/{/g, "{{}")
    .replace(/}/g, "{}}")
    .replace(/\+/g, "{+}")
    .replace(/\^/g, "{^}")
    .replace(/%/g, "{%}")
    .replace(/~/g, "{~}")
    .replace(/\(/g, "{(}")
    .replace(/\)/g, "{)}")
    .replace(/\[/g, "{[}")
    .replace(/\]/g, "{]}")
    .replace(/"/g, '`"')
    .replace(/\$/g, "`$")
    .replace(/\n/g, "`n")
    .replace(/\r/g, "`r")
    .replace(/\t/g, "`t")

const typeText = Effect.fn("Computer.typeText")(function* (text: string, delayMs: number = 0) {
  const typeChar = (char: string) => {
    if (platform === "win32") {
      const esc = escapeSendKeys(char)
      return powershellScript(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("${esc}")`)
    } else if (platform === "darwin") {
      return Effect.promise<void>(() =>
        new Promise((resolve, reject) => {
          const proc = spawn("osascript", ["-e", `tell application "System Events" to keystroke "${char.replace(/"/g, '\\"')}"`])
          proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
          proc.on("error", reject)
        }),
      )
    } else {
      return Effect.promise<void>(() =>
        new Promise((resolve, reject) => {
          const proc = spawn("xdotool", ["type", char])
          proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
          proc.on("error", reject)
        }),
      )
    }
  }
  if (delayMs <= 0) {
    if (platform === "win32") {
      const escaped = escapeSendKeys(text)
      yield* powershellScript(`Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait("${escaped}")`)
    } else if (platform === "darwin") {
      yield* Effect.promise<void>(() =>
        new Promise((resolve, reject) => {
          const proc = spawn("osascript", ["-e", `tell application "System Events" to keystroke "${text.replace(/"/g, '\\"')}"`])
          proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
          proc.on("error", reject)
        }),
      )
    } else {
      yield* Effect.promise<void>(() =>
        new Promise((resolve, reject) => {
          const proc = spawn("xdotool", ["type", text])
          proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
          proc.on("error", reject)
        }),
      )
    }
  } else {
    for (const char of text) {
      yield* typeChar(char)
      if (delayMs > 0) yield* Effect.promise<void>((resolve) => setTimeout(resolve, delayMs))
    }
  }
})

const keyPress = Effect.fn("Computer.keyPress")(function* (keys: string[]) {
  const combo = keys.join("+")
  if (platform === "win32") {
    const mapping: Record<string, string> = {
      ctrl: "^", alt: "%", shift: "+", enter: "{ENTER}", tab: "{TAB}",
      escape: "{ESC}", backspace: "{BACKSPACE}", delete: "{DELETE}",
      up: "{UP}", down: "{DOWN}", left: "{LEFT}", right: "{RIGHT}",
      home: "{HOME}", end: "{END}", pageup: "{PGUP}", pagedown: "{PGDN}",
    }
    const translated = keys.map((k) => mapping[k.toLowerCase()] ?? k.toUpperCase())
    yield* powershellScript(`
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.SendKeys]::SendWait("${translated.join("")}")
`)
  } else if (platform === "darwin") {
    const mapping: Record<string, string> = {
      ctrl: "command down", alt: "option down", shift: "shift down",
      enter: "return", escape: "escape", tab: "tab",
      backspace: "delete", delete: "forward delete",
      up: "up", down: "down", left: "left", right: "right",
    }
    const parts = keys.map((k) => mapping[k.toLowerCase()] ?? `"${k}"`)
    const cmd = `tell application "System Events" to key code ${keys.length > 0 ? `using {${parts.join(", ")}}` : ""}`
    yield* Effect.promise(() =>
      new Promise<void>((resolve, reject) => {
        const proc = spawn("osascript", ["-e", cmd])
        proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
        proc.on("error", reject)
      }),
    )
  } else if (platform === "linux") {
    yield* Effect.promise(() =>
      new Promise<void>((resolve, reject) => {
        const proc = spawn("xdotool", ["key", combo])
        proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
        proc.on("error", reject)
      }),
    )
  }
})

const scrollMouse = Effect.fn("Computer.scrollMouse")(function* (clicks: number) {
  if (platform === "win32") {
    yield* powershellScript(`
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class W32 {
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint x, uint y, uint d, int i);
  public const uint W=0x0800;
}
'@
[W32]::mouse_event([W32]::W, 0, 0, ${Math.round(clicks) * 120}, 0); Write-Output OK
`)
  } else if (platform === "darwin") {
    yield* Effect.promise(() =>
      new Promise<void>((resolve, reject) => {
        const proc = spawn("osascript", [
          "-e",
          `tell application "System Events" to scroll wheel ${clicks} lines`,
        ])
        proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
        proc.on("error", reject)
      }),
    )
  } else if (platform === "linux") {
    const btn = clicks > 0 ? "4" : "5"
    const count = Math.abs(clicks)
    yield* Effect.promise(() =>
      new Promise<void>((resolve, reject) => {
        const proc = spawn("xdotool", ["click", `--repeat`, String(count), btn])
        proc.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
        proc.on("error", reject)
      }),
    )
  }
})

const getScreenSize = Effect.fn("Computer.screenSize")(function* () {
  if (platform === "win32") {
    const raw = yield* powershellScript(`
Add-Type -AssemblyName System.Windows.Forms
$s = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
Write-Output "$($s.Width) $($s.Height)"
`)
    const [w, h] = raw.split(" ").map(Number)
    return { width: w, height: h }
  }
  if (platform === "darwin") {
    const raw = yield* Effect.promise<string>(
      () =>
        new Promise((resolve, reject) => {
          const proc = spawn("osascript", [
            "-e",
            `tell application "Finder" to get bounds of window of desktop`,
          ])
          let d = ""
          proc.stdout.on("data", (b: Buffer) => (d += b.toString()))
          proc.on("close", (code) => (code === 0 ? resolve(d.trim()) : reject(new Error(`exit ${code}`))))
          proc.on("error", reject)
        }),
    )
    const [_, __, w, h] = d.split(", ").map(Number)
    return { width: w, height: h }
  }
  if (platform === "linux") {
    const raw = yield* Effect.promise<string>(
      () =>
        new Promise((resolve, reject) => {
          const proc = spawn("xdotool", ["getdisplaygeometry"])
          let d = ""
          proc.stdout.on("data", (b: Buffer) => (d += b.toString()))
          proc.on("close", (code) => (code === 0 ? resolve(d.trim()) : reject(new Error(`exit ${code}`))))
          proc.on("error", reject)
        }),
    )
    const [w, h] = raw.split(/\s+/).map(Number)
    return { width: w, height: h }
  }
  return yield* Effect.fail(new Error(`Unsupported platform: ${platform}`))
})

export const Action = Schema.Struct({
  action: Schema.Literal("screenshot", "click", "doubleclick", "rightclick", "move", "type", "keypress", "scroll", "screensize"),
  x: Schema.optional(Schema.Number).annotate({ description: "X coordinate for click/move actions" }),
  y: Schema.optional(Schema.Number).annotate({ description: "Y coordinate for click/move actions" }),
  text: Schema.optional(Schema.String).annotate({ description: "Text to type (for type action)" }),
  delayMs: Schema.optional(Schema.Number).annotate({ description: "Delay in ms between keystrokes (for type action, default: 0)" }),
  keys: Schema.optional(Schema.Array(Schema.String)).annotate({ description: "Keys to press (for keypress action), e.g. ['ctrl', 'c']" }),
  button: Schema.optional(Schema.Literal("left", "right", "middle")).annotate({ description: "Mouse button (default: left)" }),
  clicks: Schema.optional(Schema.Number).annotate({ description: "Scroll clicks (positive=up, negative=down)" }),
})

export const ComputerTool = Tool.define<typeof Action, {}, Question.Service>(
  "computer",
  Effect.gen(function* () {
    return {
      description: DESCRIPTION,
      parameters: Action,
      execute: (params: Schema.Schema.Type<typeof Action>) =>
        Effect.gen(function* () {
          const { action } = params

          if (action === "screenshot") {
            const dataUrl = yield* captureScreenshot
            return {
              title: "Captured screenshot",
              output: "Screenshot captured. Use the image to decide the next action.",
              attachments: [{
                type: "file",
                mime: "image/png",
                filename: "screenshot.png",
                url: dataUrl,
              }],
              metadata: {},
            }
          }

          if (action === "move") {
            yield* moveMouse(params.x!, params.y!)
            return { title: "Mouse moved", output: `Mouse moved to (${params.x}, ${params.y})`, metadata: {} }
          }

          if (action === "click" || action === "doubleclick" || action === "rightclick") {
            if (params.x != null && params.y != null) {
              yield* moveMouse(params.x, params.y)
            }
            const btn = action === "rightclick" ? "right" : (params.button ?? "left")
            yield* clickMouse(btn as "left" | "right" | "middle")
            if (action === "doubleclick") {
              yield* clickMouse(btn as "left" | "right" | "middle")
            }
            const dataUrl = yield* captureScreenshot
            return {
              title: `${action} at (${params.x ?? "current"}, ${params.y ?? "current"})`,
              output: `Performed ${action}. Screenshot shows the result.`,
              attachments: [{
                type: "file",
                mime: "image/png",
                filename: "screenshot.png",
                url: dataUrl,
              }],
              metadata: {},
            }
          }

          if (action === "type") {
            yield* typeText(params.text!, params.delayMs ?? 0)
            const dataUrl = yield* captureScreenshot
            return {
              title: `Typed text`,
              output: `Typed "${params.text!.length > 50 ? params.text!.slice(0, 50) + "..." : params.text!}". Screenshot shows the result.`,
              attachments: [{
                type: "file",
                mime: "image/png",
                filename: "screenshot.png",
                url: dataUrl,
              }],
              metadata: {},
            }
          }

          if (action === "keypress") {
            yield* keyPress(params.keys!)
            const dataUrl = yield* captureScreenshot
            return {
              title: `Key press: ${params.keys!.join("+")}`,
              output: `Pressed ${params.keys!.join("+")}. Screenshot shows the result.`,
              attachments: [{
                type: "file",
                mime: "image/png",
                filename: "screenshot.png",
                url: dataUrl,
              }],
              metadata: {},
            }
          }

          if (action === "scroll") {
            yield* scrollMouse(params.clicks ?? 3)
            const dataUrl = yield* captureScreenshot
            return {
              title: `Scrolled ${params.clicks ?? 3} clicks`,
              output: `Scrolled. Screenshot shows the result.`,
              attachments: [{
                type: "file",
                mime: "image/png",
                filename: "screenshot.png",
                url: dataUrl,
              }],
              metadata: {},
            }
          }

          if (action === "screensize") {
            const size = yield* getScreenSize
            return {
              title: "Screen size",
              output: `Screen resolution: ${size.width}x${size.height}`,
              metadata: {},
            }
          }

          return {
            title: "Unknown action",
            output: `Unknown action: ${action}`,
            metadata: {},
          }
        }).pipe(Effect.orDie),
    }
  }),
)
