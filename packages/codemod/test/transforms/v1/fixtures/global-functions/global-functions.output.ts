// TODO(typeorm-v1): `dataSource` is not defined — inject or import your DataSource instance
const repo = dataSource.getRepository(User)
const manager = dataSource.manager
const qb = dataSource.createQueryBuilder("user")
