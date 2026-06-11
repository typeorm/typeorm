import "typeorm"

import { In } from "typeorm"

declare const repo: any
declare class User {}

// Side-effect-only `import "typeorm"` carries no specifiers. Pushing a
// named specifier into it would work at runtime but changes the import
// shape; emit a fresh `import { In } from "typeorm"` instead.
async function load() {
    return repo.findBy({
        id: In([1, 2, 3]),
    })
}
