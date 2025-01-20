# 日志

  * [开启日志](#开启日志)
  * [日志选项](#日志选项)
  * [记录耗时长的查询](#记录耗时长的查询)
  * [更改默认记录器](#更改默认记录器)
  * [使用自定义记录器](#使用自定义记录器)

## 开启日志

你只需在连接选项中设置`logging：true`即可启用所有查询和错误的记录：

```typescript
{
    name: "mysql",
    type: "mysql",
    host: "localhost",
    port: 3306,
    username: "test",
    password: "test",
    database: "test",
    ...
    logging: true
}
```

## 日志选项

可以在连接选项中启用不同类型的日志记录：

```typescript
{
    host: "localhost",
    ...
    logging: ["query", "error"]
}
```

如果要启用失败查询的日志记录，则只添加`error`：

```typescript
{
    host: "localhost",
    ...
    logging: ["error"]
}
```

还可以使用其他选项：

- `query` - 记录所有查询。
- `error` - 记录所有失败的查询和错误。
- `schema` - 记录架构构建过程。
- `warn` - 记录内部 orm 警告。
- `info` - 记录内部 orm 信息性消息。
- `log` - 记录内部 orm 日志消息。

你可以根据需要指定任意数量的选项。
如果要启用所有日志记录，只需指定`logging：“all”`：

```typescript
{
    host: "localhost",
    ...
    logging: "all"
}
```

## 记录耗时长的查询

如果遇到性能问题，可以通过在连接选项中设置`maxQueryExecutionTime`来记录执行时间过长的查询：

```typescript
{
    host: "localhost",
    ...
    maxQueryExecutionTime: 1000
}
```

此代码将记录所有运行超过`1秒`的查询。

## 更改默认记录器

TypeORM 附带 4 种不同类型的记录器：

- `advanced-console` - 默认记录器，它将使用颜色和 sql 语法高亮显示所有记录到控制台中的消息（使用[chalk](https://github.com/chalk/chalk)）。
- `simple-console` - 简单的控制台记录器，与高级记录器完全相同，但它不使用任何颜色突出显示。
  如果你不喜欢/或者使用彩色日志有问题，可以使用此记录器。
- `file` - 这个记录器将所有日志写入项目根文件夹中的`ormlogs.log`（靠近`package.json`和`ormconfig.json`）。
- `debug` - 此记录器使用[debug package](https://github.com/visionmedia/debug)打开日志记录设置你的 env 变量`DEBUG = typeorm：*`（注意记录选项对此记录器没有影响）。

你可以在连接选项中启用其中任何一个：

```typescript
{
    host: "localhost",
    ...
    logging: true,
    logger: "file"
}
```

## 使用自定义记录器

你可以通过实现`Logger`接口来创建自己的记录器类：

```typescript
import { Logger } from "typeorm";

export class MyCustomLogger implements Logger {
  // 实现logger类的所有方法
}
```

并在连接选项中指定它：

```typescript
import { createConnection } from "typeorm";
import { MyCustomLogger } from "./logger/MyCustomLogger";

createConnection({
  name: "mysql",
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "test",
  password: "test",
  database: "test",
  logger: new MyCustomLogger()
});
```

如果在`ormconfig`文件中定义了
然后你可以使用它并以下面的方式覆盖它：

```typescript
import { createConnection, getConnectionOptions } from "typeorm";
import { MyCustomLogger } from "./logger/MyCustomLogger";

// getConnectionOptions将从ormconfig文件中读取选项并将其返回到connectionOptions对象中，
// 然后你只需向其附加其他属性
getConnectionOptions().then(connectionOptions => {
  return createConnection(
    Object.assign(connectionOptions, {
      logger: new MyCustomLogger()
    })
  );
});
```

记录器方法可接受`QueryRunner`。 如果要记录其他数据将会很有帮助。
此外，通过查询运行程序，你可以访问在持久/删除期间传递的其他数据。 例如：

```typescript
// 用户在实体保存期间发送请求
postRepository.save(post, { data: { request: request } });

// 在logger中你可以这样访问它：
logQuery(query: string, parameters?: any[], queryRunner?: QueryRunner) {
    const requestUrl = queryRunner && queryRunner.data["request"] ? "(" + queryRunner.data["request"].url + ") " : "";
    console.log(requestUrl + "executing query: " + sql);
}
```
