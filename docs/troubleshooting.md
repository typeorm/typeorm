# Troubleshooting

* [Glob patterns](#glob-patterns)

## Glob Patterns

Glob patterns are used in the TypeOrm to specify the locations of entities, migrations, subscriber and other information. Errors in the patterns can lead to the common `RepositoryNotFoundError` and familiar errors. In order to check if any files were loaded by TypeOrm using the glob patterns, all you need to do is set the logging level to `info` such as explained in the [Logging](./logging.md) section of the documentation. This will allow you to have logs in the console that may look like this:

```bash
# in case of an error
 INFO: No classes were found using the provided glob pattern:  "dist/**/*.entity{.ts}"
```
```bash
# when files are found
INFO: All classes found using provided glob pattern "dist/**/*.entity{.js,.ts}" : "dist/app/user/user.entity.js | dist/app/common/common.entity.js"
```