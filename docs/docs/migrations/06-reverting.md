# Reverting

If for some reason you want to revert the changes, you can run:

```shell
typeorm migration:revert -- -d path-to-datasource-config
```

This command will execute `down` in the latest executed migration.

If you need to revert multiple migrations you must call this command multiple times.
