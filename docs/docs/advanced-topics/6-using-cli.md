# Using CLI

## Installing CLI

### If entities files are in javascript

If you have a local typeorm version, make sure it matches the global version we are going to install.

You can install typeorm globally with `npm i -g typeorm`.
You can also choose to use `npx typeorm <params>` for each command if you prefer not having to install it.

### If entities files are in typescript

This CLI tool is written in javascript and to be run on node. If your entity files are in typescript, you will need to transpile them to javascript before using CLI. You may skip this section if you only use javascript.

You may setup ts-node in your project to ease the operation as follows:

Install ts-node:

```shell
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

```shell
npm run typeorm migration:run -- -d path-to-datasource-config
```

### How to read the documentation?

To reduce verbosity of the documentation, the following sections are using a globally installed typeorm CLI. Depending on how you installed the CLI, you may replace `typeorm` at the start of the command, by either `npx typeorm` or `npm run typeorm`.

## Initialize a new TypeORM project

You can create a new project with everything already setup:

```shell
typeorm init
```

It creates all files needed for a basic project with TypeORM:

- .gitignore
- package.json
- README.md
- tsconfig.json
- src/entity/User.ts
- src/index.ts

Then you can run `npm install` to install all dependencies.
After that, you can run your application by running `npm start`.

All files are generated in the current directory.
If you want to generate them in a special directory you can use `--name`:

```shell
typeorm init --name my-project
```

To specify a specific database you use you can use `--database`:

```shell
typeorm init --database mssql
```

To generate an ESM base project you can use `--module esm`:

```shell
typeorm init --name my-project --module esm
```

You can also generate a base project with Express:

```shell
typeorm init --name my-project --express
```

If you are using docker you can generate a `docker-compose.yml` file using:

```shell
typeorm init --docker
```

`typeorm init` is the easiest and fastest way to setup a TypeORM project.

## Create a new entity

You can create a new entity using CLI:

```shell
typeorm entity:create path-to-entity-dir/entity
```

Learn more about [entities](../entity/1-entities.md).

## Create a new subscriber

You can create a new subscriber using CLI:

```shell
typeorm subscriber:create path-to-subscriber-dir/subscriber
```

Learn more about [Subscribers](./4-listeners-and-subscribers.md).

## Manage migrations

- `typeorm migration:create` - [create](../migrations/03-creating.md) empty migration
- `typeorm migration:generate` - [generate](../migrations/04-generating.md) migration comparing entities with actual database schema
- `typeorm migration:run` - [execute](../migrations/05-executing.md) all migrations
- `typeorm migration:revert` - [revert](../migrations/06-reverting.md) last migration
- `typeorm migration:show` - [list](../migrations/07-status.md) all migrations with their execution status

Learn more about [Migrations](../migrations/01-why.md).

## Sync database schema

To synchronize a database schema use:

```shell
typeorm schema:sync
```

Be careful running this command in production -
schema sync may cause data loss if you don't use it wisely.
Check which sql queries it will run before running on production.

## Log sync database schema queries without actual running them

To check what sql queries `schema:sync` is going to run use:

```shell
typeorm schema:log
```

## Drop database schema

To completely drop a database schema use:

```shell
typeorm schema:drop -- -d path-to-datasource-config
```

Be careful with this command on production since it completely removes data from your database.

## Run any SQL query

You can execute any SQL query you want directly in the database using:

```shell
typeorm query "SELECT * FROM USERS"
```

## Clear cache

If you are using `QueryBuilder` caching, sometimes you may want to clear everything stored in the cache.
You can do it using the following command:

```shell
typeorm cache:clear
```

## Check version

You can check what typeorm version you have installed (both local and global) by running:

```shell
typeorm version
```
