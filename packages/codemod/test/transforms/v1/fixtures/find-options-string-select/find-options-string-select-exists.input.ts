import "typeorm"

declare class User {}

// `Repository.exists(options?: FindManyOptions)` was added in v1 and accepts
// the same FindOptions shape as `find`/`findOne`. Its `select` array should
// be rewritten to v1 object syntax like other FindOptions sites.
const existsByOptions = await repository.exists({ select: ["id", "email"] })

// `EntityManager.exists(Entity, options?)` — options is the second argument,
// mirroring `manager.find(Entity, { ... })`. Same rewrite applies.
const viaManager = await manager.exists(User, {
    select: ["id", "email", "createdAt"],
})

// `existsBy(where)` takes a plain WHERE object, not FindOptions — a top-level
// `select` key would match an entity field named `select`. Must NOT rewrite.
const notByOptions = await repository.existsBy({ select: ["a", "b"] })
