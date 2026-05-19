import * as typeorm from "typeorm"

import { In } from "typeorm"

declare class User {}

// Namespace-only typeorm import — pushing a named specifier into
// `import * as typeorm` would produce invalid TS. A fresh
// `import { In } from "typeorm"` must be emitted instead.
async function load(repo: typeorm.Repository<User>) {
    return repo.findBy({
        id: In([1, 2, 3]),
    })
}
