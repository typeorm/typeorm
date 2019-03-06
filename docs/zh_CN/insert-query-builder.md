# 使用 Query Builder 插入

你可以使用`QueryBuilder`创建`INSERT`查询。
例如：

```typescript
import { getConnection } from "typeorm";

await getConnection()
  .createQueryBuilder()
  .insert()
  .into(User)
  .values([{ firstName: "Timber", lastName: "Saw" }, { firstName: "Phantom", lastName: "Lancer" }])
  .execute();
```

就性能而言，这是向数据库中插入实体的最有效方法。
你也可以通过这种方式执行批量插入。
