## [0.2.19](https://github.com/typeorm/typeorm/compare/0.2.18...0.2.19) (2019-09-13)

### Bug Fixes

* "database" option error in driver when use "url" option for connection ([690e6f5](https://github.com/typeorm/typeorm/commit/690e6f5))
* "hstore injection" & properly handle NULL, empty string, backslashes & quotes in hstore key/value pairs ([#4720](https://github.com/typeorm/typeorm/issues/4720)) ([3abe5b9](https://github.com/typeorm/typeorm/commit/3abe5b9))
* add SaveOptions and RemoveOptions into ActiveRecord ([#4318](https://github.com/typeorm/typeorm/issues/4318)) ([a6d7ba2](https://github.com/typeorm/typeorm/commit/a6d7ba2))
* apostrophe in Postgres enum strings breaks query ([#4631](https://github.com/typeorm/typeorm/issues/4631)) ([445c740](https://github.com/typeorm/typeorm/commit/445c740))
* change PrimaryColumn decorator to clone passed options ([#4571](https://github.com/typeorm/typeorm/issues/4571)) ([3cf470d](https://github.com/typeorm/typeorm/commit/3cf470d)), closes [#4570](https://github.com/typeorm/typeorm/issues/4570)
* createQueryBuilder relation remove works only if using ID ([#2632](https://github.com/typeorm/typeorm/issues/2632)) ([#4734](https://github.com/typeorm/typeorm/issues/4734)) ([1d73a90](https://github.com/typeorm/typeorm/commit/1d73a90))
* resolve issue with conversion string to simple-json ([#4476](https://github.com/typeorm/typeorm/issues/4476)) ([d1594f5](https://github.com/typeorm/typeorm/commit/d1594f5)), closes [#4440](https://github.com/typeorm/typeorm/issues/4440)
* sqlite connections don't ignore the schema property ([#4599](https://github.com/typeorm/typeorm/issues/4599)) ([d8f1c81](https://github.com/typeorm/typeorm/commit/d8f1c81))
* the excessive stack depth comparing types `FindConditions<?>` and `FindConditions<?>` problem ([#4470](https://github.com/typeorm/typeorm/issues/4470)) ([7a0beed](https://github.com/typeorm/typeorm/commit/7a0beed))
* views generating broken Migrations ([#4726](https://github.com/typeorm/typeorm/issues/4726)) ([c52b3d2](https://github.com/typeorm/typeorm/commit/c52b3d2)), closes [#4123](https://github.com/typeorm/typeorm/issues/4123)


### Features

* add `set` datatype support for MySQL/MariaDB ([#4538](https://github.com/typeorm/typeorm/issues/4538)) ([19e2179](https://github.com/typeorm/typeorm/commit/19e2179)), closes [#2779](https://github.com/typeorm/typeorm/issues/2779)
* add materialized View support for Postgres ([#4478](https://github.com/typeorm/typeorm/issues/4478)) ([dacac83](https://github.com/typeorm/typeorm/commit/dacac83)), closes [#4317](https://github.com/typeorm/typeorm/issues/4317) [#3996](https://github.com/typeorm/typeorm/issues/3996)
* add mongodb `useUnifiedTopology` config parameter ([#4684](https://github.com/typeorm/typeorm/issues/4684)) ([92e4270](https://github.com/typeorm/typeorm/commit/92e4270))
* add multi-dimensional cube support for PostgreSQL ([#4378](https://github.com/typeorm/typeorm/issues/4378)) ([b6d6278](https://github.com/typeorm/typeorm/commit/b6d6278))
* add options to input init config for sql.js ([#4560](https://github.com/typeorm/typeorm/issues/4560)) ([5c311ed](https://github.com/typeorm/typeorm/commit/5c311ed))
* add postgres pool error handler ([#4474](https://github.com/typeorm/typeorm/issues/4474)) ([a925be9](https://github.com/typeorm/typeorm/commit/a925be9))
* add referenced table metadata to NamingStrategy to resolve foreign key name ([#4274](https://github.com/typeorm/typeorm/issues/4274)) ([0094f61](https://github.com/typeorm/typeorm/commit/0094f61)), closes [#3847](https://github.com/typeorm/typeorm/issues/3847) [#1355](https://github.com/typeorm/typeorm/issues/1355)
* add support for ON CONFLICT for cockroach ([#4518](https://github.com/typeorm/typeorm/issues/4518)) ([db8074a](https://github.com/typeorm/typeorm/commit/db8074a)), closes [#4513](https://github.com/typeorm/typeorm/issues/4513)
* Added support for DISTINCT queries ([#4109](https://github.com/typeorm/typeorm/issues/4109)) ([39a8e34](https://github.com/typeorm/typeorm/commit/39a8e34))
* Aurora Data API ([#4375](https://github.com/typeorm/typeorm/issues/4375)) ([c321562](https://github.com/typeorm/typeorm/commit/c321562))
* export additional schema builder classes ([#4325](https://github.com/typeorm/typeorm/issues/4325)) ([e589fda](https://github.com/typeorm/typeorm/commit/e589fda))
* log files loaded from glob patterns ([#4346](https://github.com/typeorm/typeorm/issues/4346)) ([e12479e](https://github.com/typeorm/typeorm/commit/e12479e)), closes [#4162](https://github.com/typeorm/typeorm/issues/4162)
* UpdateResult returns affected rows in postgresql ([#4432](https://github.com/typeorm/typeorm/issues/4432)) ([7808bba](https://github.com/typeorm/typeorm/commit/7808bba)), closes [#1308](https://github.com/typeorm/typeorm/issues/1308)

## 0.2.18

### Bug fixes

* fixed loadRelationCountAndMap when entities' primary keys are strings ([#3946](https://github.com/typeorm/typeorm/issues/3946))
* fixed QueryExpressionMap not cloning all values correctly ([#4156](https://github.com/typeorm/typeorm/issues/4156))
* fixed transform embeddeds with no columns but with nested embeddeds (mongodb) ([#4131](https://github.com/typeorm/typeorm/pull/4131))
* fixed the getMany() result being droped randomly bug when using the buffer as primary key. ([#4220](https://github.com/typeorm/typeorm/issues/4220))

### Features

* adds `typeorm migration:show` command ([#4173](https://github.com/typeorm/typeorm/pull/4173))
* deprecate column `readonly` option in favor of `update` and `insert` options ([#4035](https://github.com/typeorm/typeorm/pull/4035))
* support sql.js v1.0 ([#4104](https://github.com/typeorm/typeorm/issues/4104))
* added support for `orUpdate` in SQLlite ([#4097](https://github.com/typeorm/typeorm/pull/4097))
* added support for `dirty_read` (NOLOCK) in SQLServer ([#4133](https://github.com/typeorm/typeorm/pull/4133))
* extend afterLoad() subscriber interface to take LoadEvent ([issue #4185](https://github.com/typeorm/typeorm/issues/4185))
* relation decorators (e.g. `@OneToMany`) now also accept `string` instead of `typeFunction`, which prevents circular dependency issues in the frontend/browser ([issue #4190](https://github.com/typeorm/typeorm/issues/4190))
* added support for metadata reflection in typeorm-class-transformer-shim.js ([issue #4219](https://github.com/typeorm/typeorm/issues/4219))
* added `sqlJsConfig` to input config when initializing sql.js ([issue #4559](https://github.com/typeorm/typeorm/issues/4559))

## 0.2.17 (2019-05-01)

### Bug fixes

* fixed transform embeddeds with boolean values (mongodb) ([#3900](https://github.com/typeorm/typeorm/pull/3900))
* fixed issue with schema inheritance in STI pattern ([#3957](https://github.com/typeorm/typeorm/issues/3957))
* revert changes from [#3814](https://github.com/typeorm/typeorm/pull/3814) ([#3828](https://github.com/typeorm/typeorm/pull/3828))
* fix performance issue when inserting into raw tables with QueryBuilder
  ([#3931](https://github.com/typeorm/typeorm/issues/3931))
* sqlite date hydration is susceptible to corruption ([#3949](https://github.com/typeorm/typeorm/issues/3949))
* fixed mongodb uniques, support 3 ways to define uniques ([#3986](https://github.com/typeorm/typeorm/pull/3986))
* fixed mongodb TTL index ([#4044](https://github.com/typeorm/typeorm/pull/4044))

### Features

* added deferrable options for foreign keys (postgres) ([#2191](https://github.com/typeorm/typeorm/issues/2191))
* added View entity implementation ([#1024](https://github.com/typeorm/typeorm/issues/1024)). Read more at [View entities](https://typeorm.io/#/view-entities)
* added multiple value transformer support ([#4007](https://github.com/typeorm/typeorm/issues/4007))

## 0.2.16 (2019-03-26)

### Bug fixes

* removed unused parameters from `insert`, `update`, `delete` methods ([#3888](https://github.com/typeorm/typeorm/pull/3888))
* fixed: migration generator produces duplicated changes ([#1960](https://github.com/typeorm/typeorm/issues/1960))
* fixed: unique constraint not created on embedded entity field ([#3142](https://github.com/typeorm/typeorm/issues/3142))
* fixed: FK columns have wrong length when PrimaryGeneratedColumn('uuid') is used ([#3604](https://github.com/typeorm/typeorm/issues/3604))
* fixed: column option unique sqlite error ([#3803](https://github.com/typeorm/typeorm/issues/3803))
* fixed: 'uuid' in PrimaryGeneratedColumn causes Many-to-Many Relationship to Fail ([#3151](https://github.com/typeorm/typeorm/issues/3151))
* fixed: sync enums on schema sync ([#3694](https://github.com/typeorm/typeorm/issues/3694))
* fixed: changes in enum type is not reflected when generating migration (in definition file) ([#3244](https://github.com/typeorm/typeorm/issues/3244))
* fixed: migration will keep create and drop indexes if index name is the same across tables ([#3379](https://github.com/typeorm/typeorm/issues/3379))

### Features

* added `lock` option in `FindOptions`

## 0.2.15 (2019-03-14)

### Bug fixes

* fixed bug in `connection.dropDatabase` method ([#1414](https://github.com/typeorm/typeorm/pull/3727))
* fixed "deep relations" not loaded/mapped due to the built-in max length of Postgres ([#3118](https://github.com/typeorm/typeorm/issues/3118))
* updated all dependencies
* fixed types issue from [#3725](https://github.com/typeorm/typeorm/issues/3725)
* removed sql-function-support (`() => ` syntax) in parameters to prevent security considerations
* fix sync schema issue with postgres enum in case capital letters in entity name ([#3536](https://github.com/typeorm/typeorm/issues/3536))

### Features

* added `uuidExtension` option to Postgres connection options, which allows TypeORM to use the newer `pgcrypto` extension to generate UUIDs

## 0.2.14 (2019-02-25)

### Bug fixes

* fixed migration issue with postgres numeric enum type - change queries are not generated if enum is not modified ([#3587](https://github.com/typeorm/typeorm/issues/3587))
* fixed mongodb entity listeners in optional embeddeds ([#3450](https://github.com/typeorm/typeorm/issues/3450))
* fixes returning invalid delete result
* reverted lazy loading properties not enumerable feature to fix related bugs

### Features

* added CockroachDB support
* added browser entry point to `package.json` ([3583](https://github.com/typeorm/typeorm/issues/3583))
* replaced backend-only drivers by dummy driver in browser builds
* added `useLocalForage` option to Sql.js connection options, which enables asynchronous load and save operations of the datatbase from the indexedDB ([#3554](https://github.com/typeorm/typeorm/issues/3554))
* added simple-enum column type ([#1414](https://github.com/typeorm/typeorm/issues/1414))

## 0.2.13 (2019-02-10)

### Bug Fixes

* fixed undefined object id field in case property name is `_id` ([3517](https://github.com/typeorm/typeorm/issues/3517))
* allow to use mongodb index options in `Index` decorator ([#3592](https://github.com/typeorm/typeorm/pull/3592))
* fixed entity embeddeds indices in mongodb ([#3585](https://github.com/typeorm/typeorm/pull/3585))
* fixed json/jsonb column data types comparison ([#3496](https://github.com/typeorm/typeorm/issues/3496))
* fixed increment/decrement value of embedded entity ([#3182](https://github.com/typeorm/typeorm/issues/3182))
* fixed missing call `transformer.from()` in case column is NULL ([#3395](https://github.com/typeorm/typeorm/issues/3395))
* fixed signatures of `update`/`insert` methods, some `find*` methods in repositories, entity managers, BaseEntity and QueryBuilders
* handle embedded documents through multiple levels in mongodb ([#3551](https://github.com/typeorm/typeorm/issues/3551))
* fixed hanging connections in `mssql` driver ([#3327](https://github.com/typeorm/typeorm/pull/3327))

### Features

* Injection 2nd parameter(options) of constructor to `ioredis/cluster` is now possible([#3538](https://github.com/typeorm/typeorm/issues/3538))

## 0.2.12 (2019-01-20)

### Bug Fixes

* fixed mongodb entity listeners and subscribers ([#1527](https://github.com/typeorm/typeorm/issues/1527))
* fixed connection options builder - paramters parsed from url are assigned on top of options ([#3442](https://github.com/typeorm/typeorm/pull/3442))
* fixed issue with logical operator precedence in `QueryBuilder` `whereInIds` ([#2103](https://github.com/typeorm/typeorm/issues/2103))
* fixed missing `isolationLevel` in `Connection.transaction()` method ([#3363](https://github.com/typeorm/typeorm/issues/3363))
* fixed broken findOne method with custom join column name
* fixed issue with uuid in mysql ([#3374](https://github.com/typeorm/typeorm/issues/3374))
* fixed missing export of `Exclusion` decorator
* fixed ignored extra options in mongodb driver ([#3403](https://github.com/typeorm/typeorm/pull/3403), [#1741](https://github.com/typeorm/typeorm/issues/1741))
* fixed signature of root `getRepository` function to accept `EntitySchema<Entity>` ([#3402](https://github.com/typeorm/typeorm/pull/3402))
* fixed false undefined connection options passed into mongodb client ([#3366](https://github.com/typeorm/typeorm/pull/3366))
* fixed ER_DUP_FIELDNAME with simple find ([#3350](https://github.com/typeorm/typeorm/issues/3350))

### Features

* added `tslib` to reduce package size ([#3457](https://github.com/typeorm/typeorm/issues/3457), [#3458](https://github.com/typeorm/typeorm/pull/3458))
* queries are simplified in `findByIds` and `whereInIds` for simple entities with single primary key ([#3431](https://github.com/typeorm/typeorm/pull/3431))
* added `ioredis` and `ioredis-cluster` cache support ([#3289](https://github.com/typeorm/typeorm/pull/3289),[#3364](https://github.com/typeorm/typeorm/pull/3364))
* added `LessThanOrEqual` and `MoreThanOrEqual` find options ([#3373](https://github.com/typeorm/typeorm/pull/3373))
* improve support of string, numeric and heterogeneous enums in postgres and mysql ([#3414](https://github.com/typeorm/typeorm/pull/3414))
* default value of enum array in postgres is now possible define as typescript array ([#3414](https://github.com/typeorm/typeorm/pull/3414))
```typescript
@Column({
    type: "enum",
    enum: StringEnum,
    array: true,
    default: [StringEnum.ADMIN]
})
stringEnums: StringEnum[];
```

### Breaking changes

* `UpdateQueryBuilder` now throw error if update values are not provided or unknown property is passed into `.set()` method ([#2849](https://github.com/typeorm/typeorm/issues/2849),[#3324](https://github.com/typeorm/typeorm/pull/3324))


## 0.2.11

* hot fix for mysql schema sync bug

## 0.2.10

* allowed caching options from environment variable (#3321)
* more accurate type for postgres ssl parameters
* added support for `ON UPDATE CASCADE` relations for mysql
* `repository.save` returns union type
* added reuse of lazy relationships
* added ability to disable prefixes for embedded columns
* migrations can be tested
* migration run returns array of successful migrations
* added debug ENV option
* added support for postgres exclusion constraints
* bug fixes
* documentation updates
* fixed issue with mysql primary generated uuid ER_TOO_LONG_KEY (#1139)

## 0.2.9

* `UpdateEvent` now returns with contains `updatedColumns` and `updatedRelations`

## 0.2.8

* added support for specifying isolation levels in transactions
* added SQLCipher connection option for sqlite
* added driver to support Expo platform for sqlite
* added support for nativescript
* bug fixes
* documentation updates

## 0.2.7

* added support for rowversion type for mssql (#2198)

## 0.2.6

* fixed wrong aggregate and count methods signature in mongodb

## 0.2.5

* added support for enum arrays in postgres
* fixed issue with lazy relations (#1953)
* fixed issue with migration file generator using a wrong class name (#2070)
* fixed issue with unhandled promise rejection warning on postgres connection (#2067)

## 0.2.4

* fixed bug with relation id loader queries not working with self-referencing relations
* fixed issues with zerofill and unsigned options not available in column options (#2049)
* fixed issue with lazy relation loader (#2029)
* fixed issue with closure table not properly escaped when using custom schema (#2043)
* fixed issue #2053

## 0.2.3

* fixed bug with selecting default values after persistence when initialized properties defined
* fixed bug with find operators used on relational columns (#2031)
* fixed bug with DEFAULT as functions in mssql (#1991)

## 0.2.2

* fixing bugs with STI
* fixed bug in mysql schema synchronization

## 0.2.1

* fixed bug with STI
* fixed bug with lazy relations inside transactions

## 0.2.0

* completely refactored, improved and optimized persistence process and performance.
* removed cascade remove functionality, refactored how cascades are working.
* removed `cascadeRemove` option from relation options.
* replaced `cascadeAll` with `cascade: true` syntax from relation options.
* replaced `cascadeInsert` with `cascade: ["insert"]` syntax from relation options.
* replaced `cascadeUpdate` with `cascade: ["update"]` syntax from relation options.
* now when one-to-one or many-to-one relation is loaded and its not set (set to null) ORM returns you entity with relation set to `null` instead of `undefined property` as before.
* now relation id can be set directly to relation, e.g. `Post { @ManyToOne(type => Tag) tag: Tag|number }` with `post.tag = 1` usage.
* now you can disable persistence on any relation by setting `@OneToMany(type => Post, post => tag, { persistence: false })`. This can dramatically improve entity save performance.
* `loadAllRelationIds` method of `QueryBuilder` now accepts list of relation paths that needs to be loaded, also `disableMixedMap` option is now by default set to false, but you can enable it via new method parameter `options`
* now `returning` and `output` statements of `InsertQueryBuilder` support array of columns as argument
* now when many-to-many and one-to-many relation set to `null` all items from that relation are removed, just like it would be set to empty array
* fixed issues with relation update from one-to-one non-owner side
* now version column is updated on the database level, not by ORM anymore
* now created date and update date columns is set on the database level, not by ORM anymore (e.g. using `CURRENT_TIMESTAMP` as a default value)
* now `InsertQueryBuilder`, `UpdateQueryBuilder` and `DeleteQueryBuilder` automatically update entities after execution.
This only happens if real entity objects are passed.
Some databases (like mysql and sqlite) requires a separate query to perform this operation.
If you want to disable this behavior use `queryBuilder.updateEntity(false)` method.
This feature is convenient for users who have uuid, create/update date, version columns or columns with DEFAULT value set.
* now `InsertQueryBuilder`, `UpdateQueryBuilder` and `DeleteQueryBuilder` call subscribers and listeners.
You can disable this behavior by setting `queryBuilder.callListeners(false)` method.
* `Repository` and `EntityManager` method `.findOneById` is deprecated and will be removed in next 0.3.0 version.
Use `findOne(id)` method instead now.
* `InsertQueryBuilder` now returns `InsertResult` which contains extended information and metadata about runned query
* `UpdateQueryBuilder` now returns `UpdateResult` which contains extended information and metadata about runned query
* `DeleteQueryBuilder` now returns `DeleteResult` which contains extended information and metadata about runned query
* now insert / update / delete queries built with QueryBuilder can be wrapped into a transaction using `useTransaction(true)` method of the QueryBuilder.
* `insert`, `update` and `delete` methods of `QueryRunner` now use `InsertQueryRunner`, `UpdateQueryRunner` and `DeleteQueryRunner` inside
* removed deprecated `removeById`, `removeByIds` methods
* removed `deleteById` method - use `delete(id)` method instead now
* removed `updateById` method - use `update(id)` method instead now
* changed `snakeCase` utility - check table names after upgrading
* added ability to disable transaction in `save` and `remove` operations
* added ability to disable listeners and subscribers in `save` and `remove` operations
* added ability to save and remove objects in chunks
* added ability to disable entity reloading after insertion and updation
* class table inheritance functionality has been completely dropped
* single table inheritance functionality has been fixed
* `@SingleEntityChild` has been renamed to `@ChildEntity`
* `@DiscriminatorValue` has been removed, instead parameter in `@ChildEntity` must be used, e.g. `@ChildEntity("value")`
* `@DiscriminatorColumn` decorator has been removed, use `@TableInheritance` options instead now
* `skipSync` in entity options has been renamed to `synchronize`. Now if it set to false schema synchronization for the entity will be disabled.
By default its true.
* now array initializations for relations are forbidden and ORM throws an error if there are entities with initialized relation arrays.
* `@ClosureEntity` decorator has been removed. Instead `@Entity` + `@Tree("closure-table")` must be used
* added support for nested set and materialized path tree hierarchy patterns
* breaking change on how array parameters work in queries - now instead of (:param) new syntax must be used (:...param).
This fixed various issues on how real arrays must work
* changed the way how entity schemas are created (now more type-safe), now interface EntitySchema is a class
* added `@Unique` decorator. Accepts custom unique constraint name and columns to be unique. Used only on as
composite unique constraint, on table level. E.g. `@Unique("uq_id_name", ["id", "name"])`
* added `@Check` decorator. Accepts custom check constraint name and expression. Used only on as
composite check constraint, on table level. E.g. `@Check("chk_name", "name <> 'asd'")`
* fixed `Oracle` issues, now it will be fully maintained as other drivers
* implemented migrations functionality in all drivers
* CLI commands changed from `migrations:create`, `migrations:generate`, `migrations:revert` and `migrations:run` to `migration:create`, `migration:generate`, `migration:revert` and `migration:run`
* changed the way how migrations work (more info in #1315). Now migration table contains `id` column with auto-generated keys, you need to re-create migrations table or add new column manually.
* entity schemas syntax was changed
* dropped support for WebSql and SystemJS
* `@Index` decorator now accepts `synchronize` option. This option need to avoid deleting custom indices which is not created by TypeORM
* new flag in relation options was introduced: `{ persistence: false }`. You can use it to prevent any extra queries for relations checks
* added support for `UNSIGNED` and `ZEROFILL` column attributes in MySQL
* added support for generated columns in MySQL
* added support for `ON UPDATE` column option in MySQL
* added `SPATIAL` and `FULLTEXT` index options in MySQL
* added `hstore` and `enum` column types support in Postgres
* added range types support in Postgres
* TypeORM now uses `{ "supportBigNumbers": true, "bigNumberStrings": true }` options by default for `node-mysql`
* Integer data types in MySQL now accepts `width` option instead of `length`
* junction tables now have `onDelete: "CASCADE"` attribute on their foreign keys
* `ancestor` and `descendant` columns in ClosureTable marked as primary keys
* unique index now will be created for the join columns in `ManyToOne` and `OneToOne` relations

## 0.1.19

* fixed bug in InsertQueryBuilder

## 0.1.18

* fixed timestamp issues

## 0.1.17

* fixed issue with entity order by applied to update query builder

## 0.1.16

* security and bug fixes

## 0.1.15

* security and bug fixes

## 0.1.14

* optimized hydration performance ([#1672](https://github.com/typeorm/typeorm/pull/1672))

## 0.1.13

* added simple-json column type ([#1448](https://github.com/typeorm/typeorm/pull/1488))
* fixed transform behaviour for timestamp columns ([#1140](https://github.com/typeorm/typeorm/issues/1140))
* fixed issue with multi-level relations loading ([#1504](https://github.com/typeorm/typeorm/issues/1504))

## 0.1.12

* EntitySubscriber now fires events on subclass entity ([#1369](https://github.com/typeorm/typeorm/issues/1369))
* fixed error with entity schema validator being async  ([#1448](https://github.com/typeorm/typeorm/issues/1448))

## 0.1.11

* postgres extensions now gracefully handled when user does not have rights to use them ([#1407](https://github.com/typeorm/typeorm/issues/1407))

## 0.1.10

* `sqljs` driver now enforces FK integrity by default (same behavior as `sqlite`)
* fixed issue that broke browser support in 0.1.8 because of the debug package ([#1344](https://github.com/typeorm/typeorm/pull/1344))

## 0.1.9

* fixed bug with sqlite and mysql schema synchronization when uuid column is used ([#1332](https://github.com/typeorm/typeorm/issues/1332))

## 0.1.8

* New DebugLogger ([#1302](https://github.com/typeorm/typeorm/pull/1302))
* fixed issue with primary relations being nullable by default - now they are not nullable always
* fixed issue with multiple databases support when tables with same name are used across multiple databases

## 0.1.7

* fixed bug with migrations execution in mssql ([#1254](https://github.com/typeorm/typeorm/issues/1254))
* added support for more complex ordering in paginated results ([#1259](https://github.com/typeorm/typeorm/issues/1259))
* MSSQL users are required to add "order by" for skip/offset operations since mssql does not support OFFSET/LIMIT statement without order by applied
* fixed issue when relation query builder methods execute operations with empty arrays ([#1241](https://github.com/typeorm/typeorm/issues/1241))
* Webpack can now be used for node projects and not only for browser projects. To use TypeORM in Ionic with minimal changes checkout the [ionic-example](https://github.com/typeorm/ionic-example#typeorm--017) for the needed changes. To use webpack for non-Ionic browser webpack projects, the needed configuration can be found in the [docs]( http://typeorm.io/#/supported-platforms) ([#1280](https://github.com/typeorm/typeorm/pulls/1280))
* added support for loading sub-relations in via find options ([#1270](https://github.com/typeorm/typeorm/issues/1270))

## 0.1.6

* added support for indices and listeners in embeddeds
* added support for `ON CONFLICT` keyword
* fixed bug with query builder where lazy relations are loaded multiple times when using `leftJoinAndSelect` ([#996](https://github.com/typeorm/typeorm/issues/996))
* fixed bug in all sqlite based drivers that generated wrong uuid columns ([#1128](https://github.com/typeorm/typeorm/issues/1128) and [#1161](https://github.com/typeorm/typeorm/issues/1161))

## 0.1.5

* fixed bug where `findByIds` would return values with an empty array ([#1118](https://github.com/typeorm/typeorm/issues/1118))
* fixed bug in MigrationExecutor that didn't release created query builder ([#1201](https://github.com/typeorm/typeorm/issues/1201))

## 0.1.4

* fixed bug in mysql driver that generated wrong query when using skip ([#1099](https://github.com/typeorm/typeorm/issues/1099))
* added option to create query builder from repository without alias([#1084](https://github.com/typeorm/typeorm/issues/1084))
* fixed bug that made column option "select" unusable ([#1110](https://github.com/typeorm/typeorm/issues/1110))
* fixed bug that generated mongodb projects what don't work ([#1119](https://github.com/typeorm/typeorm/issues/1119))

## 0.1.3

* added support for `sql.js`. To use it you just need to install `npm i sql.js` and use `sqljs` as driver type ([#894](https://github.com/typeorm/typeorm/pull/894)).
* added explicit require() statements for drivers ([#1143](https://github.com/typeorm/typeorm/pull/1143))
* fixed bug where wrong query is generated with multiple primary keys ([#1146](https://github.com/typeorm/typeorm/pull/1146))
* fixed bug for oracle driver where connect method was wrong ([#1177](https://github.com/typeorm/typeorm/pull/1177))

## 0.1.2

* sqlite now supports relative database file paths ([#798](https://github.com/typeorm/typeorm/issues/798) and [#799](https://github.com/typeorm/typeorm/issues/799))
* fixed bug with not properly working `update` method ([#1037](https://github.com/typeorm/typeorm/issues/1037), [#1042](https://github.com/typeorm/typeorm/issues/1042))
* fixed bug with replication support ([#1035](https://github.com/typeorm/typeorm/pull/1035))
* fixed bug with wrong embedded column names being generated ([#969](https://github.com/typeorm/typeorm/pull/969))
* added support for caching in respositories ([#1057](https://github.com/typeorm/typeorm/issues/1057))
* added support for the `citext` column type for postgres ([#1075](https://github.com/typeorm/typeorm/pull/1075))

## 0.1.1

* added support for `pg-native` for postgres (#975). To use it you just need to install `npm i pg-native` and it will be picked up automatically.
* now Find Options support `-1` and `1` for `DESC` and `ASC` values. This is better user experience for MongoDB users.
* now inheritances in embeddeds are supported (#966).
* `isArray: boolean` in `ColumnOptions` is deprecated. Use `array: boolean` instead.
* deprecated `removeById` method, now use `deleteById` method instead.
* added `insert` and `delete` methods into repository and entity manager.
* fixed multiple issues with `update`, `updateById` and `removeById` methods in repository and entity manager. Now they do not use `save` and `remove` methods anymore - instead they are using QueryBuilder to build and execute their queries.
* now `save` method can accept partial entities.
* removed opencollective dependency.
* fixed issues with bulk entity insertions.
* find* methods now can find by embed conditions.
* fixed issues with multiple schema support, added option to `@JoinTable` to support schema and database.
* multiple small bugfixes.

## 0.1.0

#### BREAKING CHANGES

* `Table`, `AbstractTable`, `ClassTableChild`, `ClosureTable`, `EmbeddableTable`, `SingleTableChild` deprecated  decorators were removed. Use `Entity`, `ClassEntityChild`, `ClosureEntity`, `SingleEntityChild` decorators instead.
* `EntityManager#create`, `Repository#create`, `EntityManager#preload`, `Repository#preload`, `EntityManager#merge`, `Repository#merge` methods now accept `DeepPartial<Entity>` instead of `Object`.
*  `EntityManager#merge`, `Repository#merge` methods first argument is now an entity where to need to merge all given entity-like objects.
* changed `find*` repository methods. Now conditions are `Partial<Entity>` type.
* removed `FindOptions` interface and introduced two new interfaces: `FindOneOptions` and `FindManyOptions` - each for its own `findOne*` or `find*` methods.
* dropped out some of options of `FindOptions`. Use `QueryBuilder` instead. However, added  few new options as well.
* deprecated method `addParameters` has been removed from `QueryBuilder`. Use `setParameters` instead.
* removed `setMaxResults`, `setFirstResult` methods in `QueryBuilder`. Use `take` and `skip` methods instead.
* renamed `entityManager` to `manager` in `Connection`, `AbstractRepository` and event objects. `entityManager` property was removed.
* renamed `persist` to `save` in `EntityManager` and `Repository` objects. `persist` method was removed.
* `SpecificRepository` is removed. Use relational query builder functionality instead.
* `transaction` method has been removed from `Repository`. Use `EntityManager#transaction` method instead.
* custom repositories do not support container anymore.
* controller / subscriber / migrations from options tsconfig now appended with a project root directory
* removed naming strategy decorator, naming strategy by name functionality. Now naming strategy should be registered by passing naming strategy instance directly.
* `driver` section in connection options now deprecated. All settings should go directly to connection options root.
* removed `fromTable` from the `QueryBuilder`. Now use regular `from` to select from tables.
* removed `usePool` option from the connection options. Pooling now is always enabled.
* connection options interface has changed and now each platform has its own set of connection options.
* `storage` in sqlite options has been renamed to `database`.
* env variable names for connection were changed (`TYPEORM_DRIVER_TYPE` has been renamed to `TYPEORM_CONNECTION`, some other renaming). More env variable names you can find in `ConnectionOptionsEnvReader` class.
* some api changes in `ConnectionManager` and `createConnection` / `createConnections` methods of typeorm main entrypoint.
* `simple_array` column type now is called `simple-array`
* some column types were removed. Now orm uses column types of underlying database.
* now `number` type in column definitions (like `@Column() likes: number`) maps to `integer` instead of `double`. This is more programmatic design. If you need to store float-pointing values - define a type explicitly.
* `fixedLength` in column options has been removed. Now actual column types can be used, e.g. `@Column("char")` or `@Column("varchar")`.
* `timezone` option has been removed from column options. Now corresponding database types can be used instead.
* `localTimezone` has been removed from the column options.
* `skipSchemaSync` in entity options has been renamed to `skipSync`.
* `setLimit` and `setOffset` in `QueryBuilder` were renamed into `limit` and `offset`.
* `nativeInterface` has been removed from a driver interface and implementations.
* now typeorm works with the latest version of mssql (version 4).
* fixed how orm creates default values for SqlServer - now it creates constraints for it as well.
* migrations interface has changed - now `up` and `down` accept only `QueryRunner`. To use `Connection` and `EntityManager` use properties of `QueryRunner`, e.g. `queryRunner.connection` and `queryRunner.manager`.
* now `update` method in `QueryBuilder` accepts `Partial<Entity>` and property names used in update map are column property names and they are automatically mapped to column names.
* `SpecificRepository` has been removed. Instead new `RelationQueryBuilder` was introduced.
* `getEntitiesAndRawResults` of `QueryBuilder` has been renamed to `getRawAndEntities`.
* in mssql all constraints are now generated using table name in their names - this is fixes issues with duplicate constraint names.
* now when object is loaded from the database all its columns with null values will be set into entity properties as null.  Also after saving entity with unset properties that will be stored as nulls - their (properties) values will be set to null.
* create and update dates in entities now use date with fractional seconds.
* `@PrimaryGeneratedColumn` decorator now accept generation strategy as first argument (default is `increment`), instead of column type. Column type must be passed in options object, e.g. `@PrimaryGeneratedColumn({ type: "bigint"})`.
* `@PrimaryColumn` now does not accept `generated` parameter in options. Use `@Generated` or `@PrimaryGeneratedColumn` decorators instead.
* Logger interface has changed. Custom logger supply mechanism has changed.
* Now `logging` options in connection options is simple "true", or "all", or list of logging modes can be supplied.
* removed `driver` section in connection options. Define options right in the connection options section.
* `Embedded` decorator is deprecated now. use `@Column(type => SomeEmbedded)` instead.
* `schemaName` in connection options is removed. Use `schema` instead.
* `TYPEORM_AUTO_SCHEMA_SYNC` env variable is now called `TYPEORM_SYNCHRONIZE`.
* `schemaSync` method in `Connection` has been renamed to `synchronize`.
* `getEntityManager` has been deprecated. Use `getManager` instead.
* `@TransactionEntityManager` is now called `@TransactionManager` now.
* `EmbeddableEntity`, `Embedded`, `AbstractEntity` decorators has been removed. There is no need to use `EmbeddableEntity` and `AbstractEntity` decorators at all - entity will work as expected without them. Instead of `@Embedded(type => X)` decorator now `@Column(type => X)` must be used instead.
* `tablesPrefix`, `autoSchemaSync`, `autoMigrationsRun`, `dropSchemaOnConnection` options were removed. Use `entityPrefix`, `synchronize`, `migrationsRun`, `dropSchema` options instead.
* removed `persist` method from the `Repository` and `EntityManager`. Use `save` method instead.
* removed `getEntityManager` from `typeorm` namespace. Use `getManager` method instead.
* refactored how query runner works, removed query runner provider
* renamed `TableSchema` into `Table`
* renamed `ColumnSchema` into `TableColumn`
* renamed `ForeignKeySchema` into `TableForeignKey`
* renamed `IndexSchema` into `TableIndex`
* renamed `PrimaryKeySchema` into `TablePrimaryKey`

#### NEW FEATURES

* added `mongodb` support.
* entity now can be saved partially within `update` method.
* added prefix support to embeddeds.
* now embeddeds inside other embeddeds are supported.
* now relations are supported inside embeds.
* now relations for multiple primary keys are generated properly.
* now ormconfig is read from `.env`, `.js`, `.json`, `.yml`, `.xml` formats.
* all database-specific types are supported now.
* now migrations generation in mysql is supported. Use `typeorm migrations:generate` command.
* `getGeneratedQuery` was renamed to `getQuery` in `QueryBuilder`.
* `getSqlWithParameters` was renamed to `getSqlAndParameters` in `QueryBuilder`.
* sql queries are highlighted in console.
* added `@Generated` decorator. It can accept `strategy` option with values `increment` and `uuid`. Default is `increment`. It always generates value for column, except when column defined as `nullable` and user sets `null` value in to column.
* added logging of log-running requests.
* added replication support.
* added custom table schema and database support in `Postgres`, `Mysql` and `Sql Server` drivers.
* multiple bug fixes.
* added ActiveRecord support (by extending BaseEntity) class
* `Connection` how has `createQueryRunner` that can be used to control database connection and its transaction state
* `QueryBuilder` is abstract now and all different kinds of query builders were created for different query types - `SelectQueryBuilder`, `UpdateQueryBuilder`, `InsertQueryBuilder` and `DeleteQueryBuilder` with individual method available.

## 0.0.11

* fixes [#341](https://github.com/typeorm/typeorm/issues/341) - issue when trying to create a `OneToOne` relation with
`referencedColumnName` where the relation is not between primary keys


## 0.0.10

* added `ObjectLiteral` and `ObjectType` into main exports
* fixed issue fixes [#345](https://github.com/typeorm/typeorm/issues/345).
* fixed issue with migration not saving into the database correctly.
    Note its a breaking change if you have run migrations before and have records in the database table,
    make sure to apply corresponding changes. More info in [#360](https://github.com/typeorm/typeorm/issues/360) issue.

## 0.0.9

* fixed bug with indices from columns are not being inherited from parent entity [#242](https://github.com/typeorm/typeorm/issues/242)
* added support of UUID primary columns (thanks [@seanski](https://github.com/seanski))
* added `count` method to repository and entity manager (thanks [@aequasi](https://github.com/aequasi))

## 0.0.8

* added complete babel support
* added `clear` method to `Repository` and `EntityManager` which allows to truncate entity table
* exported `EntityRepository` in `typeorm/index`
* fixed issue with migration generation in [#239](https://github.com/typeorm/typeorm/pull/239) (thanks to [@Tobias4872](https://github.com/Tobias4872))
* fixed issue with using extra options with SqlServer [#236](https://github.com/typeorm/typeorm/pull/236) (thanks to [@jmai00](https://github.com/jmai00))
* fixed issue with non-pooled connections [#234](https://github.com/typeorm/typeorm/pull/234) (thanks to [@benny-medflyt](https://github.com/benny-medflyt))
* fixed issues:
[#242](https://github.com/typeorm/typeorm/issues/242),
[#240](https://github.com/typeorm/typeorm/issues/240),
[#204](https://github.com/typeorm/typeorm/issues/204),
[#219](https://github.com/typeorm/typeorm/issues/219),
[#233](https://github.com/typeorm/typeorm/issues/233),
[#234](https://github.com/typeorm/typeorm/issues/234)

## 0.0.7

* added custom entity repositories support
* merged typeorm-browser and typeorm libraries into single package
* added `@Transaction` decorator
* added exports to `typeorm/index` for naming strategies
* added shims for browsers using typeorm in frontend models, also added shim to use typeorm
with class-transformer library on the frontend
* fixed issue when socketPath could not be used with mysql driver (thanks @johncoffee)
* all table decorators are renamed to `Entity` (`Table` => `Entity`, `AbstractTable` => `AbstractEntity`,
`ClassTableChild` => `ClassEntityChild`, `ClosureTable` => `ClosureEntity`, `EmbeddableTable` => `EmbeddableEntity`,
`SingleTableChild` => `SingleEntityChild`). This change is required because upcoming versions of orm will work
not only with tables, but also with documents and other database-specific "tables".
Previous decorator names are deprecated and will be removed in the future.
* added custom repositories support. Example in samples directory.
* cascade remove options has been removed from `@ManyToMany`, `@OneToMany` decorators. Also cascade remove is not possible
from two sides of `@OneToOne` relationship now.
* fixed issues with subscribers and transactions
* typeorm now has translation in chinese (thanks [@brookshi](https://github.com/brookshi))
* added `schemaName` support for postgres database [#152](https://github.com/typeorm/typeorm/issues/152) (thanks [@mingyang91](https://github.com/mingyang91))
* fixed bug when new column was'nt added properly in sqlite [#157](https://github.com/typeorm/typeorm/issues/157)
* added ability to set different types of values for DEFAULT value of the column [#150](https://github.com/typeorm/typeorm/issues/150)
* added ability to use zero, false and empty string values as DEFAULT values in [#189](https://github.com/typeorm/typeorm/pull/189) (thanks to [@Luke265](https://github.com/Luke265))
* fixed bug with junction tables persistence (thanks [@Luke265](https://github.com/Luke265))
* fixed bug regexp in `QueryBuilder` (thanks [@netnexus](https://github.com/netnexus))
* fixed issues [#202](https://github.com/typeorm/typeorm/issues/202), [#203](https://github.com/typeorm/typeorm/issues/203) (thanks to [@mingyang91](https://github.com/mingyang91))
* fixed issues
[#159](https://github.com/typeorm/typeorm/issues/159),
[#181](https://github.com/typeorm/typeorm/issues/181),
[#176](https://github.com/typeorm/typeorm/issues/176),
[#192](https://github.com/typeorm/typeorm/issues/192),
[#191](https://github.com/typeorm/typeorm/issues/191),
[#190](https://github.com/typeorm/typeorm/issues/190),
[#179](https://github.com/typeorm/typeorm/issues/179),
[#177](https://github.com/typeorm/typeorm/issues/177),
[#175](https://github.com/typeorm/typeorm/issues/175),
[#174](https://github.com/typeorm/typeorm/issues/174),
[#150](https://github.com/typeorm/typeorm/issues/150),
[#159](https://github.com/typeorm/typeorm/issues/159),
[#173](https://github.com/typeorm/typeorm/issues/173),
[#195](https://github.com/typeorm/typeorm/issues/195),
[#151](https://github.com/typeorm/typeorm/issues/151)

## 0.0.6

* added `JSONB` support for Postgres in #126 (thanks [@CreepGin](https://github.com/CreepGin)@CreepGin)
* fixed in in sqlite query runner in #141 (thanks [@marcinwadon](https://github.com/marcinwadon))
* added shortcut exports for table schema classes in #135 (thanks [@eduardoweiland](https://github.com/eduardoweiland))
* fixed bugs with single table inheritance in #132 (thanks [@eduardoweiland](https://github.com/eduardoweiland))
* fixed issue with `TIME` column in #134 (thanks [@cserron](https://github.com/cserron))
* fixed issue with relation id in #138 (thanks [@mingyang91](https://github.com/mingyang91))
* fixed bug when URL for pg was parsed incorrectly #114 (thanks [@mingyang91](https://github.com/mingyang91))
* fixed bug when embedded is not being updated
* metadata storage now in global variable
* entities are being loaded in migrations and can be used throw the entity manager or their repositories
* migrations now accept `EntityMetadata` which can be used within one transaction
* fixed issue with migration running on windows #140
* fixed bug with with Class Table Inheritance #144

## 0.0.5

* changed `getScalarMany` to `getRawMany` in `QueryBuilder`
* changed `getScalarOne` to `getRawOne` in `QueryBuilder`
* added migrations support

## 0.0.4

* fixed problem when `order by` is used with `limit`
* fixed problem when `decorators-shim.d.ts` exist and does not allow to import decorators (treats like they exist in global)
* fixed Sql Server driver bugs

## 0.0.3

* completely refactored persistence mechanism:
    * added experimental support of `{ nullable: true }` in relations
    * cascade operations should work better now
    * optimized all queries
    * entities with recursive entities should be persisted correctly now
* now `undefined` properties are skipped in the persistence operation, as well as `undefined` relations.
* added platforms abstractions to allow typeorm to work on multiple platforms
* added experimental support of typeorm in the browser
* breaking changes in `QueryBuilder`:
    * `getSingleResult()` renamed to `getOne()`
    * `getResults()` renamed to `getMany()`
    * `getResultsAndCount()` renamed to `getManyAndCount()`
    * in the innerJoin*/leftJoin* methods now no need to specify `ON`
    * in the innerJoin*/leftJoin* methods no longer supports parameters, use `addParameters` or `setParameter` instead.
    * `setParameters` is now works just like `addParameters` (because previous behaviour confused users),
    `addParameters` now is deprecated
    * `getOne` returns `Promise<Entity|undefined>`
* breaking changes in `Repository` and `EntityManager`:
    * `findOne` and .findOneById` now return `Promise<Entity|undefined>` instead of `Promise<Entity>`
* now typeorm is compiled into `ES5` instead of `ES6` - this allows to run it on older versions of node.js
* fixed multiple issues with dates and utc-related stuff
* multiple bugfixes

## 0.0.2

* lot of API refactorings
* complete support TypeScript 2
* optimized schema creation
* command line tools
* multiple drivers support
* multiple bugfixes

## 0.0.1

* first stable version, works with TypeScript 1.x
