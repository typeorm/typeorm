import "typeorm"

const users = await repository.find({
    relations: {
        profile: true,

        posts: {
            comments: true,
        },
    },
})

// Dynamic value — wrapped with `Object.fromEntries(...)`. A TODO notes
// that dot-paths (`"posts.comments"`) need manual nesting since the wrap
// produces a flat object keyed by the raw dot-path string.
// TODO(typeorm-v1): `relations` now takes an object. If the dynamic list contains dot-paths like `"posts.comments"`, the wrap below produces `{ "posts.comments": true }` — convert those to nested objects manually: `{ posts: { comments: true } }`.
const dynamic = await repository.find({
    relations: Object.fromEntries(
        computeRelations()?.map((r) => [r, true]) ?? [],
    ),
})

// Should NOT be transformed — pre-existing object-style already uses v1 shape.
const explicit = await repository.find({
    relations: { profile: true },
})

// WHERE-only find variants (`findBy`/`findOneBy`/`findAndCountBy`/`countBy`)
// take a plain WHERE object — a top-level `relations` key there would match
// an entity field named `relations`, so the transform must NOT rewrite.
const whereBy = await repository.findBy({ relations: ["profile"] })
const whereByOne = await repository.findOneBy({ relations: ["profile"] })
