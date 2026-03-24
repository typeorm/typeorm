await queryBuilder.insert().into(Post).values(post).orIgnore().execute()
