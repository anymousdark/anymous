import { InstallationChannel, InstallationLocal, InstallationVersion } from "@anymous-ai/core/installation/version"

export const version = InstallationVersion
export const channel = InstallationChannel
export const isLocal = InstallationLocal

export function versionBanner(label?: string): string {
  const prefix = label ? `${label} ` : ""
  return `${prefix}v${InstallationVersion}`
}

export function fullBanner(): string {
  return `AI-Powered Reverse Engineering & Pentest Platform v${InstallationVersion}`
}
