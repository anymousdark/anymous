interface ImportMetaEnv {
  readonly ANYMOUS_CHANNEL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module "virtual:anymous-server" {
  export namespace Server {
    export const listen: typeof import("../../../anymous/dist/types/src/node").Server.listen
    export type Listener = import("../../../anymous/dist/types/src/node").Server.Listener
  }
  export namespace Config {
    export const get: typeof import("../../../anymous/dist/types/src/node").Config.get
    export type Info = import("../../../anymous/dist/types/src/node").Config.Info
  }
  export const bootstrap: typeof import("../../../anymous/dist/types/src/node").bootstrap
}
