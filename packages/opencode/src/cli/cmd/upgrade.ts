import type { Argv } from "yargs"
import { UI } from "../ui"
import * as prompts from "@clack/prompts"
import { Installation } from "../../installation"
import { InstallationVersion } from "@opencode-ai/core/installation/version"

const OPENCODE_RELEASES = "https://api.github.com/repos/anomalyco/opencode/releases/latest"

async function checkOpenCodeUpdate(): Promise<string | null> {
  try {
    const resp = await fetch(OPENCODE_RELEASES, { headers: { "User-Agent": "anymous" } })
    if (!resp.ok) return null
    const data: any = await resp.json()
    return (data.tag_name as string).replace(/^v/, "")
  } catch {
    return null
  }
}

export const UpgradeCommand = {
  command: "upgrade [target]",
  describe: "upgrade Anymous to the latest or a specific version",
  builder: (yargs: Argv) => {
    return yargs
      .positional("target", {
        describe: "version to upgrade to, for ex '0.1.48' or 'v0.1.48'",
        type: "string",
      })
      .option("method", {
        alias: "m",
        describe: "installation method to use",
        type: "string",
        choices: ["curl", "npm", "pnpm", "bun", "brew", "choco", "scoop"],
      })
      .option("sync", {
        alias: "s",
        describe: "sync with latest opencode release before upgrading",
        type: "boolean",
        default: false,
      })
  },
  handler: async (args: { target?: string; method?: string; sync?: boolean }) => {
    UI.empty()
    UI.println(UI.logo("  "))
    UI.empty()
    prompts.intro("Upgrade")

    // Check for opencode updates
    const opencodeLatest = await checkOpenCodeUpdate()
    if (opencodeLatest && opencodeLatest !== InstallationVersion) {
      prompts.log.info(`anymous v${opencodeLatest} disponível (atual: v${InstallationVersion})`)
      if (args.sync) {
        prompts.log.info("Sincronizando com opencode...")
        prompts.log.info(`Execute: bun run script/sync-opencode.ts --version=${opencodeLatest}`)
      } else {
        const sync = await prompts.confirm({
          message: `Sincronizar com opencode v${opencodeLatest}?`,
          initialValue: false,
        })
        if (sync) {
          prompts.log.info(`Execute para sincronizar:`)
          prompts.log.info(`  bun run script/sync-opencode.ts --version=${opencodeLatest}`)
          prompts.log.info(`Depois: cd packages/opencode/dist-npm && npm publish --access public`)
        }
      }
    }

    const detectedMethod = await Installation.method()
    const method = (args.method as Installation.Method) ?? detectedMethod
    if (method === "unknown") {
      prompts.log.error(`anymous is installed to ${process.execPath} and may be managed by a package manager`)
      const install = await prompts.select({
        message: "Install anyways?",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
        initialValue: false,
      })
      if (!install) {
        prompts.outro("Done")
        return
      }
    }
    prompts.log.info("Using method: " + method)
    const target = args.target ? args.target.replace(/^v/, "") : await Installation.latest()

    if (InstallationVersion === target) {
      prompts.log.warn(`anymous upgrade skipped: ${target} is already installed`)
      prompts.outro("Done")
      return
    }

    prompts.log.info(`From ${InstallationVersion} → ${target}`)
    const spinner = prompts.spinner()
    spinner.start("Upgrading...")
    const err = await Installation.upgrade(method, target).catch((err) => err)
    if (err) {
      spinner.stop("Upgrade failed", 1)
      if (err instanceof Installation.UpgradeFailedError) {
        if (method === "choco" && err.stderr.includes("not running from an elevated command shell")) {
          prompts.log.error("Please run the terminal as Administrator and try again")
        } else {
          prompts.log.error(err.stderr)
        }
      } else if (err instanceof Error) prompts.log.error(err.message)
      prompts.outro("Done")
      return
    }
    spinner.stop("Upgrade complete")
    prompts.outro("Done")
  },
}
