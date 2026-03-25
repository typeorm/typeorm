// TODO(typeorm-v1): `printSql()` was removed — use `getSql()` or `getQueryAndParameters()` to inspect SQL
const users = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :id", { id: 1 })
    .printSql()
    .getMany()
