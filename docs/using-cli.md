# Using CLI

-   [Installing CLI](#installing-cli)
-   [Initialize a new TypeORM project](#initialize-a-new-typeorm-project)
-   [Create a new entity](#create-a-new-entity)
-   [Create a new subscriber](#create-a-new-subscriber)
-   [Create a new migration](#create-a-new-migration)
-   [Generate a migration from existing table schema](#generate-a-migration-from-existing-table-schema)
-   [Run migrations](#run-migrations)
-   [Revert migrations](#revert-migrations)
-   [Show migrations](#show-migrations)
-   [Sync database schema](#sync-database-schema)
-   [Log sync database schema queries without actual running them](#log-sync-database-schema-queries-without-actual-running-them)
-   [Drop database schema](#drop-database-schema)
-   [Run any SQL query](#run-any-sql-query)
-   [Clear cache](#clear-cache)
-   [Check version](#check-version)

## Installing CLI

### If entities files are in javascript

If you have a local typeorm version, make sure it matches the global version we are going to install.

You can install typeorm globally with `npm i -g typeorm`.
You can also choose to use `npx typeorm <params>` for each command if you prefer not having to install it.

### If entities files are in typescript

This CLI tool is written in javascript and to be run on node. If your entity files are in typescript, you will need to transpile them to javascript before using CLI. You may skip this section if you only use javascript.

You may setup ts-node in your project to ease the operation as follows:

Install ts-node:

```bash
npm install ts-node --save-dev
```

Add typeorm command under scripts section in package.json

```json
"scripts": {
    ...
    "typeorm": "typeorm-ts-node-commonjs"
}
```

For ESM projects add this instead:

```json
"scripts": {
    ...
    "typeorm": "typeorm-ts-node-esm"
}
```

If you want to load more modules like [module-alias](https://github.com/ilearnio/module-alias) you can add more `--require my-module-supporting-register`

Then you may run the command like this:

```bash
npm run typeorm migration:run -d path-to-datasource-config
```

### How to read the documentation

To reduce verbosity of the documentation, the following sections are using a globally installed typeorm CLI. Depending on how you installed the CLI, you may replace `typeorm` at the start of the command, by either `npx typeorm` or `npm run typeorm`.

## Initialize a new TypeORM project

You can create a new project with everything already setup:

```bash
typeorm init
```

It creates all files needed for a basic project with TypeORM:

-   .gitignore
-   package.json
-   README.md
-   tsconfig.json
-   src/entity/User.ts
-   src/index.ts

Then you can run `npm install` to install all dependencies.
After that, you can run your application by running `npm start`.

All files are generated in the current directory.
If you want to generate them in a special directory you can use `--name`:

```bash
typeorm init --name my-project
```

To specify a specific database you use you can use `--database`:

```bash
typeorm init --database mssql
```

To generate an ESM base project you can use `--module esm`:

```bash
typeorm init --name my-project --module esm
```

You can also generate a base project with Express:

```bash
typeorm init --name my-project --express
```

If you are using docker you can generate a `docker-compose.yml` file using:

```bash
typeorm init --docker
```

`typeorm init` is the easiest and fastest way to setup a TypeORM project.

## Create a new entity

You can create a new entity using CLI:

```bash
typeorm entity:create path-to-entity-dir/entity
```

Learn more about [entities](./entities.md).

## Create a new subscriber

You can create a new subscriber using CLI:

```bash
typeorm subscriber:create path-to-subscriber-dir/subscriber
```

Learn more about [Subscribers](./listeners-and-subscribers.md).

## Create a new migration

You can create a new migration using CLI:

```bash
typeorm migration:create path-to-migrations-dir/migrationName
```

Learn more about [Migrations](./migrations.md).

## Generate a migration from existing table schema

Automatic migration generation creates a new migration file
and writes all sql queries that must be executed to update the database.

If no there were no changes generated, the command will exit with code 1.

```bash
typeorm migration:generate path/to/Migration -d path/to/datasource
```

The rule of thumb is to generate a migration after each entity change.
the -d argument value should specify the path where your DataSource instance is defined.
You can specify the path and name of the migration with the first argument.

Learn more about [Migrations](./migrations.md).

## Run migrations

To execute all pending migrations use following command:

```bash
typeorm migration:run -d path-to-datasource-config
```

Learn more about [Migrations](./migrations.md).

## Revert migrations

To revert the most recently executed migration use the following command:

```bash
typeorm migration:revert -d path-to-datasource-config
```

This command will undo only the last executed migration.
You can execute this command multiple times to revert multiple migrations.
Learn more about [Migrations](./migrations.md).

## Show migrations

To show all migrations and whether they've been run or not use following command:

```bash
typeorm migration:show -d path-to-datasource-config
```

[X] = Migration has been ran

[ ] = Migration is pending/unapplied

## Sync database schema

To synchronize a database schema use:

```bash
typeorm schema:sync
```

Be careful running this command in production -
schema sync may cause data loss if you don't use it wisely.
Check which sql queries it will run before running on production.

## Log sync database schema queries without actual running them

To check what sql queries `schema:sync` is going to run use:

```bash
typeorm schema:log
```

## Drop database schema

To completely drop a database schema use:

```bash
typeorm schema:drop -d path-to-datasource-config
```

Be careful with this command on production since it completely removes data from your database.

## Run any SQL query

You can execute any SQL query you want directly in the database using:

```bash
typeorm query "SELECT * FROM USERS"
```

## Clear cache

If you are using `QueryBuilder` caching, sometimes you may want to clear everything stored in the cache.
You can do it using the following command:

```bash
typeorm cache:clear
```

## Check version

You can check what typeorm version you have installed (both local and global) by running:

```bash
typeorm version
```
