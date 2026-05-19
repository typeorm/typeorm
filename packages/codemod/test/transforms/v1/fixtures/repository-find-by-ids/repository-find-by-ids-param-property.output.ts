import type { Repository } from "typeorm"

import { In } from "typeorm"

declare class User {}

// NestJS-style constructor parameter-property. `private readonly repo:
// Repository<User>` is both a local binding inside the constructor AND a
// class field reachable as `this.repo` elsewhere. The `.findByIds(...)`
// call on `this.repo` must still be rewritten to `.findBy({ id: In(...) })`.
class UserService {
    constructor(private readonly repo: Repository<User>) {}

    load() {
        return this.repo.findBy({
            id: In([1, 2, 3]),
        })
    }
}
