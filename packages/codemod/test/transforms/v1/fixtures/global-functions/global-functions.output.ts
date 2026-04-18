// TODO(typeorm-v1): `dataSource` is not defined — inject or import your DataSource instance
// TODO(typeorm-v1): named connections were removed in v1 — if you relied on `getConnection("name")`, wire up a second DataSource and reference it here
const repo = dataSource.getRepository(User)
const manager = dataSource.manager
const qb = dataSource.createQueryBuilder("user")
const postRepo = dataSource.getRepository(Post)

// getConnection() with no args → dataSource
const ds = dataSource

// Named connections removed in v1 — argument is dropped, TODO flags manual reconfiguration
const secondary = dataSource
