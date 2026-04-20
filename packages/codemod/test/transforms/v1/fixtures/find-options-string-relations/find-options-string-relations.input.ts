import "typeorm"

const users = await repository.find({
    relations: ["profile", "posts", "posts.comments"],
})

// Dynamic value — wrapped with `Object.fromEntries(...)`. A TODO notes
// that dot-paths (`"posts.comments"`) need manual nesting since the wrap
// produces a flat object keyed by the raw dot-path string.
const dynamic = await repository.find({
    relations: computeRelations(),
})

// Should NOT be transformed — pre-existing object-style already uses v1 shape.
const explicit = await repository.find({
    relations: { profile: true },
})
