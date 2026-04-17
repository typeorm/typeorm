import "typeorm"

const users = await repository.find({
    select: {
        id: true,
        name: true,
        email: true,
    },
})

// Should NOT be transformed — value is a function call, not an array literal.
const dynamic = await repository.find({
    select: computeSelect(),
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
