declare global {
  const ANYMOUS_VERSION: string
  const ANYMOUS_CHANNEL: string
}

export const InstallationVersion = typeof ANYMOUS_VERSION === "string" ? ANYMOUS_VERSION : "local"
export const InstallationChannel = typeof ANYMOUS_CHANNEL === "string" ? ANYMOUS_CHANNEL : "local"
export const InstallationLocal = InstallationChannel === "local"
