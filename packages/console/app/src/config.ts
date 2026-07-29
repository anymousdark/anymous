/**
 * Application-wide constants and configuration
 */
export const config = {
  // Base URL
  baseUrl: "https://anymous-cli.vercel.app",

  // GitHub
  github: {
    repoUrl: "https://github.com/anymousdark/anymous",
    starsFormatted: {
      compact: "160K",
      full: "160,000",
    },
  },

  // Social links
  social: {
    twitter: "https://x.com/anymous",
    discord: "https://discord.gg/anymous",
  },

  // Static stats (used on landing page)
  stats: {
    contributors: "900",
    commits: "13,000",
    monthlyUsers: "7.5M",
  },
} as const
