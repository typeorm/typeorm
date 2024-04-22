# 自定义存储库

你可以创建一个自定义存储库，其中应包含使用数据库的方法。
通常为单个实体创建自定义存储库，并包含其特定查询。
比如，假设我们想要一个名为`findByName（firstName：string，lastName：string）`的方法，它将按给定的 first 和 last names 搜索用户。
这个方法的最好的地方是在`Repository`，所以我们可以这样称呼它`userRepository.findByName（...）`。
你也可以使用自定义存储库来实现此目的。

有几种方法可以创建自定义存储库。

- [自定义存储库](#自定义存储库)
  - [如何自定义存储库](#如何自定义存储库)
  - [在事务中使用自定义存储库](#在事务中使用自定义存储库)

## 如何自定义存储库

常见的做法是将一个实体的存储库实例赋值给一个变量导出，然后在你的应用中使用它，例如：

```ts
// user.repository.ts
export const UserRepository = dataSource.getRepository(User)

// user.controller.ts
export class UserController {
    users() {
        return UserRepository.find()
    }
}
```

你可以使用 `Repository` 类中的 `.extend` 方法来扩展 `UserRepository` 的功能：

```typescript
// user.repository.ts
export const UserRepository = dataSource.getRepository(User).extend({
    findByName(firstName: string, lastName: string) {
        return this.createQueryBuilder("user")
            .where("user.firstName = :firstName", { firstName })
            .andWhere("user.lastName = :lastName", { lastName })
            .getMany()
    },
})

// user.controller.ts
export class UserController {
    users() {
        return UserRepository.findByName("Timber", "Saw")
    }
}
```

## 在事务中使用自定义存储库

每个事务有自己的执行作用域：它们有自己的执行器、实体管理器和储存库。
这就是使用全局的（数据源的）实体管理器和存储库在事务中并不会生效的原因。
为了确保事务中的操作能够正确地被执行你**必须**使用提供的实体管理器实例及其 `getRepository` 方法。如果需要在事务中使用自定义存储库，你必须使用其提供的实体管理器实例上的 `withRepository` 方法：

```typescript
await connection.transaction(async (manager) => {
    // 在事务中你必须使用其提供的实体管理器实例，
    // 不能使用全局的实体管理器或者存储库，
    // 因为这个实体管理器具有排他性和事务性

    const userRepository = manager.withRepository(UserRepository)
    await userRepository.createAndSave("Timber", "Saw")
    const timber = await userRepository.findByName("Timber", "Saw")
})
```
