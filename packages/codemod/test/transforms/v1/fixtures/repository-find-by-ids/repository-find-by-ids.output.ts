import { DataSource, In } from "typeorm"

type DataSourceType = typeof DataSource

const users = await repository.findBy({
    id: In([1, 2, 3]),
})

const invalid = await repository.findByIds(ids, options)

// Should NOT be transformed — not a TypeORM repository method
const values = await service.findByIds(ctx, ids)
