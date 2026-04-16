import { ConnectionOptionsReader } from "typeorm"

// Case 1: simple constructor + all() → rename to get()
// TODO(typeorm-v1): `ConnectionOptionsReader` now searches `process.cwd()` instead of the app root — pass `{ root: "/custom/path" }` to override. `get(name)` and `has(name)` were also removed; use `get()` (previously `all()`) and filter the returned array.
const reader = new ConnectionOptionsReader()
const allOptions = await reader.get()

// Case 2: constructor with options
// TODO(typeorm-v1): `ConnectionOptionsReader` now searches `process.cwd()` instead of the app root — pass `{ root: "/custom/path" }` to override. `get(name)` and `has(name)` were also removed; use `get()` (previously `all()`) and filter the returned array.
const customReader = new ConnectionOptionsReader({ root: "/custom/path" })
const custom = await customReader.get()

// Case 3: inlined usage — constructor gets a TODO, .all() is not renamed
// (our transform only tracks bound identifiers)
// TODO(typeorm-v1): `ConnectionOptionsReader` now searches `process.cwd()` instead of the app root — pass `{ root: "/custom/path" }` to override. `get(name)` and `has(name)` were also removed; use `get()` (previously `all()`) and filter the returned array.
const inline = await new ConnectionOptionsReader().all()
