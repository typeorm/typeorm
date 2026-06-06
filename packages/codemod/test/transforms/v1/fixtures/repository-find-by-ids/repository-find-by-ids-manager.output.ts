import type { DataSource } from "typeorm"

import { In } from "typeorm"

declare const ds: DataSource
declare class User {}

// `ds.manager.getRepository(...)` returns a Repository, then `.findByIds`
// on it is the 1-arg Repository form. Pre-fix, the receiver of the
// `.findByIds` call was the inline `getRepository()` call and was already
// recognized. This fixture pins that behavior alongside the new
// DataSource-local-via-.manager pattern below.
async function viaRepo() {
    return ds.manager.getRepository(User).findBy({
        id: In([1, 2, 3]),
    })
}

// Class-property DataSource accessed via `this.ds.manager.getRepository(...)`.
class Service {
    constructor(private readonly ds: DataSource) {}
    load() {
        return this.ds.manager.getRepository(User).findBy({
            id: In([1, 2, 3]),
        })
    }
}
