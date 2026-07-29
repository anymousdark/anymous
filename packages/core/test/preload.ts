import path from "path"

process.env.ANYMOUS_DB = ":memory:"
process.env.ANYMOUS_MODELS_PATH = path.join(import.meta.dir, "plugin", "fixtures", "models-dev.json")
process.env.ANYMOUS_DISABLE_MODELS_FETCH = "true"
