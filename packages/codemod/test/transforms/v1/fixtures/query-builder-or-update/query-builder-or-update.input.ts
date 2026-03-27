await queryBuilder
    .insert()
    .into(Post)
    .values(post)
    .orUpdate({ conflict_target: ["date"], overwrite: ["title"] })
    .execute()
