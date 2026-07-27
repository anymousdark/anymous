// @ts-nocheck

import { anymous } from "@anymous-ai/core"
import { ReadTool } from "@anymous-ai/core/tools"

const anymous = anymous.make({})

anymous.tool.add(ReadTool)

anymous.tool.add({
  name: "bash",
  schema: {
    type: "object",
    properties: {
      command: {
        type: "string",
        description: "The command to run.",
      },
    },
    required: ["command"],
  },
  execute(input, ctx) {},
})

anymous.auth.add({
  provider: "openai",
  type: "api",
  value: process.env.OPENAI_API_KEY,
})

anymous.agent.add({
  name: "build",
  permissions: [],
  model: {
    id: "gpt-5-5",
    provider: "openai",
    variant: "xhigh",
  },
})

const sessionID = await anymous.session.create({
  agent: "build",
})

anymous.subscribe((event) => {
  console.log(event)
})

await anymous.session.prompt({
  sessionID,
  text: "hey what is up",
})

await anymous.session.prompt({
  sessionID,
  text: "what is up with this",
  files: [
    {
      mime: "image/png",
      uri: "data:image/png;base64,xxxx",
    },
  ],
})

await anymous.session.wait()

console.log(await anymous.session.messages(sessionID))
