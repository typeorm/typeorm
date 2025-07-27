# SQLite

## Installation

-   for **SQLite**:

```shell
npm install sqlite3
```

-   for **Better SQLite**:

```shell
npm install better-sqlite3
```

-   for **sql.js**:

```shell
npm install sql.js
```

-   for **Capacitor**, **Cordova**, **Expo**, **NativeScript** and **React Native**, check the [supported platforms](../help/2-supported-platforms.md).

## Data Source Options

See [Data Source Options](../data-source/2-data-source-options.md) for the common data source options.

### `sqlite` data source options

-   `database` - Database path. For example "mydb.sql"

### `better-sqlite3` data source options

-   `database` - Database path. For example "mydb.sql"
-   `statementCacheSize` - Cache size of sqlite statement to speed up queries (default 100).
-   `prepareDatabase` - Function to run before a database is used in typeorm. You can access original better-sqlite3 Database object here.
-   `nativeBinding` - Relative or absolute path to the native addon (better_sqlite3.node).

### `sql.js` data source options

-   `database`: The raw UInt8Array database that should be imported.
-   `sqlJsConfig`: Optional initialize config for sql.js.
-   `autoSave`: Enable automatic persistence of database changes, requires either `location` or `autoSaveCallback`. When set to `true`, every change is saved to the file system (Node.js) or to `localStorage`/`indexedDB` (browser) if `location` is specified, or the `autoSaveCallback` is invoked otherwise.
-   `autoSaveCallback`: A function that gets called when changes to the database are made and `autoSave` is enabled. The function gets a `UInt8Array` that represents the database.
-   `location`: The file location to load and save the database to.
-   `useLocalForage`: Enables the usage of the [localforage library](https://github.com/localForage/localForage) to save & load the database asynchronously from the indexedDB instead of using the synchrony local storage methods in a browser environment. The localforage node module needs to be added to your project and the localforage.js should be imported in your page.

### `capacitor` data source options

-   `database` - Database name (capacitor-sqlite will add the suffix `SQLite.db`)
-   `driver` - The capacitor-sqlite instance. For example, `new SQLiteConnection(CapacitorSQLite)`.
-   `mode` - Set the mode for database encryption: "no-encryption" | "encryption" | "secret" | "newsecret"
-   `version` - Database version
-   `journalMode` - The SQLite journal mode (optional)

### `cordova` data source options

-   `database` - Database name
-   `location` - Where to save the database. See [cordova-sqlite-storage](https://github.com/litehelpers/Cordova-sqlite-storage#opening-a-database) for options.

### `expo` data source options

-   `database` - Name of the database. For example, "mydb".
-   `driver` - The Expo SQLite module. For example, `require('expo-sqlite')`.

### `nativescript` data source options

-   `database` - Database name

### `react-native` data source options

-   `database` - Database name
-   `location` - Where to save the database. See [react-native-sqlite-storage](https://github.com/andpor/react-native-sqlite-storage#opening-a-database) for options.

## Column Types

`int`, `int2`, `int8`, `integer`, `tinyint`, `smallint`, `mediumint`, `bigint`, `decimal`, `numeric`, `float`, `double`, `real`, `double precision`, `datetime`, `varying character`, `character`, `native character`, `varchar`, `nchar`, `nvarchar2`, `unsigned big int`, `boolean`, `blob`, `text`, `clob`, `date`
