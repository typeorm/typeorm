await queryBuilder
    .insert()
    .into(Post)
    .values(post)
    .orUpdate(["title"], ["date"])
    .execute()
