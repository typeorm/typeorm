# Using CLI

* [Installing CLI](#installing-cli)
* [Initialize a new TypeORM project](#initialize-a-new-typeorm-project)
* [Create a new entity](#create-a-new-entity)
* [Create a new subscriber](#create-a-new-subscriber)
* [Create a new migration](#create-a-new-migration)
* [Generate a migration from existing table schema](#generate-a-migration-from-existing-table-schema)
* [Run migrations](#run-migrations)
* [Revert migrations](#revert-migrations)
* [Show migrations](#show-migrations)
* [Sync database schema](#sync-database-schema)
* [Log sync database schema queries without actual running them](#log-sync-database-schema-queries-without-actual-running-them)
* [Drop database schema](#drop-database-schema)
* [Run any sql query](#run-any-sql-query)
* [Clear cache](#clear-cache)
* [Check version](#check-version)

## Installing CLI
### If entities files are in javascript
If you have a local typeorm version, make sure it matches the global version we are going to install.

Install typeorm globally with `npm i -g typeorm`.
You can also chose to use `npx typeorm <params>` for each command if you prefer not having to install it.

### If entities files are in typescript
This CLI tool is written in javascript and to be run on node. If your entity files are in typescript, you will need to transpile them to javascript before using CLI. You may skip this section if you only use javascript.

You may setup ts-node in your project to ease the operation as follows:

Install ts-node globally:
```
npm install -g ts-node
```

Add typeorm command under scripts section in package.json
```
"scripts" {
    ...
    "typeorm": "node --require ts-node/register ./node_modules/typeorm/cli.js"    
}
```

If you want to load more modules like [module-alias](https://github.com/ilearnio/module-alias) you can add more `--require my-module-supporting-register`

Then you may run the command like this:
```
npm run typeorm migration:run
```

If you need to pass parameter with dash to npm script, you will need to add them after --. For example, if you need to *generate*, the command is like this:
```
npm run typeorm migration:generate -- -n migrationNameHere
```

### How to read the documentation
To reduce verbosity of the documentation, the following sections are using a globally installed typeorm CLI. Depending on how you installed the CLI, you may replace `typeorm` at the start of the command, by either `npx typeorm` or `npm run typeorm`.

## Initialize a new TypeORM project

You can create a new project with everything already setup:

```
typeorm init
```

It creates all files needed for a basic project with TypeORM:

* .gitignore
* package.json
* README.md
* tsconfig.json
* ormconfig.json
* src/entity/User.ts
* src/index.ts

Then you can run `npm install` to install all dependencies.
Once all dependencies are installed, you need to modify `ormconfig.json` and insert your own database settings.
After that, you can run your application by running `npm start`.

All files are generated in the current directory.
If you want to generate them in a special directory you can use `--name`: 

```
typeorm init --name my-project
```

To specify a specific database you use you can use `--database`:

```
typeorm init --database mssql
```

You can also generate a base project with Express:

```
typeorm init --name my-project --express
```

If you are using docker you can generate a `docker-compose.yml` file using:

```
typeorm init --docker
```

`typeorm init` is the easiest and fastest way to setup a TypeORM project.


## Create a new entity

You can create a new entity using CLI:

```
typeorm entity:create -n User
```

where `User` is an entity file and class name. 
Running the command will create a new empty entity in `entitiesDir` of the project.
To setup the `entitiesDir` of the project you must add it in connection options:

```
{
    cli: {
        entitiesDir: "src/entity"
    }
}
```

Learn more about [connection options](./connection-options.md).
If you have a multi-module project structure with multiple entities in different directories
you can provide the path to the CLI command where you want to generate an entity:

 
```
typeorm entity:create -n User -d src/user/entity
```

Learn more about [entities](./entities.md).

## Create a new subscriber

You can create a new subscriber using CLI:

```
typeorm subscriber:create -n UserSubscriber
```

where `UserSubscriber` is a subscriber file and class name. 
Running the following command will create a new empty subscriber in the `subscribersDir` of the project.
To setup `subscribersDir` you must add it in connection options:

```
{
    cli: {
        subscribersDir: "src/subscriber"
    }
}
```

Learn more about [connection options](./connection-options.md).
If you have a multi-module project structure with multiple subscribers in different directories
you can provide a path to the CLI command where you want to generate a subscriber:

 
```
typeorm subscriber:create -n UserSubscriber -d src/user/subscriber
```

Learn more about [Subscribers](./listeners-and-subscribers.md).

## Create a new migration

You can create a new migration using CLI:

```
typeorm migration:create -n UserMigration
```

where `UserMigration` is a migration file and class name. 
Running the command will create a new empty migration in the `migrationsDir` of the project.
To setup `migrationsDir` you must add it in connection options:

```
{
    cli: {
        migrationsDir: "src/migration"
    }
}
```

Learn more about [connection options](./connection-options.md).
If you have a multi-module project structure with multiple migrations in different directories
you can provide a path to the CLI command where you want to generate a migration:

```
typeorm migration:create -n UserMigration -d src/user/migration
```

Learn more about [Migrations](./migrations.md).

## Generate a migration from existing table schema

Automatic migration generation creates a new migration file
and writes all sql queries that must be executed to update the database.

If no there were no changes generated, the command will exit with code 1.

```
typeorm migration:generate -n UserMigration
```

The rule of thumb is to generate a migration after each entity change.

Learn more about [Migrations](./migrations.md).

## Run migrations

To execute all pending migrations use following command:

```
typeorm migration:run
```

Learn more about [Migrations](./migrations.md).

## Revert migrations

To revert the most recently executed migration use the following command:

```
typeorm migration:revert
```

This command will undo only the last executed migration.
You can execute this command multiple times to revert multiple migrations.
Learn more about [Migrations](./migrations.md).

## Show migrations
To show all migrations and whether they've been run or not use following command:

```
typeorm migration:show
```

[X] = Migration has been ran

[ ] = Migration is pending/unapplied

This command also returns an error code if there are unapplied migrations.

## Sync database schema

To synchronize a database schema use:
```
typeorm schema:sync
```

Be careful running this command in production - 
schema sync may cause data loss if you don't use it wisely.
Check which sql queries it will run before running on production.

## Log sync database schema queries without actual running them

To check what sql queries `schema:sync` is going to run use:

```
typeorm schema:log
```

## Drop database schema

To completely drop a database schema use:

```
typeorm schema:drop
```

Be careful with this command on production since it completely removes data from your database.

## Run any sql query

You can execute any sql query you want directly in the database using:

```
typeorm query "SELECT * FROM USERS"
```

## Clear cache

If you are using `QueryBuilder` caching, sometimes you may want to clear everything stored in the cache. 
You can do it using the following command:

```
typeorm cache:clear
```

## Check version

You can check what typeorm version you have installed (both local and global) by running:

```
typeorm version
```
