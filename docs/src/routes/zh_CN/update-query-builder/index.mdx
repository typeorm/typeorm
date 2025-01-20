# 使用 Query Builder 更新

你可以使用`QueryBuilder`创建`UPDATE`查询。
例如：

```typescript
import { getConnection } from "typeorm";

await getConnection()
  .createQueryBuilder()
  .update(User)
  .set({ firstName: "Timber", lastName: "Saw" })
  .where("id = :id", { id: 1 })
  .execute();
```

就性能而言，这是更新数据库中的实体的最有效方法。

### 原始SQL支持

 在某些情况下需要执行函数SQL查询时：


 ```typescript
import {getConnection} from "typeorm";
 await getConnection()
    .createQueryBuilder()
    .update(User)
    .set({ 
        firstName: "Timber", 
        lastName: "Saw",
        age: () => "'age' + 1"
    })
    .where("id = :id", { id: 1 })
    .execute();
```

 此语法不会对值进行转义，你需要自己处理转义。
