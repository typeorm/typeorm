import { ConnectionManager } from "typeorm"
import { ConnectionManager as CM } from "typeorm"

// Case 1: direct instantiation
const manager = new ConnectionManager()

// Case 2: aliased instantiation
const manager2 = new CM()

// Case 3: instantiation inside a `throw` — previous allowlist missed this
function mustFail() {
    throw new ConnectionManager()
}

// Case 4: instantiation inside an `if` condition — previously missed
if (new ConnectionManager()) {
    console.log("never")
}

// Case 5: the class is only used as a type annotation — previously the
// import was silently stripped leaving a broken reference.
function create(): ConnectionManager {
    return null as any
}

// Case 6: CommonJS destructured require — previously unmigrated
const { ConnectionManager: CjsManager } = require("typeorm")
const cjsInstance = new CjsManager()
