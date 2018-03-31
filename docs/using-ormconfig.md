# Using ormconfig.json

* [Creating a new connection from the configuration file](#creating-a-new-connection-from-the-configuration-file)
* [Loading from `ormconfig.json`](#loading-from-ormconfigjson)
* [Loading from `ormconfig.js`](#loading-from-ormconfigjs)
* [Loading from `ormconfig.env` or from environment variables](#loading-from-ormconfigenv-or-from-environment-variables)
* [Loading from `ormconfig.yml`](#loading-from-ormconfigyml)
* [Loading from `ormconfig.xml`](#loading-from-ormconfigxml)

## Creating a new connection from the configuration file

Most of the times you want to store your connection options in a separate configuration file.
It makes it convenient and easy to manage. 
TypeORM supports multiple configuration sources.
You only need to create a `ormconfig.[format]` file in the root directory of your application (near `package.json`),
put your configuration there and in your app call `createConnection()` without any configuration passed:

```typescript
import {createConnection, Connection} from "typeorm";

// createConnection method will automatically read connection options from your ormconfig file
const connection: Connection = await createConnection();
```
 
## Loading from `ormconfig.json`

Create `ormconfig.json` in the project root (near `package.json`). It should have the following content:

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

You can specify any other options from `ConnectionOptions`.
Learn more about [ConnectionOptions](./connection-options.md).

If you want to create multiple connections then simply create multiple connections in a single array:

```json
[{
   "name": "default",
   "type": "mysql",
   "host": "localhost",
   "port": 3306,
   "username": "test",
   "password": "test",
   "database": "test"
}, {
   "name": "second-connection",
   "type": "mysql",
   "host": "localhost",
   "port": 3306,
   "username": "test",
   "password": "test",
   "database": "test"
}]
```

## Loading from `ormconfig.js`

Create `ormconfig.js` in the project root (near `package.json`). It should have following content:

```javascript
module.exports = {
   "type": "mysql",
   "host": "localhost",
   "port": 3306,
   "username": "test",
   "password": "test",
   "database": "test"
}
```

You can specify any other options from `ConnectionOptions`.
If you want to create multiple connections then simply create multiple connections in a single array and return it.

## Loading from `ormconfig.env` or from environment variables

Create `ormconfig.env` in the project root (near `package.json`). It should have the following content:

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

List of available env variables you can set:

* TYPEORM_CONNECTION
* TYPEORM_HOST
* TYPEORM_USERNAME
* TYPEORM_PASSWORD
* TYPEORM_DATABASE
* TYPEORM_PORT
* TYPEORM_URL
* TYPEORM_SID
* TYPEORM_SCHEMA
* TYPEORM_SYNCHRONIZE
* TYPEORM_DROP_SCHEMA
* TYPEORM_MIGRATIONS_RUN
* TYPEORM_ENTITIES
* TYPEORM_MIGRATIONS
* TYPEORM_SUBSCRIBERS
* TYPEORM_ENTITY_SCHEMAS
* TYPEORM_LOGGING
* TYPEORM_LOGGER
* TYPEORM_ENTITY_PREFIX
* TYPEORM_MAX_QUERY_EXECUTION_TIME
* TYPEORM_ENTITIES_DIR
* TYPEORM_MIGRATIONS_DIR
* TYPEORM_SUBSCRIBERS_DIR
* TYPEORM_DRIVER_EXTRA

`ormconfig.env` should be used only during development.
On production you can set all these values in real ENVIRONMENT VARIABLES.

You cannot define multiple connections using an `env` file or environment variables.
If your app has multiple connections then use alternative configuration storage format.

## Loading from `ormconfig.yml`

Create `ormconfig.yml` in the project root (near `package.json`). It should have the following content:

```yaml
default: # default connection
    host: "localhost"
    port: 3306
    username: "test"
    password: "test"
    database: "test"
    
second-connection: # other connection
    host: "localhost"
    port: 3306
    username: "test"
    password: "test"
    database: "test2"
```

You can use any connection options available.

## Loading from `ormconfig.xml`

Create `ormconfig.xml` in the project root (near `package.json`). It should have the following content:

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

You can use any connection options available.
