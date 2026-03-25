// TODO: `printSql()` was removed in TypeORM v1. Use `getSql()` or `getQueryAndParameters()` to inspect SQL. See migration guide: https://typeorm.io/docs/guides/migration-v1
const users = await dataSource
    .getRepository(User)
    .createQueryBuilder("user")
    .where("user.id = :id", { id: 1 })
    .printSql()
    .getMany()
