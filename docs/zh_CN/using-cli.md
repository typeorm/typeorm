# 使用 CLI

  * [关于TypeScript编写实体的说明](#关于TypeScript编写实体的说明)
  * [初始化一个新的TypeORM项目](#初始化一个新的TypeORM项目)
  * [创建一个新实体](#创建一个新实体)
  * [创建一个新订阅者](#创建一个新订阅者)
  * [创建新迁移](#创建新迁移)
  * [从现有表结构生成迁移](#从现有表结构生成迁移)
  * [运行迁移](#运行迁移)
  * [还原迁移](#还原迁移)
  * [同步数据库架构](#同步数据库架构)
  * [记录同步数据库架构查询而不运行](#记录同步数据库架构查询而不运行)
  * [删除数据库架构](#删除数据库架构)
  * [运行任意SQL查询](#运行任意SQL查询)
  * [清除缓存](#清除缓存)
  * [检查版本](#检查版本)

## 关于TypeScript编写实体的说明

此 CLI 工具使用 javascript 编写，并在 node 上运行。如果你的实体文件是 TypeScript 编写，则需要在使用 CLI 之前将它们转换为 javascript。如果只使用 javascript，则可以跳过此部分。

全局安装 ts-node：

你可以在项目中设置 ts-node 以简化操作，如下所示：

```
npm install ts-node --save-dev
```

在 package.json 中的 scripts 下添加 typeorm 命令

```
"script" {
    ...
    "typeorm": "typeorm-ts-node-commonjs"
}
```

然后运行如下命令：

```
npm run typeorm migration:run
```

如果你需要将带有破折号的参数传递给 npm 脚本，则需要在`--`之后添加。例如，如果需要生成，则命令如下：

```
npm run typeorm migration:generate -- -n migrationNameHere
```

## 初始化一个新的TypeORM项目

你可以使用已设置的所有内容创建新项目：

```
typeorm init
```

它使用 TypeORM 创建基本项目所需的所有文件：

-   .gitignore
-   package.json
-   README.md
-   tsconfig.json
-   ormconfig.json
-   src/entity/User.ts
-   src/index.ts

然后你可以运行`npm install`来安装所有依赖项。
一旦安装了所有依赖项，你需要修改`ormconfig.json`并插入您自己的数据库设置。
之后，可以通过运行`npm start`来运行您的应用程序。

所有文件都在当前目录中生成。
如果要在特殊目录中生成它们，可以使用`--name`：

```
typeorm init --name my-project
```

要指定使用的特定数据库，可以使用`--database`：

```
typeorm init --database mssql
```

你还可以使用 Express 生成基础项目：

```
typeorm init --name my-project --express
```

如果你使用的是 docker，可以使用以下命令生成`docker-compose.yml`文件：

```
typeorm init --docker
```

`typeorm init`是设置 TypeORM 项目最简单，最快捷的方法。

## 创建一个新实体

你可以使用 CLI 创建新实体：

```
typeorm entity:create -n User
```

其中`User`是实体文件和类名。
运行该命令将在项目的`entitiesDir`中创建一个新的空实体。
要设置项目的`entitiesDir`，你必须在连接选项中添加它：

```
{
    cli: {
        entitiesDir: "src/entity"
    }
}
```

学习更多关于 [connection options](./connection-options.md).

如果多个目录中具有多个实体的多模块项目结构，则需要提供 CLI 生成实体目录的路径：

```
typeorm entity:create -n User -d src/user/entity
```

学习更多关于 [entities](./entities.md).

## 创建一个新订阅者

可以使用 CLI 创建新订阅者：

```
typeorm subscriber:create -n UserSubscriber
```

其中`UserSubscriber`是订阅者文件和类名。
执行以下命令将在项目的`subscribersDir`中创建一个新的空订阅者。
要设置`subscribersDir`，首先必须在连接选项中添加它：

```
{
    cli: {
        subscribersDir: "src/subscriber"
    }
}
```

了解有关[连接选项](./connection-options.md)的更多信息。
如果你有一个不同目录中有多个订阅用户的多模块结构的项目，可以给 CLI 命令提供相应的路径，然后在其中生成 subscriber：

```
typeorm subscriber:create -n UserSubscriber -d src/user/subscriber
```

了解有关[Subscribers](./listeners-and-subscribers.md)的更多信息。

## 创建新迁移

你可以使用 CLI 创建新的迁移：

```
typeorm migration:create path-to-migrations-dir/migrationName
```

其中`UserMigration`是一个迁移文件和类名。
运行该命令将在项目的`migrationsDir`中创建一个新的空迁移。
要设置`migrationsDir`，首先必须在连接选项中添加它：

```
{
    cli: {
        migrationsDir: "src/migration"
    }
}
```

了解有关[连接选项](./connection-options.md)的更多信息。
如果你有一个在不同目录中具有多个迁移的多模块结构的项目，则可以提供要生成迁移的 CLI 命令的路径：

```
typeorm migration:create path-to-migrations-dir/migrationName
```

了解有关[Migrations](./migrations.md)的更多信息。

## 从现有表结构生成迁移

自动迁移生成会创建新的迁移文件并编写必须执行的所有 sql 查询以更新数据库。

```
typeorm migration:generate -n UserMigration
```

根据经验，在每次实体更改后生成迁移。

了解有关[Migrations](./migrations.md)的更多信息。

## 运行迁移

要执行所有挂起的迁移，请使用以下命令：

```
typeorm migration:run
```

了解有关 [Migrations](./migrations.md)的更多信息。

## 还原迁移

要还原最近执行的迁移，请使用以下命令：

```
typeorm migration:revert -- -d path-to-datasource-config
```

此命令将仅撤消上次执行的迁移。
你可以多次执行此命令以还原多个迁移。
了解有关[Migrations](./migrations.md)的更多信息。

## 同步数据库架构

要同步数据库架构，请使用：

```
typeorm schema:sync
```

在生产环境中请谨慎运行此命令。如果冒失的使用它，则可能会导致数据库同步时数据丢失。在部署生产环境之前，检查将运行哪些 sql 查询。

## 记录同步数据库架构查询而不运行

要检查将要运行的 sql 查询，请使用`schema：sync`：

```
typeorm schema:log
```

## 删除数据库架构

要完全删除数据库架构，请使用以下命令：

```
typeorm schema:drop -- -d path-to-datasource-config
```

在生产环境时要谨慎使用这个命令，因为它会完全删除数据库中的数据。

## 运行任意SQL查询

你可以使用以下命令直接在数据库中执行想要的任何 SQL 查询：

```
typeorm query "SELECT * FROM USERS"
```

## 清除缓存

如果你使用`QueryBuilder`缓存，有时可能希望清除缓存中存储的所有内容。
则可以使用以下命令执行此操作：

```
typeorm cache:clear
```

## 检查版本

可以通过运行以下命令来检查已安装（本地和全局）的 typeorm 版本：

```
typeorm version
```
