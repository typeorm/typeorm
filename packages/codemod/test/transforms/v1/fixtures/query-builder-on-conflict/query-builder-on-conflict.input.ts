import "typeorm"

await queryBuilder
    .insert()
    .into(Post)
    .values(post)
    .onConflict('("id") DO NOTHING')
    .execute()

qb.insert().onConflict('("id") DO UPDATE SET title = EXCLUDED.title')
