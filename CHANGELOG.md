# 0.1.0 (future)

### BREAKING CHANGES

* `Table`, `AbstractTable`, `ClassTableChild`, `ClosureTable`, `EmbeddableTable`, `SingleTableChild` deprecated decorators has been removed.
Use `Entity`, `AbstractEntity`, `ClassEntityChild`, `ClosureEntity`, `EmbeddableEntity`, `SingleEntityChild` decorators instead.
* `EntityManager#create` and `Repository#create`, `EntityManager#preload` and `Repository#preload` methods now accept 
`DeepPartial<Entity>` instead of `Object`
* `EntityManager#merge` and `Repository#merge` methods now accepts `DeepPartial<Entity>` instead of `Object`,
also their first argument is an entity where to need to merge all given entity-like objects.
* changed `find*` repository methods. Now conditions are `Partial<Entity>` which makes them type-safe. 
However now `FindOptions` cannot be used with `findOne`, `findAndCount`, `find` and other methods. 
Use `fineOneByOptions`, `findAndCountByOptions`, `findByOptions` methods instead
* removed `FindOptions` interface and introduced two new interfaces: `FindOneOptions` and `FindManyOptions` - 
each for its own `findOne*` or `find*` methods
* dropped out some of options of `FindOptions`. Use `QueryBuilder` instead.
* deprecated method `addParameters` has been removed from `QueryBuilder`. Use `setParameters` instead.
* table decorators were not removed in the release, however they will be removed in next. Be sure to replace them before that.
* `QueryBuilder#setFirstResult` has been renamed to `QueryBuilder#skip`
* `QueryBuilder#setMaxResults` has been renamed to `QueryBuilder#take`

### NEW FEATURES

* added `mongodb` support
* entity now can be saved partially within `update` method
* added prefix support to embeddeds

### BUG FIXES

* fixes [#285](https://github.com/typeorm/typeorm/issues/285) - issue when cli commands rise `CannotCloseNotConnectedError`
* fixes [#309](https://github.com/typeorm/typeorm/issues/309) - issue when `andHaving` didn't work without calling `having` on `QueryBuilder`

# 0.0.9 (latest)

* fixed bug with indices from columns are not being inherited from parent entity [#242](https://github.com/typeorm/typeorm/issues/242)
* added support of UUID primary columns (thanks [@seanski](https://github.com/seanski))
* added `count` method to repository and entity manager (thanks [@aequasi](https://github.com/aequasi))

# 0.0.8

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

# 0.0.7

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

# 0.0.6

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

# 0.0.5

* changed `getScalarMany` to `getRawMany` in `QueryBuilder`
* changed `getScalarOne` to `getRawOne` in `QueryBuilder`
* added migrations support

# 0.0.4

* fixed problem when `order by` is used with `limit`
* fixed problem when `decorators-shim.d.ts` exist and does not allow to import decorators (treats like they exist in global)
* fixed Sql Server driver bugs

# 0.0.3

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

# 0.0.2

* lot of API refactorings
* complete support TypeScript 2
* optimized schema creation 
* command line tools
* multiple drivers support
* multiple bugfixes

# 0.0.1

* first stable version, works with TypeScript 1.x
