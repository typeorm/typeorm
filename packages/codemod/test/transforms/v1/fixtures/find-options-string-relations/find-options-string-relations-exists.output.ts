import "typeorm"

declare class User {}

// `Repository.exists` / `EntityManager.exists` accept FindManyOptions, whose
// `relations` key takes the same string-array or nested-object form as
// `find`/`findOne`. Must be rewritten to v1 nested-object syntax.
const existsWithNestedRelations = await repository.exists({
    relations: {
        profile: true,

        orders: {
            items: true,
        },
    },
})

const viaManager = await manager.exists(User, {
    relations: {
        roles: true,
    },
})

// `existsBy(where)` takes a plain WHERE object — must NOT rewrite a top-level
// `relations` key there.
const notByOptions = await repository.existsBy({ relations: ["profile"] })
