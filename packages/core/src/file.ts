export * as File from "./file"

import { Revert } from "@anymous-ai/schema/revert"

export const Diff = Revert.FileDiff
export type Diff = typeof Diff.Type
