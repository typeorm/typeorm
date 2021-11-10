# 事务

  * [创建和使用事务](#创建和使用事务)
    * [指定隔离级别](#指定隔离级别)
  * [事务装饰器](#事务装饰器)
  * [使用`QueryRunner`创建和控制单个数据库连接的状态](#使用`QueryRunner`创建和控制单个数据库连接的状态)

## 创建和使用事务

事务是使用`Connection`或`EntityManager`创建的。
例如:

```typescript
import { getConnection } from "typeorm";

await getConnection().transaction(transactionalEntityManager => {});
```

or

```typescript
import { getManager } from "typeorm";

await getManager().transaction(transactionalEntityManager => {});
```

你想要在事务中运行的所有内容都必须在回调中执行：

```typescript
import { getManager } from "typeorm";

await getManager().transaction(async transactionalEntityManager => {
  await transactionalEntityManager.save(users);
  await transactionalEntityManager.save(photos);
  // ...
});
```

当在事务中工作时需要**总是**使用提供的实体管理器实例 - `transactionalEntityManager`。
如果你使用全局管理器（来自`getManager`或来自连接的 manager 可能会遇到一些问题。
你也不能使用使用全局管理器或连接的类来执行查询。**必须**使用提供的事务实体管理器执行所有操作。

### 指定隔离级别

指定事务的隔离级别可以通过将其作为第一个参数提供来完成：

```typescript
import { getManager } from "typeorm";

await getManager().transaction("SERIALIZABLE", transactionalEntityManager => {});
```

隔离级别实现与所有数据库不相关。

以下数据库驱动程序支持标准隔离级别（`READ UNCOMMITTED`，`READ COMMITTED`，`REPEATABLE READ`，`SERIALIZABLE`）：

- MySQL
- Postgres
- SQL Server

**SQlite**将事务默认为`SERIALIZABLE`，但如果启用了*shared cache mode*，则事务可以使用`READ UNCOMMITTED`隔离级别。

**Oracle**仅支持`READ COMMITTED`和`SERIALIZABLE`隔离级别。

## 事务装饰器

以下装饰器可以帮助你组织事务操作 - `@Transaction`, `@TransactionManager` 和 `@TransactionRepository`。

`@Transaction`将其所有执行包装到一个数据库事务中，`@TransactionManager`提供了一个事务实体管理器，它必须用于在该事务中执行查询：

```typescript
@Transaction()
save(@TransactionManager() manager: EntityManager, user: User) {
    return manager.save(user);
}
```

隔离级别：

```typescript
@Transaction({ isolation: "SERIALIZABLE" })
save(@TransactionManager() manager: EntityManager, user: User) {
    return manager.save(user);
}
```

你**必须**使用`@TransactionManager`提供的管理器。

但是，你也可以使用`@TransactionRepository`注入事务存储库（使用事务实体管理器）：

```typescript
@Transaction()
save(user: User, @TransactionRepository(User) userRepository: Repository<User>) {
    return userRepository.save(user);
}
```

你可以注入内置的 TypeORM 的存储库，如`Repository`，`TreeRepository`和`MongoRepository`
（使用`@TransactionRepository(Entity)entityRepository：Repository<Entity>`）或自定义存储库（扩展内置 TypeORM 的存储库类并用`@ EntityRepository`装饰的类）使用`@TransactionRepository() customRepository：CustomRepository`。

## 使用 `QueryRunner` 创建和控制单个数据库连接的状态

`QueryRunner`提供单个数据库连接。
使用查询运行程序组织事务。
单个事务只能在单个查询运行器上建立。
你可以手动创建查询运行程序实例，并使用它来手动控制事务状态。
例如：

```typescript
import { getConnection } from "typeorm";

// 获取连接并创建新的queryRunner
const connection = getConnection();
const queryRunner = connection.createQueryRunner();

// 使用我们的新queryRunner建立真正的数据库连
await queryRunner.connect();

// 现在我们可以在queryRunner上执行任何查询，例如：
await queryRunner.query("SELECT * FROM users");

// 我们还可以访问与queryRunner创建的连接一起使用的实体管理器：
const users = await queryRunner.manager.find(User);

// 开始事务：
await queryRunner.startTransaction();

try {
  // 对此事务执行一些操作：
  await queryRunner.manager.save(user1);
  await queryRunner.manager.save(user2);
  await queryRunner.manager.save(photos);

  // 提交事务：
  await queryRunner.commitTransaction();
} catch (err) {
  // 有错误做出回滚更改
  await queryRunner.rollbackTransaction();
}
```

在`QueryRunner`中有 3 种控制事务的方法：

- `startTransaction` - 启动一个新事务。
- `commitTransaction` - 提交所有更改。
- `rollbackTransaction` - 回滚所有更改。

了解有关[Query Runner](./query-runner.md)的更多信息。
