# 0.0.7 (upcoming)

* fixed bug when new column was'nt added properly in sqlite [#157](https://github.com/typeorm/typeorm/issues/157)
* added ability to set different types of values for DEFAULT value of the column [#150](https://github.com/typeorm/typeorm/issues/150)

# 0.0.6 (latest)

* added `JSONB` support for Postgres in #126 (thanks @CreepGin)
* fixed in in sqlite query runner in #141 (thanks @marcinwadon)
* added shortcut exports for table schema classes in #135 (thanks @eduardoweiland)
* fixed bugs with single table inheritance in #132 (thanks @eduardoweiland)
* fixed issue with `TIME` column in #134 (thanks @cserron)
* fixed issue with relation id in #138 (thanks @mingyang91)
* fixed bug when URL for pg was parsed incorrectly #114 (thanks @mingyang91)
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
