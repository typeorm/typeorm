import "typeorm"

await queryBuilder.insert().into(Post).values(post).orIgnore().execute()

// TODO(typeorm-v1): `onConflict()` was removed — use `orIgnore()` or `orUpdate()` instead
qb.insert().onConflict('("id") DO UPDATE SET title = EXCLUDED.title')
