<div align="center">
  <a href="http://typeorm.io/">
    <img src="https://github.com/typeorm/typeorm/raw/master/resources/logo_big.png" width="492" height="228">
  </a>
  <br>
  <br>
	<a href="https://travis-ci.org/typeorm/typeorm">
		<img src="https://travis-ci.org/typeorm/typeorm.svg?branch=master">
	</a>
	<a href="https://badge.fury.io/js/typeorm">
		<img src="https://badge.fury.io/js/typeorm.svg">
	</a>
	<a href="https://david-dm.org/typeorm/typeorm">
		<img src="https://david-dm.org/typeorm/typeorm.svg">
	</a>
    <a href="https://codecov.io/gh/typeorm/typeorm">
        <img alt="Codecov" src="https://img.shields.io/codecov/c/github/typeorm/typeorm.svg">
    </a>
	<a href="https://join.slack.com/t/typeorm/shared_invite/enQtNDQ1MzA3MDA5MTExLTUxNTZhM2Q4NDNhMjMzNjQ2NGM1ZjI1ZGRkNjJjYzI4OTZjMGYyYTc0MzAxYTdjMWE3ZDIxOWUzZTdlM2QxNTY">
		<img src="https://img.shields.io/badge/chat-on%20slack-blue.svg">
	</a>
  <br>
  <br>
</div>

TypeORM is an [ORM](https://en.wikipedia.org/wiki/Object-relational_mapping)
that can run in NodeJS, Browser, Cordova, PhoneGap, Ionic, React Native, NativeScript, Expo, and Electron platforms
and can be used with TypeScript and JavaScript (ES5, ES6, ES7, ES8).
Its goal is to always support the latest JavaScript features and provide additional features
that help you to develop any kind of application that uses databases - from
small applications with a few tables to large scale enterprise applications
with multiple databases.

TypeORM supports both [Active Record](./docs/active-record-data-mapper.md#what-is-the-active-record-pattern) and [Data Mapper](./docs/active-record-data-mapper.md#what-is-the-data-mapper-pattern) patterns,
unlike all other JavaScript ORMs currently in existence,
which means you can write high quality, loosely coupled, scalable,
maintainable applications the most productive way.

TypeORM is highly influenced by other ORMs, such as [Hibernate](http://hibernate.org/orm/),
 [Doctrine](http://www.doctrine-project.org/) and [Entity Framework](https://www.asp.net/entity-framework).

Some TypeORM features:

* supports both [DataMapper](./docs/active-record-data-mapper.md#what-is-the-data-mapper-pattern) and [ActiveRecord](./docs/active-record-data-mapper.md#what-is-the-active-record-pattern) (your choice)
* entities and columns
* database-specific column types
* entity manager
* repositories and custom repositories
* clean object relational model
* associations (relations)
* eager and lazy relations
* uni-directional, bi-directional and self-referenced relations
* supports multiple inheritance patterns
* cascades
* indices
* transactions
* migrations and automatic migrations generation
* connection pooling
* replication
* using multiple database connections
* working with multiple databases types
* cross-database and cross-schema queries
* elegant-syntax, flexible and powerful QueryBuilder
* left and inner joins
* proper pagination for queries using joins
* query caching
* streaming raw results
* logging
* listeners and subscribers (hooks)
* supports closure table pattern
* schema declaration in models or separate configuration files
* connection configuration in json / xml / yml / env formats
* supports MySQL / MariaDB / Postgres / CockroachDB / SQLite / Microsoft SQL Server / Oracle / SAP Hana / sql.js
* supports MongoDB NoSQL database
* works in NodeJS / Browser / Ionic / Cordova / React Native / NativeScript / Expo / Electron platforms
* TypeScript and JavaScript support
* produced code is performant, flexible, clean and maintainable
* follows all possible best practices
* CLI

And more...

With TypeORM your models look like this:

```typescript
import {Entity, PrimaryGeneratedColumn, Column} from "typeorm";

@Entity()
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

}
```

And your domain logic looks like this:

```typescript
const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.age = 25;
await repository.save(user);

const allUsers = await repository.find();
const firstUser = await repository.findOne(1); // find by id
const timber = await repository.findOne({ firstName: "Timber", lastName: "Saw" });

await repository.remove(timber);
```

Alternatively, if you prefer to use the `ActiveRecord` implementation, you can use it as well:

```typescript
import {Entity, PrimaryGeneratedColumn, Column, BaseEntity} from "typeorm";

@Entity()
export class User extends BaseEntity {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    firstName: string;

    @Column()
    lastName: string;

    @Column()
    age: number;

}
```

And your domain logic will look this way:

```typescript
const user = new User();
user.firstName = "Timber";
user.lastName = "Saw";
user.age = 25;
await user.save();

const allUsers = await User.find();
const firstUser = await User.findOne(1);
const timber = await User.findOne({ firstName: "Timber", lastName: "Saw" });

await timber.remove();
```

## TypeORM documentation

[Official documentation for TypeORM is at https://typeorm.io/](https://typeorm.io/)

## Extensions

There are several extensions that simplify working with TypeORM and integrating it with other modules:

* [TypeORM + GraphQL framework](http://vesper-framework.com)
* [TypeORM integration](https://github.com/typeorm/typeorm-typedi-extensions) with [TypeDI](https://github.com/pleerock/typedi)
* [TypeORM integration](https://github.com/typeorm/typeorm-routing-controllers-extensions) with [routing-controllers](https://github.com/pleerock/routing-controllers)
* Models generation from existing database - [typeorm-model-generator](https://github.com/Kononnable/typeorm-model-generator)
* Fixtures loader - [typeorm-fixtures-cli](https://github.com/RobinCK/typeorm-fixtures)

## Contributing

Learn about contribution [here](https://github.com/typeorm/typeorm/blob/master/CONTRIBUTING.md) and how to setup your development environment [here](https://github.com/typeorm/typeorm/blob/master/DEVELOPER.md).

This project exists thanks to all the people who contribute:

<a href="https://github.com/typeorm/typeorm/graphs/contributors"><img src="https://opencollective.com/typeorm/contributors.svg?width=890&showBtn=false" /></a>

## Sponsors

Open source is hard and time-consuming. If you want to invest into TypeORM's future you can become a sponsor and make our core team to spend more time on TypeORM's improvements and new features. [Become a sponsor](https://opencollective.com/typeorm)

<a href="https://opencollective.com/typeorm" target="_blank"><img src="https://opencollective.com/typeorm/tiers/sponsor.svg?width=890"></a>

## Gold Sponsors

Become a gold sponsor and get a premium technical support from our core contributors. [Become a gold sponsor](https://opencollective.com/typeorm)

<a href="https://opencollective.com/typeorm" target="_blank"><img src="https://opencollective.com/typeorm/tiers/gold-sponsor.svg?width=890"></a>
