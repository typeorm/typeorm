import type { Repository } from "typeorm"

import { In } from "typeorm"

declare class User {}
declare class FallbackRepo {}

// Union-typed parameter — `FallbackRepo | Repository<User>` lists the
// non-TypeORM type first. The scope walker must still recognise the
// `Repository` member and rewrite `.findByIds(...)` on the bare `repo`
// identifier; otherwise the binding would be silently missed.
async function load(repo: FallbackRepo | Repository<User>) {
    return repo.findBy({
        id: In([1, 2, 3]),
    })
}
