# Roadmap

See what amazing new features we are expecting to land in the next TypeORM versions.

## Note on 1.0.0 release

We are planning to release a final stable `1.0.0` version in near future.
However, TypeORM is already actively used in a number of big production systems.
The main API is already very stable.
TypeORM follows a semantic versioning and until `1.0.0`, breaking changes may appear in `0.x.x` versions.
However, since the API is already quite stable we don't expect too many breaking changes.

## How to install latest development version?

To install latest development version use the following command:

```
npm i typeorm@next
```

## 0.3.0

- [ ] research `@Select` and `@Where` decorators
- [ ] add `addSelectAndMap` functionality to `QueryBuilder`
- [ ] research internationalization features
- [ ] research ability to create one-to-many relations without inverse sides
- [ ] research ability to create a single relation with multiple entities at once
- [ ] more tree repository functionality
- [ ] cli: create database backup command
- [ ] extend `query` method functionality
- [ ] better internal ORM logging
- [ ] better error handling and user-friendly messages
- [ ] better JavaScript support - more docs and test coverage
- [ ] research NativeScript support
- [ ] finish naming strategy implementation
- [ ] implement soft deletion

## 0.2.0

- [x] add more tree-table features: nested set and materialized path; more repository methods
- [x] fix Oracle driver issues and make oracle stable and ready for production use
- [x] implement migrations generator for all drivers
- [x] create example how to use TypeORM in Electron apps
- [x] finish subscribers and listeners implementation
- [x] refactor persistence mechanism
- [x] fix all issues with cascades and make stable functionality
- [x] implement API for manual migration creation
- [x] add sql.js driver
- [x] fix inheritance support issues
