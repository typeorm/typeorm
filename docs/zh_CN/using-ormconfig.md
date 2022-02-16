# 使用 ormconfig.json

  * [从配置文件创建新连接](#从配置文件创建新连接)
  * [使用`ormconfig.json`](#使用`ormconfig.json`)
  * [使用`ormconfig.js`](#使用`ormconfig.js`)
  * [使用环境变量](#使用环境变量)
  * [使用`ormconfig.yml`](#使用`ormconfig.yml`)
  * [使用`ormconfig.xml`](#使用`ormconfig.xml`)
  * [覆盖ormconfig中定义的选项](#覆盖ormconfig中定义的选项)

## 从配置文件创建新连接

大多数情况下，我们希望将连接选项存储在单独的配置文件中，因为此方式使管理变得更方便和容易。 TypeORM 支持多个配置源。你只需要在应用程序的根目录（`package.json`附近）中创建一个`ormconfig.[format]`文件存放连接配置，并在应用程序中调用`createConnection()`，而不传递任何参数配置：

```typescript
import { createConnection } from "typeorm";

// createConnection方法会自动读取来自ormconfig文件或环境变量中的连接选项
const connection = await createConnection();
```

支持的 ormconfig 文件格式有：`.json`, `.js`, `.env`, `.yml` 和 `.xml`.

## 使用`ormconfig.json`

在项目根目录（`package.json`附近）中创建`ormconfig.json`，并包含以下内容：

```json
{
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "test",
  "password": "test",
  "database": "test"
}
```

你可以参考[ConnectionOptions](./connection-options.md)来设置其他选项。

如果要创建多个连接，则只需在数组中添加多个连接：

```json
[
  {
    "name": "default",
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "username": "test",
    "password": "test",
    "database": "test"
  },
  {
    "name": "second-connection",
    "type": "mysql",
    "host": "localhost",
    "port": 3306,
    "username": "test",
    "password": "test",
    "database": "test"
  }
]
```

## 使用`ormconfig.js`

在项目根目录（`package.json`附近）中创建`ormconfig.js`，并包含以下内容：

```javascript
module.exports = {
  type: "mysql",
  host: "localhost",
  port: 3306,
  username: "test",
  password: "test",
  database: "test"
};
```

你可以参考[ConnectionOptions](./connection-options.md)来设置其他选项。

如果要创建多个连接，则只需在数组中添加多个连接：

## 使用环境变量

在项目根目录（`package.json`附近）中创建`.env` 或者 `ormconfig.env`，并包含以下内容：

```ini
TYPEORM_CONNECTION = mysql
TYPEORM_HOST = localhost
TYPEORM_USERNAME = root
TYPEORM_PASSWORD = admin
TYPEORM_DATABASE = test
TYPEORM_PORT = 3000
TYPEORM_SYNCHRONIZE = true
TYPEORM_LOGGING = true
TYPEORM_ENTITIES = entity/.*js,modules/**/entity/.*js
```

可以设置的可用 env 变量列表：

- TYPEORM_CACHE
- TYPEORM_CACHE_ALWAYS_ENABLED
- TYPEORM_CACHE_DURATION
- TYPEORM_CACHE_OPTIONS
- TYPEORM_CONNECTION
- TYPEORM_DATABASE
- TYPEORM_DEBUG
- TYPEORM_DRIVER_EXTRA
- TYPEORM_DROP_SCHEMA
- TYPEORM_ENTITIES
- TYPEORM_ENTITIES_DIR
- TYPEORM_ENTITY_PREFIX
- TYPEORM_HOST
- TYPEORM_LOGGER
- TYPEORM_LOGGING
- TYPEORM_MAX_QUERY_EXECUTION_TIME
- TYPEORM_MIGRATIONS
- TYPEORM_MIGRATIONS_DIR
- TYPEORM_MIGRATIONS_RUN
- TYPEORM_MIGRATIONS_TABLE_NAME
- TYPEORM_METADATA_TABLE_NAME
- TYPEORM_PASSWORD
- TYPEORM_PORT
- TYPEORM_SCHEMA
- TYPEORM_SID
- TYPEORM_SUBSCRIBERS
- TYPEORM_SUBSCRIBERS_DIR
- TYPEORM_SYNCHRONIZE
- TYPEORM_URL
- TYPEORM_USERNAME
- TYPEORM_UUID_EXTENSION

`ormconfig.env`只能在开发期间使用。在生产环境中，你可以在 ENVIRONMENT VARIABLES 中设置所有这些值。

你无法使用`env`文件或环境变量定义多个连接。如果你的应用需要有多个连接，请使用其他配置替代。

## 使用`ormconfig.yml`

在项目根目录（`package.json`附近）中创建`ormconfig.yml`，并包含以下内容：

```yaml
default: # 默认连接
  host: "localhost"
  port: 3306
  username: "test"
  password: "test"
  database: "test"

second-connection: # 其他连接
  host: "localhost"
  port: 3306
  username: "test"
  password: "test"
  database: "test2"
```

你可以使用任一连接。

## 使用`ormconfig.xml`

在项目根目录（`package.json`附近）中创建`ormconfig.xml`，并包含以下内容：

```xml
<connections>
    <connection type="mysql" name="default">
        <host>localhost</host>
        <username>root</username>
        <password>admin</password>
        <database>test</database>
        <port>3000</port>
        <logging>true</logging>
    </connection>
    <connection type="mysql" name="second-connection">
        <host>localhost</host>
        <username>root</username>
        <password>admin</password>
        <database>test2</database>
        <port>3000</port>
        <logging>true</logging>
    </connection>
</connections>
```

你可以使用任何可用的连接选项。

## Typeorm使用哪个配置文件

有时你可能希望使用不同格式的多个配置。 当调用`getConnectionOptions()`或尝试在没有连接选项的情况下使用`createConnection()`时，Typeorm将尝试按以下顺序加载配置：

1. 来自环境变量。 Typeorm将尝试使用dotEnv加载`.env`文件（如果存在）。 如果设置了环境变量`TYPEORM_CONNECTION`或`TYPEORM_URL`，Typeorm将使用此方法。
2. 来自`ormconfig.env`。
3. 从另一个`ormconfig.[format]`文件，按此顺序：`[js，ts，json，yml，yaml，xml]`。

注意，Typeorm将使用找到的第一个有效方法，而不会加载其他方法。 例如，如果在环境中找到配置，Typeorm将不会加载`ormconfig.[format]`文件。

## 覆盖ormconfig中定义的选项

有时你希望覆盖 ormconfig 文件中定义的值，或者可能会在配置中附加一些 TypeScript / JavaScript 逻辑。
在这种情况下，你可以从 ormconfig 加载选项并构建`ConnectionOptions`，然后在将它们传递给`createConnection`函数之前，使用这些选项执行任何操作：

```typescript
// 从ormconfig文件（或ENV变量）读取连接选项
const connectionOptions = await getConnectionOptions();

// 使用connectionOptions做一些事情，
// 例如，附加自定义命名策略或自定义记录器
Object.assign(connectionOptions, { namingStrategy: new MyNamingStrategy() });

// 使用覆盖后的连接选项创建连接
const connection = await createConnection(connectionOptions);
```
