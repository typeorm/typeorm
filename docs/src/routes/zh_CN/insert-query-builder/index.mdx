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

### 原始SQL支持

在某些情况下需要执行函数SQL查询时：


```typescript
import {getConnection} from "typeorm";

await getConnection()
    .createQueryBuilder()
    .insert()
    .into(User)
    .values({ 
        firstName: "Timber", 
        lastName: () => "CONCAT('S', 'A', 'W')"
    })
    .execute();
```

此语法不会对值进行转义，你需要自己处理转义。
