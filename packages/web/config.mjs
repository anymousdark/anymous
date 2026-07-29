const stage = process.env.SST_STAGE || "dev"

export default {
  url: stage === "production" ? "https://anymous-cli.vercel.app" : `https://${stage}.anymous-cli.vercel.app`,
  console: stage === "production" ? "https://anymous-cli.vercel.app/auth" : `https://${stage}.anymous-cli.vercel.app/auth`,
  email: "help@anoma.ly",
  socialCard: "https://social-cards.sst.dev",
  github: "https://github.com/anymousdark/anymous",
  discord: "https://anymous-cli.vercel.app/discord",
  headerLinks: [
    { name: "app.header.home", url: "/" },
    { name: "app.header.docs", url: "/docs/" },
  ],
}
