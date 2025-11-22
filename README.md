<div align="center">
  <a href="http://typeorm.io/">
    <picture>
        <source media="(prefers-color-scheme: dark)" srcset="https://github.com/typeorm/typeorm/raw/master/resources/typeorm-logo-colored-light.png">
        <source  media="(prefers-color-scheme: light)" srcset="https://github.com/typeorm/typeorm/raw/master/resources/typeorm-logo-colored-dark.png">
        <img height="80" width="auto" alt="TypeORM Logo" src="https://github.com/typeorm/typeorm/raw/master/resources/typeorm-logo-colored-dark.png">
    </picture>
  </a>
  <br>
  <br>
    <a href="https://www.npmjs.com/package/typeorm"><img src="https://img.shields.io/npm/v/typeorm" alt="NPM Version" /></a>
    <a href="https://www.npmjs.com/package/typeorm"><img src="https://img.shields.io/npm/dm/typeorm" alt="NPM Downloads" /></a>
    <a href="https://github.com/typeorm/typeorm/actions/workflows/commit-validation.yml?query=branch%3Amaster"><img src="https://github.com/typeorm/typeorm/actions/workflows/commit-validation.yml/badge.svg?branch=master" alt="Commit Validation"/></a>
    <a href="https://coveralls.io/github/typeorm/typeorm?branch=master"><img src="https://coveralls.io/repos/github/typeorm/typeorm/badge.svg?branch=master" alt="Coverage Status" /></a>
    <a href=""><img src="https://img.shields.io/badge/License-MIT-teal.svg" alt="MIT License" /></a>
  <br>
  <br>
</div>

TypeORM is an [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping) that can run in Node.js, Browser, Cordova, Ionic, React Native, NativeScript, Expo, and Electron platforms and can be used with TypeScript and JavaScript (ES2023). Its goal is to always support the latest JavaScript features and provide additional features that help you to develop any kind of application that uses databases - from small applications with a few tables to large-scale enterprise applications with multiple databases.

TypeORM supports more databases than any other JS/TS ORM: [Google Spanner](./docs/docs/drivers/google-spanner.md), [Microsoft SqlServer](./docs/docs/drivers/microsoft-sqlserver.md), [MySQL/MariaDB](./docs/docs/drivers/mysql.md), [MongoDB](./docs/docs/drivers/mongodb.md), [Oracle](./docs/docs/drivers/oracle.md), [Postgres](./docs/docs/drivers/postgres.md), [SAP HANA](./docs/docs/drivers/sap.md) and [SQLite](./docs/docs/drivers/sqlite.md), as well we derived databases and different drivers.

TypeORM supports both [Active Record](./docs/docs/guides/1-active-record-data-mapper.md#what-is-the-active-record-pattern) and [Data Mapper](./docs/docs/guides/1-active-record-data-mapper.md#what-is-the-data-mapper-pattern) patterns, unlike all other JavaScript ORMs currently in existence, which means you can write high-quality, loosely coupled, scalable, maintainable applications in the most productive way.

TypeORM is highly influenced by other ORMs, such as [Hibernate](http://hibernate.org/orm/),
[Doctrine](http://www.doctrine-project.org/) and [Entity Framework](https://www.asp.net/entity-framework).

## Features

-   Supports both [DataMapper](./docs/docs/guides/1-active-record-data-mapper.md#what-is-the-data-mapper-pattern) and [ActiveRecord](./docs/docs/guides/1-active-record-data-mapper.md#what-is-the-active-record-pattern) (your choice).
-   Entities and columns.
-   Database-specific column types.
-   Entity manager.
-   Repositories and custom repositories.
-   Clean object-relational model.
-   Associations (relations).
-   Eager and lazy relations.
-   Unidirectional, bidirectional, and self-referenced relations.
-   Supports multiple inheritance patterns.
-   Cascades.
-   Indices.
-   Transactions.
-   Migrations and automatic migrations generation.
-   Connection pooling.
-   Replication.
-   Using multiple database instances.
-   Working with multiple database types.
-   Cross-database and cross-schema queries.
-   Elegant-syntax, flexible and powerful QueryBuilder.
-   Left and inner joins.
-   Proper pagination for queries using joins.
-   Query caching.
-   Streaming raw results.
-   Logging.
-   Listeners and subscribers (hooks).
-   Supports closure table pattern.
-   Schema declaration in models or separate configuration files.
-   Supports MySQL / MariaDB / Postgres / CockroachDB / SQLite / Microsoft SQL Server / Oracle / SAP Hana / sql.js.
-   Supports MongoDB NoSQL database.
-   Works in Node.js / Browser / Ionic / Cordova / React Native / NativeScript / Expo / Electron platforms.
-   TypeScript and JavaScript support.
-   ESM and CommonJS support.
-   Produced code is performant, flexible, clean, and maintainable.
-   Follows all possible best practices.
-   CLI.

And more...

With TypeORM, your models look like this:

```typescript
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm"

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    age: number
}
```

And your domain logic looks like this:

```typescript
const userRepository = MyDataSource.getRepository(User)

const user = new User()
user.firstName = "Timber"
user.lastName = "Saw"
user.age = 25
await userRepository.save(user)

const allUsers = await userRepository.find()
const firstUser = await userRepository.findOneBy({
    id: 1,
}) // find by id
const timber = await userRepository.findOneBy({
    firstName: "Timber",
    lastName: "Saw",
}) // find by firstName and lastName

await userRepository.remove(timber)
```

Alternatively, if you prefer to use the `ActiveRecord` implementation, you can use it as well:

```typescript
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from "typeorm"

@Entity()
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: number

    @Column()
    firstName: string

    @Column()
    lastName: string

    @Column()
    age: number
}
```

And your domain logic will look this way:

```typescript
const user = new User()
user.firstName = "Timber"
user.lastName = "Saw"
user.age = 25
await user.save()

const allUsers = await User.find()
const firstUser = await User.findOneBy({
    id: 1,
})
const timber = await User.findOneBy({
    firstName: "Timber",
    lastName: "Saw",
})

await timber.remove()
```

## Samples

Take a look at the samples in [sample](https://github.com/typeorm/typeorm/tree/master/sample) for examples of usage.

There are a few repositories that you can clone and start with:

-   [Example how to use TypeORM with TypeScript](https://github.com/typeorm/typescript-example)
-   [Example how to use TypeORM with JavaScript](https://github.com/typeorm/javascript-example)
-   [Example how to use TypeORM with JavaScript and Babel](https://github.com/typeorm/babel-example)
-   [Example how to use TypeORM with TypeScript and SystemJS in Browser](https://github.com/typeorm/browser-example)
-   [Example how to use TypeORM with TypeScript and React in Browser](https://github.com/ItayGarin/typeorm-react-swc)
-   [Example how to use Express and TypeORM](https://github.com/typeorm/typescript-express-example)
-   [Example how to use Koa and TypeORM](https://github.com/typeorm/typescript-koa-example)
-   [Example how to use TypeORM with MongoDB](https://github.com/typeorm/mongo-typescript-example)
-   [Example how to use TypeORM in a Cordova app](https://github.com/typeorm/cordova-example)
-   [Example how to use TypeORM with an Ionic app](https://github.com/typeorm/ionic-example)
-   [Example how to use TypeORM with React Native](https://github.com/typeorm/react-native-example)
-   [Example how to use TypeORM with Nativescript-Vue](https://github.com/typeorm/nativescript-vue-typeorm-sample)
-   [Example how to use TypeORM with Nativescript-Angular](https://github.com/betov18x/nativescript-angular-typeorm-example)
-   [Example how to use TypeORM with Electron using JavaScript](https://github.com/typeorm/electron-javascript-example)
-   [Example how to use TypeORM with Electron using TypeScript](https://github.com/typeorm/electron-typescript-example)

## Extensions

There are several extensions that simplify working with TypeORM and integrating it with other modules:

-   [TypeORM integration](https://github.com/typeorm/typeorm-typedi-extensions) with [TypeDI](https://github.com/pleerock/typedi)
-   [TypeORM integration](https://github.com/typeorm/typeorm-routing-controllers-extensions) with [routing-controllers](https://github.com/pleerock/routing-controllers)
-   Models generation from the existing database - [typeorm-model-generator](https://github.com/Kononnable/typeorm-model-generator)
-   Fixtures loader - [typeorm-fixtures-cli](https://github.com/RobinCK/typeorm-fixtures)
-   ER Diagram generator - [typeorm-uml](https://github.com/eugene-manuilov/typeorm-uml/)
-   another ER Diagram generator - [erdia](https://www.npmjs.com/package/erdia/)
-   Create, drop and seed database - [typeorm-extension](https://github.com/tada5hi/typeorm-extension)
-   Automatically update `data-source.ts` after generating migrations/entities - [typeorm-codebase-sync](https://www.npmjs.com/package/typeorm-codebase-sync)
-   Easy manipulation of `relations` objects - [typeorm-relations](https://npmjs.com/package/typeorm-relations)
-   Automatically generate `relations` based on a GraphQL query - [typeorm-relations-graphql](https://npmjs.com/package/typeorm-relations-graphql)
-   Generate TypeORM entities from Valibot schemas - [piying-orm](https://github.com/piying-org/piying-orm)

## Contributing

Learn about contribution [here](https://github.com/typeorm/typeorm/blob/master/CONTRIBUTING.md) and how to set up your development environment [here](https://github.com/typeorm/typeorm/blob/master/DEVELOPER.md).

This project exists thanks to all the people who contribute:

<a href="https://github.com/typeorm/typeorm/graphs/contributors"><img src="https://opencollective.com/typeorm/contributors.svg?width=890&showBtn=false" /></a>

## Sponsors

Open source is hard and time-consuming. If you want to invest in TypeORM's future, you can become a sponsor and allow our core team to spend more time on TypeORM's improvements and new features.

### Champion

Become a champion sponsor and get premium technical support from our core contributors. [Become a champion](https://opencollective.com/typeorm)

<a href="https://opencollective.com/typeorm" target="_blank"><img src="https://opencollective.com/typeorm/tiers/gold-sponsor.svg?avatarHeight=36"></a>

### Supporter

Support TypeORM's development with a monthly contribution. [Become a supporter](https://opencollective.com/typeorm)

<a href="https://opencollective.com/typeorm" target="_blank"><img src="https://opencollective.com/typeorm/tiers/love.svg?avatarHeight=36"></a>

### Community

Join our community of supporters and help sustain TypeORM. [Become a community supporter](https://opencollective.com/typeorm)

<a href="https://opencollective.com/typeorm" target="_blank"><img src="https://opencollective.com/typeorm/tiers/like.svg?avatarHeight=36"></a>

### Sponsor

Make a one-time or recurring contribution of your choice. [Become a sponsor](https://opencollective.com/typeorm)

<a href="https://opencollective.com/typeorm" target="_blank"><img src="https://opencollective.com/typeorm/tiers/sponsor.svg?avatarHeight=36"></a>
