# Executing and reverting

Once you have a migration to run on production, you can run them using a CLI command:

```shell
typeorm migration:run -- -d path-to-datasource-config
```

**`typeorm migration:create` and `typeorm migration:generate` will create `.ts` files, unless you use the `o` flag (see more in [Generating migrations](#generating-migrations)). The `migration:run` and `migration:revert` commands only work on `.js` files. Thus the typescript files need to be compiled before running the commands.** Alternatively, you can use `ts-node` with `typeorm` to run `.ts` migration files.

Example with `ts-node`:

```shell
npx typeorm-ts-node-commonjs migration:run -- -d path-to-datasource-config
```

Example with `ts-node` in ESM projects:

```shell
npx typeorm-ts-node-esm migration:run -- -d path-to-datasource-config
```

```shell
npx typeorm-ts-node-esm migration:generate ./src/migrations/update-post-table -d ./src/data-source.ts
```

This command will execute all pending migrations and run them in a sequence ordered by their timestamps.
This means all sql queries written in the `up` methods of your created migrations will be executed.
That's all! Now you have your database schema up-to-date.
