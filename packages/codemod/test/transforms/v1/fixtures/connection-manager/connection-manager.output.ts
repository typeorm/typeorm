// Case 1: direct instantiation
// TODO(typeorm-v1): `ConnectionManager` was removed — create and manage `DataSource` instances directly instead — there is no replacement class
const manager = new ConnectionManager()

// Case 2: aliased instantiation
// TODO(typeorm-v1): `ConnectionManager` was removed — create and manage `DataSource` instances directly instead — there is no replacement class
const manager2 = new CM()

// Case 3: instantiation inside a `throw` — previous allowlist missed this
function mustFail() {
    // TODO(typeorm-v1): `ConnectionManager` was removed — create and manage `DataSource` instances directly instead — there is no replacement class
    throw new ConnectionManager()
}

// Case 4: instantiation inside an `if` condition — previously missed
// TODO(typeorm-v1): `ConnectionManager` was removed — create and manage `DataSource` instances directly instead — there is no replacement class
if (new ConnectionManager()) {
    console.log("never")
}

// Case 5: the class is only used as a type annotation — previously the
// import was silently stripped leaving a broken reference.
function create(): ConnectionManager {
    return null as any
}
