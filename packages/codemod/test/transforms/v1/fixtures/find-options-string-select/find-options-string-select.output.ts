import "typeorm"

const users = await repository.find({
    select: {
        id: true,
        name: true,
        email: true,
    },
})

// Should NOT be transformed — value is a function call, not an array literal.
// The codemod can only rewrite statically-known string arrays.
const dynamic = await repository.find({
    select: computeSelect(),
})

// Should NOT be transformed — pre-existing object-style already uses v1 shape.
const explicit = await repository.find({
    select: { id: true, name: true },
})
