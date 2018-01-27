# Changelog

TypeORM follows a semantic versioning and until `1.0.0` breaking changes may appear in `0.x.x` versions,
however since API is already quite stable we don't expect too much breaking changes.
If we missed a note on some change or you have a questions on migrating from old version, 
feel free to ask us and community.

## 0.1.13
* added simple-json column type ([#1448](https://github.com/typeorm/typeorm/pull/1488))

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
    * `findOne` and `findOneById` now return `Promise<Entity|undefined>` instead of `Promise<Entity>`
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
