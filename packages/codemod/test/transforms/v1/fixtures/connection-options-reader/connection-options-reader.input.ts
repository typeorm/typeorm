import { ConnectionOptionsReader } from "typeorm"

// Case 1: simple constructor + all() → rename to get()
const reader = new ConnectionOptionsReader()
const allOptions = await reader.all()

// Case 2: constructor with options
const customReader = new ConnectionOptionsReader({ root: "/custom/path" })
const custom = await customReader.all()

// Case 3: inlined usage — constructor gets a TODO, .all() is not renamed
// (our transform only tracks bound identifiers)
const inline = await new ConnectionOptionsReader().all()
