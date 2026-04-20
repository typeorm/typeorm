import "typeorm"

const users = await repository.find({
    select: ["id", "name", "email"],
})

// Dynamic value — wrapped with `Object.fromEntries(...)` to produce the
// v1 object shape at runtime from whatever `string[]` the expression
// returns.
const dynamic = await repository.find({
    select: computeSelect(),
})

// Pinned: an array literal after a dynamic call still transforms independently
const mixed = await repository.find({
    select: ["id", "name"],
})

// Should NOT be transformed — pre-existing object-style already uses v1 shape.
const explicit = await repository.find({
    select: { id: true, name: true },
})

// TS cast around the options object — the scope check walks through
// `as FindOptions` / `satisfies FindOptions` before looking for the
// enclosing find call.
const casted = await repository.find({ select: ["id", "name"] } as FindOptions)
const satisfied = await repository.find({
    select: ["id"],
} satisfies FindOptions)

// Bound variable — could already be in v1 object form, so the transform
// leaves a TODO rather than wrapping.
const selectOpts = { id: true }
const viaVariable = await repository.find({ select: selectOpts })
const viaMember = await repository.find({ select: config.select })

// WHERE-only find variants (`findBy`/`findOneBy`/`findAndCountBy`/`countBy`)
// take a plain WHERE object, not FindOptions — a top-level `select` key
// there would match an entity field named `select`, so the transform must
// NOT rewrite these.
const whereBy = await repository.findBy({ select: ["a", "b"] })
const whereByOne = await repository.findOneBy({ select: ["a"] })
const whereByCount = await repository.countBy({ select: ["a"] })
