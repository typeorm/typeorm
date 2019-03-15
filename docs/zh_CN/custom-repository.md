# 自定义存储库

你可以创建一个自定义存储库，其中应包含使用数据库的方法。
通常为单个实体创建自定义存储库，并包含其特定查询。
比如，假设我们想要一个名为`findByName（firstName：string，lastName：string）`的方法，它将按给定的 first 和 last names 搜索用户。
这个方法的最好的地方是在`Repository`，所以我们可以这样称呼它`userRepository.findByName（...）`。
你也可以使用自定义存储库来实现此目的。

有几种方法可以创建自定义存储库。

  - [扩展了标准存储库的定制存储库](#扩展了标准存储库的定制存储库)
  - [扩展了标准AbstractRepository的自定义存储库](#扩展了标准AbstractRepository的自定义存储库)
  - [没有扩展的自定义存储库](#没有扩展的自定义存储库)
  - [在事务中使用自定义存储库或为什么自定义存储库不能是服务](#在事务中使用自定义存储库或为什么自定义存储库不能是服务)

## 扩展了标准存储库的定制存储库

创建自定义 repository 的第一种方法是扩展`Repository`。
例如：

```typescript
import { EntityRepository, Repository } from "typeorm";
import { User } from "../entity/User";

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  findByName(firstName: string, lastName: string) {
    return this.findOne({ firstName, lastName });
  }
}
```

然后你可以这样使用它：

```typescript
import { getCustomRepository } from "typeorm";
import { UserRepository } from "./repository/UserRepository";

const userRepository = getCustomRepository(UserRepository); // 或connection.getCustomRepository或manager.getCustomRepository（）
const user = userRepository.create(); // 和 const user = new User();一样
user.firstName = "Timber";
user.lastName = "Saw";
await userRepository.save(user);

const timber = await userRepository.findByName("Timber", "Saw");
```

如你所见，你也可以使用`getCustomRepository` 获取 repository，
并且可以访问在其中创建的任何方法以及标准实体 repository 中的任何方法。

## 扩展了标准AbstractRepository的自定义存储库

创建自定义 repository 的第二种方法是扩展`AbstractRepository`：

```typescript
import { EntityRepository, AbstractRepository } from "typeorm";
import { User } from "../entity/User";

@EntityRepository(User)
export class UserRepository extends AbstractRepository<User> {
  createAndSave(firstName: string, lastName: string) {
    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    return this.manager.save(user);
  }

  findByName(firstName: string, lastName: string) {
    return this.repository.findOne({ firstName, lastName });
  }
}
```

然后你可以这样使用它：

```typescript
import { getCustomRepository } from "typeorm";
import { UserRepository } from "./repository/UserRepository";

const userRepository = getCustomRepository(UserRepository); // or connection.getCustomRepository or manager.getCustomRepository()
await userRepository.createAndSave("Timber", "Saw");
const timber = await userRepository.findByName("Timber", "Saw");
```

这种类型的存储库与前一个存储库之间的区别在于它没有公开`Repository`所具有的所有方法。
`AbstractRepository`没有任何公共方法，它只有受保护的方法，比如`manager`和`repository`，你可以在自己的公共方法中使用它们。
如果你不希望将标准`Repository`所有方法公开给 public，那么扩展`AbstractRepository`将非常有用。

## 没有扩展的自定义存储库

创建存储库的第三种方法是不扩展任何东西，
但是需要定义一个总是接受实体管理器(entity manager)实例的构造函数：

```typescript
import { EntityRepository, Repository, EntityManager } from "typeorm";
import { User } from "../entity/User";

@EntityRepository()
export class UserRepository {
  constructor(private manager: EntityManager) {}

  createAndSave(firstName: string, lastName: string) {
    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    return this.manager.save(user);
  }

  findByName(firstName: string, lastName: string) {
    return this.manager.findOne(User, { firstName, lastName });
  }
}
```

然后你可以这样使用它：

```typescript
import { getCustomRepository } from "typeorm";
import { UserRepository } from "./repository/UserRepository";

const userRepository = getCustomRepository(UserRepository); // 或者 connection.getCustomRepository 或者 manager.getCustomRepository()
await userRepository.createAndSave("Timber", "Saw");
const timber = await userRepository.findByName("Timber", "Saw");
```

这种类型的存储库不会扩展任何东西，你只需要定义一个必须接受`EntityManager`的构造函数。 然后在存储库方法中的任何位置使用它。
此外，这种类型的存储库不绑定到特定实体，因此你可以使用其中的多个实体进行操作。

## 在事务中使用自定义存储库或为什么自定义存储库不能是服务

自定义存储库不能是服务，因为应用程序中没有自定义存储库的单个实例（就像常规存储库或实体管理器一样）。
除了您的应用程序中可能存在多个连接（实体管理器和存储库不同）之外，存储库和管理器在事务中也是不同的。

例如：

```typescript
await connection.transaction(async manager => {
  // 在事务中你必须使用事务提供的管理器实例而不能使用全局管理器、存储库或自定义存储库，
  // 因为这个管理器是独占的和事务性的，
  // 如果让我们自定义存储库作为服务,它的一个"manager"属性应该 是EntityManager的唯一实例，但没有全局的EntityManager实例，并且也不可能有。
  // 这就是为什么自定义管理器特定于每个EntityManager而不能是服务。
  // 这也提供了在事务中使用自定义存储库而不会出现什么问题：
  const userRepository = manager.getCustomRepository(UserRepository); // 不要在这里使用全局的getCustomRepository！
  await userRepository.createAndSave("Timber", "Saw");
  const timber = await userRepository.findByName("Timber", "Saw");
});
```
