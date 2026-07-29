import { getComponentCatalogue } from "@opentui/solid/components"
import { registerSpinner } from "opentui-spinner/solid"

export function registeranymousSpinner() {
  if (!getComponentCatalogue().spinner) registerSpinner()
}
