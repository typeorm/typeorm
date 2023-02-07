# 缓存查询

你可以缓存`getMany`，`getOne`，`getRawMany`，`getRawOne`和`getCount`这些`QueryBuilder`方法的查询结果。

还可以缓存`find`，`findAndCount`，`findByIds`和`count`这些`Repository`方法查询的结果。

要启用缓存，需要在连接选项中明确启用它：

```typescript
{
    type: "mysql",
    host: "localhost",
    username: "test",
    ...
    cache: true
}
```

首次启用缓存时，你必须同步数据库架构（使用 CLI，migrations 或`synchronize`连接选项）。

然后在`QueryBuilder`中，你可以为任何查询启用查询缓存：

```typescript
const users = await connection
  .createQueryBuilder(User, "user")
  .where("user.isAdmin = :isAdmin", { isAdmin: true })
  .cache(true)
  .getMany();
```

等同于`Repository`查询：

```typescript
const users = await connection.getRepository(User).find({
  where: { isAdmin: true },
  cache: true
});
```

这将执行查询以获取所有 admin users 并缓存结果。
下次执行相同的代码时，它将从缓存中获取所有 admin users。
默认缓存生存期为`1000 ms`，例如 1 秒。
这意味着在调用查询构建器代码后 1 秒内缓存将无效。
实际上，这也意味着如果用户在 3 秒内打开用户页面 150 次，则在此期间只会执行三次查询。
在 1 秒缓存窗口期间插入的任何 users 都不会返回到 user。

你可以通过`QueryBuilder`手动更改缓存时间：

```typescript
const users = await connection
  .createQueryBuilder(User, "user")
  .where("user.isAdmin = :isAdmin", { isAdmin: true })
  .cache(60000) // 1 分钟
  .getMany();
```

或者通过 `Repository`:

```typescript
const users = await connection.getRepository(User).find({
  where: { isAdmin: true },
  cache: 60000
});
```

或者通过全局连接选项：

```typescript
{
    type: "mysql",
    host: "localhost",
    username: "test",
    ...
    cache: {
        duration: 30000 // 30 seconds
    }
}
```

此外，你可以通过`QueryBuilder`设置"cache id"：

```typescript
const users = await connection
  .createQueryBuilder(User, "user")
  .where("user.isAdmin = :isAdmin", { isAdmin: true })
  .cache("users_admins", 25000)
  .getMany();
```

或者通过 `Repository`:

```typescript
const users = await connection.getRepository(User).find({
  where: { isAdmin: true },
  cache: {
    id: "users_admins",
    milisseconds: 25000
  }
});
```

这使你可以精确控制缓存，例如，在插入新用户时清除缓存的结果：

```typescript
await connection.queryResultCache.remove(["users_admins"]);
```

默认情况下，TypeORM 使用一个名为`query-result-cache`的单独表，并在那里存储所有查询和结果。
表名是可配置的，因此您可以通过在 tableName 属性中给出值来更改它
例如：

```typescript
{
    type: "mysql",
    host: "localhost",
    username: "test",
    ...
    cache: {
        type: "database",
        tableName: "configurable-table-query-result-cache"
    }
}
```

如果在单个数据库表中存储缓存对你无效，则可以将缓存类型更改为"redis"或者"ioredis"，而 TypeORM 将以 redis 形式存储所有缓存的记录。
例如：

```typescript
{
    type: "mysql",
    host: "localhost",
    username: "test",
    ...
    cache: {
        type: "redis",
        options: {
            host: "localhost",
            port: 6379
        }
    }
}
```

"options" 可以是[node_redis specific options](https://github.com/NodeRedis/node_redis#options-object-properties) 或者
[ioredis specific options](https://github.com/luin/ioredis/blob/master/API.md#new-redisport-host-options)，具体取决于你使用的类型。

如果你想使用IORedis的集群功能连接到redis-cluster，则可以通过方式下操作来执行此操作：

 ```typescript
{
    type: "mysql",
    host: "localhost",
    username: "test",
    cache: {
        type: "ioredis/cluster",
        options: {
            startupNodes: [
                {
                    host: 'localhost',
                    port: 7000,
                },
                {
                    host: 'localhost',
                    port: 7001,
                },
                {
                    host: 'localhost',
                    port: 7002,
                }
            ],
            options: {
                scaleReads: 'all',
                clusterRetryStrategy: function (times) { return null },
                redisOptions: {
                    maxRetriesPerRequest: 1
                }
            }
        }
    }
}
```

请注意，你仍然可以使用选项作为IORedis的集群构造函数的第一个参数。

``` typescript
{
    ...
    cache: {
        type: "ioredis/cluster",
        options: [
            {
                host: 'localhost',
                port: 7000,
            },
            {
                host: 'localhost',
                port: 7001,
            },
            {
                host: 'localhost',
                port: 7002,
            }
        ]
    },
    ...
}
```

你可以使用`typeorm cache：clear`来清除存储在缓存中的所有内容。
