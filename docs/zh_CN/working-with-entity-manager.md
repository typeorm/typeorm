# 什么是 EntityManager

使用`EntityManager`，你可以管理（insert, update, delete, load 等）任何实体。
EntityManager 就像放一个实体存储库的集合的地方。

你可以通过`getManager（）`或`Connection`访问实体管理器。

如何使用它：

```typescript
import { getManager } from "typeorm";
import { User } from "./entity/User";

const entityManager = getManager(); // 你也可以通过 getConnection().manager 获取
const user = await entityManager.findOne(User, 1);
user.name = "Umed";
await entityManager.save(user);
```
