import "typeorm"

const users = await repository.find({
    select: {
        id: true,
        name: true,
        email: true,
    },
})

// Dynamic value — wrapped with `Object.fromEntries(...)` to produce the
// v1 object shape at runtime from whatever `string[]` the expression
// returns.
const dynamic = await repository.find({
    select: Object.fromEntries(computeSelect().map((f) => [f, true])),
})

// Pinned: an array literal after a dynamic call still transforms independently
const mixed = await repository.find({
    select: {
        id: true,
        name: true,
    },
})

// Should NOT be transformed — pre-existing object-style already uses v1 shape.
const explicit = await repository.find({
    select: { id: true, name: true },
})
