import { ConnectionOptionsReader } from "typeorm"
import { ConnectionOptionsReader as Reader } from "typeorm"
import * as typeorm from "typeorm"

// Case 1: simple constructor + all() → rename to get()
const reader = new ConnectionOptionsReader()
const allOptions = await reader.all()

// Case 2: constructor with options
const customReader = new ConnectionOptionsReader({ root: "/custom/path" })
const custom = await customReader.all()

// Case 3: inlined usage — constructor gets a TODO AND .all() is renamed to .get()
const inline = await new ConnectionOptionsReader().all()

// Case 4: aliased ESM import — constructor flagged, .all() renamed
const aliased = new Reader()
const aliasedOptions = await aliased.all()

// Case 5: namespace import — `new typeorm.ConnectionOptionsReader()`
const ns = new typeorm.ConnectionOptionsReader()
const nsOptions = await ns.all()

// Case 6: CommonJS destructured (aliased) binding
const { ConnectionOptionsReader: CjsReader } = require("typeorm")
const cjs = new CjsReader()
const cjsOptions = await cjs.all()

// Case 7: AssignmentExpression binding — `let r; r = new Reader()`
let deferred: ConnectionOptionsReader | undefined
deferred = new ConnectionOptionsReader()
const deferredOptions = await deferred.all()

// Case 8: two constructors on the same statement — only one TODO
const [a, b] = [
    new ConnectionOptionsReader(),
    new ConnectionOptionsReader({ root: "/other" }),
]

// Case 9: constructor inside `throw` — should still be flagged
function mustFail() {
    throw new ConnectionOptionsReader()
}

// Case 10: CommonJS member require — `const R = require("typeorm").ConnectionOptionsReader`
const MemberReader = require("typeorm").ConnectionOptionsReader
const fromMember = new MemberReader()
const fromMemberOptions = await fromMember.all()

// Case 11: default-parameter binding — constructor in a function default
async function loadDefaults(r = new ConnectionOptionsReader()) {
    return r.all()
}

// Case 12: optional-chain call variants on a tracked reader binding — still
// rename `.all()` → `.get()`
const opt1 = await reader?.all()
const opt2 = await reader.all?.()
const opt3 = await reader?.all?.()

// Case 13: `.all(arg)` — must NOT be renamed (v0 `all()` was zero-arg; an
// argument means unrelated user code that happens to share the method name)
const extraneous = reader.all("extra")

// Case 14: shadowing — a nested `reader` bound to an unrelated type must NOT
// have its `.all()` renamed even though the outer `reader` is a tracked
// ConnectionOptionsReader instance
function shadowed() {
    const reader = {
        all: (): string[] => ["not", "a", "typeorm", "reader"],
    }
    return reader.all()
}

// Case 15: outer-declared binding reassigned inside a nested scope — the
// declaration scope differs from the assignment-site scope, but `.all()` on
// that binding should still be renamed.
let nested: ConnectionOptionsReader | undefined
function init() {
    nested = new ConnectionOptionsReader()
    return nested.all()
}

// Case 16: computed member access — `reader["all"]()` should also be renamed
const computed1 = await reader["all"]()
const computed2 = await reader?.["all"]()
