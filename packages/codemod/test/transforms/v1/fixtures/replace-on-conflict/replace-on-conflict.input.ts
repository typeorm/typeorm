await queryBuilder
    .insert()
    .into(Post)
    .values(post)
    .onConflict('("id") DO NOTHING')
    .execute()
