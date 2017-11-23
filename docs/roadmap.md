# Roadmap

See what amazing new features we are expecting to land in the next TypeORM versions.

## Note on 1.0.0 release

We are planning to release a final stable `1.0.0` version somewhere in summer 2018.
However TypeORM is already actively used in number of big production systems.
Main API is already very stable, there are only few issues currently we have in following areas:
`class and single table inheritance`, `naming strategy`, `subscribers`, `tree tables`.
All issues in those areas are planning to be fixed in next minor versions.
Your donations and contribution play a big role in achieving this goal.
TypeORM follows a semantic versioning and until `1.0.0` breaking changes may appear in `0.x.x` versions,
however since API is already quite stable we don't expect too much breaking changes.  

## How to install latest development version?

To install latest development version use following command:

```
npm i typeorm@next
```

## 0.3.0

- [ ] fix Oracle driver issues and make oracle stable and ready for production use
- [ ] add `@Select` and `@Where` decorators
- [ ] add `addSelectAndMap` functionality to `QueryBuilder`
- [ ] research NativeScript support
- [ ] research internationalization features
- [ ] implement soft deletion 
- [ ] research ability to create one-to-many relations without inverse sides
- [ ] research ability to create a single relation with multiple entities at once
- [ ] fix all table-inheritance issues, better class-table and single-table inheritance support
- [ ] add more tree-table features: nested set and materialized path; more repository methods
- [ ] cli: create database backup command
- [ ] extend `query` method functionality
- [ ] better support for entity schemas, support inheritance, add xml and yml formats support
- [ ] better internal ORM logging
- [ ] better error handling and user-friendly messages
- [ ] better JavaScript support - more docs and test coverage

## 0.2.0

- [ ] implement migrations generator for all drivers
- [ ] create example how to use TypeORM in Electron apps
- [ ] finish naming strategy implementation
- [ ] finish subscribers and listeners implementation
- [x] refactor persistence mechanism
- [x] fix all issues with cascades and make stable functionality
- [ ] implement API for manual migration creation
- [x] add sql.js driver
