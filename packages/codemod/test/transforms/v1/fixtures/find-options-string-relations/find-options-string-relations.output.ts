import "typeorm"

const users = await repository.find({
    relations: {
        profile: true,

        posts: {
            comments: true,
        },
    },
})

// Should NOT be transformed — value is a function call, not an array literal.
const dynamic = await repository.find({
    relations: computeRelations(),
})

// Should NOT be transformed — pre-existing object-style already uses v1 shape.
const explicit = await repository.find({
    relations: { profile: true },
})
