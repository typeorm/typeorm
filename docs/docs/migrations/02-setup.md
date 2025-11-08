# Setup

Before working with migrations you need to setup your [DataSource](../data-source/1-data-source.md) options properly:

```ts
export default new DataSource({
    // basic setup
    synchronize: false,
    migrations: [ /*...*/ ],

    // optional
    migrationsRun: false,
    migrationsTableName: 'migrations',
    migrationsTransactionMode: 'all'

    // other options...
})
```

## `synchronise`

Turning off automatic schema synchronisation is essential for working with migrations. Otherwise they would make no sense.

## `migrations`

Defines list of migrations that need to be loaded by TypeORM. It accepts both migration classes and directories from which to load.

The easiest is to specify the directory where your migration files are located (glob patterns are supported):

```ts
migrations: [__dirname + '/migration/**/*{.js,.ts}']
```

Defining both `.js` and `.ts` extensions would allow you to run migrations in development and from compiled to JavaScript for production (eg. from Docker image).

Alternatively you could also specify exact classes to get more fine grained control:

```ts
import FirstMigration from 'migrations/TIMESTAMP-first-migration'
import SecondMigration from 'migrations/TIMESTAMP-second-migration'

export default new DataSource({
  migrations: [FirstMigration, SecondMigration]
})
```

but it also requires more manual work and can be error prone.

-   `migrationsRun` - Indicates if [migrations](../migrations/01-why.md) should be auto-run on every application launch.

## Optional settings

### `migrationsRun`

Indicates if migrations should be auto-run on every application launch. Default: `false`

### `migrationsTableName`

You might want to specify the name of the table that will store information about executed migrations. By default it is called `'migrations'`.

```ts
migrationsTableName: 'some_custom_migrations_table'
```

### `migrationsTransactionMode`

Controls transaction mode when running migrations. Poossible options are:

- `all` (_default_) - wraps migrations run into a single transaction
- `none`
- `each`
